const { Deployment, Project, Environment } = require('../models');
const { AppError } = require('../utils/errors');
const logger = require('../utils/logger');
const kubernetesClient = require('../utils/kubernetesClient');

class DeploymentService {
  async createDeployment(data, userId) {
    try {
      const deployment = await Deployment.create({
        ...data,
        deployedBy: userId,
        status: 'pending',
      });

      // Trigger deployment to Kubernetes
      await this.deployToKubernetes(deployment);

      return deployment;
    } catch (error) {
      logger.error('Error creating deployment:', error);
      throw new AppError('Failed to create deployment', 500);
    }
  }

  async getDeployments({ projectId, environment, status, page, limit, userId }) {
    try {
      const offset = (page - 1) * limit;
      const where = {};

      if (projectId) where.projectId = projectId;
      if (environment) where.environment = environment;
      if (status) where.status = status;

      const { rows, count } = await Deployment.findAndCountAll({
        where,
        limit,
        offset,
        include: [{ model: Project }],
        order: [['createdAt', 'DESC']],
      });

      return {
        deployments: rows,
        pagination: {
          total: count,
          page,
          limit,
          totalPages: Math.ceil(count / limit),
        },
      };
    } catch (error) {
      logger.error('Error fetching deployments:', error);
      throw new AppError('Failed to fetch deployments', 500);
    }
  }

  async getDeploymentById(deploymentId, userId) {
    try {
      const deployment = await Deployment.findByPk(deploymentId, {
        include: [{ model: Project }],
      });

      if (!deployment) {
        throw new AppError('Deployment not found', 404);
      }

      return deployment;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching deployment:', error);
      throw new AppError('Failed to fetch deployment', 500);
    }
  }

  async rollbackDeployment(deploymentId, userId) {
    try {
      const deployment = await this.getDeploymentById(deploymentId, userId);

      if (!deployment.previousVersion) {
        throw new AppError('No previous version available for rollback', 400);
      }

      const rollback = await Deployment.create({
        projectId: deployment.projectId,
        environment: deployment.environment,
        version: deployment.previousVersion,
        deployedBy: userId,
        status: 'pending',
        isRollback: true,
        rolledBackFrom: deploymentId,
      });

      await this.deployToKubernetes(rollback);

      return rollback;
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error rolling back deployment:', error);
      throw new AppError('Failed to rollback deployment', 500);
    }
  }

  async getDeploymentStatus(deploymentId, userId) {
    try {
      const deployment = await this.getDeploymentById(deploymentId, userId);
      const k8sStatus = await kubernetesClient.getDeploymentStatus(deployment.k8sDeploymentName);

      return {
        deployment,
        kubernetes: k8sStatus,
      };
    } catch (error) {
      if (error instanceof AppError) throw error;
      logger.error('Error fetching deployment status:', error);
      throw new AppError('Failed to fetch deployment status', 500);
    }
  }

  async getEnvironments(projectId, userId) {
    try {
      const environments = await Environment.findAll({
        where: { projectId },
        order: [['name', 'ASC']],
      });
      return environments;
    } catch (error) {
      logger.error('Error fetching environments:', error);
      throw new AppError('Failed to fetch environments', 500);
    }
  }

  async deployToKubernetes(deployment) {
    try {
      const result = await kubernetesClient.deploy({
        name: `${deployment.projectId}-${deployment.environment}`,
        namespace: deployment.environment,
        image: deployment.imageUrl,
        version: deployment.version,
        replicas: deployment.replicas || 1,
        envVars: deployment.environmentVariables,
      });

      await deployment.update({
        status: 'deploying',
        k8sDeploymentName: result.name,
      });
    } catch (error) {
      await deployment.update({ status: 'failed' });
      throw error;
    }
  }
}

module.exports = new DeploymentService();
