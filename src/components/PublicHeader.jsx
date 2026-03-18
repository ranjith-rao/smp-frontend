import React from 'react';
import { Link } from 'react-router-dom';
import logoImage from '../assets/logo.png';
import { useSiteSettings } from '../context/SiteSettingsContext';

const PublicHeader = ({ showNavLinks = true, activeSection = 'home', onSectionChange = () => {} }) => {
  const { settings } = useSiteSettings();
  const appName = settings?.appName || 'NEXUS';
  const brandLogo = settings?.logoUrl || logoImage;

  return (
    <nav className="landing-nav" style={{ borderBottom: showNavLinks ? undefined : '1px solid #e2e8f0' }}>
      <div className="nav-logo">
        <img src={brandLogo} alt={appName} className="nav-logo-image" />
        <span>{appName}</span>
      </div>

      {showNavLinks ? (
        <ul className="nav-menu">
          <li>
            <button
              className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}
              onClick={() => onSectionChange('home')}
              type="button"
            >
              Home
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${activeSection === 'contact' ? 'active' : ''}`}
              onClick={() => onSectionChange('contact')}
              type="button"
            >
              Contact Us
            </button>
          </li>
        </ul>
      ) : (
        <div />
      )}

      <div className="nav-auth">
        <Link to="/login" className="nav-btn login">Login</Link>
        <Link to="/register" className="nav-btn signup">Sign Up</Link>
      </div>
    </nav>
  );
};

export default PublicHeader;
