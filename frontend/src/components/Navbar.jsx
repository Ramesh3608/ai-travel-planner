import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header className="border-b border-ink-700 bg-ink-950/80 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link to="/dashboard" className="text-lg font-extrabold tracking-tight text-white">
          Voyager <span className="text-ember-500">AI</span>
        </Link>
        <div className="flex items-center gap-4">
          {user && <span className="hidden text-sm text-slate-400 sm:inline">Hi, {user.name}</span>}
          <Link
            to="/dashboard/new"
            className="rounded-full bg-ember-500 px-4 py-1.5 text-sm font-semibold text-ink-950 transition hover:bg-ember-400"
          >
            + New trip
          </Link>
          <button
            onClick={handleLogout}
            className="rounded-full border border-ink-700 px-4 py-1.5 text-sm font-medium text-slate-300 transition hover:border-red-500/50 hover:text-red-400"
          >
            Sign out
          </button>
        </div>
      </div>
    </header>
  );
}
