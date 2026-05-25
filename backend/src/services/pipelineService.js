const { Pipeline, PipelineExecution, Project } = require('../models');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const ciRunnerClient = require('../utils/ciRunnerClient');

class PipelineService {
  async createPipeline(data, userId) {
    try {
      const pipeline = await Pipeline.create({
        ...data,
        createdBy: userId,
        status: 'active',
      });
      return pipeline;
    } catch (error) {
      logger.error('Error creating pipeline:', error);
      throw new AppError('Failed to create pipeline', 500);
    }
  }

  async getPipelines({ projectId, page, limit, userId }) {
    try {
      const offset = (page - 1) * limit;
      const where = {};

      if (projectId) {
        where.projectId = projectId;
      }

      const { rows, count } = await Pipeline.findAndCountAll({
        where,
        limit,
        offset,
        include: [{ model: Project }],
        order: [['createdAt', 'DESC']],
      });

      return {
        pipelines: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching pipelines:', error);
      throw new AppError('Failed to fetch pipelines', 500);
    }
  }

  async getPipelineById(pipelineId, userId) {
    try {
      const pipeline = await Pipeline.findByPk(pipelineId, {
        include: [{ model: Project }],
      });

      if (!pipeline) {
        throw new AppError('Pipeline not found', 404);
      }

      return pipeline;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching pipeline:', error);
      throw new AppError('Failed to fetch pipeline', 500);
    }
  }

  async updatePipeline(pipelineId, data, userId) {
    try {
      const pipeline = await this.getPipelineById(pipelineId, userId);
      await pipeline.update(data);
      return pipeline;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error updating pipeline:', error);
      throw new AppError('Failed to update pipeline', 500);
    }
  }

  async deletePipeline(pipelineId, userId) {
    try {
      const pipeline = await this.getPipelineById(pipelineId, userId);
      await pipeline.destroy();
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error deleting pipeline:', error);
      throw new AppError('Failed to delete pipeline', 500);
    }
  }

  async executePipeline(pipelineId, params, userId) {
    try {
      const pipeline = await this.getPipelineById(pipelineId, userId);

      const execution = await PipelineExecution.create({
        pipelineId,
        triggeredBy: userId,
        status: 'running',
        parameters: params,
      });

      // Trigger CI runner
      await ciRunnerClient.triggerPipeline({
        pipelineId,
        executionId: execution.id,
        config: pipeline.config,
        parameters: params,
      });

      return execution;
    } catch (error) {
      logger.error('Error executing pipeline:', error);
      throw new AppError('Failed to execute pipeline', 500);
    }
  }

  async getPipelineExecutions(pipelineId, { page, limit }, userId) {
    try {
      await this.getPipelineById(pipelineId, userId);
      const offset = (page - 1) * limit;

      const { rows, count } = await PipelineExecution.findAndCountAll({
        where: { pipelineId },
        limit,
        offset,
        order: [['createdAt', 'DESC']],
      });

      return {
        executions: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching pipeline executions:', error);
      throw new AppError('Failed to fetch pipeline executions', 500);
    }
  }
}

module.exports = new PipelineService();
