const pool = require('../config/db');
const redis = require('../config/redis');
const { success, error } = require('../utils/apiResponse');
const { getClusters } = require('../algorithm/clusterEngine');
const { buildOSMGraph, extractSubgraph, findNearestNode } = require('../algorithm/graphBuilder');
const { applyPenalties } = require('../algorithm/penaltyApplicator');
const { bidirectionalAStar, dijkstra } = require('../algorithm/safetyRouter');

const countClustersAvoided = (path, clusters, comparePath) => {
  const nearCluster = (pt, clustersList, threshold = 75) => {
    return clustersList.filter((c) => {
      const dist = require('../utils/haversine').haversine(
        pt[1], pt[0], c.centroid_lat, c.centroid_lng
      );
      return dist < threshold;
    }).length;
  };

  const safeNear = path.reduce((sum, pt) => sum + nearCluster(pt, clusters), 0);
  const fastNear = comparePath.reduce((sum, pt) => sum + nearCluster(pt, clusters), 0);
  return Math.max(0, fastNear - safeNear);
};

const computeRoute = async (req, res) => {
  try {
    const { originLat, originLng, destLat, destLng } = req.body;
    const currentHour = new Date().getHours();

    const origin = { lat: parseFloat(originLat), lng: parseFloat(originLng) };
    const destination = { lat: parseFloat(destLat), lng: parseFloat(destLng) };

    const clusters = await getClusters(currentHour);

    const fullGraph = await buildOSMGraph();

    const minLat = Math.min(origin.lat, destination.lat);
    const maxLat = Math.max(origin.lat, destination.lat);
    const minLng = Math.min(origin.lng, destination.lng);
    const maxLng = Math.max(origin.lng, destination.lng);
    const subgraph = extractSubgraph(fullGraph, minLat, maxLat, minLng, maxLng);

    if (subgraph.size === 0) {
      return error(res, 'No road network found in this area. Try a different route.', 400);
    }

    const { nodeId: originNodeId, snapDistanceMeters: originSnap } = findNearestNode(
      subgraph,
      origin.lat,
      origin.lng
    );
    const { nodeId: destNodeId, snapDistanceMeters: destSnap } = findNearestNode(
      subgraph,
      destination.lat,
      destination.lng
    );

    if (originSnap > 500 || destSnap > 500) {
      return error(
        res,
        'Origin or destination is too far from any walkable road. Please choose a point closer to a road.',
        400
      );
    }

    const penalizedGraph = applyPenalties(subgraph, clusters, currentHour);

    const safeResult = bidirectionalAStar(penalizedGraph, originNodeId, destNodeId, clusters);
    const fastResult = dijkstra(penalizedGraph, originNodeId, destNodeId, clusters, false);

    if (!safeResult) {
      return error(res, 'Could not compute route', 400);
    }

    const safeRouteGeoJSON = {
      type: 'LineString',
      coordinates: safeResult.path,
    };

    await pool.query(
      `INSERT INTO route_requests
        (user_id, origin, destination, route_geojson, safety_score, distance_meters)
       VALUES (
         $1,
         ST_SetSRID(ST_MakePoint($2, $3), 4326)::geography,
         ST_SetSRID(ST_MakePoint($4, $5), 4326)::geography,
         $6, $7, $8
       )`,
      [
        req.user.id,
        originLng, originLat,
        destLng, destLat,
        JSON.stringify(safeRouteGeoJSON),
        safeResult.safetyScore,
        safeResult.totalDistance,
      ]
    );

    try {
      await redis.setex(
        `route:${req.user.id}:latest`,
        3600,
        JSON.stringify({ safeResult, fastResult, clusters })
      );
    } catch {
      // non-critical cache
    }

    const clustersAvoided = fastResult
      ? countClustersAvoided(safeResult.path, clusters, fastResult.path)
      : 0;

    return success(res, {
      safeRoute: {
        path: safeRouteGeoJSON,
        safetyScore: safeResult.safetyScore,
        distance: safeResult.totalDistance,
        totalSafetyCost: safeResult.totalSafetyCost,
      },
      fastRoute: fastResult
        ? {
            path: { type: 'LineString', coordinates: fastResult.path },
            distance: fastResult.totalDistance,
          }
        : null,
      clusters,
      clustersAvoided,
      originSnap,
      destSnap,
      savedAt: new Date().toISOString(),
    }, 'Route computed');
  } catch (err) {
    console.error('Route compute error:', err);
    return error(res, 'Failed to compute route', 500);
  }
};

const getRouteHistory = async (req, res) => {
  try {
    const result = await pool.query(
      `SELECT id,
        ST_Y(origin::geometry) AS origin_lat,
        ST_X(origin::geometry) AS origin_lng,
        ST_Y(destination::geometry) AS dest_lat,
        ST_X(destination::geometry) AS dest_lng,
        route_geojson, safety_score, distance_meters, created_at
       FROM route_requests
       WHERE user_id = $1
       ORDER BY created_at DESC
       LIMIT 10`,
      [req.user.id]
    );

    const history = result.rows.map((r) => ({
      id: r.id,
      origin: { lat: parseFloat(r.origin_lat), lng: parseFloat(r.origin_lng) },
      destination: { lat: parseFloat(r.dest_lat), lng: parseFloat(r.dest_lng) },
      route: r.route_geojson,
      safetyScore: parseFloat(r.safety_score),
      distance: parseFloat(r.distance_meters),
      createdAt: r.created_at,
    }));

    return success(res, history, 'Route history retrieved');
  } catch (err) {
    return error(res, 'Failed to fetch route history', 500);
  }
};

module.exports = { computeRoute, getRouteHistory };
