const { haversine } = require('../utils/haversine');

function computeEdgePenalty(midLat, midLng, clusters) {
  let edgePenalty = 0;

  for (const cluster of clusters) {
    const dist = haversine(midLat, midLng, cluster.centroid_lat, cluster.centroid_lng);

    if (dist < 75) {
      const proximityFactor = 1 / (1 + (dist / 25) ** 2);
      edgePenalty += cluster.gravity_score * proximityFactor;
    }
  }

  return edgePenalty;
}

function localDangerDensity(lat, lng, clusters, radiusM = 100) {
  if (!clusters || clusters.length === 0) return 0;
  let count = 0;
  for (const cluster of clusters) {
    const dist = haversine(lat, lng, cluster.centroid_lat, cluster.centroid_lng);
    if (dist < radiusM) count++;
  }
  return Math.min(1, count / Math.max(clusters.length, 1));
}

function dangerAwareHeuristic(nodeLat, nodeLng, targetLat, targetLng, clusters) {
  const dist = haversine(nodeLat, nodeLng, targetLat, targetLng);
  const density = localDangerDensity(nodeLat, nodeLng, clusters);
  return dist * (1 + 0.2 * density);
}

module.exports = { computeEdgePenalty, localDangerDensity, dangerAwareHeuristic };
