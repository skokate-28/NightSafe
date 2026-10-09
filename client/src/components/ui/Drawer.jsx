import { X } from 'lucide-react';

export default function Drawer({ isOpen, onClose, title, children, side = 'right' }) {
  if (!isOpen) return null;

  const sideClass = side === 'right' ? 'right-0' : 'left-0';

  return (
    <div className="fixed inset-0 z-50">
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />
      <div className={`absolute top-0 ${sideClass} h-full w-80 bg-surface border-l border-border shadow-2xl flex flex-col`}>
        <div className="flex items-center justify-between p-4 border-b border-border">
          <h3 className="font-heading font-semibold">{title}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            <X size={20} />
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}
