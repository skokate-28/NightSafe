const pool = require('../config/db');
const redis = require('../config/redis');
const { computeReportWeight } = require('./safetyRouter');

const CLUSTER_CACHE_KEY = 'clusters:all';
const CLUSTER_CACHE_TTL = 1800;

async function fetchActiveReports() {
  const result = await pool.query(`
    SELECT
      ST_ClusterDBSCAN(location::geometry, eps := 0.001, minpoints := 2)
        OVER () AS cluster_id,
      id,
      ST_Y(location::geometry) AS lat,
      ST_X(location::geometry) AS lng,
      category, severity, upvotes, downvotes, net_score,
      created_at, hour_of_day
    FROM reports
    WHERE expires_at > NOW()
      AND net_score >= -2
  `);
  return result.rows;
}

async function computeClusters(currentHour = new Date().getHours()) {
  const rows = await fetchActiveReports();
  const clusterMap = new Map();

  for (const row of rows) {
    if (row.cluster_id === null) continue;

    if (!clusterMap.has(row.cluster_id)) {
      clusterMap.set(row.cluster_id, []);
    }
    clusterMap.get(row.cluster_id).push(row);
  }

  const clusters = [];

  for (const [, reports] of clusterMap) {
    let totalWeight = 0;
    const categoryCount = {};

    for (const report of reports) {
      totalWeight += computeReportWeight(report, currentHour);
      categoryCount[report.category] = (categoryCount[report.category] || 0) + 1;
    }

    const reportCount = reports.length;
    const gravityScore = totalWeight * Math.log(1 + reportCount);

    const dominantCategory = Object.entries(categoryCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'other';

    const coords = reports.map((r) => ({
      lng: parseFloat(r.lng),
      lat: parseFloat(r.lat),
    }));

    if (coords.length === 0) continue;

    const centroidLng = coords.reduce((s, c) => s + c.lng, 0) / coords.length;
    const centroidLat = coords.reduce((s, c) => s + c.lat, 0) / coords.length;

    let maxDist = 0;
    for (const c of coords) {
      const dist = require('../utils/haversine').haversine(centroidLat, centroidLng, c.lat, c.lng);
      if (dist > maxDist) maxDist = dist;
    }

    const radiusMeters = maxDist + 30;

    clusters.push({
      centroid_lat: centroidLat,
      centroid_lng: centroidLng,
      radius_meters: radiusMeters,
      report_count: reportCount,
      gravity_score: gravityScore,
      dominant_category: dominantCategory,
    });
  }

  await upsertClusters(clusters);
  await cacheClusters(clusters);

  return clusters;
}

async function upsertClusters(clusters) {
  await pool.query('DELETE FROM danger_clusters');

  for (const cluster of clusters) {
    await pool.query(
      `INSERT INTO danger_clusters
        (centroid, radius_meters, report_count, gravity_score, dominant_category, last_computed)
       VALUES (
         ST_SetSRID(ST_MakePoint($1, $2), 4326)::geography,
         $3, $4, $5, $6, NOW()
       )`,
      [
        cluster.centroid_lng,
        cluster.centroid_lat,
        cluster.radius_meters,
        cluster.report_count,
        cluster.gravity_score,
        cluster.dominant_category,
      ]
    );
  }
}

async function cacheClusters(clusters) {
  try {
    await redis.setex(CLUSTER_CACHE_KEY, CLUSTER_CACHE_TTL, JSON.stringify(clusters));
  } catch (err) {
    console.error('Redis cache error:', err.message);
  }
}

async function getClusters(currentHour = new Date().getHours()) {
  try {
    const cached = await redis.get(CLUSTER_CACHE_KEY);
    if (cached) {
      return JSON.parse(cached);
    }
  } catch (err) {
    console.error('Redis get error:', err.message);
  }

  const dbResult = await pool.query(`
    SELECT
      id,
      ST_Y(centroid::geometry) AS centroid_lat,
      ST_X(centroid::geometry) AS centroid_lng,
      radius_meters,
      report_count,
      gravity_score,
      dominant_category,
      last_computed
    FROM danger_clusters
    ORDER BY gravity_score DESC
  `);

  if (dbResult.rows.length > 0) {
    const clusters = dbResult.rows.map((r) => ({
      id: r.id,
      centroid_lat: parseFloat(r.centroid_lat),
      centroid_lng: parseFloat(r.centroid_lng),
      radius_meters: parseFloat(r.radius_meters),
      report_count: r.report_count,
      gravity_score: parseFloat(r.gravity_score),
      dominant_category: r.dominant_category,
    }));
    await cacheClusters(clusters);
    return clusters;
  }

  return computeClusters(currentHour);
}

module.exports = {
  computeClusters,
  getClusters,
  CLUSTER_CACHE_KEY,
};
