const axios = require('axios');
const config = require('../config');
const logger = require('./logger');

class CIRunnerClient {
  constructor() {
    this.client = axios.create({
      baseURL: config.externalServices.ciRunner.url,
      headers: {
        'Authorization': `Bearer ${config.externalServices.ciRunner.token}`,
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    });
  }

  async triggerPipeline({ pipelineId, executionId, config, parameters }) {
    try {
      const response = await this.client.post('/pipelines/trigger', {
        pipelineId,
        executionId,
        config,
        parameters,
      });

      logger.info(`Pipeline triggered: ${pipelineId}`);
      return response.data;
    } catch (error) {
      logger.error('Error triggering pipeline:', error);
      throw new Error('Failed to trigger pipeline');
    }
  }

  async getPipelineStatus(executionId) {
    try {
      const response = await this.client.get(`/pipelines/executions/${executionId}`);
      return response.data;
    } catch (error) {
      logger.error('Error fetching pipeline status:', error);
      throw new Error('Failed to fetch pipeline status');
    }
  }

  async cancelPipeline(executionId) {
    try {
      const response = await this.client.post(`/pipelines/executions/${executionId}/cancel`);
      logger.info(`Pipeline cancelled: ${executionId}`);
      return response.data;
    } catch (error) {
      logger.error('Error cancelling pipeline:', error);
      throw new Error('Failed to cancel pipeline');
    }
  }
}

module.exports = new CIRunnerClient();
