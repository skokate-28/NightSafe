import { CircleMarker, Popup } from 'react-leaflet';
import VoteButtons from '../report/VoteButtons';
import { timeAgo } from '../../utils/formatDate';

const categoryColors = {
  poorly_lit: '#F59E0B',
  harassment: '#EF4444',
  theft: '#F97316',
  assault: '#DC2626',
  suspicious_activity: '#8B5CF6',
  unsafe_infrastructure: '#6B7280',
  other: '#3B82F6',
};

function getReportCenter(report) {
  if (report.location?.coordinates) {
    return [report.location.coordinates[1], report.location.coordinates[0]];
  }
  if (report.lat != null && report.lng != null) {
    return [report.lat, report.lng];
  }
  return null;
}

export default function ReportMarkers({ reports, newReportIds = [] }) {
  return (
    <>
      {reports.map((report) => {
        const center = getReportCenter(report);
        if (!center) return null;

        const color = categoryColors[report.category] || '#F59E0B';
        const isNew = newReportIds.includes(report.id);

        return (
          <CircleMarker
            key={report.id}
            center={center}
            radius={isNew ? 12 : 8}
            pathOptions={{
              color,
              fillColor: color,
              fillOpacity: isNew ? 1 : 0.8,
              weight: 2,
              className: isNew ? 'ripple-ping' : '',
            }}
          >
            <Popup>
              <div style={{ background: '#13131A', color: '#fff', padding: '8px', borderRadius: '8px', minWidth: '180px' }}>
                <strong>{report.category.replace(/_/g, ' ').toUpperCase()}</strong>
                <p>Severity: {'⭐'.repeat(report.severity)}</p>
                <p style={{ fontSize: '12px', color: '#9CA3AF' }}>{timeAgo(report.created_at)}</p>
                {report.description && <p style={{ fontSize: '13px', marginTop: '4px' }}>{report.description}</p>}
                {report.photo_url && (
                  <img src={report.photo_url} alt="" style={{ width: '100%', borderRadius: '4px', marginTop: '8px' }} />
                )}
                <div style={{ marginTop: '8px' }}>
                  <VoteButtons
                    reportId={report.id}
                    upvotes={report.upvotes}
                    downvotes={report.downvotes}
                  />
                </div>
              </div>
            </Popup>
          </CircleMarker>
        );
      })}
    </>
  );
}
