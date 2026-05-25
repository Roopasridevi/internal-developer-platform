const request = require('supertest');
const app = require('../../src/app');
const { sequelize, Deployment, Environment, Project, User } = require('../../src/models');
const jwt = require('jsonwebtoken');
const kubernetesClient = require('../../src/utils/kubernetesClient');

jest.mock('../../src/utils/kubernetesClient');

describe('Deployment Routes Integration Tests', () => {
  let authToken;
  let testUser;
  let testProject;
  let testDeployment;

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

    await Environment.create({
      id: 'env-dev',
      name: 'development',
      projectId: testProject.id,
    });

    await Environment.create({
      id: 'env-prod',
      name: 'production',
      projectId: testProject.id,
    });
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    await Deployment.destroy({ where: {} });
    jest.clearAllMocks();
    kubernetesClient.deploy = jest.fn().mockResolvedValue({ name: 'test-deployment' });
    kubernetesClient.getDeploymentStatus = jest.fn().mockResolvedValue({ replicas: 3 });
  });

  describe('POST /api/deployments', () => {
    /**
     * Test: Should successfully create a new deployment
     * Scenario: Authenticated user creates a deployment with valid data
     * Expected: Returns 201 status with created deployment
     */
    it('should create a new deployment', async () => {
      const response = await request(app)
        .post('/api/deployments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProject.id,
          environment: 'production',
          version: 'v1.0.0',
          imageUrl: 'registry.io/app:v1.0.0',
          replicas: 3,
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.version).toBe('v1.0.0');
      expect(kubernetesClient.deploy).toHaveBeenCalled();
    });

    /**
     * Test: Should return 400 for invalid deployment data
     * Scenario: User submits incomplete deployment data
     * Expected: Returns 400 with validation errors
     */
    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/deployments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing required fields
        });

      expect(response.status).toBe(400);
    });

    /**
     * Test: Should return 401 without authentication
     * Scenario: Unauthenticated request to create deployment
     * Expected: Returns 401 unauthorized
     */
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/deployments')
        .send({
          projectId: testProject.id,
          environment: 'production',
          version: 'v1.0.0',
        });

      expect(response.status).toBe(401);
    });

    /**
     * Test: Should create deployment with environment variables
     * Scenario: User deploys with custom environment variables
     * Expected: Returns 201 with deployment including env vars
     */
    it('should create deployment with environment variables', async () => {
      const response = await request(app)
        .post('/api/deployments')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          projectId: testProject.id,
          environment: 'production',
          version: 'v1.0.0',
          imageUrl: 'registry.io/app:v1.0.0',
          environmentVariables: {
            DATABASE_URL: 'postgres://...',
            API_KEY: 'secret',
          },
        });

      expect(response.status).toBe(201);
      expect(response.body.data.environmentVariables).toBeDefined();
    });
  });

  describe('GET /api/deployments', () => {
    beforeEach(async () => {
      await Deployment.create({
        projectId: testProject.id,
        environment: 'production',
        version: 'v1.0.0',
        deployedBy: testUser.id,
        status: 'deployed',
      });

      await Deployment.create({
        projectId: testProject.id,
        environment: 'staging',
        version: 'v1.1.0',
        deployedBy: testUser.id,
        status: 'deploying',
      });
    });

    /**
     * Test: Should retrieve all deployments
     * Scenario: User requests list of deployments
     * Expected: Returns 200 with list of deployments
     */
    it('should get all deployments', async () => {
      const response = await request(app)
        .get('/api/deployments')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.deployments).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    /**
     * Test: Should filter deployments by project ID
     * Scenario: User requests deployments for a specific project
     * Expected: Returns only deployments for that project
     */
    it('should filter deployments by projectId', async () => {
      const response = await request(app)
        .get(`/api/deployments?projectId=${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.deployments.every(d => d.projectId === testProject.id)).toBe(true);
    });

    /**
     * Test: Should filter deployments by environment
     * Scenario: User filters deployments by environment
     * Expected: Returns only deployments for specified environment
     */
    it('should filter deployments by environment', async () => {
      const response = await request(app)
        .get('/api/deployments?environment=production')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.deployments.every(d => d.environment === 'production')).toBe(true);
    });

    /**
     * Test: Should filter deployments by status
     * Scenario: User filters deployments by status
     * Expected: Returns only deployments with specified status
     */
    it('should filter deployments by status', async () => {
      const response = await request(app)
        .get('/api/deployments?status=deployed')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.deployments.every(d => d.status === 'deployed')).toBe(true);
    });

    /**
     * Test: Should support pagination
     * Scenario: User requests deployments with pagination parameters
     * Expected: Returns paginated results
     */
    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/deployments?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.deployments).toHaveLength(1);
      expect(response.body.data.pagination.limit).toBe(1);
    });
  });

  describe('GET /api/deployments/:id', () => {
    beforeEach(async () => {
      testDeployment = await Deployment.create({
        projectId: testProject.id,
        environment: 'production',
        version: 'v1.0.0',
        deployedBy: testUser.id,
        status: 'deployed',
      });
    });

    /**
     * Test: Should retrieve deployment by ID
     * Scenario: User requests a specific deployment
     * Expected: Returns 200 with deployment details
     */
    it('should get deployment by id', async () => {
      const response = await request(app)
        .get(`/api/deployments/${testDeployment.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testDeployment.id);
      expect(response.body.data.version).toBe('v1.0.0');
    });

    /**
     * Test: Should return 404 for non-existent deployment
     * Scenario: User requests a deployment that doesn't exist
     * Expected: Returns 404
     */
    it('should return 404 for non-existent deployment', async () => {
      const response = await request(app)
        .get('/api/deployments/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('POST /api/deployments/:id/rollback', () => {
    beforeEach(async () => {
      testDeployment = await Deployment.create({
        projectId: testProject.id,
        environment: 'production',
        version: 'v2.0.0',
        previousVersion: 'v1.0.0',
        deployedBy: testUser.id,
        status: 'deployed',
      });
    });

    /**
     * Test: Should rollback deployment successfully
     * Scenario: User rolls back to previous version
     * Expected: Returns 200 with new deployment at previous version
     */
    it('should rollback deployment successfully', async () => {
      const response = await request(app)
        .post(`/api/deployments/${testDeployment.id}/rollback`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.version).toBe('v1.0.0');
      expect(response.body.data.isRollback).toBe(true);
      expect(kubernetesClient.deploy).toHaveBeenCalled();
    });

    /**
     * Test: Should return 400 when no previous version exists
     * Scenario: User tries to rollback deployment without previous version
     * Expected: Returns 400 error
     */
    it('should return 400 when no previous version available', async () => {
      const deploymentWithoutPrevious = await Deployment.create({
        projectId: testProject.id,
        environment: 'production',
        version: 'v1.0.0',
        previousVersion: null,
        deployedBy: testUser.id,
      });

      const response = await request(app)
        .post(`/api/deployments/${deploymentWithoutPrevious.id}/rollback`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(400);
    });

    /**
     * Test: Should return 404 for non-existent deployment
     * Scenario: User tries to rollback non-existent deployment
     * Expected: Returns 404
     */
    it('should return 404 for non-existent deployment', async () => {
      const response = await request(app)
        .post('/api/deployments/non-existent-id/rollback')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/deployments/:id/status', () => {
    beforeEach(async () => {
      testDeployment = await Deployment.create({
        projectId: testProject.id,
        environment: 'production',
        version: 'v1.0.0',
        deployedBy: testUser.id,
        k8sDeploymentName: 'app-production',
        status: 'deployed',
      });
    });

    /**
     * Test: Should retrieve deployment status from Kubernetes
     * Scenario: User requests current deployment status
     * Expected: Returns 200 with deployment and Kubernetes status
     */
    it('should get deployment status successfully', async () => {
      const response = await request(app)
        .get(`/api/deployments/${testDeployment.id}/status`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.deployment).toBeDefined();
      expect(response.body.data.kubernetes).toBeDefined();
      expect(kubernetesClient.getDeploymentStatus).toHaveBeenCalledWith('app-production');
    });

    /**
     * Test: Should handle Kubernetes API errors
     * Scenario: Kubernetes API fails to return status
     * Expected: Returns 500 error
     */
    it('should handle Kubernetes API errors', async () => {
      kubernetesClient.getDeploymentStatus = jest.fn().mockRejectedValue(new Error('K8s API error'));

      const response = await request(app)
        .get(`/api/deployments/${testDeployment.id}/status`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(500);
    });
  });

  describe('GET /api/projects/:projectId/environments', () => {
    /**
     * Test: Should retrieve all environments for a project
     * Scenario: User requests list of available environments
     * Expected: Returns 200 with list of environments
     */
    it('should get project environments', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProject.id}/environments`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });

    /**
     * Test: Should return empty array when no environments exist
     * Scenario: Project has no environments configured
     * Expected: Returns 200 with empty array
     */
    it('should return empty array when no environments exist', async () => {
      const newProject = await Project.create({
        name: 'Project Without Environments',
        ownerId: testUser.id,
      });

      const response = await request(app)
        .get(`/api/projects/${newProject.id}/environments`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data).toEqual([]);
    });
  });
});
