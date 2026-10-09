const pool = require('../config/db');
const runClusterRefresh = require('./clusterRefresh.job');

async function runExpireReports(io) {
  try {
    console.log('[CRON] Running report expiration...');
    const result = await pool.query('DELETE FROM reports WHERE expires_at < NOW()');
    console.log(`[CRON] Expired ${result.rowCount} reports`);

    await runClusterRefresh(io);

    if (io) {
      io.emit('heatmap:refresh');
    }

    return result.rowCount;
  } catch (err) {
    console.error('[CRON] Report expiration failed:', err);
    throw err;
  }
}

module.exports = runExpireReports;
