import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Landing.css';
import { API_CONFIG } from '../config/api';

const LandingPage = () => {
  const [content, setContent] = useState({});
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });
  const [formStatus, setFormStatus] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  // Fetch landing page content from backend
  useEffect(() => {
    const fetchContent = async () => {
      try {
        const response = await fetch(`${API_CONFIG.BASE_URL}/api/content/landing-page`);
        const data = await response.json();
        setContent(data);
      } catch (error) {
        console.error('Error fetching content:', error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchContent();
  }, []);

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Handle form submission
  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormStatus(null);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/content/contact`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(formData)
      });

      const data = await response.json();

      if (response.ok) {
        setFormStatus({ type: 'success', message: 'Thank you! Your message has been sent successfully.' });
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setFormStatus({ type: 'error', message: data.message || 'Failed to send message. Please try again.' });
      }
    } catch (error) {
      setFormStatus({ type: 'error', message: 'Error sending message. Please try again later.' });
    } finally {
      setFormLoading(false);
    }
  };

  const scrollToSection = (section) => {
    setActiveSection(section);
    const element = document.getElementById(section);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="landing-page">
      {/* Navigation */}
      <nav className="landing-nav">
        <div className="nav-logo">NEXUS</div>
        <ul className="nav-menu">
          <li>
            <button
              className={`nav-link ${activeSection === 'home' ? 'active' : ''}`}
              onClick={() => scrollToSection('home')}
              type="button"
            >
              Home
            </button>
          </li>
          <li>
            <button
              className={`nav-link ${activeSection === 'contact' ? 'active' : ''}`}
              onClick={() => scrollToSection('contact')}
              type="button"
            >
              Contact Us
            </button>
          </li>
        </ul>
        <div className="nav-auth">
          <Link to="/login" className="nav-btn login">Login</Link>
          <Link to="/register" className="nav-btn signup">Sign Up</Link>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="hero hero-split">
        <div className="hero-inner">
          <div className="hero-left">
          <div className="hero-badge">✨ The next‑gen social space</div>
          <h1>{content.homeTitle || 'Welcome to NEXUS'}</h1>
          <p>
            {loading
              ? 'Loading your experience...'
              : content.homeSubtitle || 'The social platform where connections matter'}
          </p>
          <div className="hero-buttons">
            <Link to="/register" className="btn-hero btn-primary-hero">Get Started</Link>
            <Link to="/login" className="btn-hero btn-secondary-hero">Sign In</Link>
          </div>
          <div className="hero-trust">
            <span>Trusted by creators, students, and communities</span>
          </div>
        </div>
          <div className="hero-right">
            <img className="hero-illustration" src="/hero-illustration.svg" alt="NEXUS social feed preview" />
            <div className="floating-card card-one">
              <div className="floating-title">Live Connections</div>
              <div className="floating-sub">+8.4k new chats today</div>
            </div>
            <div className="floating-card card-two">
              <div className="floating-title">Creator Momentum</div>
              <div className="floating-sub">2.1M weekly impressions</div>
            </div>
          </div>
        </div>
      </section>

      <section className="stats-section">
        <div className="stats-grid">
          <div className="stat-card">
            <h3>120k+</h3>
            <p>Active Members</p>
          </div>
          <div className="stat-card">
            <h3>4.6M</h3>
            <p>Posts Shared</p>
          </div>
          <div className="stat-card">
            <h3>92%</h3>
            <p>Positive Interactions</p>
          </div>
          <div className="stat-card">
            <h3>48+</h3>
            <p>Countries Connected</p>
          </div>
        </div>
      </section>

      {/* Home Section */}
      <section id="home" className="about-section">
        <div className="about-grid">
          <div className="about-text">
            <h2>Build your community here</h2>
            <p>
              {content.homeDescription ||
              'NEXUS is a modern social platform designed to bring people together. Share your thoughts, connect with friends, and build meaningful relationships in a safe and supportive community.'}
            </p>
            <div className="home-highlight">
              <h3>Why Choose NEXUS?</h3>
              <ul className="highlight-list">
                <li>✨ Clean and intuitive user interface</li>
                <li>🔒 Privacy-first approach to social networking</li>
                <li>💬 Real-time messaging and notifications</li>
                <li>👥 Connect with like-minded individuals</li>
                <li>🌟 Build your community with ease</li>
              </ul>
            </div>
          </div>
          <div className="about-media">
            <img src="/mockup-feed.svg" alt="NEXUS feed preview" />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <h2>Key Features</h2>
        <p className="section-subtitle">Everything you need to connect, share, and grow.</p>
        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">💬</div>
            <h3>Real Conversations</h3>
            <p>Build meaningful connections with people who share your interests and passions.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Creator Tools</h3>
            <p>Express yourself freely and share your thoughts, photos, and experiences.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">❤️</div>
            <h3>Engagement</h3>
            <p>Like, comment, and interact with content from your connections.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h3>Smart Alerts</h3>
            <p>Never miss important updates with real-time notifications.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🌐</div>
            <h3>Global Community</h3>
            <p>Connect with people from around the world and expand your network.</p>
          </div>
          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Safe & Secure</h3>
            <p>Your privacy and security are our top priorities.</p>
          </div>
        </div>
      </section>

      <section className="cta-section">
        <div className="cta-card">
          <div>
            <h2>Ready to build your social graph?</h2>
            <p>Join NEXUS and discover meaningful conversations today.</p>
          </div>
          <Link to="/register" className="cta-btn">Create your account</Link>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="contact-section">
        <div className="contact-container">
          <h2>Get In Touch</h2>
          
          {/* Contact Info */}
          <div className="contact-info">
            <div className="info-card">
              <h3>📧 Email</h3>
              <p>{content.contactEmail || 'support@nexus.com'}</p>
            </div>
            <div className="info-card">
              <h3>📞 Phone</h3>
              <p>{content.contactPhone || '+1 (555) 123-4567'}</p>
            </div>
          </div>

          {/* Contact Form */}
          <form className="contact-form" onSubmit={handleContactSubmit}>
            <h3 style={{ marginBottom: '30px', color: '#1e293b', fontSize: '20px', fontWeight: 'bold' }}>Send us a Message</h3>
            
            <div className="form-group">
              <label htmlFor="name">Full Name *</label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleInputChange}
                placeholder="Your full name"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">Email Address *</label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                placeholder="your@email.com"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="subject">Subject *</label>
              <input
                type="text"
                id="subject"
                name="subject"
                value={formData.subject}
                onChange={handleInputChange}
                placeholder="What is this about?"
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="message">Message *</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleInputChange}
                placeholder="Tell us more..."
                required
              />
            </div>

            <button 
              type="submit" 
              className="form-submit"
              disabled={formLoading}
            >
              {formLoading ? 'Sending...' : 'Send Message'}
            </button>

            {formStatus && (
              <div className={`form-status ${formStatus.type}`}>
                {formStatus.message}
              </div>
            )}
          </form>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-section">
            <h3>NEXUS</h3>
            <p>The social platform where connections matter.</p>
          </div>
          <div className="footer-section">
            <h3>Quick Links</h3>
            <a href="#home">Home</a>
            <a href="#contact">Contact</a>
            <Link to="/login">Login</Link>
            <Link to="/register">Register</Link>
          </div>
          <div className="footer-section">
            <h3>Support</h3>
            <a href="#contact">Contact Us</a>
            <a href="#home">About Us</a>
          </div>
        </div>
        <div className="footer-bottom">
          <p>&copy; 2026 NEXUS. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;