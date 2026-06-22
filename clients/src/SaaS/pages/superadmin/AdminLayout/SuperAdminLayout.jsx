import React, { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./AdminSider/Sidebar";
import "./SuperAdminLayout.css";
import AdminNavbar from "./AdminNavbar/AdminNavbar";

const SuperAdminLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  const logout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/admin/login";
  };

  return (
    <div className="sa-dashboard-shell">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        onLogout={logout}
      />

      <AdminNavbar setSidebarOpen={setSidebarOpen} />

      <div className="mainbar-grid">
        <main className="sa-main">
          <Outlet context={{ sidebarOpen, setSidebarOpen }} />
        </main>
      </div>
    </div>
  );
};

export default SuperAdminLayout;
// import React, { useState } from "react";
// import { Outlet } from "react-router-dom";
// import Sidebar from "./AdminSider/Sidebar";
// import "./SuperAdminLayout.css";

// const SuperAdminLayout = () => {
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   const logout = () => {
//     localStorage.removeItem("adminToken");
//     window.location.href = "/admin/login";
//   };

//   return (
//     <div className="sa-dashboard-shell">
//       <div className="sidebar-grid">
//         <Sidebar
//           sidebarOpen={sidebarOpen}
//           setSidebarOpen={setSidebarOpen}
//           onLogout={logout}
//         />
//       </div>

//       {/*  */}
//       <div className="mainbar-grid ">
//         <Outlet context={{ sidebarOpen, setSidebarOpen }} />
//       </div>
//     </div>
//   );
// };

// export default SuperAdminLayout;

// import React, { useState } from "react";
// import { Outlet } from "react-router-dom";

// import Sidebar from "./Sidebar";

// const SuperAdminLayout = () => {
//   const [sidebarOpen, setSidebarOpen] = useState(false);

//   const logout = () => {
//     localStorage.removeItem("adminToken");
//     window.location.href = "/admin/login";
//   };

//   return (
//     <div className="sa-dashboard-shell">
//       <Sidebar
//         sidebarOpen={sidebarOpen}
//         setSidebarOpen={setSidebarOpen}
//         onLogout={logout}
//       />

//       <Outlet
//         context={{
//           sidebarOpen,
//           setSidebarOpen,
//         }}
//       />
//     </div>
//   );
// };

// export default SuperAdminLayout;
