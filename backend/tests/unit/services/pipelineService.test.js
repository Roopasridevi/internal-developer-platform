const pipelineService = require('../../../src/services/pipelineService');
const { Pipeline, PipelineExecution, Project } = require('../../../src/models');
const { AppError } = require('../../../src/utils/errors');
const ciRunnerClient = require('../../../src/utils/ciRunnerClient');

jest.mock('../../../src/models');
jest.mock('../../../src/utils/logger');
jest.mock('../../../src/utils/ciRunnerClient');

describe('PipelineService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createPipeline', () => {
    /**
     * Test: Should successfully create a pipeline with valid data
     * Scenario: User creates a new CI/CD pipeline
     * Expected: Pipeline is created with active status
     */
    it('should create a pipeline successfully', async () => {
      const mockPipeline = {
        id: 'pipeline-123',
        name: 'Build Pipeline',
        projectId: 'project-123',
        config: { steps: ['build', 'test'] },
        status: 'active',
        createdBy: 'user-123',
      };

      const pipelineData = {
        name: 'Build Pipeline',
        projectId: 'project-123',
        config: { steps: ['build', 'test'] },
      };

      Pipeline.create = jest.fn().mockResolvedValue(mockPipeline);

      const result = await pipelineService.createPipeline(pipelineData, 'user-123');

      expect(result).toEqual(mockPipeline);
      expect(Pipeline.create).toHaveBeenCalledWith({
        ...pipelineData,
        createdBy: 'user-123',
        status: 'active',
      });
    });

    /**
     * Test: Should handle database errors during pipeline creation
     * Scenario: Database throws an error
     * Expected: AppError is thrown with appropriate message
     */
    it('should throw AppError when pipeline creation fails', async () => {
      Pipeline.create = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        pipelineService.createPipeline({ name: 'Test', config: {} }, 'user-123')
      ).rejects.toThrow(AppError);
      await expect(
        pipelineService.createPipeline({ name: 'Test', config: {} }, 'user-123')
      ).rejects.toThrow('Failed to create pipeline');
    });

    /**
     * Test: Should create pipeline with complex configuration
     * Scenario: User creates pipeline with detailed config
     * Expected: Pipeline is created with full configuration
     */
    it('should create pipeline with complex configuration', async () => {
      const complexConfig = {
        steps: ['checkout', 'build', 'test', 'deploy'],
        environment: { NODE_ENV: 'production' },
        triggers: ['push', 'pull_request'],
      };

      const mockPipeline = {
        id: 'pipeline-456',
        name: 'Complex Pipeline',
        config: complexConfig,
        status: 'active',
      };

      Pipeline.create = jest.fn().mockResolvedValue(mockPipeline);

      const result = await pipelineService.createPipeline(
        { name: 'Complex Pipeline', projectId: 'project-123', config: complexConfig },
        'user-123'
      );

      expect(result.config).toEqual(complexConfig);
    });
  });

  describe('getPipelines', () => {
    /**
     * Test: Should retrieve paginated pipelines
     * Scenario: User requests list of pipelines with pagination
     * Expected: Returns pipelines with pagination metadata
     */
    it('should get pipelines with pagination', async () => {
      const mockPipelines = [
        { id: 'pipeline-1', name: 'Pipeline 1' },
        { id: 'pipeline-2', name: 'Pipeline 2' },
      ];

      Pipeline.findAndCountAll = jest.fn().mockResolvedValue({
        rows: mockPipelines,
        count: 2,
      });

      const result = await pipelineService.getPipelines({
        page: 1,
        limit: 10,
        userId: 'user-123',
      });

      expect(result).toEqual({
        pipelines: mockPipelines,
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    /**
     * Test: Should filter pipelines by project ID
     * Scenario: User requests pipelines for a specific project
     * Expected: Returns only pipelines for that project
     */
    it('should filter pipelines by projectId', async () => {
      Pipeline.findAndCountAll = jest.fn().mockResolvedValue({
        rows: [],
        count: 0,
      });

      await pipelineService.getPipelines({
        projectId: 'project-123',
        page: 1,
        limit: 10,
        userId: 'user-123',
      });

      expect(Pipeline.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'project-123' },
        })
      );
    });

    /**
     * Test: Should include project details in pipeline results
     * Scenario: User requests pipelines
     * Expected: Each pipeline includes associated project data
     */
    it('should include project details', async () => {
      Pipeline.findAndCountAll = jest.fn().mockResolvedValue({
        rows: [],
        count: 0,
      });

      await pipelineService.getPipelines({
        page: 1,
        limit: 10,
        userId: 'user-123',
      });

      expect(Pipeline.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          include: [{ model: Project }],
        })
      );
    });

    /**
     * Test: Should handle database errors when fetching pipelines
     * Scenario: Database query fails
     * Expected: AppError is thrown
     */
    it('should throw AppError when fetching pipelines fails', async () => {
      Pipeline.findAndCountAll = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        pipelineService.getPipelines({ page: 1, limit: 10, userId: 'user-123' })
      ).rejects.toThrow(AppError);
    });
  });

  describe('getPipelineById', () => {
    /**
     * Test: Should retrieve a pipeline by ID
     * Scenario: User requests a specific pipeline
     * Expected: Returns the pipeline with project details
     */
    it('should get pipeline by id successfully', async () => {
      const mockPipeline = {
        id: 'pipeline-123',
        name: 'Test Pipeline',
        config: { steps: ['build'] },
      };

      Pipeline.findByPk = jest.fn().mockResolvedValue(mockPipeline);

      const result = await pipelineService.getPipelineById('pipeline-123', 'user-123');

      expect(result).toEqual(mockPipeline);
      expect(Pipeline.findByPk).toHaveBeenCalledWith('pipeline-123', {
        include: [{ model: Project }],
      });
    });

    /**
     * Test: Should throw error when pipeline not found
     * Scenario: User requests a non-existent pipeline
     * Expected: AppError with 404 status is thrown
     */
    it('should throw AppError when pipeline not found', async () => {
      Pipeline.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        pipelineService.getPipelineById('pipeline-999', 'user-123')
      ).rejects.toThrow(AppError);
      await expect(
        pipelineService.getPipelineById('pipeline-999', 'user-123')
      ).rejects.toThrow('Pipeline not found');
    });
  });

  describe('updatePipeline', () => {
    /**
     * Test: Should successfully update a pipeline
     * Scenario: User updates pipeline configuration
     * Expected: Pipeline is updated and returned
     */
    it('should update pipeline successfully', async () => {
      const mockPipeline = {
        id: 'pipeline-123',
        name: 'Old Name',
        update: jest.fn().mockResolvedValue(true),
      };

      Pipeline.findByPk = jest.fn().mockResolvedValue(mockPipeline);

      const updateData = { name: 'New Name', config: { steps: ['build', 'test', 'deploy'] } };
      const result = await pipelineService.updatePipeline('pipeline-123', updateData, 'user-123');

      expect(mockPipeline.update).toHaveBeenCalledWith(updateData);
      expect(result).toEqual(mockPipeline);
    });

    /**
     * Test: Should throw error when updating non-existent pipeline
     * Scenario: User tries to update a pipeline that doesn't exist
     * Expected: AppError is thrown
     */
    it('should throw error when pipeline does not exist', async () => {
      Pipeline.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        pipelineService.updatePipeline('pipeline-999', { name: 'New' }, 'user-123')
      ).rejects.toThrow(AppError);
    });

    /**
     * Test: Should handle database errors during update
     * Scenario: Database update operation fails
     * Expected: AppError is thrown
     */
    it('should handle update errors', async () => {
      const mockPipeline = {
        id: 'pipeline-123',
        update: jest.fn().mockRejectedValue(new Error('Update failed')),
      };

      Pipeline.findByPk = jest.fn().mockResolvedValue(mockPipeline);

      await expect(
        pipelineService.updatePipeline('pipeline-123', { name: 'New' }, 'user-123')
      ).rejects.toThrow(AppError);
    });
  });

  describe('deletePipeline', () => {
    /**
     * Test: Should successfully delete a pipeline
     * Scenario: User deletes a pipeline
     * Expected: Pipeline is deleted from database
     */
    it('should delete pipeline successfully', async () => {
      const mockPipeline = {
        id: 'pipeline-123',
        destroy: jest.fn().mockResolvedValue(true),
      };

      Pipeline.findByPk = jest.fn().mockResolvedValue(mockPipeline);

      await pipelineService.deletePipeline('pipeline-123', 'user-123');

      expect(mockPipeline.destroy).toHaveBeenCalled();
    });

    /**
     * Test: Should throw error when deleting non-existent pipeline
     * Scenario: User tries to delete a pipeline that doesn't exist
     * Expected: AppError is thrown
     */
    it('should throw error when pipeline does not exist', async () => {
      Pipeline.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        pipelineService.deletePipeline('pipeline-999', 'user-123')
      ).rejects.toThrow(AppError);
    });
  });

  describe('executePipeline', () => {
    /**
     * Test: Should successfully execute a pipeline
     * Scenario: User triggers a pipeline execution
     * Expected: Pipeline execution is created and CI runner is triggered
     */
    it('should execute pipeline successfully', async () => {
      const mockPipeline = {
        id: 'pipeline-123',
        config: { steps: ['build', 'test'] },
      };

      const mockExecution = {
        id: 'execution-123',
        pipelineId: 'pipeline-123',
        triggeredBy: 'user-123',
        status: 'running',
        parameters: { branch: 'main' },
      };

      Pipeline.findByPk = jest.fn().mockResolvedValue(mockPipeline);
      PipelineExecution.create = jest.fn().mockResolvedValue(mockExecution);
      ciRunnerClient.triggerPipeline = jest.fn().mockResolvedValue({ success: true });

      const result = await pipelineService.executePipeline(
        'pipeline-123',
        { branch: 'main' },
        'user-123'
      );

      expect(result).toEqual(mockExecution);
      expect(PipelineExecution.create).toHaveBeenCalledWith({
        pipelineId: 'pipeline-123',
        triggeredBy: 'user-123',
        status: 'running',
        parameters: { branch: 'main' },
      });
      expect(ciRunnerClient.triggerPipeline).toHaveBeenCalledWith({
        pipelineId: 'pipeline-123',
        executionId: 'execution-123',
        config: mockPipeline.config,
        parameters: { branch: 'main' },
      });
    });

    /**
     * Test: Should throw error when pipeline not found
     * Scenario: User tries to execute non-existent pipeline
     * Expected: AppError is thrown
     */
    it('should throw error when pipeline does not exist', async () => {
      Pipeline.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        pipelineService.executePipeline('pipeline-999', {}, 'user-123')
      ).rejects.toThrow(AppError);
    });

    /**
     * Test: Should handle CI runner errors
     * Scenario: CI runner client fails to trigger pipeline
     * Expected: AppError is thrown
     */
    it('should handle CI runner errors', async () => {
      const mockPipeline = { id: 'pipeline-123', config: {} };
      const mockExecution = { id: 'execution-123' };

      Pipeline.findByPk = jest.fn().mockResolvedValue(mockPipeline);
      PipelineExecution.create = jest.fn().mockResolvedValue(mockExecution);
      ciRunnerClient.triggerPipeline = jest.fn().mockRejectedValue(new Error('CI Runner failed'));

      await expect(
        pipelineService.executePipeline('pipeline-123', {}, 'user-123')
      ).rejects.toThrow(AppError);
    });

    /**
     * Test: Should execute pipeline without parameters
     * Scenario: User triggers pipeline without additional parameters
     * Expected: Pipeline executes with empty parameters
     */
    it('should execute pipeline without parameters', async () => {
      const mockPipeline = { id: 'pipeline-123', config: {} };
      const mockExecution = { id: 'execution-123', parameters: {} };

      Pipeline.findByPk = jest.fn().mockResolvedValue(mockPipeline);
      PipelineExecution.create = jest.fn().mockResolvedValue(mockExecution);
      ciRunnerClient.triggerPipeline = jest.fn().mockResolvedValue({});

      const result = await pipelineService.executePipeline('pipeline-123', {}, 'user-123');

      expect(result).toEqual(mockExecution);
    });
  });

  describe('getPipelineExecutions', () => {
    /**
     * Test: Should retrieve pipeline executions with pagination
     * Scenario: User requests execution history for a pipeline
     * Expected: Returns executions with pagination metadata
     */
    it('should get pipeline executions successfully', async () => {
      const mockPipeline = { id: 'pipeline-123' };
      const mockExecutions = [
        { id: 'execution-1', status: 'success' },
        { id: 'execution-2', status: 'running' },
      ];

      Pipeline.findByPk = jest.fn().mockResolvedValue(mockPipeline);
      PipelineExecution.findAndCountAll = jest.fn().mockResolvedValue({
        rows: mockExecutions,
        count: 2,
      });

      const result = await pipelineService.getPipelineExecutions(
        'pipeline-123',
        { page: 1, limit: 10 },
        'user-123'
      );

      expect(result).toEqual({
        executions: mockExecutions,
        pagination: {
          total: 2,
          page: 1,
          limit: 10,
          totalPages: 1,
        },
      });
    });

    /**
     * Test: Should throw error when pipeline not found
     * Scenario: User requests executions for non-existent pipeline
     * Expected: AppError is thrown
     */
    it('should throw error when pipeline does not exist', async () => {
      Pipeline.findByPk = jest.fn().mockResolvedValue(null);

      await expect(
        pipelineService.getPipelineExecutions('pipeline-999', { page: 1, limit: 10 }, 'user-123')
      ).rejects.toThrow(AppError);
    });

    /**
     * Test: Should order executions by creation date descending
     * Scenario: User requests pipeline executions
     * Expected: Executions are ordered from newest to oldest
     */
    it('should order executions by createdAt DESC', async () => {
      const mockPipeline = { id: 'pipeline-123' };

      Pipeline.findByPk = jest.fn().mockResolvedValue(mockPipeline);
      PipelineExecution.findAndCountAll = jest.fn().mockResolvedValue({
        rows: [],
        count: 0,
      });

      await pipelineService.getPipelineExecutions(
        'pipeline-123',
        { page: 1, limit: 10 },
        'user-123'
      );

      expect(PipelineExecution.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['createdAt', 'DESC']],
        })
      );
    });
  });
});
