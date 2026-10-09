const { haversine } = require('../utils/haversine');

const SAFETY_WEIGHT = 3.5;
const INFLUENCE_RADIUS_METERS = 75;
const FALLOFF_CONSTANT = 25;

const applyPenalties = (subgraph, clusters, _currentHour) => {
  const clusterList = clusters || [];

  for (const [, node] of subgraph.entries()) {
    for (const neighbor of node.neighbors) {
      let edgePenalty = 0;

      for (const cluster of clusterList) {
        const clusterLat = cluster.centroid?.lat ?? cluster.centroid_lat;
        const clusterLng = cluster.centroid?.lng ?? cluster.centroid_lng;

        const distance = haversine(
          neighbor.midLat,
          neighbor.midLng,
          clusterLat,
          clusterLng
        );

        if (distance < INFLUENCE_RADIUS_METERS) {
          const proximityFactor = 1 / (1 + Math.pow(distance / FALLOFF_CONSTANT, 2));
          edgePenalty += cluster.gravity_score * proximityFactor;
        }
      }

      neighbor.edgePenalty = edgePenalty;
      neighbor.edgeCost = neighbor.distance + SAFETY_WEIGHT * edgePenalty;
    }
  }

  return subgraph;
};

module.exports = { applyPenalties };
