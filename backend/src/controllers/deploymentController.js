const deploymentService = require('../services/deploymentService');
const logger = require('../utils/logger');
const { validationResult } = require('express-validator');

class DeploymentController {
  async createDeployment(req, res, next) {
    try {
      const errors = validationResult(req);
      if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
      }

      const deployment = await deploymentService.createDeployment(req.body, req.user.id);
      logger.info(`Deployment created: ${deployment.id}`);
      
      res.status(201).json({
        success: true,
        data: deployment,
        message: 'Deployment created successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getDeployments(req, res, next) {
    try {
      const { projectId, environment, status, page = 1, limit = 10 } = req.query;
      const deployments = await deploymentService.getDeployments({
        projectId,
        environment,
        status,
        page: parseInt(page, 10),
        limit: parseInt(limit, 10),
        userId: req.user.id,
      });
      
      res.status(200).json({
        success: true,
        data: deployments,
      });
    } catch (error) {
      next(error);
    }
  }

  async getDeploymentById(req, res, next) {
    try {
      const { id } = req.params;
      const deployment = await deploymentService.getDeploymentById(id, req.user.id);
      
      res.status(200).json({
        success: true,
        data: deployment,
      });
    } catch (error) {
      next(error);
    }
  }

  async rollbackDeployment(req, res, next) {
    try {
      const { id } = req.params;
      const rollback = await deploymentService.rollbackDeployment(id, req.user.id);
      logger.info(`Deployment rolled back: ${id}`);
      
      res.status(200).json({
        success: true,
        data: rollback,
        message: 'Deployment rolled back successfully',
      });
    } catch (error) {
      next(error);
    }
  }

  async getDeploymentStatus(req, res, next) {
    try {
      const { id } = req.params;
      const status = await deploymentService.getDeploymentStatus(id, req.user.id);
      
      res.status(200).json({
        success: true,
        data: status,
      });
    } catch (error) {
      next(error);
    }
  }

  async getEnvironments(req, res, next) {
    try {
      const { projectId } = req.params;
      const environments = await deploymentService.getEnvironments(projectId, req.user.id);
      
      res.status(200).json({
        success: true,
        data: environments,
      });
    } catch (error) {
      next(error);
    }
  }
}

module.exports = new DeploymentController();
