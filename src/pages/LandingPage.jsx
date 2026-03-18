import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import '../styles/Landing.css';
import { API_CONFIG } from '../config/api';
import { useSiteSettings } from '../context/SiteSettingsContext';
import PublicHeader from '../components/PublicHeader';

const LandingPage = () => {
  const { settings, loading, refresh } = useSiteSettings();
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [formStatus, setFormStatus] = useState(null);
  const [formLoading, setFormLoading] = useState(false);
  const [activeSection, setActiveSection] = useState('home');

  const appName = settings?.appName || 'NEXUS';
  const appTagline = settings?.appTagline || 'The social platform where connections matter.';
  const heroBadge = settings?.heroBadge || '✨ The next-gen social space';
  const heroTitle = settings?.heroTitle || settings?.homeTitle || `Welcome to ${appName}`;
  const heroSubtitle = settings?.heroSubtitle || settings?.homeSubtitle || appTagline;
  const heroImageUrl = settings?.heroImageUrl || '/hero-illustration.svg';
  const aboutTitle = settings?.aboutTitle || 'Build your community here';
  const aboutDescription = settings?.aboutDescription || settings?.homeDescription || appTagline;
  const aboutBullets = Array.isArray(settings?.aboutBulletsJson) ? settings.aboutBulletsJson : [];
  const aboutImageUrl = settings?.aboutImageUrl || '/mockup-feed.svg';
  const features = Array.isArray(settings?.featuresJson) ? settings.featuresJson : [];
  const stats = Array.isArray(settings?.statsJson) ? settings.statsJson : [];
  const ctaTitle = settings?.ctaTitle || 'Ready to build your social graph?';
  const ctaDescription = settings?.ctaDescription || `Join ${appName} and discover meaningful conversations today.`;
  const ctaButtonText = settings?.ctaButtonText || 'Create your account';

  useEffect(() => {
    refresh();
  }, [refresh]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleContactSubmit = async (e) => {
    e.preventDefault();
    setFormLoading(true);
    setFormStatus(null);

    try {
      const response = await fetch(`${API_CONFIG.BASE_URL}/api/content/contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      });
      const data = await response.json();
      if (response.ok) {
        setFormStatus({ type: 'success', message: 'Thank you! Your message has been sent successfully.' });
        setFormData({ name: '', email: '', subject: '', message: '' });
      } else {
        setFormStatus({ type: 'error', message: data.message || 'Failed to send message. Please try again.' });
      }
    } catch {
      setFormStatus({ type: 'error', message: 'Error sending message. Please try again later.' });
    } finally {
      setFormLoading(false);
    }
  };

  const scrollToSection = (section) => {
    setActiveSection(section);
    const element = document.getElementById(section);
    if (element) element.scrollIntoView({ behavior: 'smooth' });
  };

  const fallbackStats = [
    { value: '120k+', label: 'Active Members' },
    { value: '4.6M', label: 'Posts Shared' },
    { value: '92%', label: 'Positive Interactions' },
    { value: '48+', label: 'Countries Connected' },
  ];

  const fallbackFeatures = [
    { icon: '💬', title: 'Real Conversations', description: 'Build meaningful connections with people who share your interests and passions.' },
    { icon: '📝', title: 'Creator Tools', description: 'Express yourself freely and share your thoughts, photos, and experiences.' },
    { icon: '❤️', title: 'Engagement', description: 'Like, comment, and interact with content from your connections.' },
  ];

  const fallbackBullets = [
    '✨ Clean and intuitive user interface',
    '🔒 Privacy-first approach to social networking',
    '💬 Real-time messaging and notifications',
  ];

  return (
    <div className="landing-page">
      <PublicHeader showNavLinks activeSection={activeSection} onSectionChange={scrollToSection} />

      <section className="hero hero-split" id="home">
        <div className="hero-inner">
          <div className="hero-left">
            <div className="hero-badge">{heroBadge}</div>
            <h1>{heroTitle}</h1>
            <p>{loading ? 'Loading your experience...' : heroSubtitle}</p>
            <div className="hero-buttons">
              <Link to="/register" className="btn-hero btn-primary-hero">Get Started</Link>
              <Link to="/login" className="btn-hero btn-secondary-hero">Sign In</Link>
            </div>
            <div className="hero-trust"><span>{appTagline}</span></div>
          </div>
          <div className="hero-right">
            <img className="hero-illustration" src={heroImageUrl} alt={`${appName} preview`} />
            <div className="floating-card card-one"><div className="floating-title">Live Connections</div><div className="floating-sub">+8.4k new chats today</div></div>
            <div className="floating-card card-two"><div className="floating-title">Creator Momentum</div><div className="floating-sub">2.1M weekly impressions</div></div>
          </div>
        </div>
      </section>

      <section className="stats-section"><div className="stats-grid">{(stats.length ? stats : fallbackStats).map((stat, index) => <div className="stat-card" key={`${stat.label}-${index}`}><h3>{stat.value}</h3><p>{stat.label}</p></div>)}</div></section>

      <section className="about-section"><div className="about-grid"><div className="about-text"><h2>{aboutTitle}</h2><p>{aboutDescription}</p><div className="home-highlight"><h3>Why Choose {appName}?</h3><ul className="highlight-list">{(aboutBullets.length ? aboutBullets : fallbackBullets).map((item, index) => <li key={`bullet-${index}`}>{item}</li>)}</ul></div></div><div className="about-media"><img src={aboutImageUrl} alt={`${appName} feed preview`} /></div></div></section>

      <section className="features-section"><h2>Key Features</h2><p className="section-subtitle">Everything you need to connect, share, and grow.</p><div className="features-grid">{(features.length ? features : fallbackFeatures).map((feature, index) => <div className="feature-card" key={`${feature.title}-${index}`}><div className="feature-icon">{feature.icon}</div><h3>{feature.title}</h3><p>{feature.description}</p></div>)}</div></section>

      <section className="cta-section"><div className="cta-card"><div><h2>{ctaTitle}</h2><p>{ctaDescription}</p></div><Link to="/register" className="cta-btn">{ctaButtonText}</Link></div></section>

      <section id="contact" className="contact-section">
        <div className="contact-container">
          <h2>Get In Touch</h2>
          <div className="contact-info">
            <div className="info-card"><h3>📧 Email</h3><p>{settings.contactEmail || 'support@nexus.com'}</p></div>
            <div className="info-card"><h3>📞 Phone</h3><p>{settings.contactPhone || '+1 (555) 123-4567'}</p></div>
          </div>
          <form className="contact-form" onSubmit={handleContactSubmit}>
            <h3 style={{ marginBottom: '30px', color: '#1e293b', fontSize: '20px', fontWeight: 'bold' }}>Send us a Message</h3>
            <div className="form-group"><label htmlFor="name">Full Name *</label><input type="text" id="name" name="name" value={formData.name} onChange={handleInputChange} placeholder="Your full name" required /></div>
            <div className="form-group"><label htmlFor="email">Email Address *</label><input type="email" id="email" name="email" value={formData.email} onChange={handleInputChange} placeholder="your@email.com" required /></div>
            <div className="form-group"><label htmlFor="subject">Subject *</label><input type="text" id="subject" name="subject" value={formData.subject} onChange={handleInputChange} placeholder="What is this about?" required /></div>
            <div className="form-group"><label htmlFor="message">Message *</label><textarea id="message" name="message" value={formData.message} onChange={handleInputChange} placeholder="Tell us more..." required /></div>
            <button type="submit" className="form-submit" disabled={formLoading}>{formLoading ? 'Sending...' : 'Send Message'}</button>
            {formStatus && <div className={`form-status ${formStatus.type}`}>{formStatus.message}</div>}
          </form>
        </div>
      </section>

      <footer className="landing-footer">
        <div className="footer-content">
          <div className="footer-section"><h3>{appName}</h3><p>{appTagline}</p></div>
          <div className="footer-section"><h3>Quick Links</h3><a href="#home">Home</a><a href="#contact">Contact</a><Link to="/login">Login</Link><Link to="/register">Register</Link></div>
          <div className="footer-section"><h3>Support</h3><a href="#contact">Contact Us</a><a href="#home">About Us</a></div>
        </div>
        <div className="footer-bottom" style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
          <Link to="/terms-and-conditions">Terms & Conditions</Link><span>•</span><Link to="/privacy-policy">Privacy Policy</Link><span>•</span><p style={{ margin: 0 }}>&copy; 2026 {appName}. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;