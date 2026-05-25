const request = require('supertest');
const app = require('../../src/app');
const { sequelize } = require('../../src/models');

describe('Project Routes', () => {
  let authToken;

  beforeAll(async () => {
    await sequelize.sync({ force: true });
    // Create test user and get auth token
  });

  afterAll(async () => {
    await sequelize.close();
  });

  describe('POST /api/projects', () => {
    it('should create a new project', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({
          name: 'Test Project',
          description: 'Test Description',
        });

      expect(response.status).toBe(201);
      expect(response.body.success).toBe(true);
      expect(response.body.data).toHaveProperty('id');
    });

    it('should return 400 for invalid data', async () => {
      const response = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${authToken}`)
        .send({});

      expect(response.status).toBe(400);
    });
  });
});
