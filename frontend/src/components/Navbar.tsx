import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import { Icon } from './Icon';
import './Navbar.css';
import { useAuth } from '../context/AuthContext';

interface NavbarProps {
  onLogout: () => void;
  onSidebarToggle: () => void;
  pendingAdminCount?: number;
  onAdminBellClick?: () => void;
  adminBellActive?: boolean;
}

export function Navbar({ onLogout, onSidebarToggle, pendingAdminCount = 0, onAdminBellClick, adminBellActive }: NavbarProps) {
  const { user, isReadOnlyUser } = useAuth();
  const displayName = user?.name || user?.email || 'User';
  const isAdmin = user?.role === 'admin';
  const roleLabel = user?.role === 'admin' ? 'Admin' : 'User (read-only)';

  const [detailsOpen, setDetailsOpen] = useState(false);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!detailsOpen) return;
    const handleClickAway = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setDetailsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickAway);
    return () => document.removeEventListener('mousedown', handleClickAway);
  }, [detailsOpen]);

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
        {isAdmin && (
          <button
            type="button"
            className={`notif-bell ${adminBellActive ? 'active' : ''}`}
            title={pendingAdminCount > 0 ? `${pendingAdminCount} admin approval${pendingAdminCount > 1 ? 's' : ''}` : 'Admin approvals'}
            aria-label="Admin approvals"
            aria-pressed={adminBellActive}
            onClick={onAdminBellClick}
          >
            <Icon name="bell" alt="Pending admin approvals" size="sm" />
            {pendingAdminCount > 0 && <span className="notif-badge">{pendingAdminCount}</span>}
          </button>
        )}
        <div className="user-wrapper" ref={userMenuRef}>
          <button
            type="button"
            className={`user-info ${detailsOpen ? 'open' : ''}`}
            onClick={() => setDetailsOpen((open) => !open)}
            onKeyDown={(e) => {
              if (e.key === 'Escape') setDetailsOpen(false);
            }}
            aria-expanded={detailsOpen}
            aria-haspopup="dialog"
            title="View profile details"
          >
            <Icon name="user" alt="User" />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.1 }}>
              <span className="user-name">{displayName}</span>
              <span className="user-role" style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                {roleLabel}
                {isReadOnlyUser ? ' • Limited' : ''}
              </span>
            </div>
          </button>

          {detailsOpen && (
            <div className="user-card" role="dialog" aria-label="User details">
              <div className="user-card-row">
                <span className="user-card-label">Name</span>
                <span className="user-card-value">{user?.name || '—'}</span>
              </div>
              <div className="user-card-row">
                <span className="user-card-label">Email</span>
                <span className="user-card-value">{user?.email || '—'}</span>
              </div>
              <div className="user-card-row">
                <span className="user-card-label">Role</span>
                <span className="user-card-value">{roleLabel}</span>
              </div>
              <div className="user-card-row">
                <span className="user-card-label">Status</span>
                <span className={`user-card-pill ${user?.status === 'approved' ? 'pill-ok' : 'pill-warn'}`}>
                  {user?.status === 'approved' ? 'Approved' : 'Pending approval'}
                </span>
              </div>
            </div>
          )}
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
