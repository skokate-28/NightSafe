export default function SafetyScoreBadge({ score, size = 'md' }) {
  const color =
    score > 70 ? 'text-safe border-safe/40 bg-safe/10' :
    score > 40 ? 'text-accent border-accent/40 bg-accent/10' :
    'text-danger border-danger/40 bg-danger/10';

  const sizes = {
    sm: 'text-2xl w-16 h-16',
    md: 'text-4xl w-24 h-24',
    lg: 'text-5xl w-32 h-32',
  };

  return (
    <div className={`flex flex-col items-center justify-center rounded-full border-2 font-heading font-bold ${color} ${sizes[size]}`}>
      <span>{Math.round(score)}</span>
      <span className="text-xs font-normal opacity-70">/ 100</span>
    </div>
  );
}
