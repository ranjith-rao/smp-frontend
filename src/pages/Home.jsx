import React from 'react';
import { useNavigate } from 'react-router-dom';
import { authService } from '../services/authService';

const Home = () => {
  const navigate = useNavigate();

  const handleLogout = () => {
    authService.logout();
    navigate('/login');
  };

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f8fafc' }}>
      {/* Header */}
      <header style={{ backgroundColor: 'white', borderBottom: '1px solid #e2e8f0', boxShadow: '0 1px 3px rgba(0,0,0,0.05)' }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '16px 20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h1 style={{ color: '#6366f1', fontSize: '24px', fontWeight: '700', margin: 0 }}>NEXUS</h1>
          <button 
            onClick={handleLogout}
            style={{
              padding: '10px 20px',
              backgroundColor: '#ef4444',
              color: 'white',
              border: 'none',
              borderRadius: '6px',
              cursor: 'pointer',
              fontWeight: '600',
              fontSize: '14px',
              transition: 'background-color 0.2s'
            }}
            onMouseEnter={(e) => e.target.style.backgroundColor = '#dc2626'}
            onMouseLeave={(e) => e.target.style.backgroundColor = '#ef4444'}
          >
            Logout
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main style={{ maxWidth: '1200px', margin: '0 auto', padding: '40px 20px' }}>
        <div style={{ textAlign: 'center' }}>
          <h2 style={{ color: '#1e293b', fontSize: '32px', fontWeight: '700', margin: '0 0 10px 0' }}>Welcome to NEXUS</h2>
          <p style={{ color: '#64748b', fontSize: '16px', margin: '0 0 40px 0' }}>The social platform where connections matter</p>
        </div>

        {/* Coming Soon Message */}
        <div style={{ 
          background: 'white', 
          padding: '60px 40px', 
          borderRadius: '10px', 
          boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
          textAlign: 'center'
        }}>
          <div style={{ fontSize: '64px', marginBottom: '20px' }}>🚀</div>
          <h3 style={{ color: '#1e293b', fontSize: '24px', fontWeight: '700', margin: '0 0 10px 0' }}>Coming Soon</h3>
          <p style={{ color: '#64748b', fontSize: '16px', margin: 0 }}>
            We're building something amazing. Check back soon for posts, connections, and more!
          </p>
        </div>
      </main>
    </div>
  );
};

export default Home;
