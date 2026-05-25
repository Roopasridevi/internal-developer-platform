const logsService = require('../services/logsService');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

class LogsController {
  async getLogs(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const {
        projectId,
        deploymentId,
        pipelineId,
        level,
        startTime,
        endTime,
        search,
        page = 1,
        limit = 100,
      } = req.query;

      const logs = await logsService.getLogs({
        projectId,
        deploymentId,
        pipelineId,
        level,
        startTime,
        endTime,
        search,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        userId: req.user.id,
      });
      
      res.status(200).json({
        success: true,
        data: logs,
      });
    } catch (error) {
      next(error);
    }
  }

  async streamLogs(req, res, next) {
    try {
      const { deploymentId, pipelineId } = req.query;
      
      res.setHeader('Content-Type', 'text/event-stream');
      res.setHeader('Cache-Control', 'no-cache');
      res.setHeader('Connection', 'keep-alive');

      const stream = await logsService.streamLogs({
        deploymentId,
        pipelineId,
        userId: req.user.id,
      });

      stream.on('data', (log) => {
        res.write(`data: ${JSON.stringify(log)}\n\n`);
      });

      stream.on('end', () => {
        res.end();
      });

      req.on('close', () => {
        stream.destroy();
      });
    } catch (error) {
      next(error);
    }
  }

  async getLogStats(req, res, next) {
    try {
      const { projectId, startTime, endTime } = req.query;
      const stats = await logsService.getLogStats({
        projectId,
        startTime,
        endTime,
        userId: req.user.id,
      });
      
      res.status(200).json({
        success: true,
        data: stats,
      });
    } catch (error) {
      next(error);
    }
  }

  async exportLogs(req, res, next) {
    try {
      const { projectId, deploymentId, startTime, endTime, format = 'json' } = req.query;
      const exportData = await logsService.exportLogs({
        projectId,
        deploymentId,
        startTime,
        endTime,
        format,
        userId: req.user.id,
      });

      const filename = `logs-${Date.now()}.${format}`;
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.setHeader('Content-Type', format === 'json' ? 'application/json' : 'text/plain');
      
      res.status(200).send(exportData);
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new LogsController();
