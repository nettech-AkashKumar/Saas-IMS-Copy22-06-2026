import React, { useState, useEffect } from "react";
import "./companies.css";
import Logo1 from "../assets/images/brand/invi.jpeg";
import Logo2 from "../assets/images/brand/res.jpeg";
import Logo3 from "../assets/images/brand/rms.jpeg";
import Logo4 from "../assets/images/brand/solar.jpeg";
import Logo5 from "../assets/images/brand/yougta.jpeg";
import { FiTrendingUp, FiUsers, FiAward, FiGlobe } from "react-icons/fi";

const Companies = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [animatedCount, setAnimatedCount] = useState(0);

  const logos = [Logo1, Logo2, Logo3, Logo4, Logo5];

  // Stats data
  const stats = [
    { icon: FiUsers, value: 10000, label: "Active Users", suffix: "+" },
    { icon: FiTrendingUp, value: 500, label: "Businesses", suffix: "+" },
    { icon: FiAward, value: 98, label: "Satisfaction", suffix: "%" },
    { icon: FiGlobe, value: 25, label: "Countries", suffix: "+" },
  ];

  useEffect(() => {
    let timerId = null;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true);
          if (timerId !== null) return;

          timerId = setInterval(() => {
            setAnimatedCount((prev) => {
              if (prev >= 10000) {
                if (timerId !== null) {
                  clearInterval(timerId);
                  timerId = null;
                }
                return 10000;
              }
              return prev + 200;
            });
          }, 50);
        }
      },
      { threshold: 0.3 },
    );

    const element = document.querySelector(".trusted");
    if (element) observer.observe(element);

    return () => {
      if (timerId !== null) {
        clearInterval(timerId);
      }
      observer.disconnect();
    };
  }, []);

  return (
    <section className="trusted">
      {/* Background Elements */}
      <div className="trusted-bg">
        <div className="floating-shape shape-1"></div>
        <div className="floating-shape shape-2"></div>
        <div className="floating-shape shape-3"></div>
      </div>

      <div className="trusted-container">
        {/* Header Section */}
        <div className={`trusted-header ${isVisible ? "animate-in" : ""}`}>
          <div className="trusted-badge">
            <FiAward className="badge-icon" />
            <span>Trusted Worldwide</span>
          </div>

          <h2 className="trusted-title">
            Trusted by{" "}
            <span className="highlight">{animatedCount.toLocaleString()}+</span>{" "}
            Businesses
          </h2>

          <p className="trusted-subtitle">
            Join thousands of successful businesses that have transformed their
            operations with our platform
          </p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid">
          {stats.map((stat, index) => {
            const IconComponent = stat.icon;
            return (
              <div
                key={index}
                className={`stat-card ${isVisible ? "animate-in-delay" : ""}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="stat-icon">
                  <IconComponent />
                </div>
                <div className="stat-content">
                  <div className="stat-value">
                    {stat.value.toLocaleString()}
                    {stat.suffix}
                  </div>
                  <div className="stat-label">{stat.label}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Logo Showcase */}
        <div className="logo-showcase">
          <div className="logo-header">
            <h3>Our Partners & Clients</h3>
            <p>Leading brands trust our solutions</p>
          </div>

          <div className="logo-grid">
            {logos.map((logo, i) => (
              <div
                key={i}
                className={`logo-item ${isVisible ? "animate-in-delay" : ""}`}
                style={{ animationDelay: `${(i + 4) * 0.1}s` }}
              >
                <div className="logo-wrapper">
                  <img src={logo} alt={`company-${i + 1}`} />
                  <div className="logo-overlay"></div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div
          className={`cta-section ${isVisible ? "animate-in-delay" : ""}`}
          style={{ animationDelay: "1s" }}
        >
          <div className="cta-content">
            <h3>Ready to Join Them?</h3>
            <p>Start your free trial today and see the difference</p>
            <div className="cta-buttons">
              <a href="/register-login-details" className="cta-primary">
                Start Free Trial
              </a>
              <a href="#contact" className="cta-secondary">
                Contact Sales
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Companies;
