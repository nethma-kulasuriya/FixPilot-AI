import React from "react";
import "./Landing.css";
import { FiCpu, FiShield, FiBarChart2, FiArrowRight } from "react-icons/fi";

function Landing({ onLoginClick, isAuthenticated = false }) {
  return (
    <div className="landing-container">
      {/* Background glowing blobs */}
      <div className="blob blob-1"></div>
      <div className="blob blob-2"></div>

      {/* Navbar */}
      <nav className="landing-nav">
        <div className="nav-logo">
          <div className="logo-icon">FP</div>
          <span>FixPilot AI</span>
        </div>
        <button className="nav-signin-btn" onClick={onLoginClick}>
          {isAuthenticated ? "Dashboard" : "Sign In"}
        </button>
      </nav>

      {/* Hero Section */}
      <header className="hero-section">
        <div className="badge-modern">
          <span className="badge-dot"></span>
          FixPilot AI 2.0 is now live
        </div>
        <h1 className="hero-title">
          Intelligent IT Support, <br />
          <span className="gradient-text">Powered by AI</span>
        </h1>
        <p className="hero-subtitle">
          Automate issue triage, prioritize critical tickets, and generate smart solutions in seconds.
          Transform your IT workflow today.
        </p>
        <div className="hero-actions">
          <button className="cta-btn primary-cta" onClick={onLoginClick}>
            {isAuthenticated ? "Go to Dashboard" : "Get Started"} <FiArrowRight className="cta-icon" />
          </button>
          <button className="cta-btn secondary-cta" onClick={() => {
            document.getElementById("features").scrollIntoView({ behavior: 'smooth' });
          }}>
            Learn More
          </button>
        </div>
      </header>

      {/* Features Section */}
      <section id="features" className="features-section">
        <div className="feature-card">
          <div className="feature-icon-wrapper">
            <FiCpu className="feature-icon" />
          </div>
          <h3>AI Auto-Triage</h3>
          <p>
            Instantly analyzes your incoming tickets to categorize and prioritize them without human intervention.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon-wrapper">
            <FiShield className="feature-icon" />
          </div>
          <h3>Smart Solutions</h3>
          <p>
            Generates highly accurate, contextual solutions to common IT issues, reducing resolution times drastically.
          </p>
        </div>

        <div className="feature-card">
          <div className="feature-icon-wrapper">
            <FiBarChart2 className="feature-icon" />
          </div>
          <h3>Admin Dashboard</h3>
          <p>
            Get a birds-eye view of all operations. Monitor active tickets, track performance, and manage users efficiently.
          </p>
        </div>
      </section>

      {/* Footer */}
      <footer className="landing-footer">
        <p>&copy; {new Date().getFullYear()} Nethma Kulasuriya. All rights reserved.</p>
      </footer>
    </div>
  );
}

export default Landing;
