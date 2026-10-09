function bboxGeohash(boundingBox) {
  const { north, south, east, west } = boundingBox;
  const lat = Math.floor(((north + south) / 2) * 100) / 100;
  const lng = Math.floor(((east + west) / 2) * 100) / 100;
  return `${lat.toFixed(2)}_${lng.toFixed(2)}`;
}

function pointGeohashes(lat, lng) {
  const hashes = new Set();
  const baseLat = Math.floor(lat * 100) / 100;
  const baseLng = Math.floor(lng * 100) / 100;

  for (let dLat = -0.01; dLat <= 0.01; dLat += 0.01) {
    for (let dLng = -0.01; dLng <= 0.01; dLng += 0.01) {
      hashes.add(`${(baseLat + dLat).toFixed(2)}_${(baseLng + dLng).toFixed(2)}`);
    }
  }
  return Array.from(hashes);
}

function bboxContainsPoint(bbox, lat, lng) {
  return lat <= bbox.north && lat >= bbox.south && lng <= bbox.east && lng >= bbox.west;
}

module.exports = { bboxGeohash, pointGeohashes, bboxContainsPoint };
