import { Link, useNavigate } from 'react-router-dom';
import { Map, History, User, LogOut } from 'lucide-react';
import Avatar from '../ui/Avatar';
import useAuthStore from '../../store/authStore';
import { useState } from 'react';

export default function AppShell({ children }) {
  const { user, logout } = useAuthStore();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="relative w-full h-screen overflow-hidden bg-background">
      {children}

      <nav className="fixed bottom-0 left-0 right-0 z-40 flex items-center justify-center gap-1 p-3 bg-surface/90 backdrop-blur border-t border-border md:hidden">
        <Link to="/app/map" className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400 hover:text-accent">
          <Map size={20} />
          <span className="text-xs">Map</span>
        </Link>
        <Link to="/app/history" className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400 hover:text-accent">
          <History size={20} />
          <span className="text-xs">History</span>
        </Link>
        <Link to="/app/profile" className="flex flex-col items-center gap-1 px-4 py-2 text-gray-400 hover:text-accent">
          <User size={20} />
          <span className="text-xs">Profile</span>
        </Link>
      </nav>
    </div>
  );
}

export function MapTopBar({ children, user }) {
  const navigate = useNavigate();
  const { logout } = useAuthStore();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="absolute top-0 left-0 right-0 z-20 flex items-center gap-4 px-4 py-3 bg-surface/90 backdrop-blur border-b border-border">
      <Link to="/app/map" className="flex items-center gap-2 shrink-0">
        <span className="font-heading text-lg font-bold">
          Night<span className="text-accent">Safe</span>
        </span>
      </Link>

      <div className="flex-1 flex justify-center">{children}</div>

      <div className="relative shrink-0">
        <button onClick={() => setMenuOpen(!menuOpen)}>
          <Avatar src={user?.avatar} name={user?.name} size="sm" />
        </button>
        {menuOpen && (
          <div className="absolute right-0 top-10 w-48 bg-surface border border-border rounded-xl shadow-2xl py-2 z-50">
            <Link to="/app/profile" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-input" onClick={() => setMenuOpen(false)}>
              <User size={16} /> Profile
            </Link>
            <Link to="/app/history" className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-input" onClick={() => setMenuOpen(false)}>
              <History size={16} /> History
            </Link>
            <button
              className="flex items-center gap-2 px-4 py-2 text-sm hover:bg-input w-full text-left text-danger"
              onClick={async () => { await logout(); navigate('/login'); }}
            >
              <LogOut size={16} /> Logout
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
