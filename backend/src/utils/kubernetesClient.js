const axios = require('axios');
const config = require('../config');
const logger = require('./logger');

class KubernetesClient {
  constructor() {
    this.client = axios.create({
      baseURL: config.externalServices.kubernetes.apiUrl,
      headers: {
        'Authorization': `Bearer ${config.externalServices.kubernetes.token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
    this.namespace = config.externalServices.kubernetes.namespace;
  }

  async deploy({ name, namespace, image, version, replicas, envVars }) {
    try {
      const deploymentManifest = {
        apiVersion: 'apps/v1',
        kind: 'Deployment',
        metadata: {
          name,
          namespace: namespace || this.namespace,
          labels: {
            app: name,
            version,
          },
        },
        spec: {
          replicas,
          selector: {
            matchLabels: {
              app: name,
            },
          },
          template: {
            metadata: {
              labels: {
                app: name,
                version,
              },
            },
            spec: {
              containers: [
                {
                  name,
                  image: `${image}:${version}`,
                  env: Object.entries(envVars || {}).map(([key, value]) => ({
                    name: key,
                    value: String(value),
                  })),
                },
              ],
            },
          },
        },
      };

      const response = await this.client.post(
        `/apis/apps/v1/namespaces/${namespace || this.namespace}/deployments`,
        deploymentManifest
      );

      logger.info(`Deployment created: ${name}`);
      return response.data;
    } catch (error) {
      logger.error('Error creating deployment:', error);
      throw new Error('Failed to create deployment');
    }
  }

  async getDeploymentStatus(deploymentName) {
    try {
      const response = await this.client.get(
        `/apis/apps/v1/namespaces/${this.namespace}/deployments/${deploymentName}`
      );
      return response.data.status;
    } catch (error) {
      logger.error('Error fetching deployment status:', error);
      throw new Error('Failed to fetch deployment status');
    }
  }

  async deleteDeployment(deploymentName) {
    try {
      await this.client.delete(
        `/apis/apps/v1/namespaces/${this.namespace}/deployments/${deploymentName}`
      );
      logger.info(`Deployment deleted: ${deploymentName}`);
    } catch (error) {
      logger.error('Error deleting deployment:', error);
      throw new Error('Failed to delete deployment');
    }
  }
}

module.exports = new KubernetesClient();
