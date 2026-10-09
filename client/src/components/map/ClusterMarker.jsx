import { CircleMarker } from 'react-leaflet';

function getClusterCenter(cluster) {
  if (cluster.centroid?.coordinates) {
    return [cluster.centroid.coordinates[1], cluster.centroid.coordinates[0]];
  }
  if (cluster.centroid_lat != null && cluster.centroid_lng != null) {
    return [cluster.centroid_lat, cluster.centroid_lng];
  }
  return null;
}

export default function ClusterMarkers({ clusters }) {
  if (!clusters?.length) return null;

  return (
    <>
      {clusters.map((cluster) => {
        const center = getClusterCenter(cluster);
        if (!center) return null;

        return (
          <CircleMarker
            key={cluster.id || `${center[0]}-${center[1]}`}
            center={center}
            radius={Math.min(40, Math.max(15, cluster.radius_meters / 10))}
            pathOptions={{
              color: '#EF4444',
              fillColor: '#EF4444',
              fillOpacity: 0.25,
              weight: 2,
              dashArray: '4 4',
            }}
          />
        );
      })}
    </>
  );
}
