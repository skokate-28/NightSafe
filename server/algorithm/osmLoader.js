const axios = require('axios');
const fs = require('fs');
const path = require('path');

const CACHE_PATH = path.join(__dirname, 'mumbai_roads.json');
const CACHE_MAX_AGE_HOURS = 168; // re-fetch once per week

const OVERPASS_ENDPOINTS = [
  'https://overpass-api.de/api/interpreter',
  'https://overpass.kumi.systems/api/interpreter',
];

const OVERPASS_HEADERS = {
  'Content-Type': 'application/x-www-form-urlencoded',
  Accept: 'application/json',
  'User-Agent': 'NightSafe/1.0 (mumbai walkable-road routing; local research)',
};

// Overpass query — fetches all walkable roads in Mumbai bounding box
// Mumbai bounding box: south=18.89, west=72.77, north=19.27, east=72.99
const OVERPASS_QUERY = `
[out:json][timeout:60];
(
  way["highway"~"^(footway|pedestrian|residential|living_street|path|steps|track|service|unclassified|tertiary|secondary|primary)$"]
  (18.89,72.77,19.27,72.99);
);
out body;
>;
out skel qt;
`;

const fetchFromOverpass = async () => {
  let lastError = null;

  for (const endpoint of OVERPASS_ENDPOINTS) {
    try {
      const response = await axios.post(
        endpoint,
        new URLSearchParams({ data: OVERPASS_QUERY }).toString(),
        {
          headers: OVERPASS_HEADERS,
          timeout: 90000,
        }
      );
      return response.data;
    } catch (err) {
      lastError = err;
      console.warn(`Overpass endpoint failed (${endpoint}): ${err.message}`);
    }
  }

  throw lastError || new Error('All Overpass endpoints failed');
};

const loadOSMData = async () => {
  if (fs.existsSync(CACHE_PATH)) {
    const stats = fs.statSync(CACHE_PATH);
    const ageHours = (Date.now() - stats.mtimeMs) / (1000 * 60 * 60);
    if (ageHours < CACHE_MAX_AGE_HOURS) {
      console.log('OSM road data loaded from local cache');
      return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
    }
  }

  console.log('Fetching Mumbai road network from Overpass API...');
  try {
    const data = await fetchFromOverpass();
    fs.writeFileSync(CACHE_PATH, JSON.stringify(data));
    console.log(`OSM data fetched and cached: ${data.elements.length} elements`);
    return data;
  } catch (err) {
    if (fs.existsSync(CACHE_PATH)) {
      console.warn('Overpass fetch failed, using stale cache');
      return JSON.parse(fs.readFileSync(CACHE_PATH, 'utf8'));
    }
    throw new Error('Cannot load OSM data: ' + err.message);
  }
};

module.exports = { loadOSMData };
