const { Log, Deployment, Pipeline } = require('../models');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const { EventEmitter } = require('events');

class LogsService {
  constructor() {
    this.logEmitter = new EventEmitter();
  }

  async getLogs({ projectId, deploymentId, pipelineId, level, startTime, endTime, search, page, limit, userId }) {
    try {
      const offset = (page - 1) * limit;
      const where = {};

      if (projectId) where.projectId = projectId;
      if (deploymentId) where.deploymentId = deploymentId;
      if (pipelineId) where.pipelineId = pipelineId;
      if (level) where.level = level;
      if (search) where.message = { [Op.iLike]: `%${search}%` };
      if (startTime || endTime) {
        where.timestamp = {};
        if (startTime) where.timestamp[Op.gte] = new Date(startTime);
        if (endTime) where.timestamp[Op.lte] = new Date(endTime);
      }

      const { rows, count } = await Log.findAndCountAll({
        where,
        limit,
        offset,
        order: [['timestamp', 'DESC']],
      });

      return {
        logs: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching logs:', error);
      throw new AppError('Failed to fetch logs', 500);
    }
  }

  async streamLogs({ deploymentId, pipelineId, userId }) {
    try {
      const stream = new EventEmitter();

      // Subscribe to log events
      const logHandler = (log) => {
        if (
          (deploymentId && log.deploymentId === deploymentId) ||
          (pipelineId && log.pipelineId === pipelineId)
        ) {
          stream.emit('data', log);
        }
      };

      this.logEmitter.on('newLog', logHandler);

      // Cleanup on stream close
      stream.on('close', () => {
        this.logEmitter.off('newLog', logHandler);
      });

      return stream;
    } catch (error) {
      logger.error('Error streaming logs:', error);
      throw new AppError('Failed to stream logs', 500);
    }
  }

  async getLogStats({ projectId, startTime, endTime, userId }) {
    try {
      const where = { projectId };

      if (startTime || endTime) {
        where.timestamp = {};
        if (startTime) where.timestamp[Op.gte] = new Date(startTime);
        if (endTime) where.timestamp[Op.lte] = new Date(endTime);
      }

      const stats = await Log.findAll({
        where,
        attributes: [
          'level',
          [sequelize.fn('COUNT', sequelize.col('id')), 'count'],
        ],
        group: ['level'],
      });

      return stats;
    } catch (error) {
      logger.error('Error fetching log stats:', error);
      throw new AppError('Failed to fetch log stats', 500);
    }
  }

  async exportLogs({ projectId, deploymentId, startTime, endTime, format, userId }) {
    try {
      const where = {};
      if (projectId) where.projectId = projectId;
      if (deploymentId) where.deploymentId = deploymentId;
      if (startTime || endTime) {
        where.timestamp = {};
        if (startTime) where.timestamp[Op.gte] = new Date(startTime);
        if (endTime) where.timestamp[Op.lte] = new Date(endTime);
      }

      const logs = await Log.findAll({
        where,
        order: [['timestamp', 'ASC']],
      });

      if (format === 'json') {
        return JSON.stringify(logs, null, 2);
      }

      // Text format
      return logs.map(log => `[${log.timestamp}] [${log.level}] ${log.message}`).join('\n');
    } catch (error) {
      logger.error('Error exporting logs:', error);
      throw new AppError('Failed to export logs', 500);
    }
  }

  async createLog(logData) {
    try {
      const log = await Log.create(logData);
      this.logEmitter.emit('newLog', log);
      return log;
    } catch (error) {
      logger.error('Error creating log:', error);
      throw new AppError('Failed to create log', 500);
    }
  }
}

module.exports = new LogsService();
