const { success, error } = require('../utils/apiResponse');
const { getClusters, computeClusters } = require('../algorithm/clusterEngine');

const getAllClusters = async (req, res) => {
  try {
    const clusters = await getClusters();
    return success(res, clusters, 'Clusters retrieved');
  } catch (err) {
    console.error('Get clusters error:', err);
    return error(res, 'Failed to fetch clusters', 500);
  }
};

const recomputeClusters = async (req, res) => {
  try {
    const clusters = await computeClusters();
    const io = req.app.get('io');
    if (io) {
      io.emit('cluster:updated', clusters);
      io.emit('heatmap:refresh');
    }
    return success(res, clusters, 'Clusters recomputed');
  } catch (err) {
    return error(res, 'Failed to recompute clusters', 500);
  }
};

module.exports = { getAllClusters, recomputeClusters };
