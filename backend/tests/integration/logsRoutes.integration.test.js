const request = require('supertest');
const app = require('../../src/app');
const { sequelize, Log, Project, Deployment, Pipeline, User } = require('../../src/models');
const jwt = require('jsonwebtoken');

describe('Logs Routes Integration Tests', () => {
  let authToken;
  let testUser;
  let testProject;
  let testDeployment;
  let testPipeline;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    testUser = await User.create({
      id: 'test-user-123',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
    });

    authToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    testProject = await Project.create({
      id: 'test-project-123',
      name: 'Test Project',
      ownerId: testUser.id,
    });

    testDeployment = await Deployment.create({
      id: 'test-deployment-123',
      projectId: testProject.id,
      environment: 'production',
      version: 'v1.0.0',
      deployedBy: testUser.id,
    });

    testPipeline = await Pipeline.create({
      id: 'test-pipeline-123',
      name: 'Test Pipeline',
      projectId: testProject.id,
      config: { steps: [] },
      createdBy: testUser.id,
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Log.destroy({ where: {} });
  });

  describe('GET /api/logs', () => {
    beforeEach(async () => {
      await Log.create({
        projectId: testProject.id,
        deploymentId: testDeployment.id,
        level: 'info',
        message: 'Deployment started',
        timestamp: new Date('2024-01-01T10:00:00Z'),
      });

      await Log.create({
        projectId: testProject.id,
        deploymentId: testDeployment.id,
        level: 'error',
        message: 'Error occurred',
        timestamp: new Date('2024-01-01T10:05:00Z'),
      });

      await Log.create({
        projectId: testProject.id,
        pipelineId: testPipeline.id,
        level: 'info',
        message: 'Pipeline execution started',
        timestamp: new Date('2024-01-01T10:10:00Z'),
      });
    });

    /**
     * Test: Should retrieve all logs
     * Scenario: User requests logs without filters
     * Expected: Returns 200 with all logs
     */
    it('should get all logs', async () => {
      const response = await request(app)
        .get('/api/logs')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.logs).toHaveLength(3);
      expect(response.body.data.pagination).toBeDefined();
    });

    /**
     * Test: Should filter logs by project ID
     * Scenario: User requests logs for a specific project
     * Expected: Returns only logs for that project
     */
    it('should filter logs by projectId', async () => {
      const response = await request(app)
        .get(`/api/logs?projectId=${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs.every(log => log.projectId === testProject.id)).toBe(true);
    });

    /**
     * Test: Should filter logs by deployment ID
     * Scenario: User requests logs for a specific deployment
     * Expected: Returns only logs for that deployment
     */
    it('should filter logs by deploymentId', async () => {
      const response = await request(app)
        .get(`/api/logs?deploymentId=${testDeployment.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs.every(log => log.deploymentId === testDeployment.id)).toBe(true);
      expect(response.body.data.logs).toHaveLength(2);
    });

    /**
     * Test: Should filter logs by pipeline ID
     * Scenario: User requests logs for a specific pipeline
     * Expected: Returns only logs for that pipeline
     */
    it('should filter logs by pipelineId', async () => {
      const response = await request(app)
        .get(`/api/logs?pipelineId=${testPipeline.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs.every(log => log.pipelineId === testPipeline.id)).toBe(true);
      expect(response.body.data.logs).toHaveLength(1);
    });

    /**
     * Test: Should filter logs by level
     * Scenario: User filters logs by severity level
     * Expected: Returns only logs with specified level
     */
    it('should filter logs by level', async () => {
      const response = await request(app)
        .get('/api/logs?level=error')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs.every(log => log.level === 'error')).toBe(true);
      expect(response.body.data.logs).toHaveLength(1);
    });

    /**
     * Test: Should filter logs by search term
     * Scenario: User searches logs by message content
     * Expected: Returns logs matching search term
     */
    it('should filter logs by search term', async () => {
      const response = await request(app)
        .get('/api/logs?search=error')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs.length).toBeGreaterThan(0);
    });

    /**
     * Test: Should filter logs by time range
     * Scenario: User requests logs within a specific time range
     * Expected: Returns logs between start and end time
     */
    it('should filter logs by time range', async () => {
      const response = await request(app)
        .get('/api/logs?startTime=2024-01-01T10:00:00Z&endTime=2024-01-01T10:06:00Z')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs).toHaveLength(2);
    });

    /**
     * Test: Should support pagination
     * Scenario: User requests logs with pagination parameters
     * Expected: Returns paginated results
     */
    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/logs?page=1&limit=2')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.logs).toHaveLength(2);
      expect(response.body.data.pagination.limit).toBe(2);
    });

    /**
     * Test: Should return 401 without authentication
     * Scenario: Unauthenticated request to get logs
     * Expected: Returns 401 unauthorized
     */
    it('should return 401 without authentication', async () => {
      const response = await request(app).get('/api/logs');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/logs/stream', () => {
    /**
     * Test: Should establish SSE connection for log streaming
     * Scenario: User subscribes to real-time logs
     * Expected: Returns SSE headers and connection
     */
    it('should establish SSE connection', async () => {
      const response = await request(app)
        .get(`/api/logs/stream?deploymentId=${testDeployment.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.headers['content-type']).toContain('text/event-stream');
      expect(response.headers['cache-control']).toBe('no-cache');
    });

    /**
     * Test: Should require authentication for streaming
     * Scenario: Unauthenticated request to stream logs
     * Expected: Returns 401 unauthorized
     */
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/logs/stream?deploymentId=${testDeployment.id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/logs/stats', () => {
    beforeEach(async () => {
      await Log.create({
        projectId: testProject.id,
        level: 'info',
        message: 'Info log 1',
        timestamp: new Date(),
      });

      await Log.create({
        projectId: testProject.id,
        level: 'info',
        message: 'Info log 2',
        timestamp: new Date(),
      });

      await Log.create({
        projectId: testProject.id,
        level: 'error',
        message: 'Error log',
        timestamp: new Date(),
      });

      await Log.create({
        projectId: testProject.id,
        level: 'warn',
        message: 'Warning log',
        timestamp: new Date(),
      });
    });

    /**
     * Test: Should retrieve log statistics
     * Scenario: User requests log statistics for a project
     * Expected: Returns 200 with stats grouped by level
     */
    it('should get log stats', async () => {
      const response = await request(app)
        .get(`/api/logs/stats?projectId=${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    /**
     * Test: Should filter stats by time range
     * Scenario: User requests log statistics for a specific period
     * Expected: Returns stats only for specified time range
     */
    it('should filter stats by time range', async () => {
      const startTime = new Date(Date.now() - 3600000).toISOString(); // 1 hour ago
      const endTime = new Date().toISOString();

      const response = await request(app)
        .get(`/api/logs/stats?projectId=${testProject.id}&startTime=${startTime}&endTime=${endTime}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });

    /**
     * Test: Should return 401 without authentication
     * Scenario: Unauthenticated request to get stats
     * Expected: Returns 401 unauthorized
     */
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/logs/stats?projectId=${testProject.id}`);

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/logs/export', () => {
    beforeEach(async () => {
      await Log.create({
        projectId: testProject.id,
        deploymentId: testDeployment.id,
        level: 'info',
        message: 'Export log 1',
        timestamp: new Date('2024-01-01T10:00:00Z'),
      });

      await Log.create({
        projectId: testProject.id,
        deploymentId: testDeployment.id,
        level: 'error',
        message: 'Export log 2',
        timestamp: new Date('2024-01-01T10:05:00Z'),
      });
    });

    /**
     * Test: Should export logs in JSON format
     * Scenario: User exports logs as JSON
     * Expected: Returns 200 with JSON content
     */
    it('should export logs in JSON format', async () => {
      const response = await request(app)
        .get(`/api/logs/export?projectId=${testProject.id}&format=json`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('application/json');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    /**
     * Test: Should export logs in text format
     * Scenario: User exports logs as plain text
     * Expected: Returns 200 with text content
     */
    it('should export logs in text format', async () => {
      const response = await request(app)
        .get(`/api/logs/export?projectId=${testProject.id}&format=text`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.headers['content-type']).toContain('text/plain');
      expect(response.headers['content-disposition']).toContain('attachment');
    });

    /**
     * Test: Should filter exported logs by deployment
     * Scenario: User exports logs for a specific deployment
     * Expected: Returns only logs for that deployment
     */
    it('should filter exported logs by deploymentId', async () => {
      const response = await request(app)
        .get(`/api/logs/export?deploymentId=${testDeployment.id}&format=json`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const logs = JSON.parse(response.text);
      expect(logs.every(log => log.deploymentId === testDeployment.id)).toBe(true);
    });

    /**
     * Test: Should filter exported logs by time range
     * Scenario: User exports logs within a specific time range
     * Expected: Returns logs between start and end time
     */
    it('should filter exported logs by time range', async () => {
      const response = await request(app)
        .get(`/api/logs/export?projectId=${testProject.id}&startTime=2024-01-01T10:00:00Z&endTime=2024-01-01T10:03:00Z&format=json`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      const logs = JSON.parse(response.text);
      expect(logs).toHaveLength(1);
    });

    /**
     * Test: Should return 401 without authentication
     * Scenario: Unauthenticated request to export logs
     * Expected: Returns 401 unauthorized
     */
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .get(`/api/logs/export?projectId=${testProject.id}`);

      expect(response.status).toBe(401);
    });
  });
});
