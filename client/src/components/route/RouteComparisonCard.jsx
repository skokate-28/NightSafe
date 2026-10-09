import { Route, Clock, Shield } from 'lucide-react';
import { formatDistance, formatWalkTime } from '../../utils/formatDate';

export default function RouteComparisonCard({ safeRoute, fastRoute, clustersAvoided }) {
  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 p-3 bg-input rounded-lg border border-border">
        <Shield size={18} className="text-accent shrink-0" />
        <div className="flex-1">
          <p className="text-xs text-gray-400">Safe Route</p>
          <p className="text-sm font-medium">
            {formatDistance(safeRoute?.distance)} · {formatWalkTime(safeRoute?.distance)}
          </p>
        </div>
      </div>

      {fastRoute && (
        <div className="flex items-center gap-3 p-3 bg-input rounded-lg border border-border">
          <Route size={18} className="text-gray-400 shrink-0" />
          <div className="flex-1">
            <p className="text-xs text-gray-400">Fastest Route</p>
            <p className="text-sm font-medium">
              {formatDistance(fastRoute.distance)} · {formatWalkTime(fastRoute.distance)}
            </p>
          </div>
        </div>
      )}

      {clustersAvoided > 0 && (
        <div className="flex items-center gap-2 text-sm text-safe">
          <Clock size={14} />
          <span>{clustersAvoided} danger zone{clustersAvoided !== 1 ? 's' : ''} avoided</span>
        </div>
      )}
    </div>
  );
}
