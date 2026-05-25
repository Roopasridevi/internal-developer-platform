const request = require('supertest');
const app = require('../../src/app');
const { sequelize, Project, ProjectMember, User } = require('../../src/models');
const jwt = require('jsonwebtoken');

describe('Project Routes Integration Tests', () => {
  let authToken;
  let testUser;
  let testProject;

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
  });

  afterAll(async () => {
    await sequelize.close();
  });

  beforeEach(async () => {
    // Clean up projects before each test
    await Project.destroy({ where: {} });
    await ProjectMember.destroy({ where: {} });
  });

  describe('POST /api/projects', () => {
    /**
     * Test: Should successfully create a new project
     * Scenario: Authenticated user creates a project with valid data
     * Expected: Returns 201 status with created project
     */
    it('should create a new project', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Project',
          description: 'Test Description',
          repositoryUrl: 'https://github.com/test/repo',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
      expect(response.body.data.name).toBe('Test Project');
      expect(response.body.data.ownerId).toBe(testUser.id);
    });

    /**
     * Test: Should return 400 for invalid data
     * Scenario: User submits incomplete project data
     * Expected: Returns 400 with validation errors
     */
    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });

    /**
     * Test: Should return 401 without authentication
     * Scenario: Unauthenticated request to create project
     * Expected: Returns 401 unauthorized
     */
    it('should return 401 without authentication', async () => {
      const response = await request(app)
        .post('/api/projects')
        .send({
          name: 'Test Project',
          description: 'Test Description',
        });

      expect(response.status).toBe(401);
    });

    /**
     * Test: Should create project with minimal required fields
     * Scenario: User creates project with only required fields
     * Expected: Returns 201 with project having default values
     */
    it('should create project with minimal required fields', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Minimal Project',
        });

      expect(response.status).toBe(201);
      expect(response.body.data.name).toBe('Minimal Project');
      expect(response.body.data.status).toBe('active');
    });
  });

  describe('GET /api/projects', () => {
    beforeEach(async () => {
      // Create test projects
      testProject = await Project.create({
        name: 'Project 1',
        description: 'Description 1',
        ownerId: testUser.id,
        status: 'active',
      });

      await ProjectMember.create({
        projectId: testProject.id,
        userId: testUser.id,
        role: 'owner',
      });

      const project2 = await Project.create({
        name: 'Project 2',
        description: 'Description 2',
        ownerId: testUser.id,
        status: 'active',
      });

      await ProjectMember.create({
        projectId: project2.id,
        userId: testUser.id,
        role: 'developer',
      });
    });

    /**
     * Test: Should retrieve all user projects
     * Scenario: User requests their projects
     * Expected: Returns 200 with list of projects
     */
    it('should get all user projects', async () => {
      const response = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.projects).toHaveLength(2);
      expect(response.body.data.pagination).toBeDefined();
    });

    /**
     * Test: Should support pagination
     * Scenario: User requests projects with pagination parameters
     * Expected: Returns paginated results
     */
    it('should support pagination', async () => {
      const response = await request(app)
        .get('/api/projects?page=1&limit=1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.projects).toHaveLength(1);
      expect(response.body.data.pagination.page).toBe(1);
      expect(response.body.data.pagination.limit).toBe(1);
    });

    /**
     * Test: Should filter projects by search term
     * Scenario: User searches for projects by name
     * Expected: Returns only matching projects
     */
    it('should filter projects by search term', async () => {
      const response = await request(app)
        .get('/api/projects?search=Project 1')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.projects.length).toBeGreaterThan(0);
    });

    /**
     * Test: Should filter projects by status
     * Scenario: User filters projects by active status
     * Expected: Returns only active projects
     */
    it('should filter projects by status', async () => {
      const response = await request(app)
        .get('/api/projects?status=active')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.data.projects.every(p => p.status === 'active')).toBe(true);
    });
  });

  describe('GET /api/projects/:id', () => {
    beforeEach(async () => {
      testProject = await Project.create({
        name: 'Test Project',
        description: 'Test Description',
        ownerId: testUser.id,
      });

      await ProjectMember.create({
        projectId: testProject.id,
        userId: testUser.id,
        role: 'owner',
      });
    });

    /**
     * Test: Should retrieve project by ID
     * Scenario: User requests a specific project
     * Expected: Returns 200 with project details
     */
    it('should get project by id', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.id).toBe(testProject.id);
      expect(response.body.data.name).toBe('Test Project');
    });

    /**
     * Test: Should return 404 for non-existent project
     * Scenario: User requests a project that doesn't exist
     * Expected: Returns 404
     */
    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .get('/api/projects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('PUT /api/projects/:id', () => {
    beforeEach(async () => {
      testProject = await Project.create({
        name: 'Original Name',
        description: 'Original Description',
        ownerId: testUser.id,
      });

      await ProjectMember.create({
        projectId: testProject.id,
        userId: testUser.id,
        role: 'owner',
      });
    });

    /**
     * Test: Should update project successfully
     * Scenario: User updates project details
     * Expected: Returns 200 with updated project
     */
    it('should update project successfully', async () => {
      const response = await request(app)
        .put(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
          description: 'Updated Description',
        });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(response.body.data.name).toBe('Updated Name');
      expect(response.body.data.description).toBe('Updated Description');
    });

    /**
     * Test: Should return 404 when updating non-existent project
     * Scenario: User tries to update a project that doesn't exist
     * Expected: Returns 404
     */
    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .put('/api/projects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Updated Name',
        });

      expect(response.status).toBe(404);
    });

    /**
     * Test: Should validate update data
     * Scenario: User sends invalid update data
     * Expected: Returns 400 with validation errors
     */
    it('should validate update data', async () => {
      const response = await request(app)
        .put(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: '', // Invalid empty name
        });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /api/projects/:id', () => {
    beforeEach(async () => {
      testProject = await Project.create({
        name: 'Project to Delete',
        ownerId: testUser.id,
      });

      await ProjectMember.create({
        projectId: testProject.id,
        userId: testUser.id,
        role: 'owner',
      });
    });

    /**
     * Test: Should delete project successfully
     * Scenario: User deletes their project
     * Expected: Returns 200 and project is removed from database
     */
    it('should delete project successfully', async () => {
      const response = await request(app)
        .delete(`/api/projects/${testProject.id}`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);

      // Verify project is deleted
      const deletedProject = await Project.findByPk(testProject.id);
      expect(deletedProject).toBeNull();
    });

    /**
     * Test: Should return 404 when deleting non-existent project
     * Scenario: User tries to delete a project that doesn't exist
     * Expected: Returns 404
     */
    it('should return 404 for non-existent project', async () => {
      const response = await request(app)
        .delete('/api/projects/non-existent-id')
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(404);
    });
  });

  describe('GET /api/projects/:id/members', () => {
    beforeEach(async () => {
      testProject = await Project.create({
        name: 'Team Project',
        ownerId: testUser.id,
      });

      await ProjectMember.create({
        projectId: testProject.id,
        userId: testUser.id,
        role: 'owner',
      });
    });

    /**
     * Test: Should retrieve project members
     * Scenario: User requests list of project members
     * Expected: Returns 200 with members list
     */
    it('should get project members', async () => {
      const response = await request(app)
        .get(`/api/projects/${testProject.id}/members`)
        .set('Authorization', `Bearer ${authToken}`);

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
      expect(Array.isArray(response.body.data)).toBe(true);
      expect(response.body.data.length).toBeGreaterThan(0);
    });
  });

  describe('POST /api/projects/:id/members', () => {
    let anotherUser;

    beforeEach(async () => {
      testProject = await Project.create({
        name: 'Team Project',
        ownerId: testUser.id,
      });

      await ProjectMember.create({
        projectId: testProject.id,
        userId: testUser.id,
        role: 'owner',
      });

      anotherUser = await User.create({
        id: 'another-user-123',
        name: 'Another User',
        email: 'another@example.com',
        password: 'hashedpassword',
      });
    });

    /**
     * Test: Should add member to project
     * Scenario: Owner adds a new member to the project
     * Expected: Returns 201 with member details
     */
    it('should add member to project', async () => {
      const response = await request(app)
        .post(`/api/projects/${testProject.id}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          userId: anotherUser.id,
          role: 'developer',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data.userId).toBe(anotherUser.id);
      expect(response.body.data.role).toBe('developer');
    });

    /**
     * Test: Should validate member data
     * Scenario: User sends invalid member data
     * Expected: Returns 400 with validation errors
     */
    it('should validate member data', async () => {
      const response = await request(app)
        .post(`/api/projects/${testProject.id}/members`)
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          // Missing userId and role
        });

      expect(response.status).toBe(400);
    });
  });
});
