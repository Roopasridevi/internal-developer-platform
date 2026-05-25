import api from './api';

export const deploymentService = {
  async getDeployments(params) {
    const response = await api.get('/deployments', { params });
    return response.data;
  },

  async getDeploymentById(id) {
    const response = await api.get(`/deployments/${id}`);
    return response.data;
  },

  async createDeployment(data) {
    const response = await api.post('/deployments', data);
    return response.data;
  },

  async rollbackDeployment(id) {
    const response = await api.post(`/deployments/${id}/rollback`);
    return response.data;
  },

  async getDeploymentStatus(id) {
    const response = await api.get(`/deployments/${id}/status`);
    return response.data;
  },

  async getEnvironments(projectId) {
    const response = await api.get(`/deployments/projects/${projectId}/environments`);
    return response.data;
  },
};
