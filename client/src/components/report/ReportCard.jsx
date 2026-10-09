import { getCategory, SEVERITY_LABELS } from '../../utils/categories';
import { timeAgo } from '../../utils/formatDate';
import { haversine } from '../../utils/haversine';

export default function ReportCard({ report, mapCenter, onClick }) {
  const category = getCategory(report.category);
  const Icon = category.icon;
  const distance = mapCenter
    ? haversine(mapCenter[1], mapCenter[0], report.lat, report.lng)
    : null;

  return (
    <button
      onClick={() => onClick?.(report)}
      className="w-full text-left p-3 bg-input rounded-lg border border-border hover:border-accent/30 transition-colors animate-slide-in"
    >
      <div className="flex items-start gap-3">
        <div
          className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0"
          style={{ backgroundColor: `${category.color}20` }}
        >
          <Icon size={16} style={{ color: category.color }} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between gap-2">
            <p className="text-sm font-medium truncate">{category.label}</p>
            <span className="text-xs text-gray-500 shrink-0">{timeAgo(report.created_at)}</span>
          </div>
          <div className="flex items-center gap-1 mt-1">
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                className={`w-1.5 h-1.5 rounded-full ${i < report.severity ? 'bg-accent' : 'bg-border'}`}
              />
            ))}
            <span className="text-xs text-gray-500 ml-1">{SEVERITY_LABELS[report.severity]}</span>
          </div>
          {distance !== null && (
            <p className="text-xs text-gray-500 mt-1">
              {distance < 1000 ? `${Math.round(distance)}m away` : `${(distance / 1000).toFixed(1)}km away`}
            </p>
          )}
        </div>
      </div>
    </button>
  );
}
