import React from "react";
import "./SuperAdminDashboard.css";

const SecurityPage = () => {
  return (
    <section className="sa-panel sa-table-panel">
      <div className="sa-panel__header sa-table-panel__header">
        <div>
          <p className="sa-eyebrow">Super Admin Security</p>
          <h3>Security</h3>
        </div>
      </div>
      <div className="sa-panel__body">
        <p>
          Manage security settings, access controls, and audit options here.
        </p>
      </div>
    </section>
  );
};

export default SecurityPage;
