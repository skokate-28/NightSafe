import { formatDistanceToNow, format } from 'date-fns';

export function timeAgo(date) {
  return formatDistanceToNow(new Date(date), { addSuffix: true });
}

export function formatDateTime(date) {
  return format(new Date(date), 'MMM d, yyyy h:mm a');
}

export function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

export function formatWalkTime(meters) {
  const minutes = Math.round(meters / 80);
  if (minutes < 60) return `${minutes} min`;
  return `${Math.floor(minutes / 60)}h ${minutes % 60}m`;
}
