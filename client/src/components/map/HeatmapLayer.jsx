import { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from '../../lib/leaflet-heat-setup';

function getReportCoords(report) {
  if (report.location?.coordinates) {
    return [report.location.coordinates[1], report.location.coordinates[0]];
  }
  if (report.lat != null && report.lng != null) {
    return [report.lat, report.lng];
  }
  return null;
}

export default function HeatmapLayer({ reports }) {
  const map = useMap();

  useEffect(() => {
    if (!reports || reports.length === 0) return;

    const points = reports
      .map((r) => {
        const coords = getReportCoords(r);
        if (!coords) return null;
        return [coords[0], coords[1], r.weight || 0.5];
      })
      .filter(Boolean);

    if (points.length === 0) return;

    const heatLayer = L.heatLayer(points, {
      radius: 35,
      blur: 25,
      maxZoom: 17,
      gradient: { 0.2: '#10B981', 0.5: '#F59E0B', 0.8: '#EF4444' },
    }).addTo(map);

    return () => map.removeLayer(heatLayer);
  }, [reports, map]);

  return null;
}
