import { create } from 'zustand';

const useMapStore = create((set) => ({
  center: [72.8777, 19.0760],
  zoom: 13,
  boundingBox: null,
  reports: { type: 'FeatureCollection', features: [] },
  clusters: [],

  setCenter: (center) => set({ center }),
  setZoom: (zoom) => set({ zoom }),
  setBbox: (boundingBox) => set({ boundingBox }),
  setReports: (reports) => set({ reports }),
  setClusters: (clusters) => set({ clusters }),

  addReport: (report) =>
    set((state) => ({
      reports: {
        type: 'FeatureCollection',
        features: [
          {
            type: 'Feature',
            geometry: { type: 'Point', coordinates: [report.lng, report.lat] },
            properties: { ...report, weight: report.weight || 1 },
          },
          ...state.reports.features,
        ],
      },
    })),
}));

export default useMapStore;
