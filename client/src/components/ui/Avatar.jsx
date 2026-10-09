import { generateAvatar } from '../../utils/generateAvatar';

export default function Avatar({ src, name, size = 'md', className = '' }) {
  const sizes = { sm: 'w-8 h-8 text-xs', md: 'w-10 h-10 text-sm', lg: 'w-16 h-16 text-xl' };
  const { initial, color } = generateAvatar(name);

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={`${sizes[size]} rounded-full object-cover border border-border ${className}`}
      />
    );
  }

  return (
    <div
      className={`${sizes[size]} rounded-full flex items-center justify-center font-semibold text-white border border-border ${className}`}
      style={{ backgroundColor: color }}
    >
      {initial}
    </div>
  );
}
