import { Routes, Route, Navigate } from "react-router-dom";
import { useMemo } from "react";
// import Dashboard from "../pages/tenant/Dashboard";
import AllLogin from "../component/LoginPage/AllLogin";

/* ================= PRIVATE ROUTE ================= */
// Delegated to apps/PrivateRoute.jsx which handles cross-subdomain token from URL
import PrivateRouteGlobal from "./PrivateRoute";
import Navbar from "../component/website/component/Navbar";
import Sidebar from "../pages/superadmin/Sidebar";
import MainLayouts from "../../components/LayoutsCopy/MainLayouts";
import Dashboard from "../../components/Dashboard/Admin/AdminDashboard";

/* ================= PUBLIC ROUTE (LOGIN ONLY) ================= */
function PublicRoute({ children }) {
  const hasTokenInQuery = useMemo(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get("token");
    const subdomain = params.get("subdomain");
    const dbName = params.get("dbName");

    if (token) {
      localStorage.setItem("token", token);
      if (subdomain) localStorage.setItem("subdomain", subdomain);
      if (dbName) localStorage.setItem("dbName", dbName);
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${window.location.hash || ""}`,
      );
      return true;
    }

    return false;
  }, []);

  const token = localStorage.getItem("token");
  return token || hasTokenInQuery ? (
    <Navigate to="/dashboard" replace />
  ) : (
    children
  );
}

/* ================= TENANT APP ================= */
export default function TenantApp() {
  return (
    <Routes>
      {/* Login */}
      <Route
        path="/login"
        element={
          <PublicRoute>
            <AllLogin />
          </PublicRoute>
        }
      />

      <Route
        path="/all-login"
        element={
          <PublicRoute>
            <AllLogin />
          </PublicRoute>
        }
      />
      <Route
        element={
          <PrivateRouteGlobal>
            <MainLayouts />
          </PrivateRouteGlobal>
        }
      >
        {/* Dashboard - rendered inside MainLayouts via Outlet */}
        <Route path="/dashboard" element={<Dashboard />} />
      </Route>
      {/* Default: no token → login, token → dashboard (PrivateRoute handles) */}
      <Route path="*" element={<Navigate to="/login" replace />} />
    </Routes>
  );
}
