import { Polyline } from 'react-leaflet';

function toLatLngPositions(path) {
  const coords = path?.coordinates || path;
  if (!coords?.length) return [];
  return coords.map(([lng, lat]) => [lat, lng]);
}

export default function SafeRouteLayer({ safeRoute, fastRoute }) {
  const safePositions = toLatLngPositions(safeRoute?.path);
  const fastPositions = toLatLngPositions(fastRoute?.path);

  return (
    <>
      {safePositions.length > 0 && (
        <Polyline
          positions={safePositions}
          pathOptions={{ color: '#F59E0B', weight: 5, opacity: 0.9 }}
        />
      )}
      {fastPositions.length > 0 && (
        <Polyline
          positions={fastPositions}
          pathOptions={{ color: '#6B7280', weight: 2, opacity: 0.6, dashArray: '8 8' }}
        />
      )}
    </>
  );
}
