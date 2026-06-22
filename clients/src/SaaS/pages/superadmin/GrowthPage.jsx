import React from "react";
import "./SuperAdminDashboard.css";

const GrowthPage = () => {
  return (
    <section className="sa-panel sa-table-panel">
      <div className="sa-panel__header sa-table-panel__header">
        <div>
          <p className="sa-eyebrow">Growth</p>
          <h3>Growth Performance</h3>
        </div>
      </div>
      <div className="sa-panel__body">
        <p>
          Track growth and company performance from the super admin dashboard.
        </p>
      </div>
    </section>
  );
};

export default GrowthPage;
