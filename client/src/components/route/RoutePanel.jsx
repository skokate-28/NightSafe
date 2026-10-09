import { useState } from 'react';
import { ChevronDown, ChevronUp, CheckCircle } from 'lucide-react';
import SafetyScoreBadge from './SafetyScoreBadge';
import RouteComparisonCard from './RouteComparisonCard';
import { formatDateTime } from '../../utils/formatDate';
import SkeletonLoader from '../ui/SkeletonLoader';

export default function RoutePanel({ safeRoute, fastRoute, safetyScore, clustersAvoided, savedAt, isComputing, originSnap }) {
  const [collapsed, setCollapsed] = useState(false);

  if (isComputing) {
    return (
      <div className="absolute top-20 left-4 w-72 bg-surface/95 backdrop-blur border border-border rounded-2xl p-4 shadow-2xl z-10">
        <SkeletonLoader className="h-24 w-24 rounded-full mx-auto mb-4" />
        <SkeletonLoader className="h-4 w-full mb-2" />
        <SkeletonLoader className="h-4 w-3/4" />
      </div>
    );
  }

  if (!safeRoute) return null;

  return (
    <div className="absolute top-20 left-4 w-72 bg-surface/95 backdrop-blur border border-border rounded-2xl shadow-2xl z-10 overflow-hidden">
      <div className="flex items-center justify-between p-4 border-b border-border">
        <h3 className="font-heading font-semibold text-sm">Route Result</h3>
        <button onClick={() => setCollapsed(!collapsed)} className="text-gray-400 hover:text-white">
          {collapsed ? <ChevronDown size={18} /> : <ChevronUp size={18} />}
        </button>
      </div>

      {!collapsed && (
        <div className="p-4 space-y-4">
          <div className="flex justify-center">
            <SafetyScoreBadge score={safetyScore} />
          </div>

          <RouteComparisonCard
            safeRoute={safeRoute}
            fastRoute={fastRoute}
            clustersAvoided={clustersAvoided}
          />

          {originSnap > 50 && (
            <p className="text-xs text-muted-foreground mt-1">
              ⚡ Route starts from nearest road ({Math.round(originSnap)}m from your pin)
            </p>
          )}

          {savedAt && (
            <div className="flex items-center gap-2 text-xs text-safe">
              <CheckCircle size={14} />
              <span>Route saved · {formatDateTime(savedAt)}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
