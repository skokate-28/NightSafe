const { computeClusters } = require('../algorithm/clusterEngine');

async function runClusterRefresh(io) {
  try {
    console.log('[CRON] Running cluster refresh...');
    const clusters = await computeClusters();

    if (io) {
      io.emit('cluster:updated', clusters);
      io.emit('heatmap:refresh');
    }

    console.log(`[CRON] Cluster refresh complete: ${clusters.length} clusters`);
    return clusters;
  } catch (err) {
    console.error('[CRON] Cluster refresh failed:', err);
    throw err;
  }
}

module.exports = runClusterRefresh;
