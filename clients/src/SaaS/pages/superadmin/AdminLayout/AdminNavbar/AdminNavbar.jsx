import React, { useState } from "react";
import { FiBell, FiMenu, FiSearch } from "react-icons/fi";
import { Link } from "react-router-dom";
import munc_logo from "../../../../assets/Image/munc-logo.png";

const AdminNavbar = ({ setSidebarOpen }) => {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");

  return (
    <header className="sa-topbar">
      <div className="sa-topbar__left">
        <button
          type="button"
          className="sa-menu-toggle"
          onClick={() => setSidebarOpen?.((prev) => !prev)}
        >
          <FiMenu />
        </button>

        <Link
          to="/admin/dashboard"
          className="sidebar-logo-wrapper sa-navbar-brand"
        >
          <img src={munc_logo} alt="MUNC" className="sidebar-logo" />
          {/* <div style={{ marginLeft: 12 }}>
            <p className="sa-eyebrow">Super Admin Dashboard</p>
            <h1 className="sa-navbar-title">Premium SaaS command center</h1>
          </div> */}
        </Link>
      </div>

      <div className="sa-topbar__right">
        {/* <label className="sa-search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search companies, email, subdomain"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </label> */}

        {/* <select
          className="sa-filter-select"
          value={status}
          onChange={(e) => setStatus(e.target.value)}
        >
          <option value="">All status</option>
          <option value="active">Active</option>
          <option value="inactive">Inactive</option>
        </select> */}

        <button type="button" className="sa-icon-button">
          <FiBell />
        </button>
      </div>
    </header>
  );
};

export default AdminNavbar;
