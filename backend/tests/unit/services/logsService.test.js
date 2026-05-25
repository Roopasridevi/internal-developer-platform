const logsService = require('../../../src/services/logsService');
const { Log, Deployment, Pipeline } = require('../../../src/models');
const { AppError } = require('../../../src/utils/errors');
const { Op } = require('sequelize');
const { EventEmitter } = require('events');

jest.mock('../../../src/models');
jest.mock('../../../src/utils/logger');

describe('LogsService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('getLogs', () => {
    /**
     * Test: Should retrieve paginated logs
     * Scenario: User requests logs with pagination
     * Expected: Returns logs with pagination metadata
     */
    it('should get logs with pagination', async () => {
      const mockLogs = [
        { id: 'log-1', message: 'Log message 1', level: 'info' },
        { id: 'log-2', message: 'Log message 2', level: 'error' },
      ];

      Log.findAndCountAll = jest.fn().mockResolvedValue({
        rows: mockLogs,
        count: 2,
      });

      const result = await logsService.getLogs({
        page: 1,
        limit: 100,
        userId: 'user-123',
      });

      expect(result).toEqual({
        logs: mockLogs,
        pagination: {
          total: 2,
          page: 1,
          limit: 100,
          totalPages: 1,
        },
      });
    });

    /**
     * Test: Should filter logs by project ID
     * Scenario: User requests logs for a specific project
     * Expected: Returns only logs for that project
     */
    it('should filter logs by projectId', async () => {
      Log.findAndCountAll = jest.fn().mockResolvedValue({
        rows: [],
        count: 0,
      });

      await logsService.getLogs({
        projectId: 'project-123',
        page: 1,
        limit: 100,
        userId: 'user-123',
      });

      expect(Log.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ projectId: 'project-123' }),
        })
      );
    });

    /**
     * Test: Should filter logs by deployment ID
     * Scenario: User requests logs for a specific deployment
     * Expected: Returns only logs for that deployment
     */
    it('should filter logs by deploymentId', async () => {
      Log.findAndCountAll = jest.fn().mockResolvedValue({
        rows: [],
        count: 0,
      });

      await logsService.getLogs({
        deploymentId: 'deployment-123',
        page: 1,
        limit: 100,
        userId: 'user-123',
      });

      expect(Log.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deploymentId: 'deployment-123' }),
        })
      );
    });

    /**
     * Test: Should filter logs by pipeline ID
     * Scenario: User requests logs for a specific pipeline execution
     * Expected: Returns only logs for that pipeline
     */
    it('should filter logs by pipelineId', async () => {
      Log.findAndCountAll = jest.fn().mockResolvedValue({
        rows: [],
        count: 0,
      });

      await logsService.getLogs({
        pipelineId: 'pipeline-123',
        page: 1,
        limit: 100,
        userId: 'user-123',
      });

      expect(Log.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ pipelineId: 'pipeline-123' }),
        })
      );
    });

    /**
     * Test: Should filter logs by level
     * Scenario: User filters logs by severity level (e.g., error)
     * Expected: Returns only logs with specified level
     */
    it('should filter logs by level', async () => {
      Log.findAndCountAll = jest.fn().mockResolvedValue({
        rows: [],
        count: 0,
      });

      await logsService.getLogs({
        level: 'error',
        page: 1,
        limit: 100,
        userId: 'user-123',
      });

      expect(Log.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ level: 'error' }),
        })
      );
    });

    /**
     * Test: Should filter logs by search term
     * Scenario: User searches logs by message content
     * Expected: Returns logs matching search term
     */
    it('should filter logs by search term', async () => {
      Log.findAndCountAll = jest.fn().mockResolvedValue({
        rows: [],
        count: 0,
      });

      await logsService.getLogs({
        search: 'error occurred',
        page: 1,
        limit: 100,
        userId: 'user-123',
      });

      expect(Log.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            message: { [Op.iLike]: '%error occurred%' },
          }),
        })
      );
    });

    /**
     * Test: Should filter logs by time range
     * Scenario: User requests logs within a specific time range
     * Expected: Returns logs between start and end time
     */
    it('should filter logs by time range', async () => {
      const startTime = '2024-01-01T00:00:00Z';
      const endTime = '2024-01-31T23:59:59Z';

      Log.findAndCountAll = jest.fn().mockResolvedValue({
        rows: [],
        count: 0,
      });

      await logsService.getLogs({
        startTime,
        endTime,
        page: 1,
        limit: 100,
        userId: 'user-123',
      });

      expect(Log.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: {
              [Op.gte]: new Date(startTime),
              [Op.lte]: new Date(endTime),
            },
          }),
        })
      );
    });

    /**
     * Test: Should order logs by timestamp descending
     * Scenario: User requests logs
     * Expected: Logs are ordered from newest to oldest
     */
    it('should order logs by timestamp DESC', async () => {
      Log.findAndCountAll = jest.fn().mockResolvedValue({
        rows: [],
        count: 0,
      });

      await logsService.getLogs({
        page: 1,
        limit: 100,
        userId: 'user-123',
      });

      expect(Log.findAndCountAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['timestamp', 'DESC']],
        })
      );
    });

    /**
     * Test: Should handle database errors when fetching logs
     * Scenario: Database query fails
     * Expected: AppError is thrown
     */
    it('should throw AppError when fetching logs fails', async () => {
      Log.findAndCountAll = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        logsService.getLogs({ page: 1, limit: 100, userId: 'user-123' })
      ).rejects.toThrow(AppError);
    });
  });

  describe('streamLogs', () => {
    /**
     * Test: Should create a log stream for deployment
     * Scenario: User subscribes to real-time logs for a deployment
     * Expected: Returns event emitter that receives deployment logs
     */
    it('should stream logs for deployment', async () => {
      const stream = await logsService.streamLogs({
        deploymentId: 'deployment-123',
        userId: 'user-123',
      });

      expect(stream).toBeInstanceOf(EventEmitter);

      const mockLog = {
        id: 'log-1',
        deploymentId: 'deployment-123',
        message: 'Deployment started',
      };

      const dataHandler = jest.fn();
      stream.on('data', dataHandler);

      // Simulate new log event
      logsService.logEmitter.emit('newLog', mockLog);

      expect(dataHandler).toHaveBeenCalledWith(mockLog);
    });

    /**
     * Test: Should stream logs for pipeline
     * Scenario: User subscribes to real-time logs for a pipeline execution
     * Expected: Returns event emitter that receives pipeline logs
     */
    it('should stream logs for pipeline', async () => {
      const stream = await logsService.streamLogs({
        pipelineId: 'pipeline-123',
        userId: 'user-123',
      });

      const mockLog = {
        id: 'log-1',
        pipelineId: 'pipeline-123',
        message: 'Pipeline execution started',
      };

      const dataHandler = jest.fn();
      stream.on('data', dataHandler);

      logsService.logEmitter.emit('newLog', mockLog);

      expect(dataHandler).toHaveBeenCalledWith(mockLog);
    });

    /**
     * Test: Should not emit logs from other deployments
     * Scenario: Multiple deployments are logging simultaneously
     * Expected: Stream only receives logs for subscribed deployment
     */
    it('should only emit logs for subscribed deployment', async () => {
      const stream = await logsService.streamLogs({
        deploymentId: 'deployment-123',
        userId: 'user-123',
      });

      const dataHandler = jest.fn();
      stream.on('data', dataHandler);

      // Emit log for different deployment
      logsService.logEmitter.emit('newLog', {
        id: 'log-1',
        deploymentId: 'deployment-456',
        message: 'Other deployment log',
      });

      // Emit log for subscribed deployment
      logsService.logEmitter.emit('newLog', {
        id: 'log-2',
        deploymentId: 'deployment-123',
        message: 'Subscribed deployment log',
      });

      expect(dataHandler).toHaveBeenCalledTimes(1);
      expect(dataHandler).toHaveBeenCalledWith(
        expect.objectContaining({ deploymentId: 'deployment-123' })
      );
    });

    /**
     * Test: Should cleanup listener on stream close
     * Scenario: User closes the log stream
     * Expected: Event listener is removed
     */
    it('should cleanup listener on stream close', async () => {
      const stream = await logsService.streamLogs({
        deploymentId: 'deployment-123',
        userId: 'user-123',
      });

      const initialListenerCount = logsService.logEmitter.listenerCount('newLog');

      stream.emit('close');

      const finalListenerCount = logsService.logEmitter.listenerCount('newLog');

      expect(finalListenerCount).toBeLessThan(initialListenerCount);
    });
  });

  describe('getLogStats', () => {
    /**
     * Test: Should retrieve log statistics grouped by level
     * Scenario: User requests log statistics for a project
     * Expected: Returns count of logs grouped by severity level
     */
    it('should get log stats grouped by level', async () => {
      const mockStats = [
        { level: 'info', count: 150 },
        { level: 'warn', count: 25 },
        { level: 'error', count: 5 },
      ];

      Log.findAll = jest.fn().mockResolvedValue(mockStats);

      const result = await logsService.getLogStats({
        projectId: 'project-123',
        userId: 'user-123',
      });

      expect(result).toEqual(mockStats);
      expect(Log.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { projectId: 'project-123' },
          group: ['level'],
        })
      );
    });

    /**
     * Test: Should filter stats by time range
     * Scenario: User requests log statistics for a specific period
     * Expected: Returns stats only for specified time range
     */
    it('should filter stats by time range', async () => {
      const startTime = '2024-01-01T00:00:00Z';
      const endTime = '2024-01-31T23:59:59Z';

      Log.findAll = jest.fn().mockResolvedValue([]);

      await logsService.getLogStats({
        projectId: 'project-123',
        startTime,
        endTime,
        userId: 'user-123',
      });

      expect(Log.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            timestamp: {
              [Op.gte]: new Date(startTime),
              [Op.lte]: new Date(endTime),
            },
          }),
        })
      );
    });

    /**
     * Test: Should handle database errors when fetching stats
     * Scenario: Database query fails
     * Expected: AppError is thrown
     */
    it('should throw AppError when fetching stats fails', async () => {
      Log.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        logsService.getLogStats({ projectId: 'project-123', userId: 'user-123' })
      ).rejects.toThrow(AppError);
    });
  });

  describe('exportLogs', () => {
    /**
     * Test: Should export logs in JSON format
     * Scenario: User exports logs as JSON
     * Expected: Returns logs as formatted JSON string
     */
    it('should export logs in JSON format', async () => {
      const mockLogs = [
        { id: 'log-1', message: 'Log 1', level: 'info', timestamp: new Date() },
        { id: 'log-2', message: 'Log 2', level: 'error', timestamp: new Date() },
      ];

      Log.findAll = jest.fn().mockResolvedValue(mockLogs);

      const result = await logsService.exportLogs({
        projectId: 'project-123',
        format: 'json',
        userId: 'user-123',
      });

      expect(result).toBe(JSON.stringify(mockLogs, null, 2));
    });

    /**
     * Test: Should export logs in text format
     * Scenario: User exports logs as plain text
     * Expected: Returns logs as formatted text with timestamps
     */
    it('should export logs in text format', async () => {
      const timestamp1 = new Date('2024-01-01T10:00:00Z');
      const timestamp2 = new Date('2024-01-01T10:05:00Z');

      const mockLogs = [
        { id: 'log-1', message: 'Log 1', level: 'info', timestamp: timestamp1 },
        { id: 'log-2', message: 'Log 2', level: 'error', timestamp: timestamp2 },
      ];

      Log.findAll = jest.fn().mockResolvedValue(mockLogs);

      const result = await logsService.exportLogs({
        projectId: 'project-123',
        format: 'text',
        userId: 'user-123',
      });

      expect(result).toContain(`[${timestamp1}] [info] Log 1`);
      expect(result).toContain(`[${timestamp2}] [error] Log 2`);
    });

    /**
     * Test: Should filter exported logs by deployment
     * Scenario: User exports logs for a specific deployment
     * Expected: Only logs for that deployment are exported
     */
    it('should filter exported logs by deploymentId', async () => {
      Log.findAll = jest.fn().mockResolvedValue([]);

      await logsService.exportLogs({
        deploymentId: 'deployment-123',
        format: 'json',
        userId: 'user-123',
      });

      expect(Log.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({ deploymentId: 'deployment-123' }),
        })
      );
    });

    /**
     * Test: Should order exported logs by timestamp ascending
     * Scenario: User exports logs
     * Expected: Logs are ordered from oldest to newest
     */
    it('should order exported logs by timestamp ASC', async () => {
      Log.findAll = jest.fn().mockResolvedValue([]);

      await logsService.exportLogs({
        projectId: 'project-123',
        format: 'json',
        userId: 'user-123',
      });

      expect(Log.findAll).toHaveBeenCalledWith(
        expect.objectContaining({
          order: [['timestamp', 'ASC']],
        })
      );
    });

    /**
     * Test: Should handle database errors when exporting logs
     * Scenario: Database query fails
     * Expected: AppError is thrown
     */
    it('should throw AppError when exporting logs fails', async () => {
      Log.findAll = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        logsService.exportLogs({ projectId: 'project-123', format: 'json', userId: 'user-123' })
      ).rejects.toThrow(AppError);
    });
  });

  describe('createLog', () => {
    /**
     * Test: Should create a new log entry
     * Scenario: System creates a log entry
     * Expected: Log is created and newLog event is emitted
     */
    it('should create log successfully', async () => {
      const logData = {
        projectId: 'project-123',
        deploymentId: 'deployment-123',
        level: 'info',
        message: 'Deployment started',
      };

      const mockLog = { id: 'log-123', ...logData };

      Log.create = jest.fn().mockResolvedValue(mockLog);

      const emitSpy = jest.spyOn(logsService.logEmitter, 'emit');

      const result = await logsService.createLog(logData);

      expect(result).toEqual(mockLog);
      expect(Log.create).toHaveBeenCalledWith(logData);
      expect(emitSpy).toHaveBeenCalledWith('newLog', mockLog);
    });

    /**
     * Test: Should handle database errors when creating log
     * Scenario: Database insert fails
     * Expected: AppError is thrown
     */
    it('should throw AppError when creating log fails', async () => {
      Log.create = jest.fn().mockRejectedValue(new Error('Database error'));

      await expect(
        logsService.createLog({ message: 'Test log' })
      ).rejects.toThrow(AppError);
    });
  });
});
