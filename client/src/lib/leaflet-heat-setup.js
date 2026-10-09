import L from 'leaflet';

if (typeof window !== 'undefined') {
  window.L = L;
}

import 'leaflet.heat';

export default L;
