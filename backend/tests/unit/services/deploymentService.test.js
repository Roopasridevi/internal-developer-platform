const deploymentService = require('../../../src/services/deploymentService');
const { Deployment, Project, Environment } = require('../../../src/models');
const { AppError } = require('../../../src/utils/errors');
const kubernetesClient = require('../../../src/utils/kubernetesClient');

jest.mock('../../../src/models');
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/kubernetesClient');

describe('DeploymentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createDeployment', () => {
    /**
     * Test: Should successfully create a deployment
     * Scenario: User creates a new deployment to Kubernetes
     * Expected: Deployment is created and Kubernetes deployment is triggered
     */
    it('should create deployment successfully', async () => {
      const mockDeployment = {
        id: 'deployment-123',
        projectId: 'project-123',
        environment: 'production',
        version: 'v1.0.0',
        deployedBy: 'user-123',
        status: 'pending',
        update: jest.fn().mockResolvedValue(true),
      };

      const deploymentData = {
        projectId: 'project-123',
        environment: 'production',
        version: 'v1.0.0',
        imageUrl: 'registry.io/app:v1.0.0',
        replicas: 3,
      };

      Deployment.create = jest.fn().mockResolvedValue(mockDeployment);
      kubernetesClient.deploy = jest.fn().mockResolvedValue({ name: 'project-123-production' });

      const result = await deploymentService.createDeployment(deploymentData, 'user-123');

      expect(Deployment.create).toHaveBeenCalledWith({
        ...deploymentData,
        deployedBy: 'user-123',
        status: 'pending',
      });
      expect(kubernetesClient.deploy).toHaveBeenCalled();
      expect(mockDeployment.update).toHaveBeenCalledWith({
        status: 'deploying',
        k8sDeploymentName: 'project-123-production',
      });
    });

    /**
     * Test: Should handle Kubernetes deployment errors
     * Scenario: Kubernetes client fails to deploy
     * Expected: Deployment status is set to failed and error is thrown
     */
    it('should handle Kubernetes deployment errors', async () => {
      const mockDeployment = {
        id: 'deployment-123',
        update: jest.fn().mockResolvedValue(true),
      };

      Deployment.create = jest.fn().mockResolvedValue(mockDeployment);
      kubernetesClient.deploy = jest.fn().mockRejectedValue(new Error('K8s error'));

      await expect(
        deploymentService.createDeployment({ projectId: 'project-123' }, 'user-123')
      ).rejects.toThrow();

      expect(mockDeployment.update).toHaveBeenCalledWith({ status: 'failed' });
    });

    /**
     * Test: Should create deployment with environment variables
     * Scenario: User deploys with custom environment variables
     * Expected: Deployment includes environment variables in K8s config
     */
    it('should create deployment with environment variables', async () => {
      const envVars = { DATABASE_URL: 'postgres://...', API_KEY: 'secret' };
      const mockDeployment = {
        id: 'deployment-123',
        environmentVariables: envVars,
        update: jest.fn().mockResolvedValue(true),
      };

      Deployment.create = jest.fn().mockResolvedValue(mockDeployment);
      kubernetesClient.deploy = jest.fn().mockResolvedValue({ name: 'test-deploy' });

      await deploymentService.createDeployment(
        {
          projectId: 'project-123',
          environment: 'staging',
          version: 'v1.0.0',
          environmentVariables: envVars,
        },
        'user-123'
      );

      expect(kubernetesClient.deploy).toHaveBeenCalledWith(
        expect.objectContaining({
          envVars,
        })
      );
    });
  });

  describe('getDeployments', () => {
    /**
     * Test: Should retrieve paginated deployments
     * Scenario: User requests list of deployments
     * Expected: Returns deployments with pagination metadata
     */
    it('should get deployments with pagination', async () => {
      const mockDeployments = [
        { id: 'deployment-1', environment: 'production' },
        { id: 'deployment-2', environment: 'staging' },
      ];

      Deployment.findAndCountAll = jest.fn().mockResolvedValue({
        rows: mockDeployments,
        count: 2,
      });

      const result = await deploymentService.getDeployments({
        page: 1,
        limit: 10,
        userId: 'user-123',
      });

      expect(result).toEqual({
        deployments: mockDeployments,
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    /**
     * Test: Should filter deployments by project ID
     * Scenario: User requests deployments for a specific project
     * Expected: Returns only deployments for that project
     */
    it('should filter deployments by projectId', async () => {
      Deployment.findAndCountAll = jest.fn().mockResolvedValue({
        rows: [],
        count: 0,
      });

      await deploymentService.getDeployments({
        projectId: 'project-123',
        page: 1,
        limit: 10,
        userId: 'user-123',
      });

      expect(Deployment.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: 'project-123' }),
        })
      );
    });

    /**
     * Test: Should filter deployments by environment
     * Scenario: User filters deployments by environment (e.g., production)
     * Expected: Returns only deployments for specified environment
     */
    it('should filter deployments by environment', async () => {
      Deployment.findAndCountAll = jest.fn().mockResolvedValue({
        rows: [],
        count: 0,
      });

      await deploymentService.getDeployments({
        environment: 'production',
        page: 1,
        limit: 10,
        userId: 'user-123',
      });

      expect(Deployment.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ environment: 'production' }),
        })
      );
    });

    /**
     * Test: Should filter deployments by status
     * Scenario: User filters deployments by status (e.g., deployed)
     * Expected: Returns only deployments with specified status
     */
    it('should filter deployments by status', async () => {
      Deployment.findAndCountAll = jest.fn().mockResolvedValue({
        rows: [],
        count: 0,
      });

      await deploymentService.getDeployments({
        status: 'deployed',
        page: 1,
        limit: 10,
        userId: 'user-123',
      });

      expect(Deployment.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ status: 'deployed' }),
        })
      );
    });

    /**
     * Test: Should handle database errors when fetching deployments
     * Scenario: Database query fails
     * Expected: AppError is thrown
     */
    it('should throw AppError when fetching deployments fails', async () => {
      Deployment.findAndCountAll = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        deploymentService.getDeployments({ page: 1, limit: 10, userId: 'user-123' })
      ).rejects.toThrow(AppError);
    });
  });

  describe('getDeploymentById', () => {
    /**
     * Test: Should retrieve a deployment by ID
     * Scenario: User requests a specific deployment
     * Expected: Returns the deployment with project details
     */
    it('should get deployment by id successfully', async () => {
      const mockDeployment = {
        id: 'deployment-123',
        environment: 'production',
        version: 'v1.0.0',
      };

      Deployment.findByPk = jest.fn().mockResolvedValue(mockDeployment);

      const result = await deploymentService.getDeploymentById('deployment-123', 'user-123');

      expect(result).toEqual(mockDeployment);
      expect(Deployment.findByPk).toHaveBeenCalledWith('deployment-123', {
        include: [{ model: Project }],
      });
    });

    /**
     * Test: Should throw error when deployment not found
     * Scenario: User requests a non-existent deployment
     * Expected: AppError with 404 status is thrown
     */
    it('should throw AppError when deployment not found', async () => {
      Deployment.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        deploymentService.getDeploymentById('deployment-999', 'user-123')
      ).rejects.toThrow(AppError);
      await expect(
        deploymentService.getDeploymentById('deployment-999', 'user-123')
      ).rejects.toThrow('Deployment not found');
    });
  });

  describe('rollbackDeployment', () => {
    /**
     * Test: Should successfully rollback a deployment
     * Scenario: User rolls back to previous version
     * Expected: New deployment is created with previous version
     */
    it('should rollback deployment successfully', async () => {
      const mockDeployment = {
        id: 'deployment-123',
        projectId: 'project-123',
        environment: 'production',
        version: 'v2.0.0',
        previousVersion: 'v1.0.0',
      };

      const mockRollback = {
        id: 'deployment-456',
        version: 'v1.0.0',
        isRollback: true,
        update: jest.fn().mockResolvedValue(true),
      };

      Deployment.findByPk = jest.fn().mockResolvedValue(mockDeployment);
      Deployment.create = jest.fn().mockResolvedValue(mockRollback);
      kubernetesClient.deploy = jest.fn().mockResolvedValue({ name: 'rollback-deploy' });

      const result = await deploymentService.rollbackDeployment('deployment-123', 'user-123');

      expect(Deployment.create).toHaveBeenCalledWith({
        projectId: 'project-123',
        environment: 'production',
        version: 'v1.0.0',
        deployedBy: 'user-123',
        status: 'pending',
        isRollback: true,
        rolledBackFrom: 'deployment-123',
      });
      expect(result).toEqual(mockRollback);
    });

    /**
     * Test: Should throw error when no previous version exists
     * Scenario: User tries to rollback deployment without previous version
     * Expected: AppError with 400 status is thrown
     */
    it('should throw error when no previous version available', async () => {
      const mockDeployment = {
        id: 'deployment-123',
        version: 'v1.0.0',
        previousVersion: null,
      };

      Deployment.findByPk = jest.fn().mockResolvedValue(mockDeployment);

      await expect(
        deploymentService.rollbackDeployment('deployment-123', 'user-123')
      ).rejects.toThrow(AppError);
      await expect(
        deploymentService.rollbackDeployment('deployment-123', 'user-123')
      ).rejects.toThrow('No previous version available for rollback');
    });

    /**
     * Test: Should throw error when deployment not found
     * Scenario: User tries to rollback non-existent deployment
     * Expected: AppError is thrown
     */
    it('should throw error when deployment does not exist', async () => {
      Deployment.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        deploymentService.rollbackDeployment('deployment-999', 'user-123')
      ).rejects.toThrow(AppError);
    });
  });

  describe('getDeploymentStatus', () => {
    /**
     * Test: Should retrieve deployment status from Kubernetes
     * Scenario: User requests current deployment status
     * Expected: Returns deployment data with Kubernetes status
     */
    it('should get deployment status successfully', async () => {
      const mockDeployment = {
        id: 'deployment-123',
        k8sDeploymentName: 'app-production',
      };

      const mockK8sStatus = {
        replicas: 3,
        availableReplicas: 3,
        conditions: [{ type: 'Available', status: 'True' }],
      };

      Deployment.findByPk = jest.fn().mockResolvedValue(mockDeployment);
      kubernetesClient.getDeploymentStatus = jest.fn().mockResolvedValue(mockK8sStatus);

      const result = await deploymentService.getDeploymentStatus('deployment-123', 'user-123');

      expect(result).toEqual({
        deployment: mockDeployment,
        kubernetes: mockK8sStatus,
      });
      expect(kubernetesClient.getDeploymentStatus).toHaveBeenCalledWith('app-production');
    });

    /**
     * Test: Should throw error when deployment not found
     * Scenario: User requests status for non-existent deployment
     * Expected: AppError is thrown
     */
    it('should throw error when deployment does not exist', async () => {
      Deployment.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        deploymentService.getDeploymentStatus('deployment-999', 'user-123')
      ).rejects.toThrow(AppError);
    });

    /**
     * Test: Should handle Kubernetes API errors
     * Scenario: Kubernetes API fails to return status
     * Expected: AppError is thrown
     */
    it('should handle Kubernetes API errors', async () => {
      const mockDeployment = { id: 'deployment-123', k8sDeploymentName: 'app-prod' };

      Deployment.findByPk = jest.fn().mockResolvedValue(mockDeployment);
      kubernetesClient.getDeploymentStatus = jest.fn().mockRejectedValue(new Error('K8s API error'));

      await expect(
        deploymentService.getDeploymentStatus('deployment-123', 'user-123')
      ).rejects.toThrow(AppError);
    });
  });

  describe('getEnvironments', () => {
    /**
     * Test: Should retrieve all environments for a project
     * Scenario: User requests list of available environments
     * Expected: Returns array of environments ordered by name
     */
    it('should get environments successfully', async () => {
      const mockEnvironments = [
        { id: 'env-1', name: 'development', projectId: 'project-123' },
        { id: 'env-2', name: 'production', projectId: 'project-123' },
        { id: 'env-3', name: 'staging', projectId: 'project-123' },
      ];

      Environment.findAll = jest.fn().mockResolvedValue(mockEnvironments);

      const result = await deploymentService.getEnvironments('project-123', 'user-123');

      expect(result).toEqual(mockEnvironments);
      expect(Environment.findAll).toHaveBeenCalledWith({
        where: { projectId: 'project-123' },
        order: [['name', 'ASC']],
      });
    });

    /**
     * Test: Should handle database errors when fetching environments
     * Scenario: Database query fails
     * Expected: AppError is thrown
     */
    it('should throw AppError when fetching environments fails', async () => {
      Environment.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        deploymentService.getEnvironments('project-123', 'user-123')
      ).rejects.toThrow(AppError);
    });

    /**
     * Test: Should return empty array when no environments exist
     * Scenario: Project has no environments configured
     * Expected: Returns empty array
     */
    it('should return empty array when no environments exist', async () => {
      Environment.findAll = jest.fn().mockResolvedValue([]);

      const result = await deploymentService.getEnvironments('project-123', 'user-123');

      expect(result).toEqual([]);
    });
  });

  describe('deployToKubernetes', () => {
    /**
     * Test: Should deploy to Kubernetes with correct configuration
     * Scenario: Internal method deploys application to K8s
     * Expected: Kubernetes client is called with proper config
     */
    it('should deploy to Kubernetes with correct configuration', async () => {
      const mockDeployment = {
        id: 'deployment-123',
        projectId: 'project-123',
        environment: 'production',
        imageUrl: 'registry.io/app:v1.0.0',
        version: 'v1.0.0',
        replicas: 3,
        environmentVariables: { NODE_ENV: 'production' },
        update: jest.fn().mockResolvedValue(true),
      };

      kubernetesClient.deploy = jest.fn().mockResolvedValue({ name: 'project-123-production' });

      await deploymentService.deployToKubernetes(mockDeployment);

      expect(kubernetesClient.deploy).toHaveBeenCalledWith({
        name: 'project-123-production',
        namespace: 'production',
        image: 'registry.io/app:v1.0.0',
        version: 'v1.0.0',
        replicas: 3,
        envVars: { NODE_ENV: 'production' },
      });
      expect(mockDeployment.update).toHaveBeenCalledWith({
        status: 'deploying',
        k8sDeploymentName: 'project-123-production',
      });
    });

    /**
     * Test: Should set deployment status to failed on K8s error
     * Scenario: Kubernetes deployment fails
     * Expected: Deployment status is updated to failed
     */
    it('should set deployment status to failed on Kubernetes error', async () => {
      const mockDeployment = {
        id: 'deployment-123',
        projectId: 'project-123',
        environment: 'production',
        update: jest.fn().mockResolvedValue(true),
      };

      kubernetesClient.deploy = jest.fn().mockRejectedValue(new Error('K8s deployment failed'));

      await expect(deploymentService.deployToKubernetes(mockDeployment)).rejects.toThrow();

      expect(mockDeployment.update).toHaveBeenCalledWith({ status: 'failed' });
    });
  });
});
