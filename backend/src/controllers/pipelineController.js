const pipelineService = require('../services/pipelineService');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

class PipelineController {
  async createPipeline(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const pipeline = await pipelineService.createPipeline(req.body, req.user.id);
      logger.info(`Pipeline created: ${pipeline.id}`);
      
      res.status(201).json({
        success: true,
        data: pipeline,
        message: 'Pipeline created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getPipelines(req, res, next) {
    try {
      const { projectId, page = 1, limit = 10 } = req.query;
      const pipelines = await pipelineService.getPipelines({
        projectId,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        userId: req.user.id,
      });
      
      res.status(200).json({
        success: true,
        data: pipelines,
      });
    } catch (error) {
      next(error);
    }
  }

  async getPipelineById(req, res, next) {
    try {
      const { id } = req.params;
      const pipeline = await pipelineService.getPipelineById(id, req.user.id);
      
      res.status(200).json({
        success: true,
        data: pipeline,
      });
    } catch (error) {
      next(error);
    }
  }

  async updatePipeline(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const { id } = req.params;
      const pipeline = await pipelineService.updatePipeline(id, req.body, req.user.id);
      logger.info(`Pipeline updated: ${id}`);
      
      res.status(200).json({
        success: true,
        data: pipeline,
        message: 'Pipeline updated successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async deletePipeline(req, res, next) {
    try {
      const { id } = req.params;
      await pipelineService.deletePipeline(id, req.user.id);
      logger.info(`Pipeline deleted: ${id}`);
      
      res.status(200).json({
        success: true,
        message: 'Pipeline deleted successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async executePipeline(req, res, next) {
    try {
      const { id } = req.params;
      const execution = await pipelineService.executePipeline(id, req.body, req.user.id);
      logger.info(`Pipeline executed: ${id}`);
      
      res.status(200).json({
        success: true,
        data: execution,
        message: 'Pipeline execution started',
      });
    } catch (error) {
      next(error);
    }
  }

  async getPipelineExecutions(req, res, next) {
    try {
      const { id } = req.params;
      const { page = 1, limit = 10 } = req.query;
      const executions = await pipelineService.getPipelineExecutions(id, {
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
      }, req.user.id);
      
      res.status(200).json({
        success: true,
        data: executions,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new PipelineController();
