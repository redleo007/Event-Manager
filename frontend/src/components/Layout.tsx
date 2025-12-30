import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import './Layout.css';

interface NavLink {
  path: string;
  label: string;
  icon: string;
}

const navLinks: NavLink[] = [
  { path: '/', label: 'Dashboard', icon: '📊' },
  { path: '/events', label: 'Events', icon: '📅' },
  { path: '/import', label: 'Import & Attendance', icon: '📥' },
  { path: '/no-shows', label: 'No-Shows', icon: '❌' },
  { path: '/blocklist', label: 'Blocklist', icon: '🚫' },
  { path: '/volunteers', label: 'Volunteers', icon: '👥' },
  { path: '/settings', label: 'Settings', icon: '⚙️' },
];

export function Navbar() {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();

  return (
    <nav className="navbar">
      <div className="navbar-container">
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">⚡</span>
          <span className="brand-text">TechNexus</span>
        </Link>
        
        <button 
          className="navbar-toggle"
          onClick={() => setIsOpen(!isOpen)}
        >
          ☰
        </button>

        <ul className={`navbar-menu ${isOpen ? 'active' : ''}`}>
          {navLinks.map((link) => (
            <li key={link.path} className="nav-item">
              <Link
                to={link.path}
                className={`nav-link ${location.pathname === link.path ? 'active' : ''}`}
                onClick={() => setIsOpen(false)}
              >
                <span className="nav-icon">{link.icon}</span>
                <span className="nav-label">{link.label}</span>
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}

export function Layout({ children }: { children: React.ReactNode }) {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 0);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div className="layout">
      <Navbar />
      <main className={`main-content ${scrolled ? 'scrolled' : ''}`}>
        <div className="container">
          {children}
        </div>
      </main>
      <footer className="footer">
        <p>&copy; 2025 TechNexus. Production-Ready Event Management System.</p>
      </footer>
    </div>
  );
}
