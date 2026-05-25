import api from './api';

export const logsService = {
  async getLogs(params) {
    const response = await api.get('/logs', { params });
    return response.data;
  },

  async getLogStats(params) {
    const response = await api.get('/logs/stats', { params });
    return response.data;
  },

  async exportLogs(params) {
    const response = await api.get('/logs/export', {
      params,
      responseType: 'blob',
    });
    return response;
  },

  streamLogs(params) {
    const url = new URL(`${import.meta.env.VITE_API_URL}/logs/stream`);
    Object.keys(params).forEach((key) => url.searchParams.append(key, params[key]));
    return new EventSource(url.toString());
  },
};
