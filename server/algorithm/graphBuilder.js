const { loadOSMData } = require('./osmLoader');
const { haversine } = require('../utils/haversine');

let cachedGraph = null;
let graphBuildTime = null;
const GRAPH_MAX_AGE_HOURS = 168;

const buildOSMGraph = async () => {
  if (cachedGraph && graphBuildTime) {
    const ageHours = (Date.now() - graphBuildTime) / (1000 * 60 * 60);
    if (ageHours < GRAPH_MAX_AGE_HOURS) return cachedGraph;
  }

  const osmData = await loadOSMData();

  const nodeMap = new Map();

  for (const element of osmData.elements) {
    if (element.type === 'node') {
      const id = String(element.id);
      nodeMap.set(id, {
        id,
        lat: element.lat,
        lng: element.lon,
        neighbors: [],
      });
    }
  }

  for (const element of osmData.elements) {
    if (element.type !== 'way') continue;
    if (!element.nodes || element.nodes.length < 2) continue;

    const isOneWay = element.tags?.oneway === 'yes';

    for (let i = 0; i < element.nodes.length - 1; i++) {
      const fromId = String(element.nodes[i]);
      const toId = String(element.nodes[i + 1]);

      const fromNode = nodeMap.get(fromId);
      const toNode = nodeMap.get(toId);

      if (!fromNode || !toNode) continue;

      const distance = haversine(fromNode.lat, fromNode.lng, toNode.lat, toNode.lng);
      const midLat = (fromNode.lat + toNode.lat) / 2;
      const midLng = (fromNode.lng + toNode.lng) / 2;

      fromNode.neighbors.push({
        nodeId: toId,
        distance,
        edgeCost: distance,
        edgePenalty: 0,
        midLat,
        midLng,
      });

      if (!isOneWay) {
        toNode.neighbors.push({
          nodeId: fromId,
          distance,
          edgeCost: distance,
          edgePenalty: 0,
          midLat,
          midLng,
        });
      }
    }
  }

  for (const [id, node] of nodeMap.entries()) {
    if (node.neighbors.length === 0) {
      nodeMap.delete(id);
    }
  }

  const edgeCount = Array.from(nodeMap.values()).reduce(
    (sum, n) => sum + n.neighbors.length,
    0
  );
  console.log(`OSM graph built: ${nodeMap.size} nodes, ${edgeCount} directed edges`);

  cachedGraph = nodeMap;
  graphBuildTime = Date.now();
  return nodeMap;
};

const extractSubgraph = (fullGraph, minLat, maxLat, minLng, maxLng) => {
  const BUFFER = 0.003;
  const subgraph = new Map();

  for (const [id, node] of fullGraph.entries()) {
    if (
      node.lat >= minLat - BUFFER &&
      node.lat <= maxLat + BUFFER &&
      node.lng >= minLng - BUFFER &&
      node.lng <= maxLng + BUFFER
    ) {
      subgraph.set(String(id), {
        ...node,
        id: String(node.id),
        neighbors: node.neighbors.filter((n) => {
          const neighbor = fullGraph.get(String(n.nodeId));
          if (!neighbor) return false;
          return (
            neighbor.lat >= minLat - BUFFER &&
            neighbor.lat <= maxLat + BUFFER &&
            neighbor.lng >= minLng - BUFFER &&
            neighbor.lng <= maxLng + BUFFER
          );
        }),
      });
    }
  }

  return subgraph;
};

const findNearestNode = (graph, lat, lng) => {
  let nearestId = null;
  let nearestDist = Infinity;

  for (const [id, node] of graph.entries()) {
    const dist = haversine(lat, lng, node.lat, node.lng);
    if (dist < nearestDist) {
      nearestDist = dist;
      nearestId = String(id);
    }
  }

  return { nodeId: nearestId, snapDistanceMeters: nearestDist };
};

module.exports = { buildOSMGraph, extractSubgraph, findNearestNode };
