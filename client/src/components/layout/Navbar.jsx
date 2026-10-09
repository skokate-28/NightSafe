import { Link } from 'react-router-dom';
import Button from '../ui/Button';

export default function Navbar({ showAuth = true }) {
  return (
    <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 bg-background/80 backdrop-blur border-b border-border">
      <Link to="/" className="flex items-center gap-2">
        <span className="font-heading text-xl font-bold">
          Night<span className="text-accent">Safe</span>
        </span>
        <span className="w-2 h-2 rounded-full bg-accent animate-pulse" />
      </Link>

      {showAuth && (
        <div className="flex items-center gap-3">
          <Link to="/login">
            <Button variant="ghost" size="sm">Login</Button>
          </Link>
          <Link to="/register">
            <Button variant="primary" size="sm">Get Started</Button>
          </Link>
        </div>
      )}
    </nav>
  );
}
