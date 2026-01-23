import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Icon } from './Icon';
import './Navbar.css';

interface NavbarProps {
  onLogout: () => void;
  onSidebarToggle: () => void;
}

export function Navbar({ onLogout, onSidebarToggle }: NavbarProps) {
  const [adminUser, setAdminUser] = useState('');

  useEffect(() => {
    const user = localStorage.getItem('admin_user');
    if (user) {
      setAdminUser(user);
    }
  }, []);

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
          <img src="/logo.svg" alt="TechNexus" className="brand-icon" />
          <span className="brand-text">TechNexus Community</span>
        </Link>
      </div>

      {/* Right: User Info & Logout */}
      <div className="navbar-right">
        <div className="user-info">
          <Icon name="user" alt="User" />
          <span className="user-name">{adminUser || 'Admin'}</span>
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
