export default function Badge({ children, variant = 'default', className = '' }) {
  const variants = {
    default: 'bg-surface border border-border text-gray-300',
    accent: 'bg-accent/20 text-accent border border-accent/30',
    safe: 'bg-safe/20 text-safe border border-safe/30',
    danger: 'bg-danger/20 text-danger border border-danger/30',
  };

  return (
    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}
