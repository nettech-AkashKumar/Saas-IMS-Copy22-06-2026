

import React, { useEffect, useMemo, useState } from "react";
import {
  FiBell,
  FiChevronRight,
  FiFileText,
  FiGlobe,
  FiGrid,
  FiLogOut,
  FiMenu,
  FiSettings,
  FiShield,
  FiUsers,
} from "react-icons/fi";

import { Link, NavLink, useLocation } from "react-router-dom";

import munc_logo from "../../../../assets/Image/munc-logo.png";
// import "./sidebar.css";

const Sidebar = ({ sidebarOpen, setSidebarOpen, onLogout }) => {
  const location = useLocation();

  const [activeCategory, setActiveCategory] = useState(null);

  const [extended, setExtended] = useState(true);

  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  const isOpen = isMobile ? sidebarOpen : true;

  /* --------------------------------
      RESPONSIVE
  -------------------------------- */

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;

      setIsMobile(mobile);

      if (!mobile) {
        setSidebarOpen?.(false);
      }
    };

    handleResize();

    window.addEventListener("resize", handleResize);

    return () => window.removeEventListener("resize", handleResize);
  }, []);

  /* --------------------------------
      SIDEBAR CONFIG
  -------------------------------- */

  const sidebarItems = useMemo(
    () => [
      {
        name: "Overview",
        icon: <FiGrid />,
        navLinks: [
          {
            to: "/admin/dashboard",
            label: "Overview",
          },
        ],
      },

      {
        name: "Companies",
        icon: <FiUsers />,
        navLinks: [
          {
            to: "/admin/dashboard/companies",
            label: "Companies",
          },
        ],
      },

      {
        name: "Reminder",
        icon: <FiBell />,
        navLinks: [
          {
            to: "/admin/dashboard/reminder",
            label: "Reminder",
          },
        ],
      },

      {
        name: "Templates",
        icon: <FiFileText />,
        navLinks: [
          {
            to: "/admin/dashboard/templates",
            label: "Templates",
          },
        ],
      },

      {
        name: "Website",
        icon: <FiGlobe />,

        navLinks: [
          {
            to: "/admin/dashboard/hero",
            label: "Hero Section",
          },

          {
            to: "/admin/dashboard/pricing",
            label: "Pricing Plans",
          },

          {
            to: "/admin/dashboard/faqs",
            label: "FAQs",
          },

          {
            to: "/admin/dashboard/contact-messages",
            label: "Contact Messages",
          },
        ],
      },

      {
        name: "Settings",
        icon: <FiSettings />,

        navLinks: [
          {
            to: "/admin/dashboard/settings",
            label: "General",
          },

          {
            to: "/admin/dashboard/security",
            label: "Security",

            icon: <FiShield />,
          },
        ],
      },
    ],
    [],
  );

  /* --------------------------------
      AUTO OPEN ACTIVE MENU
  -------------------------------- */

  useEffect(() => {
    const currentPath = location.pathname;

    const matched = sidebarItems.find((item) =>
      item.navLinks.some((link) => currentPath.startsWith(link.to)),
    );

    if (matched) {
      setActiveCategory(matched.name);
    }
  }, [location.pathname, sidebarItems]);

  /* --------------------------------
      DROPDOWN
  -------------------------------- */

  const toggleDropdown = (category) => {
    if (!extended) {
      setExtended(true);
      setActiveCategory(category);
      return;
    }

    setActiveCategory((prev) => (prev === category ? null : category));
  };

  /* --------------------------------
      COLLAPSE
  -------------------------------- */

  const handleSidebarToggle = () => {
    if (isMobile) {
      setSidebarOpen?.((prev) => !prev);
      return;
    }

    if (extended) {
      setActiveCategory(null);
    }

    setExtended((prev) => !prev);
  };

  const expanded = extended || activeCategory;

  return (
    <>
      {isMobile && (
        <button
          className="mobile-hamburger"
          onClick={() => setSidebarOpen?.(true)}
          type="button"
        >
          <FiMenu />
        </button>
      )}

      <div
        className={`sa-sidebar ${expanded ? "sidebar-expanded" : "sidebar-collapsed"} ${isOpen ? "is-open" : ""}`}
      >
        {/* HEADER */}

        <div className="sa-sidebar__brand">
          <Link
            to="/admin/dashboard"
            className="
            sidebar-logo-wrapper
          "
          >
            {expanded ? (
              <img
                src={munc_logo}
                alt="logo"
                className="
                sidebar-logo
              "
              />
            ) : (
              <img
                src={munc_logo}
                alt="logo"
                className="
                sidebar-mini-logo
              "
              />
            )}
          </Link>

          <div
            className="
            sidebar-toggle
          "
            onClick={handleSidebarToggle}
          >
            <FiMenu />
          </div>
        </div>

        {/* NAV */}
        <div className="sa-sidebar__section-label">Navigation</div>

        <div
          className="
          sidebar-scroll-container
        "
        >
          {/* <div
            className="
            sidebar-nav-panel
          "
          > */}
          <nav className="sa-sidebar__nav">
            {sidebarItems.map(({ icon, name, navLinks }) => {
              const hasDropdown = navLinks.length > 1;

              return hasDropdown ? (
                <div
                  key={name}
                  className="
                    sa-sidebar__subnav-wrapper
                  "
                >
                  <div
                    onClick={() => toggleDropdown(name)}
                    className="
                      sa-sidebar__link
                    "
                  >
                    <div className="sidebar-icon">{icon}</div>

                    {expanded && <span className="sidebar-text">{name}</span>}

                    {expanded && (
                      <FiChevronRight
                        className={`
                          sa-sidebar__chevron
                          ${activeCategory === name ? "arrow-open" : ""}
                        `}
                      />
                    )}
                  </div>

                  <div
                    className={`
                      sa-sidebar__subnav
                      ${activeCategory === name ? "dropdown-open" : ""}
                    `}
                  >
                    {navLinks.map((link) => (
                      <NavLink
                        key={link.to}
                        to={link.to}
                        onClick={() => setSidebarOpen?.(false)}
                        className={({ isActive }) =>
                          `sa-sidebar__sublink ${isActive ? "is-active" : ""}`
                        }
                      >
                        {link.icon}

                        <span>{link.label}</span>
                      </NavLink>
                    ))}
                  </div>
                </div>
              ) : (
                <NavLink
                  key={name}
                  to={navLinks[0].to}
                  onClick={() => setSidebarOpen?.(false)}
                  className={({ isActive }) =>
                    `sa-sidebar__link ${isActive ? "is-active" : ""}`
                  }
                >
                  <div className="sidebar-icon">{icon}</div>

                  {expanded && <span className="sidebar-text">{name}</span>}
                </NavLink>
              );
            })}
          </nav>
          {/* </div> */}
        </div>

        {/* FOOTER */}

       <div className="sa-sidebar__logout">
  <button
    type="button"
    // className="sa-sidebar__logout-btn"
    onClick={onLogout}
  >
    <div className="sidebar-icon">
      <FiLogOut />
    </div>

    {expanded && (
      <span className="sa-sidebar__logout-text">
        Logout
      </span>
    )}
  </button>
</div>
      </div>

      {sidebarOpen && (
        <div
          className="sidebar-backdrop is-visible"
          onClick={() => setSidebarOpen?.(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
