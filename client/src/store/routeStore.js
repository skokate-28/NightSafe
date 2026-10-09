import { create } from 'zustand';
import { routeService } from '../services/route.service';
import toast from 'react-hot-toast';

const useRouteStore = create((set) => ({
  safeRoute: null,
  fastRoute: null,
  safetyScore: null,
  clustersAvoided: 0,
  clusters: [],
  originSnap: 0,
  savedAt: null,
  isComputing: false,

  computeRoute: async (originLat, originLng, destLat, destLng) => {
    set({ isComputing: true, safeRoute: null, fastRoute: null });
    try {
      const { data: res } = await routeService.compute(
        originLat, originLng, destLat, destLng
      );
      const { safeRoute, fastRoute, clusters, clustersAvoided, savedAt, originSnap } = res.data;
      set({
        safeRoute,
        fastRoute,
        safetyScore: safeRoute.safetyScore,
        clusters,
        clustersAvoided,
        originSnap: originSnap || 0,
        savedAt,
        isComputing: false,
      });
      return res.data;
    } catch (err) {
      set({ isComputing: false });
      toast.error(err.response?.data?.message || 'Failed to compute route');
      throw err;
    }
  },

  clearRoute: () =>
    set({
      safeRoute: null,
      fastRoute: null,
      safetyScore: null,
      clustersAvoided: 0,
      originSnap: 0,
      savedAt: null,
    }),
}));

export default useRouteStore;
