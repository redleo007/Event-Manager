import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Icon } from './Icon';
import { useAuth } from '../context/AuthContext';
import { authAPI } from '../api/client';
import './Layout.css';

interface NavLink {
  path: string;
  label: string;
  icon: React.ReactNode;
}

const mainNavLinks: NavLink[] = [
  { path: '/', label: 'Dashboard', icon: <Icon name="dashboard" alt="Dashboard" /> },
  { path: '/events', label: 'Events', icon: <Icon name="events" alt="Events" /> },
  { path: '/import-attendance', label: 'Import & Attendance', icon: <Icon name="upload" alt="Import" /> },
  { path: '/events-history', label: 'Events History', icon: <Icon name="history" alt="History" /> },
  { path: '/no-shows', label: 'No Shows', icon: <Icon name="noShows" alt="No Shows" /> },
  { path: '/blocklist', label: 'Blocklist', icon: <Icon name="blocklist" alt="Blocklist" /> },
  { path: '/settings', label: 'Settings', icon: <Icon name="settings" alt="Settings" /> },
];

interface SidebarProps {
  isOpen: boolean;
  isCollapsed: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, isCollapsed, onClose }: SidebarProps) {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

  return (
    <>
      {/* Mobile Overlay */}
      {isOpen && <div className="sidebar-overlay" onClick={onClose}></div>}
      
      <div className={`sidebar ${isCollapsed ? 'collapsed' : ''} ${isOpen ? 'open' : ''}`}>
        {/* Navigation Only */}
        <nav className="sidebar-nav">
          {mainNavLinks.map((link) => (
            <Link
              key={link.path}
              to={link.path}
              className={`sidebar-link ${isActive(link.path) ? 'active' : ''}`}
              title={isCollapsed ? link.label : ''}
              onClick={onClose}
            >
              <span className="sidebar-icon">{link.icon}</span>
              {!isCollapsed && <span className="sidebar-label">{link.label}</span>}
            </Link>
          ))}
        </nav>
      </div>
    </>
  );
}

interface LayoutProps {
  children: React.ReactNode;
  onLogout: () => void;
}

export function Layout({ children, onLogout }: LayoutProps) {
  const { user } = useAuth();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [pendingAdmins, setPendingAdmins] = useState<{ id: string; name: string; email: string; created_at?: string }[]>([]);
  const [pendingLoading, setPendingLoading] = useState(false);
  const [pendingError, setPendingError] = useState<string | null>(null);

  const handleSidebarToggle = () => {
    // On desktop: toggle collapse/expand
    // On mobile: toggle open/close
    const isMobile = window.innerWidth < 1024;
    if (isMobile) {
      setSidebarOpen(!sidebarOpen);
    } else {
      setSidebarCollapsed(!sidebarCollapsed);
    }
  };

  const handleSidebarClose = () => {
    setSidebarOpen(false);
  };

  useEffect(() => {
    const loadPending = async () => {
      if (!user || user.role !== 'admin') {
        setPendingAdmins([]);
        return;
      }

      setPendingLoading(true);
      setPendingError(null);
      try {
        const res = await authAPI.getPendingAdmins();
        const list = (res as any).pending ?? res;
        setPendingAdmins(Array.isArray(list) ? list : []);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Failed to load admin requests';
        setPendingError(message);
      } finally {
        setPendingLoading(false);
      }
    };

    loadPending();
  }, [user?.id, user?.role]);

  const handleApprove = async (userId: string) => {
    setPendingLoading(true);
    setPendingError(null);
    try {
      await authAPI.approveAdmin(userId);
      const res = await authAPI.getPendingAdmins();
      const list = (res as any).pending ?? res;
      setPendingAdmins(Array.isArray(list) ? list : []);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to approve admin request';
      setPendingError(message);
    } finally {
      setPendingLoading(false);
    }
  };

  return (
    <div className="layout-container">
      <Navbar onLogout={onLogout} onSidebarToggle={handleSidebarToggle} />
      <div className="layout-main">
        <Sidebar isOpen={sidebarOpen} isCollapsed={sidebarCollapsed} onClose={handleSidebarClose} />
        <main className="main-content">
          <div className="container">
            {user?.role === 'admin' && (
              <div className="admin-approvals-banner">
                <div className="admin-approvals-header">
                  <div>
                    <div className="admin-approvals-title">Admin approvals</div>
                    <p className="admin-approvals-subtitle">
                      {pendingAdmins.length > 0
                        ? `${pendingAdmins.length} admin request${pendingAdmins.length > 1 ? 's' : ''} awaiting approval`
                        : 'No pending admin requests'}
                    </p>
                  </div>
                  <div className="admin-approvals-actions">
                    <button
                      type="button"
                      className="admin-approvals-button secondary"
                      onClick={() => {
                        setPendingLoading(true);
                        authAPI
                          .getPendingAdmins()
                          .then((res) => {
                            const list = (res as any).pending ?? res;
                            setPendingAdmins(Array.isArray(list) ? list : []);
                            setPendingError(null);
                          })
                          .catch((err) => {
                            const message = err instanceof Error ? err.message : 'Failed to refresh requests';
                            setPendingError(message);
                          })
                          .finally(() => setPendingLoading(false));
                      }}
                      disabled={pendingLoading}
                    >
                      {pendingLoading ? 'Loading...' : 'Refresh'}
                    </button>
                  </div>
                </div>

                {pendingError && <div className="admin-approvals-error">{pendingError}</div>}

                {pendingAdmins.length > 0 && (
                  <div className="admin-approvals-list">
                    {pendingAdmins.map((pendingUser) => (
                      <div key={pendingUser.id} className="admin-approval-card">
                        <div className="admin-approval-details">
                          <div className="admin-approval-name">{pendingUser.name || 'Pending admin'}</div>
                          <div className="admin-approval-email">{pendingUser.email}</div>
                        </div>
                        <button
                          type="button"
                          className="admin-approvals-button"
                          onClick={() => handleApprove(pendingUser.id)}
                          disabled={pendingLoading}
                        >
                          {pendingLoading ? 'Working...' : 'Approve'}
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {children}
          </div>
          <footer className="footer">
            <p>&copy; 2025 Eventz. Production-Ready Event Management System.</p>
          </footer>
        </main>
      </div>
    </div>
  );
}
