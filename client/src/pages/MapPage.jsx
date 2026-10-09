import { useState, useEffect, useCallback } from 'react';
import { ArrowLeftRight, Navigation } from 'lucide-react';
import AppShell, { MapTopBar } from '../components/layout/AppShell';
import MapContainer from '../components/map/MapContainer';
import RoutePanel from '../components/route/RoutePanel';
import ReportFeed from '../components/report/ReportFeed';
import ReportForm from '../components/report/ReportForm';
import Button from '../components/ui/Button';
import useAuthStore from '../store/authStore';
import useMapStore from '../store/mapStore';
import useRouteStore from '../store/routeStore';
import useReportStore from '../store/reportStore';
import { reportService } from '../services/report.service';
import { routeService } from '../services/route.service';
import { getSocket } from '../socket/socket';
import { useGeolocation } from '../hooks/useGeolocation';

export default function MapPage() {
  const user = useAuthStore((s) => s.user);
  const { reports, clusters, setReports, setClusters, addReport } = useMapStore();
  const { safeRoute, fastRoute, safetyScore, clustersAvoided, savedAt, isComputing, computeRoute, originSnap } = useRouteStore();
  const setReportList = useReportStore((s) => s.setReports);

  const { location } = useGeolocation();
  const [from, setFrom] = useState({ lat: '', lng: '', label: '' });
  const [to, setTo] = useState({ lat: '', lng: '', label: '' });
  const [feedReports, setFeedReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [mapCenter, setMapCenter] = useState([72.8777, 19.0760]);
  const [showReportForm, setShowReportForm] = useState(false);
  const [pickLocation, setPickLocation] = useState(null);

  useEffect(() => {
    if (location) {
      setFrom({ lat: location.lat, lng: location.lng, label: 'Current location' });
    }
  }, [location]);

  const fetchMapData = useCallback(async (lat, lng) => {
    setLoading(true);
    try {
      const [reportsRes, clustersRes] = await Promise.all([
        reportService.getNearby(lat, lng, 3000),
        routeService.getClusters(),
      ]);

      const reportList = reportsRes.data.data;
      setFeedReports(reportList);
      setReportList(reportList);
      setClusters(clustersRes.data.data);

      const geojson = {
        type: 'FeatureCollection',
        features: reportList.map((r) => ({
          type: 'Feature',
          geometry: { type: 'Point', coordinates: [r.lng, r.lat] },
          properties: { ...r, weight: r.weight || 1 },
        })),
      };
      setReports(geojson);
    } catch {
      // errors handled by interceptor
    } finally {
      setLoading(false);
    }
  }, [setReports, setClusters, setReportList]);

  useEffect(() => {
    fetchMapData(mapCenter[1], mapCenter[0]);
  }, []);

  useEffect(() => {
    const socket = getSocket();
    if (!socket) return;

    const onNewReport = (report) => {
      addReport(report);
      setFeedReports((prev) => [report, ...prev].slice(0, 10));
    };

    const onClusterUpdate = async () => {
      const { data } = await routeService.getClusters();
      setClusters(data.data);
    };

    const onHeatmapRefresh = () => {
      fetchMapData(mapCenter[1], mapCenter[0]);
    };

    socket.on('report:new', onNewReport);
    socket.on('cluster:updated', onClusterUpdate);
    socket.on('heatmap:refresh', onHeatmapRefresh);

    return () => {
      socket.off('report:new', onNewReport);
      socket.off('cluster:updated', onClusterUpdate);
      socket.off('heatmap:refresh', onHeatmapRefresh);
    };
  }, [mapCenter, addReport, setClusters, fetchMapData]);

  const handleBoundsChange = useCallback((bbox, center) => {
    setMapCenter(center);
    fetchMapData(center[1], center[0]);
  }, [fetchMapData]);

  const handleSwap = () => {
    setFrom(to);
    setTo(from);
  };

  const handleComputeRoute = async () => {
    if (!from.lat || !to.lat) return;
    await computeRoute(from.lat, from.lng, to.lat, to.lng);
  };

  const handleReportSubmit = (report) => {
    addReport(report);
    setFeedReports((prev) => [report, ...prev].slice(0, 10));
    setPickLocation(null);
    setShowReportForm(false);
  };

  return (
    <AppShell>
      <MapContainer
        reports={reports}
        clusters={clusters}
        safeRoute={safeRoute}
        fastRoute={fastRoute}
        onBoundsChange={handleBoundsChange}
        pickLocation={showReportForm}
        pickMarker={pickLocation}
        onMapClick={(loc) => setPickLocation(loc)}
        userLocation={location}
      />

      <MapTopBar user={user}>
        <div className="flex items-center gap-2 w-full max-w-xl">
          <div className="flex-1">
            <input
              value={from.label || (from.lat ? `${Number(from.lat).toFixed(4)}, ${Number(from.lng).toFixed(4)}` : '')}
              onChange={(e) => setFrom({ ...from, label: e.target.value })}
              placeholder="From"
              className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent"
            />
          </div>
          <button onClick={handleSwap} className="text-gray-400 hover:text-accent shrink-0">
            <ArrowLeftRight size={16} />
          </button>
          <div className="flex-1">
            <input
              value={to.label || (to.lat ? `${Number(to.lat).toFixed(4)}, ${Number(to.lng).toFixed(4)}` : '')}
              onChange={(e) => {
                const val = e.target.value;
                const parts = val.split(',').map((s) => parseFloat(s.trim()));
                if (parts.length === 2 && !isNaN(parts[0]) && !isNaN(parts[1])) {
                  setTo({ lat: parts[0], lng: parts[1], label: val });
                } else {
                  setTo({ ...to, label: val });
                }
              }}
              placeholder="To (lat, lng)"
              className="w-full bg-input border border-border rounded-lg px-3 py-1.5 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-accent"
            />
          </div>
          <Button
            variant="primary"
            size="sm"
            onClick={handleComputeRoute}
            loading={isComputing}
            disabled={!from.lat || !to.lat}
          >
            <Navigation size={14} />
            Route
          </Button>
        </div>
      </MapTopBar>

      <RoutePanel
        safeRoute={safeRoute}
        fastRoute={fastRoute}
        safetyScore={safetyScore}
        clustersAvoided={clustersAvoided}
        savedAt={savedAt}
        isComputing={isComputing}
        originSnap={originSnap}
      />

      <ReportFeed
        reports={feedReports}
        mapCenter={mapCenter}
        loading={loading}
        onNewReport={() => setShowReportForm(true)}
      />

      <ReportForm
        isOpen={showReportForm}
        onClose={() => { setShowReportForm(false); setPickLocation(null); }}
        location={pickLocation}
        onSubmit={handleReportSubmit}
      />
    </AppShell>
  );
}
