import api from './api';

export const routeService = {
  compute: (originLat, originLng, destLat, destLng) =>
    api.post('/route/compute', { originLat, originLng, destLat, destLng }),

  getHistory: () => api.get('/route/history'),

  getClusters: () => api.get('/clusters'),
};
