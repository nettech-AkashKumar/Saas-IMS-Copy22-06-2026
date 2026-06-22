import React from "react";
import "./SuperAdminDashboard.css";

const SettingsPage = () => {
  return (
    <section className="sa-panel sa-table-panel">
      <div className="sa-panel__header sa-table-panel__header">
        <div>
          <p className="sa-eyebrow">Super Admin Settings</p>
          <h3>Settings</h3>
        </div>
      </div>
      <div className="sa-panel__body">
        <p>Configure super admin options and controls from this page.</p>
      </div>
    </section>
  );
};

export default SettingsPage;
