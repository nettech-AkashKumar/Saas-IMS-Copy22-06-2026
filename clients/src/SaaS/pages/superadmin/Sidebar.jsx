import React, { useState, useEffect } from "react";
import {
  FiBarChart2,
  FiBell,
  FiChevronDown,
  FiChevronUp,
  FiGrid,
  FiLogOut,
  FiFileText,
  FiSettings,
  FiShield,
  FiUsers,
  FiGlobe,
  FiHelpCircle,
} from "react-icons/fi";

import { useNavigate, useLocation } from "react-router-dom";

import munc_logo from "../../assets/Image/munc-logo.png";

const Sidebar = ({ sidebarOpen, setSidebarOpen, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();

  const [websiteOpen, setWebsiteOpen] = useState(false);

  const currentPath = location.pathname;

  const sidebarItems = [
    {
      id: "overview",
      label: "Overview",
      icon: <FiGrid />,
      path: "/admin/dashboard",
    },
    {
      id: "companies",
      label: "Companies",
      icon: <FiUsers />,
      path: "/admin/dashboard/companies",
    },
    {
      id: "reminder",
      label: "Reminder",
      icon: <FiBell />,
      path: "/admin/dashboard/reminder",
    },
    {
      id: "templates",
      label: "Templates",
      icon: <FiFileText />,
      path: "/admin/dashboard/templates",
    },
    {
      id: "growth",
      label: "Growth",
      icon: <FiBarChart2 />,
      path: "/admin/dashboard/growth",
    },
    {
      id: "security",
      label: "Security",
      icon: <FiShield />,
      path: "/admin/dashboard/security",
    },
    {
      id: "website",
      label: "Website",
      icon: <FiGlobe />,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <FiSettings />,
      path: "/admin/dashboard/settings",
    },
  ];

  const handleNavClick = (item) => {
    if (item.id === "website") {
      setWebsiteOpen((prev) => !prev);
      return;
    }

    if (item.path) {
      navigate(item.path);
      setSidebarOpen(false);
    }
  };

  useEffect(() => {
    if (
      currentPath.includes("/hero") ||
      currentPath.includes("/pricing") ||
      currentPath.includes("/faqs")
    ) {
      setWebsiteOpen(true);
    }
  }, [currentPath]);

  return (
    <>
      <aside className={`sa-sidebar ${sidebarOpen ? "is-open" : ""}`}>
        <div className="sa-sidebar__brand">
          <img src={munc_logo} alt="MUNC" />

          <div>
            <strong>MUNC Admin</strong>
            <span>Control center</span>
          </div>
        </div>

        <div className="sa-sidebar__section-label">Navigation</div>

        <nav className="sa-sidebar__nav">
          {sidebarItems.map((item) => {
            const isActive =
              item.path &&
              (currentPath === item.path ||
                currentPath.startsWith(item.path + "/"));

            const isWebsiteActive =
              currentPath.includes("/hero") ||
              currentPath.includes("/pricing") ||
              currentPath.includes("/faqs");

            return (
              <React.Fragment key={item.id}>
                <button
                  type="button"
                  className={`sa-sidebar__link ${isActive ? "is-active" : ""} ${
                    isWebsiteActive && item.id === "website" ? "is-active" : ""
                  }`}
                  onClick={() => handleNavClick(item)}
                >
                  <span>{item.icon}</span>

                  {item.label}

                  {item.id === "website" && (
                    <span
                      className="sa-sidebar__chevron"
                      style={{ marginLeft: "auto" }}
                    >
                      {websiteOpen ? (
                        <FiChevronUp size={14} />
                      ) : (
                        <FiChevronDown size={14} />
                      )}
                    </span>
                  )}
                </button>

                {/* Website Dropdown */}
                {item.id === "website" && websiteOpen && (
                  <div className="sa-sidebar__subnav">
                    <button
                      type="button"
                      className={`sa-sidebar__sublink ${
                        currentPath.includes("/hero") ? "is-active" : ""
                      }`}
                      onClick={() => {
                        navigate("/admin/dashboard/hero");
                        setSidebarOpen(false);
                      }}
                    >
                      Hero Section
                    </button>

                    <button
                      type="button"
                      className={`sa-sidebar__sublink ${
                        currentPath.includes("/pricing") ? "is-active" : ""
                      }`}
                      onClick={() => {
                        navigate("/admin/dashboard/pricing");
                        setSidebarOpen(false);
                      }}
                    >
                      Pricing Plans
                    </button>

                    <button
                      type="button"
                      className={`sa-sidebar__sublink ${
                        currentPath.includes("/faqs") ? "is-active" : ""
                      }`}
                      onClick={() => {
                        navigate("/admin/dashboard/faqs");
                        setSidebarOpen(false);
                      }}
                    >
                      <FiHelpCircle size={14} style={{ marginRight: "8px" }} />
                      FAQs
                    </button>
                  </div>
                )}
              </React.Fragment>
            );
          })}
        </nav>

        <button type="button" className="sa-sidebar__logout" onClick={onLogout}>
          <FiLogOut /> Logout
        </button>
      </aside>

      <div
        className={`sa-sidebar-backdrop ${sidebarOpen ? "is-visible" : ""}`}
        onClick={() => setSidebarOpen(false)}
      />
    </>
  );
};

export default Sidebar;

// import React, { useState } from "react";
// import {
//   FiBarChart2,
//   FiBell,
//   FiChevronDown,
//   FiChevronUp,
//   FiGrid,
//   FiLogOut,
//   FiFileText,
//   FiSettings,
//   FiShield,
//   FiUsers,
//   FiGlobe,
//   FiHelpCircle,
// } from "react-icons/fi";
// import munc_logo from "../../assets/Image/munc-logo.png";

// const Sidebar = ({
//   sidebarOpen,
//   setSidebarOpen,
//   onLogout,
//   currentPage,
//   onNavigate,
// }) => {
//   const [settingsOpen, setSettingsOpen] = useState(false);
//   const [websiteOpen, setWebsiteOpen] = useState(false);

//   const sidebarItems = [
//     { id: "overview", label: "Overview", icon: <FiGrid /> },
//     { id: "companies", label: "Companies", icon: <FiUsers /> },
//     { id: "reminder", label: "Reminder", icon: <FiBell /> },
//     { id: "templates", label: "Templates", icon: <FiFileText /> },
//     { id: "growth", label: "Growth", icon: <FiBarChart2 /> },
//     { id: "security", label: "Security", icon: <FiShield /> },
//     { id: "website", label: "Website", icon: <FiGlobe /> },
//     { id: "settings", label: "Settings", icon: <FiSettings /> },
//   ];

//   const handleNavClick = (pageId) => {
//     if (pageId === "settings") {
//       setSettingsOpen((prev) => !prev);
//       return;
//     }
//     if (pageId === "website") {
//       setWebsiteOpen((prev) => !prev);
//       return;
//     }
//     onNavigate(pageId);
//     setSidebarOpen(false);
//   };

//   // Auto-expand Website dropdown when hero/pricing/faqs is active
//   React.useEffect(() => {
//     if (
//       currentPage === "hero" ||
//       currentPage === "pricing" ||
//       currentPage === "faqs"
//     ) {
//       setWebsiteOpen(true);
//     }
//   }, [currentPage]);

//   return (
//     <>
//       <aside className={`sa-sidebar ${sidebarOpen ? "is-open" : ""}`}>
//         <div className="sa-sidebar__brand">
//           <img src={munc_logo} alt="MUNC" />
//           <div>
//             <strong>MUNC Admin</strong>
//             <span>Control center</span>
//           </div>
//         </div>

//         <div className="sa-sidebar__section-label">Navigation</div>
//         <nav className="sa-sidebar__nav">
//           {sidebarItems.map((item) => {
//             const isSettingsActive =
//               currentPage === item.id || currentPage === "planSetting";
//             const isWebsiteActive =
//               currentPage === "hero" ||
//               currentPage === "pricing" ||
//               currentPage === "faqs";

//             return (
//               <React.Fragment key={item.id}>
//                 <button
//                   type="button"
//                   className={`sa-sidebar__link ${isSettingsActive ? "is-active" : ""} ${
//                     isWebsiteActive && item.id === "website" ? "is-active" : ""
//                   }`}
//                   onClick={() => handleNavClick(item.id)}
//                 >
//                   <span>{item.icon}</span>
//                   {item.label}
//                   {(item.id === "website" || item.id === "settings") && (
//                     <span
//                       className="sa-sidebar__chevron"
//                       style={{ marginLeft: "auto" }}
//                     >
//                       {(item.id === "website" ? websiteOpen : settingsOpen) ? (
//                         <FiChevronUp size={14} />
//                       ) : (
//                         <FiChevronDown size={14} />
//                       )}
//                     </span>
//                   )}
//                 </button>

//                 {item.id === "website" && websiteOpen && (
//                   <div className="sa-sidebar__subnav">
//                     <button
//                       type="button"
//                       className={`sa-sidebar__sublink ${
//                         currentPage === "hero" ? "is-active" : ""
//                       }`}
//                       onClick={() => {
//                         onNavigate("hero");
//                         setSidebarOpen(false);
//                       }}
//                     >
//                       Hero Section
//                     </button>
//                     <button
//                       type="button"
//                       className={`sa-sidebar__sublink ${
//                         currentPage === "pricing" ? "is-active" : ""
//                       }`}
//                       onClick={() => {
//                         onNavigate("pricing");
//                         setSidebarOpen(false);
//                       }}
//                     >
//                       Pricing Plans
//                     </button>
//                     <button
//                       type="button"
//                       className={`sa-sidebar__sublink ${
//                         currentPage === "faqs" ? "is-active" : ""
//                       }`}
//                       onClick={() => {
//                         onNavigate("faqs");
//                         setSidebarOpen(false);
//                       }}
//                     >
//                       <FiHelpCircle size={14} style={{ marginRight: "8px" }} />
//                       FAQs
//                     </button>
//                     {/* <button
//                       type="button"
//                       className={`sa-sidebar__sublink ${
//                         currentPage === "faqs" ? "is-active" : ""
//                       }`}
//                       onClick={() => {
//                         onNavigate("faqs");
//                         setSidebarOpen(false);
//                       }}
//                     >
//                       <FiHelpCircle size={14} style={{ marginRight: "8px" }} />
//                       FAQs
//                     </button> */}
//                   </div>
//                 )}

//                 {/* {item.id === "settings" && settingsOpen && (
//                   <div className="sa-sidebar__subnav">
//                     <button
//                       type="button"
//                       className={`sa-sidebar__sublink ${currentPage === "planSetting" ? "is-active" : ""}`}
//                       onClick={() => {
//                         onNavigate("planSetting");
//                         setSidebarOpen(false);
//                       }}
//                     >
//                       Plan Setting
//                     </button>
//                   </div>
//                 )} */}
//               </React.Fragment>
//             );
//           })}
//         </nav>

//         {/* <div className="sa-sidebar__spotlight">
//           <div className="sa-sidebar__section-label">Premium Control</div>
//           <h4>Run a sharper SaaS operation</h4>
//           <p>
//             Track growth, approvals, and company health from one curated
//             workspace.
//           </p>
//           <button type="button" className="sa-sidebar__cta">
//             <FiCommand /> Broadcast update
//           </button>
//         </div> */}

//         <button type="button" className="sa-sidebar__logout" onClick={onLogout}>
//           <FiLogOut /> Logout
//         </button>
//       </aside>

//       <div
//         className={`sa-sidebar-backdrop ${sidebarOpen ? "is-visible" : ""}`}
//         onClick={() => setSidebarOpen(false)}
//       />
//     </>
//   );
// };

// export default Sidebar;
