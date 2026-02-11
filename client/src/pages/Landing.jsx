import { Link } from "react-router-dom";
import "../styles/Landing.css";
import { useContext } from "react";
import { ThemeContext } from "../contexts/ThemeContext";

export default function Landing() {
  const { darkMode, toggleDarkMode } = useContext(ThemeContext);

  return (
    <div className="landing">
      {/* NAVBAR */}
      <nav className="landing-nav">
        <div className="brand">RiskShield AI</div>
        <div className="nav-actions">
          <Link to="/login" className="nav-link">
            Login
          </Link>
          <Link to="/signup" className="primary-btn">
            Get Started
          </Link>
          <label className="toggle-bar">
            <input
              type="checkbox"
              checked={darkMode}
              onChange={toggleDarkMode}
            />
            <span className="slider"></span>
          </label>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="hero-content">
          <h1 className="fade-in">
            Predict Academic Risks <br />
            <span>Before They Happen</span>
          </h1>

          <p className="fade-in delay">
            RiskShield AI is an intelligent academic risk management platform
            that helps educators identify at-risk students early and take
            data-driven intervention actions.
          </p>

          <div className="hero-buttons fade-in delay-2">
            <Link to="/signup" className="primary-btn large">
              Create Account
            </Link>
          </div>
        </div>

        <div className="hero-visual slide-in">
          <div className="mock-card">📊 Risk Analytics</div>
          <div className="mock-card">🧠 AI Prediction</div>
          <div className="mock-card">⚠️ Early Alerts</div>
        </div>
      </section>

      {/* FEATURES */}
      <section className="features">
        <div className="feature">
          <h3>⚡ AI Risk Detection</h3>
          <p>
            Automatically analyze attendance and performance data to identify
            students at academic risk.
          </p>
        </div>

        <div className="feature">
          <h3>📊 Smart Dashboards</h3>
          <p>
            Visualize academic trends and risk levels through clean and
            intuitive dashboards.
          </p>
        </div>

        <div className="feature">
          <h3>🧠 Early Intervention</h3>
          <p>
            Enable teachers to act early and improve student outcomes using
            predictive insights.
          </p>
        </div>
      </section>

      {/* FOOTER */}
      <footer className="footer">
        © {new Date().getFullYear()} RiskShield AI. All rights reserved.
      </footer>
    </div>
  );
}
