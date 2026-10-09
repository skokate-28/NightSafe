import { Plus } from 'lucide-react';
import ReportCard from './ReportCard';
import Button from '../ui/Button';
import SkeletonLoader from '../ui/SkeletonLoader';

export default function ReportFeed({ reports, mapCenter, loading, onReportClick, onNewReport }) {
  return (
    <div className="absolute top-20 right-4 w-80 bg-surface/95 backdrop-blur border border-border rounded-2xl shadow-2xl z-10 flex flex-col max-h-[calc(100vh-6rem)]">
      <div className="p-4 border-b border-border">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-heading font-semibold text-sm">Live Reports</h3>
          <span className="text-xs text-gray-500">{reports.length} nearby</span>
        </div>
        <Button variant="primary" size="sm" className="w-full" onClick={onNewReport}>
          <Plus size={16} />
          Report Here
        </Button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading ? (
          <SkeletonLoader className="h-16 w-full" count={5} />
        ) : reports.length === 0 ? (
          <p className="text-sm text-gray-500 text-center py-8">No reports in this area yet</p>
        ) : (
          reports.slice(0, 10).map((report) => (
            <ReportCard
              key={report.id}
              report={report}
              mapCenter={mapCenter}
              onClick={onReportClick}
            />
          ))
        )}
      </div>
    </div>
  );
}
