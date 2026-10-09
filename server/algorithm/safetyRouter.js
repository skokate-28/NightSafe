const { circularHourDistance } = require('../utils/haversine');
const PriorityQueue = require('../utils/priorityQueue');
const { computeEdgePenalty, dangerAwareHeuristic } = require('./heuristics');

const LAMBDA = 0.008;

function computeReportWeight(report, currentHour) {
  const baseWeight = report.severity * (1 + (report.net_score || 0) * 0.1);

  const hoursElapsed = (Date.now() - new Date(report.created_at).getTime()) / (1000 * 60 * 60);
  const decayFactor = Math.exp(-LAMBDA * hoursElapsed);

  const hourDelta = circularHourDistance(currentHour, report.hour_of_day);
  const timeMultiplier = 1 + 1.5 * Math.exp(-(hourDelta ** 2) / 18);

  return baseWeight * decayFactor * timeMultiplier;
}

function bidirectionalAStar(graph, originNodeId, destNodeId, clusters) {
  const originKey = String(originNodeId);
  const destKey = String(destNodeId);

  const oNode = graph.get(originKey);
  const dNode = graph.get(destKey);

  if (!oNode || !dNode) {
    return null;
  }

  const forwardOpen = new PriorityQueue();
  const backwardOpen = new PriorityQueue();
  const forwardG = new Map();
  const backwardG = new Map();
  const forwardCame = new Map();
  const backwardCame = new Map();
  const forwardClosed = new Set();
  const backwardClosed = new Set();

  forwardG.set(originKey, 0);
  backwardG.set(destKey, 0);

  forwardOpen.insert(
    originKey,
    dangerAwareHeuristic(oNode.lat, oNode.lng, dNode.lat, dNode.lng, clusters)
  );
  backwardOpen.insert(
    destKey,
    dangerAwareHeuristic(dNode.lat, dNode.lng, oNode.lat, oNode.lng, clusters)
  );

  let meetingNode = null;
  let bestMeetingCost = Infinity;
  let expandForward = true;

  while (!forwardOpen.isEmpty() && !backwardOpen.isEmpty()) {
    if (expandForward) {
      const result = expandOne(
        forwardOpen,
        forwardG,
        forwardCame,
        forwardClosed,
        graph,
        dNode,
        clusters
      );
      if (result && backwardClosed.has(String(result.node))) {
        const total = forwardG.get(String(result.node)) + backwardG.get(String(result.node));
        if (total < bestMeetingCost) {
          bestMeetingCost = total;
          meetingNode = String(result.node);
        }
      }
    } else {
      const result = expandOne(
        backwardOpen,
        backwardG,
        backwardCame,
        backwardClosed,
        graph,
        oNode,
        clusters
      );
      if (result && forwardClosed.has(String(result.node))) {
        const total = forwardG.get(String(result.node)) + backwardG.get(String(result.node));
        if (total < bestMeetingCost) {
          bestMeetingCost = total;
          meetingNode = String(result.node);
        }
      }
    }

    expandForward = !expandForward;
  }

  if (!meetingNode) {
    return dijkstra(graph, originKey, destKey, clusters, true);
  }

  return reconstructPath(
    meetingNode,
    forwardCame,
    backwardCame,
    graph,
    clusters
  );
}

function expandOne(openSet, gScore, cameFrom, closedSet, graph, target, clusters) {
  const current = openSet.extractMin();
  if (!current) return null;

  const currentNode = String(current.node);
  if (closedSet.has(currentNode)) return null;
  closedSet.add(currentNode);

  const currentParsed = graph.get(currentNode);
  if (!currentParsed) return null;

  for (const neighbor of currentParsed.neighbors || []) {
    const toId = String(neighbor.nodeId);
    const tentativeG = gScore.get(currentNode) + neighbor.edgeCost;

    if (!gScore.has(toId) || tentativeG < gScore.get(toId)) {
      gScore.set(toId, tentativeG);
      cameFrom.set(toId, currentNode);

      const neighborNode = graph.get(toId);
      if (!neighborNode) continue;

      const h = dangerAwareHeuristic(
        neighborNode.lat,
        neighborNode.lng,
        target.lat,
        target.lng,
        clusters
      );
      openSet.insert(toId, tentativeG + h);
    }
  }

  return { node: currentNode, parsed: currentParsed };
}

function dijkstra(graph, originNodeId, destNodeId, clusters = [], withSafety = false) {
  const originKey = String(originNodeId);
  const destKey = String(destNodeId);

  const open = new PriorityQueue();
  const gScore = new Map();
  const cameFrom = new Map();
  const closed = new Set();

  gScore.set(originKey, 0);
  open.insert(originKey, 0);

  while (!open.isEmpty()) {
    const current = open.extractMin();
    if (!current) break;

    const currentNode = String(current.node);
    if (closed.has(currentNode)) continue;
    closed.add(currentNode);

    if (currentNode === destKey) {
      return reconstructSinglePath(currentNode, cameFrom, graph, clusters);
    }

    const currentParsed = graph.get(currentNode);
    if (!currentParsed) continue;

    for (const neighbor of currentParsed.neighbors || []) {
      const toId = String(neighbor.nodeId);
      const cost = withSafety ? neighbor.edgeCost : neighbor.distance;
      const tentativeG = gScore.get(currentNode) + cost;

      if (!gScore.has(toId) || tentativeG < gScore.get(toId)) {
        gScore.set(toId, tentativeG);
        cameFrom.set(toId, currentNode);
        open.insert(toId, tentativeG);
      }
    }
  }

  return null;
}

function reconstructPath(meetingNode, forwardCame, backwardCame, graph, clusters) {
  const forwardPath = [];
  let current = String(meetingNode);
  while (current) {
    const parsed = graph.get(String(current));
    if (!parsed) break;
    forwardPath.unshift([parsed.lng, parsed.lat]);
    const prev = forwardCame.get(String(current));
    current = prev ? String(prev) : null;
  }

  const backwardPath = [];
  current = String(meetingNode);
  while (current) {
    const next = backwardCame.get(String(current));
    if (!next) break;
    current = String(next);
    const parsed = graph.get(current);
    if (parsed) {
      backwardPath.push([parsed.lng, parsed.lat]);
    }
  }

  const fullPath = [...forwardPath, ...backwardPath];
  return computeRouteStats(fullPath, clusters);
}

function reconstructSinglePath(destNode, cameFrom, graph, clusters) {
  const path = [];
  let current = String(destNode);
  while (current) {
    const parsed = graph.get(String(current));
    if (!parsed) break;
    path.unshift([parsed.lng, parsed.lat]);
    const prev = cameFrom.get(String(current));
    current = prev ? String(prev) : null;
  }
  return computeRouteStats(path, clusters);
}

function computeRouteStats(path, clusters) {
  let totalDistance = 0;
  let totalSafetyCost = 0;

  for (let i = 0; i < path.length - 1; i++) {
    const [lng1, lat1] = path[i];
    const [lng2, lat2] = path[i + 1];
    const dist = require('../utils/haversine').haversine(lat1, lng1, lat2, lng2);
    totalDistance += dist;
    const midLat = (lat1 + lat2) / 2;
    const midLng = (lng1 + lng2) / 2;
    totalSafetyCost += computeEdgePenalty(midLat, midLng, clusters);
  }

  const maxClusterGravity = clusters.length
    ? Math.max(...clusters.map((c) => c.gravity_score))
    : 1;
  const normalizedMax = Math.max((totalDistance / 100) * maxClusterGravity, 1);
  const safetyScore = 100 - Math.min(100, (totalSafetyCost / normalizedMax) * 100);

  return {
    path,
    totalSafetyCost,
    totalDistance,
    safetyScore: Math.round(safetyScore * 10) / 10,
  };
}

module.exports = {
  computeReportWeight,
  computeEdgePenalty,
  bidirectionalAStar,
  dijkstra,
};
