import React from "react";
import { Link, NavLink, Outlet } from "react-router-dom";
import "../../../styles/Settings.css";
import "../../../styles/Responsive.css";
import { useAuth } from "../../../components/auth/AuthContext";

const SettingsLayouts = () => {
  const { user } = useAuth();
  if (!user) return null;

  const id = user?._id || user?.id;
  const permissions = user?.role?.modulePermissions || {};

  const canAccess = (module, action = "read") => {
    // ✅ Admin bypass: full access - check roleName instead of name
    if (user?.role?.roleName?.toLowerCase() === "admin") return true;

    // If no permissions or module not defined → deny
    if (!permissions || !permissions[module]) {
      console.warn(`Module "${module}" not found in permissions for user ${user?.name}`);
      return false;
    }

    const modulePerms = permissions[module];

    // ✅ Allow only if all:true or specific action:true
    return modulePerms?.all === true || modulePerms?.[action] === true;
  };

  return (
    <div className="p-4">
      <div
        style={{
          width: "100%",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          padding: "0px 0px 16px 0px",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 11,
            height: "33px",
          }}
        >
          <h2
            style={{
              margin: 0,
              color: "black",
              fontSize: 22,
              fontFamily: "Inter, sans-serif",
              fontWeight: 500,
              height: "33px",
            }}
          >
            Settings
          </h2>
        </div>
      </div>

      <div
        className="settings-layout-container d-flex"
        style={{
          backgroundColor: "white",
          padding: "24px",
          borderRadius: "16px",
          width: "100%",
          gap: "32px",
          height: "calc(100vh - 150px)",
          overflow: "hidden",
        }}
      >
        {/* Sidebar */}
        <div
          className="settings-sidebars"
          style={{ borderRight: "1px solid #dad6d6ff", width: "250px", paddingRight: "px", }}
        >
          {/* sidebar navlink */}
          <ul
            className="settings-sidebar-navlink"
            style={{
              listStyle: "none",
              paddingLeft: "0",
              marginBottom: "0",
              display: "flex",
              flexDirection: "column",
              gap: "25px",
            }}
          >
            {/* User Profile */}
            <li className="settings-siber-menu-link">
              <NavLink
                to="user-profile-settings"
                className={({ isActive }) => (isActive ? "active-link" : "")}
                style={{
                  fontFamily: "Inter",
                  fontSize: "14px",
                  textDecoration: "none",
                  color: "#727681",
                }}
              >
                User Profile
              </NavLink>
            </li>
            {/* Company Details */}
            {canAccess("CompanySettings", "read") && (
              <li className="settings-siber-menu-link">
                <NavLink
                  to="company-settings"
                  className={({ isActive }) => (isActive ? "active-link" : "")}
                  style={{
                    fontFamily: "Inter",
                    fontSize: "14px",
                    textDecoration: "none",
                    color: "#727681",
                  }}
                >
                  Company Details
                </NavLink>
              </li>
            )}
            {/* bANK  details */}
            {canAccess("BankDetails", "read") && (
              <li className="settings-siber-menu-link">
                <NavLink
                  to="company-bank"
                  className={({ isActive }) => (isActive ? "active-link" : "")}
                  style={{
                    fontFamily: "Inter",
                    fontSize: "14px",
                    textDecoration: "none",
                    color: "#727681",
                  }}
                >
                  Bank Details
                </NavLink>
              </li>
            )}
            <li className="settings-siber-menu-link">
              {/* <Link
                style={{
                  fontFamily: "Inter",
                  fontSize: "14px",
                  color: "#727681",
                  textDecoration: "none",
                }}
              >
                Print
              </Link> */}
              <NavLink
                to="barcode-print"
                className={({ isActive }) => (isActive ? "active-link" : "")}
                style={{
                  fontFamily: "Inter",
                  fontSize: "14px",
                  textDecoration: "none",
                  color: "#727681",
                }}
              >
                Print
              </NavLink>
            </li>
            <li className="settings-siber-menu-link">
              {/* <Link
                style={{
                  fontFamily: "Inter",
                  fontSize: "14px",
                  color: "#727681",
                  textDecoration: "none",
                }}
              >
                Notes, Terms & Footer se..
              </Link> */}
              <NavLink
                to="notes-term-condition"
                className={({ isActive }) => (isActive ? "active-link" : "")}
                style={{
                  fontFamily: "Inter",
                  fontSize: "14px",
                  textDecoration: "none",
                  color: "#727681",
                }}
              >
                Notes, Terms
              </NavLink>
            </li>
            <li className="settings-siber-menu-link">
              {/* <Link
                style={{
                  fontFamily: "Inter",
                  fontSize: "14px",
                  color: "#727681",
                  textDecoration: "none",
                }}
              >
               Taxes & GST
              </Link> */}
              <NavLink
                to="taxes-gst"
                className={({ isActive }) => (isActive ? "active-link" : "")}
                style={{
                  fontFamily: "Inter",
                  fontSize: "14px",
                  textDecoration: "none",
                  color: "#727681",
                }}
              >
                Taxes & GST
              </NavLink>
            </li>
            <li className="settings-siber-menu-link">
              <NavLink
                to="system-setting"
                className={({ isActive }) => (isActive ? "active-link" : "")}
                style={{
                  fontFamily: "Inter",
                  fontSize: "14px",
                  textDecoration: "none",
                  color: "#727681",
                }}
              >
                System Setting
              </NavLink>
            </li>
            <li className="settings-siber-menu-link">
              <NavLink
                to="pricing-plans"
                className={({ isActive }) => (isActive ? "active-link" : "")}
                style={{
                  fontFamily: "Inter",
                  fontSize: "14px",
                  textDecoration: "none",
                  color: "#727681",
                }}
              >
                Pricing & Plans
              </NavLink>
            </li>
            <li className="settings-siber-menu-link">
              <NavLink
                to="supports"
                className={({ isActive }) => (isActive ? "active-link" : "")}
                style={{
                  fontFamily: "Inter",
                  fontSize: "14px",
                  textDecoration: "none",
                  color: "#727681",
                }}
              >
                Supports
              </NavLink>

            </li>
          </ul>
        </div>
        {/* Settings-right-content */}
        <div className="right-settings-content w-100">
          <Outlet />
        </div>
      </div>
    </div>
  );
};

export default SettingsLayouts;
