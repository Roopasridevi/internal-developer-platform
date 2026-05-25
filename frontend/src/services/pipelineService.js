import api from './api';

export const pipelineService = {
  async getPipelines(params) {
    const response = await api.get('/pipelines', { params });
    return response.data;
  },

  async getPipelineById(id) {
    const response = await api.get(`/pipelines/${id}`);
    return response.data;
  },

  async createPipeline(data) {
    const response = await api.post('/pipelines', data);
    return response.data;
  },

  async updatePipeline(id, data) {
    const response = await api.put(`/pipelines/${id}`, data);
    return response.data;
  },

  async deletePipeline(id) {
    await api.delete(`/pipelines/${id}`);
  },

  async executePipeline(id, params) {
    const response = await api.post(`/pipelines/${id}/execute`, params);
    return response.data;
  },

  async getPipelineExecutions(id, params) {
    const response = await api.get(`/pipelines/${id}/executions`, { params });
    return response.data;
  },
};
