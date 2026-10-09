import api from './api';

export const reportService = {
  getNearby: (lat, lng, radius = 2000, filters = {}) =>
    api.get('/reports', { params: { lat, lng, radius, ...filters } }),

  getById: (id) => api.get(`/reports/${id}`),

  create: (data) => {
    const formData = new FormData();
    Object.entries(data).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    return api.post('/reports', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  vote: (id, vote_type) => api.post(`/reports/${id}/vote`, { vote_type }),

  delete: (id) => api.delete(`/reports/${id}`),
};
