import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft, MapPin, Route } from 'lucide-react';
import AppShell from '../components/layout/AppShell';
import SafetyScoreBadge from '../components/route/SafetyScoreBadge';
import SkeletonLoader from '../components/ui/SkeletonLoader';
import { routeService } from '../services/route.service';
import { formatDistance, formatDateTime } from '../utils/formatDate';

function RouteThumbnail({ route }) {
  if (!route?.coordinates?.length) {
    return (
      <div className="w-full h-32 bg-input rounded-lg flex items-center justify-center">
        <MapPin size={24} className="text-gray-600" />
      </div>
    );
  }

  return (
    <div className="w-full h-32 bg-input rounded-lg flex items-center justify-center relative overflow-hidden">
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: 'linear-gradient(#22222E 1px, transparent 1px), linear-gradient(90deg, #22222E 1px, transparent 1px)',
          backgroundSize: '20px 20px',
        }}
      />
      <div className="relative flex items-center gap-2 text-accent">
        <Route size={20} />
        <span className="text-sm font-medium">{route.coordinates.length} waypoints</span>
      </div>
    </div>
  );
}

export default function HistoryPage() {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    routeService.getHistory()
      .then(({ data }) => setHistory(data.data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  return (
    <AppShell>
      <div className="min-h-screen bg-background pt-8 pb-24 px-4">
        <div className="max-w-2xl mx-auto">
          <div className="flex items-center gap-4 mb-8">
            <Link to="/app/map" className="text-gray-400 hover:text-white">
              <ArrowLeft size={20} />
            </Link>
            <h1 className="font-heading text-2xl font-bold">Route History</h1>
          </div>

          {loading ? (
            <div className="space-y-4">
              <SkeletonLoader className="h-48 w-full" count={3} />
            </div>
          ) : history.length === 0 ? (
            <div className="text-center py-16">
              <MapPin size={48} className="text-gray-600 mx-auto mb-4" />
              <p className="text-gray-400">No routes computed yet</p>
              <Link to="/app/map" className="text-accent text-sm hover:underline mt-2 inline-block">
                Compute your first route
              </Link>
            </div>
          ) : (
            <div className="space-y-4">
              {history.map((item) => (
                <div key={item.id} className="bg-surface border border-border rounded-2xl overflow-hidden">
                  <RouteThumbnail route={item.route} />
                  <div className="p-4 flex items-center gap-4">
                    <SafetyScoreBadge score={item.safetyScore} size="sm" />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {item.origin.lat.toFixed(4)}, {item.origin.lng.toFixed(4)}
                        {' → '}
                        {item.destination.lat.toFixed(4)}, {item.destination.lng.toFixed(4)}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatDistance(item.distance)} · {formatDateTime(item.createdAt)}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  );
}
