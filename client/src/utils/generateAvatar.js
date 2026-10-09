export function generateAvatar(name) {
  const colors = ['#F59E0B', '#10B981', '#3B82F6', '#8B5CF6', '#EF4444'];
  const initial = (name || '?')[0].toUpperCase();
  const color = colors[(name || '').charCodeAt(0) % colors.length];
  return { initial, color };
}
