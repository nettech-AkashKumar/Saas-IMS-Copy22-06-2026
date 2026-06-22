import { Navigate, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";

export default function PrivateRoute({ children }) {
  const location = useLocation();
  const path = location.pathname;
  const isAdminRoute = path.startsWith("/admin");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Absorb token passed via URL query param from cross-subdomain redirect
    const params = new URLSearchParams(window.location.search);
    const adminTokenParam = params.get("adminToken");
    const tokenParam = params.get("token");
    const subdomainParam = params.get("subdomain");
    const dbNameParam = params.get("dbName");

    if (adminTokenParam) {
      localStorage.setItem("adminToken", adminTokenParam);
    } else if (tokenParam) {
      localStorage.setItem("token", tokenParam);
      if (subdomainParam) localStorage.setItem("subdomain", subdomainParam);
      if (dbNameParam) localStorage.setItem("dbName", dbNameParam);
    }

    if (adminTokenParam || tokenParam || subdomainParam || dbNameParam) {
      window.history.replaceState(
        {},
        "",
        `${window.location.pathname}${window.location.hash || ""}`,
      );
    }
    setReady(true);
  }, []);

  if (!ready) return null;

  const token = isAdminRoute
    ? localStorage.getItem("adminToken")
    : localStorage.getItem("token");

  if (!token) {
    return <Navigate to={isAdminRoute ? "/admin/login" : "/login"} replace />;
  }

  return children;
}
