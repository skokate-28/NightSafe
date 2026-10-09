export function bboxGeohash(boundingBox) {
  const { north, south, east, west } = boundingBox;
  const lat = Math.floor(((north + south) / 2) * 100) / 100;
  const lng = Math.floor(((east + west) / 2) * 100) / 100;
  return `${lat.toFixed(2)}_${lng.toFixed(2)}`;
}
