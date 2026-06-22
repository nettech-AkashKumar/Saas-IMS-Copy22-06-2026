import React from "react";
import "./dashboard.css";
// import Dashboard from "../assets/images/dashboard.png";
import Dashboard from "../assets/images/dashboard.png";

const DashboardPreview = () => {
  const leftFeatures = [
    { icon: "🏪", title: "Retail Stores", desc: "Multi-location inventory" },
    { icon: "🛒", title: "Supermarkets", desc: "High-volume management" },
    { icon: "📦", title: "Wholesale", desc: "Bulk operations" },
    { icon: "🚚", title: "Distributors", desc: "Supply chain" },
  ];

  const rightFeatures = [
    { icon: "💻", title: "Electronics", desc: "Complex SKUs" },
    { icon: "👗", title: "Fashion", desc: "Size & color variants" },
    { icon: "💊", title: "Pharmacy", desc: "Expiry tracking" },
    { icon: "🏢", title: "Multi-Store", desc: "Centralized control" },
  ];

  return (
    <section className="ultra-dashboard">
      <div className="dashboard-header">
        <h2>Who Is This Software For?</h2>
        <p>
          Our software is designed for businesses that need better control over
          inventory, billing, customers, and suppliers.
        </p>
      </div>

      <div className="ultra-container">
        {/* LEFT */}
        <div className="ultra-side left">
          {leftFeatures.map((item, i) => (
            <div key={i} className="ultra-card left">
              <span className="icon">{item.icon}</span>
              <div>
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CENTER */}
        <div className="ultra-center">
          <div className="center-glow"></div>

          <div className="center-card">
            <img src={Dashboard} alt="dashboard" />
          </div>

          {/* floating notifications */}
          {/* <div className="float-card one">+ Sale ₹2,450</div> */}
          {/* <div className="float-card two">Stock Updated</div> */}
          {/* <div className="float-card three">New Order</div> */}
        </div>

        {/* RIGHT */}
        <div className="ultra-side right">
          {rightFeatures.map((item, i) => (
            <div key={i} className="ultra-card right">
              <span className="icon">{item.icon}</span>
              <div>
                <h4>{item.title}</h4>
                <p>{item.desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default DashboardPreview;
