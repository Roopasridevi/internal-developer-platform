const request = require('supertest');
const app = require('../../src/app');
const { sequelize, Pipeline, PipelineExecution, Project, User } = require('../../src/models');
const jwt = require('jsonwebtoken');
const ciRunnerClient = require('../../src/utils/ciRunnerClient');

jest.mock('../../src/utils/ciRunnerClient');

describe('Pipeline Routes Integration Tests', () => {
  let authToken;
  let testUser;
  let testProject;
  let testPipeline;

  beforeAll(async () => {
    await sequelize.sync({ force: true });

    // Create test user
    testUser = await User.create({
      id: 'test-user-123',
      name: 'Test User',
      email: 'test@example.com',
      password: 'hashedpassword',
    });

    // Generate auth token
    authToken = jwt.sign(
      { id: testUser.id, email: testUser.email },
      process.env.JWT_SECRET || 'test-secret',
      { expiresIn: '1h' }
    );

    // Create test project
    testProject = await Project.create({
      id: 'test-project-123',
      name: 'Test Project',
      ownerId: testUser.id,
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Pipeline.destroy({ where: {} });
    await PipelineExecution.destroy({ where: {} });
    jest.clearAllMocks();
  });

  describe('POST /api/pipelines', () => {
    /**
     * Test: Should successfully create a new pipeline
     * Scenario: Authenticated user creates a pipeline with valid configuration
     * Expected: Returns 201 status with created pipeline
     */
    it('should create a new pipeline', async () => {
      const response = await request(app)
        .post('/api/pipelines')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Build Pipeline',
          description: 'CI/CD Build Pipeline',
          projectId: testProject.id,
          config: {
            steps: ['checkout', 'build', 'test'],
            environment: { NODE_ENV: 'production' },
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Build Pipeline');
      expect(response.body.data.status).toBe('active');
    });

    /**
     * Test: Should return 400 for invalid pipeline data
     * Scenario: User submits incomplete pipeline configuration
     * Expected: Returns 400 with validation errors
     */
    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/pipelines')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Invalid Pipeline',
          // Missing required config
        });

      expect(response.status).toBe(400);
    });

    /**
     * Test: Should return 401 without authentication
     * Scenario: Unauthenticated request to create pipeline
     * Expected: Returns 401 unauthorized
     */
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/pipelines')
        .send({
          name: 'Test Pipeline',
          projectId: testProject.id,
          config: { steps: [] },
        });

      expect(response.status).toBe(401);
    });
  });

  describe('GET /api/pipelines', () => {
    beforeEach(async () => {
      await Pipeline.create({
        name: 'Pipeline 1',
        projectId: testProject.id,
        config: { steps: ['build'] },
        createdBy: testUser.id,
      });

      await Pipeline.create({
        name: 'Pipeline 2',
        projectId: testProject.id,
        config: { steps: ['test'] },
        createdBy: testUser.id,
      });
    });

    /**
     * Test: Should retrieve all pipelines
     * Scenario: User requests list of pipelines
     * Expected: Returns 200 with list of pipelines
     */
    it('should get all pipelines', async () => {
      const response = await request(app)
        .get('/api/pipelines')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.pipelines).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    /**
     * Test: Should filter pipelines by project ID
     * Scenario: User requests pipelines for a specific project
     * Expected: Returns only pipelines for that project
     */
    it('should filter pipelines by projectId', async () => {
      const response = await request(app)
        .get(`/api/pipelines?projectId=${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.pipelines.every(p => p.projectId === testProject.id)).toBe(true);
    });

    /**
     * Test: Should support pagination
     * Scenario: User requests pipelines with pagination parameters
     * Expected: Returns paginated results
     */
    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/pipelines?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.pipelines).toHaveLength(1);
      expect(response.body.data.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/pipelines/:id', () => {
    beforeEach(async () => {
      testPipeline = await Pipeline.create({
        name: 'Test Pipeline',
        projectId: testProject.id,
        config: { steps: ['build', 'test'] },
        createdBy: testUser.id,
      });
    });

    /**
     * Test: Should retrieve pipeline by ID
     * Scenario: User requests a specific pipeline
     * Expected: Returns 200 with pipeline details
     */
    it('should get pipeline by id', async () => {
      const response = await request(app)
        .get(`/api/pipelines/${testPipeline.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testPipeline.id);
      expect(response.body.data.name).toBe('Test Pipeline');
    });

    /**
     * Test: Should return 404 for non-existent pipeline
     * Scenario: User requests a pipeline that doesn't exist
     * Expected: Returns 404
     */
    it('should return 404 for non-existent pipeline', async () => {
      const response = await request(app)
        .get('/api/pipelines/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/pipelines/:id', () => {
    beforeEach(async () => {
      testPipeline = await Pipeline.create({
        name: 'Original Pipeline',
        projectId: testProject.id,
        config: { steps: ['build'] },
        createdBy: testUser.id,
      });
    });

    /**
     * Test: Should update pipeline successfully
     * Scenario: User updates pipeline configuration
     * Expected: Returns 200 with updated pipeline
     */
    it('should update pipeline successfully', async () => {
      const response = await request(app)
        .put(`/api/pipelines/${testPipeline.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Pipeline',
          config: { steps: ['build', 'test', 'deploy'] },
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Pipeline');
    });

    /**
     * Test: Should return 404 when updating non-existent pipeline
     * Scenario: User tries to update a pipeline that doesn't exist
     * Expected: Returns 404
     */
    it('should return 404 for non-existent pipeline', async () => {
      const response = await request(app)
        .put('/api/pipelines/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Pipeline',
        });

      expect(response.status).toBe(404);
    });
  });

  describe('DELETE /api/pipelines/:id', () => {
    beforeEach(async () => {
      testPipeline = await Pipeline.create({
        name: 'Pipeline to Delete',
        projectId: testProject.id,
        config: { steps: [] },
        createdBy: testUser.id,
      });
    });

    /**
     * Test: Should delete pipeline successfully
     * Scenario: User deletes a pipeline
     * Expected: Returns 200 and pipeline is removed from database
     */
    it('should delete pipeline successfully', async () => {
      const response = await request(app)
        .delete(`/api/pipelines/${testPipeline.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      const deletedPipeline = await Pipeline.findByPk(testPipeline.id);
      expect(deletedPipeline).toBeNull();
    });

    /**
     * Test: Should return 404 when deleting non-existent pipeline
     * Scenario: User tries to delete a pipeline that doesn't exist
     * Expected: Returns 404
     */
    it('should return 404 for non-existent pipeline', async () => {
      const response = await request(app)
        .delete('/api/pipelines/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/pipelines/:id/execute', () => {
    beforeEach(async () => {
      testPipeline = await Pipeline.create({
        name: 'Executable Pipeline',
        projectId: testProject.id,
        config: { steps: ['build', 'test'] },
        createdBy: testUser.id,
      });

      ciRunnerClient.triggerPipeline = jest.fn().mockResolvedValue({ success: true });
    });

    /**
     * Test: Should execute pipeline successfully
     * Scenario: User triggers pipeline execution
     * Expected: Returns 200 with execution details and CI runner is triggered
     */
    it('should execute pipeline successfully', async () => {
      const response = await request(app)
        .post(`/api/pipelines/${testPipeline.id}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          branch: 'main',
          commit: 'abc123',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.status).toBe('running');
      expect(ciRunnerClient.triggerPipeline).toHaveBeenCalled();
    });

    /**
     * Test: Should handle CI runner errors
     * Scenario: CI runner fails to trigger pipeline
     * Expected: Returns 500 error
     */
    it('should handle CI runner errors', async () => {
      ciRunnerClient.triggerPipeline = jest.fn().mockRejectedValue(new Error('CI Runner failed'));

      const response = await request(app)
        .post(`/api/pipelines/${testPipeline.id}/execute`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(500);
    });

    /**
     * Test: Should return 404 for non-existent pipeline
     * Scenario: User tries to execute non-existent pipeline
     * Expected: Returns 404
     */
    it('should return 404 for non-existent pipeline', async () => {
      const response = await request(app)
        .post('/api/pipelines/non-existent-id/execute')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/pipelines/:id/executions', () => {
    beforeEach(async () => {
      testPipeline = await Pipeline.create({
        name: 'Pipeline with Executions',
        projectId: testProject.id,
        config: { steps: [] },
        createdBy: testUser.id,
      });

      await PipelineExecution.create({
        pipelineId: testPipeline.id,
        triggeredBy: testUser.id,
        status: 'success',
        parameters: { branch: 'main' },
      });

      await PipelineExecution.create({
        pipelineId: testPipeline.id,
        triggeredBy: testUser.id,
        status: 'failed',
        parameters: { branch: 'develop' },
      });
    });

    /**
     * Test: Should retrieve pipeline executions
     * Scenario: User requests execution history for a pipeline
     * Expected: Returns 200 with list of executions
     */
    it('should get pipeline executions', async () => {
      const response = await request(app)
        .get(`/api/pipelines/${testPipeline.id}/executions`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.executions).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    /**
     * Test: Should support pagination for executions
     * Scenario: User requests executions with pagination
     * Expected: Returns paginated execution results
     */
    it('should support pagination for executions', async () => {
      const response = await request(app)
        .get(`/api/pipelines/${testPipeline.id}/executions?page=1&limit=1`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.executions).toHaveLength(1);
    });

    /**
     * Test: Should return 404 for non-existent pipeline
     * Scenario: User requests executions for non-existent pipeline
     * Expected: Returns 404
     */
    it('should return 404 for non-existent pipeline', async () => {
      const response = await request(app)
        .get('/api/pipelines/non-existent-id/executions')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });
});
