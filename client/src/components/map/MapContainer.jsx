import { useEffect, useMemo, useRef, useState } from 'react';
import { MapContainer as LeafletMap, TileLayer, CircleMarker, useMap, useMapEvents, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import HeatmapLayer from './HeatmapLayer';
import SafeRouteLayer from './SafeRouteLayer';
import ReportMarkers from './ReportMarker';
import ClusterMarkers from './ClusterMarker';
import { getSocket } from '../../socket/socket';

const DEFAULT_CENTER = [19.0760, 72.8777];
const DEFAULT_ZOOM = 13;

function MapClickHandler({ onMapClick, isReportMode }) {
  useMapEvents({
    click: (e) => {
      if (isReportMode && onMapClick) {
        onMapClick({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    },
  });
  return null;
}

function MapBoundsHandler({ onBoundsChange }) {
  const map = useMap();
  const currentBbox = useRef(null);

  useEffect(() => {
    const emitBbox = () => {
      const bounds = map.getBounds();
      const boundingBox = {
        north: bounds.getNorth(),
        south: bounds.getSouth(),
        east: bounds.getEast(),
        west: bounds.getWest(),
      };

      const socket = getSocket();
      if (socket) {
        if (currentBbox.current) {
          socket.emit('map:unsubscribe', { boundingBox: currentBbox.current });
        }
        socket.emit('map:subscribe', { boundingBox });
        currentBbox.current = boundingBox;
      }

      const center = map.getCenter();
      onBoundsChange?.(boundingBox, [center.lng, center.lat]);
    };

    map.on('moveend', emitBbox);
    emitBbox();

    return () => map.off('moveend', emitBbox);
  }, [map, onBoundsChange]);

  return null;
}

function FitBoundsOnRoute({ safeRoute }) {
  const map = useMap();

  useEffect(() => {
    const coords = safeRoute?.path?.coordinates;
    if (!coords?.length) return;

    const bounds = L.latLngBounds(coords.map(([lng, lat]) => [lat, lng]));
    map.fitBounds(bounds, { padding: [80, 80] });
  }, [map, safeRoute]);

  return null;
}

function geojsonToReportList(reports) {
  if (!reports?.features) return [];
  return reports.features.map((f) => ({
    ...f.properties,
    location: { coordinates: f.geometry.coordinates },
    lat: f.geometry.coordinates[1],
    lng: f.geometry.coordinates[0],
  }));
}

export default function MapContainer({
  reports,
  clusters,
  safeRoute,
  fastRoute,
  onMapClick,
  pickLocation = false,
  pickMarker,
  onBoundsChange,
  userLocation,
}) {
  const [newReportIds, setNewReportIds] = useState([]);
  const reportList = useMemo(() => geojsonToReportList(reports), [reports]);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const handleNewReport = (report) => {
      setNewReportIds((prev) => [...prev, report.id]);
      setTimeout(() => {
        setNewReportIds((prev) => prev.filter((id) => id !== report.id));
      }, 3000);
    };

    socket.on('report:new', handleNewReport);
    return () => socket.off('report:new', handleNewReport);
  }, []);

  return (
    <div className="absolute inset-0 z-0">
      <LeafletMap
        center={DEFAULT_CENTER}
        zoom={DEFAULT_ZOOM}
        style={{ width: '100%', height: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/">CARTO</a>'
          subdomains="abcd"
          maxZoom={19}
        />
        <ZoomControl position="bottomright" />
        <MapBoundsHandler onBoundsChange={onBoundsChange} />
        <MapClickHandler onMapClick={onMapClick} isReportMode={pickLocation} />
        <HeatmapLayer reports={reportList} />
        <ClusterMarkers clusters={clusters} />
        <ReportMarkers reports={reportList} newReportIds={newReportIds} />
        <SafeRouteLayer safeRoute={safeRoute} fastRoute={fastRoute} />
        <FitBoundsOnRoute safeRoute={safeRoute} />

        {pickMarker && (
          <CircleMarker
            center={[pickMarker.lat, pickMarker.lng]}
            radius={10}
            pathOptions={{
              color: '#F59E0B',
              fillColor: '#F59E0B',
              fillOpacity: 1,
              weight: 3,
            }}
          />
        )}

        {userLocation && (
          <CircleMarker
            center={[userLocation.lat, userLocation.lng]}
            radius={10}
            pathOptions={{
              color: '#10B981',
              fillColor: '#10B981',
              fillOpacity: 1,
              weight: 3,
            }}
          />
        )}
      </LeafletMap>
    </div>
  );
}
