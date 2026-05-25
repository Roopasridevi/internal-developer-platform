// Global test setup
process.env.NODE_ENV = 'test';

// Mock external services
jest.mock('../src/utils/ciRunnerClient');
jest.mock('../src/utils/kubernetesClient');

beforeAll(async () => {
  // Setup test database
});

afterAll(async () => {
  // Cleanup test database
});

beforeEach(() => {
  // Reset mocks before each test
  jest.clearAllMocks();
});
