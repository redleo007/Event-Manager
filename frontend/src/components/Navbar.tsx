import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import './Navbar.css';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onLogout: () => void;
  onSidebarToggle: () => void;
  pendingAdminCount?: number;
}

export function Navbar({ onLogout, onSidebarToggle, pendingAdminCount = 0 }: NavbarProps) {
  const { user, isReadOnlyUser } = useAuth();
  const displayName = user?.name || user?.email || 'User';

  return (
    <nav className="navbar">
      {/* Left: Hamburger + Brand */}
      <div className="navbar-left">
        <button 
          className="hamburger-btn"
          onClick={onSidebarToggle}
          title="Toggle Sidebar"
          aria-label="Toggle navigation sidebar"
        >
          <Icon name="menu" alt="Menu" />
        </button>
        
        <Link to="/" className="brand-link">
          <img src="/logo.svg" alt="Eventz" className="brand-icon" />
          <span className="brand-text">Eventz</span>
        </Link>
      </div>

      {/* Right: User Info & Logout */}
      <div className="navbar-right">
        {pendingAdminCount > 0 && (
          <div className="notif-bell" title={`${pendingAdminCount} admin approval${pendingAdminCount > 1 ? 's' : ''}`}>
            <Icon name="bell" alt="Pending admin approvals" size="sm" />
            <span className="notif-badge">{pendingAdminCount}</span>
          </div>
        )}
        <div className="user-info">
          <Icon name="user" alt="User" />
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
            <span className="user-name">{displayName}</span>
            <span className="user-role" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
              {user?.role === 'admin' ? 'Admin' : 'User (read-only)'}
              {isReadOnlyUser ? ' • Limited' : ''}
            </span>
          </div>
        </div>
        <button 
          className="logout-btn"
          onClick={onLogout}
          title="Logout"
        >
          <Icon name="logout" alt="Logout" />
          Logout
        </button>
      </div>
    </nav>
  );
}
