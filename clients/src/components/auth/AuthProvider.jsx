import React, { useState, useEffect } from "react";
import api from "../../pages/config/axiosInstance";
import { AuthContext } from "./AuthContext";

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    try {
      const cached = localStorage.getItem("user");
      if (cached && !user) {
        const parsed = JSON.parse(cached);
        if (parsed && parsed._id) {
          setUser(parsed);
          try {
            window.__authGraceUntil = Date.now() + 3000;
          } catch (e) {
            void e;
          }
        }
      }
    } catch (e) {
      void e;
    }
  }, []);

  const logout = async () => {
    setUser(null);
    try {
      await api.post("/api/auth/logout");
    } catch (e) {
      void e;
    }
  };

  const fetchUser = async () => {
    try {
      const res = await api.get("/api/auth/me");
      setUser(res.data.user);
    } catch (e) {
      void e;
    } finally {
      setLoading(false);
    }
  };

  const refreshUser = async () => {
    try {
      const res = await api.get("/api/auth/me", { withCredentials: true });
      setUser(res.data.user);
    } catch (e) {
      console.error("Failed to refresh user");
    }
  };

  useEffect(() => {
    const path = window.location.pathname;
    const host = window.location.hostname;

    // Check if we're on public app (company registration/landing pages)
    const isPublicApp = host === "localhost" || host === "imsmymunc.com";

    // 🚫 Skip auth check for public app (localhost/imsmymunc.com)
    if (isPublicApp) {
      setLoading(false);
      setAuthReady(true);
      return;
    }

    // 🚫 Skip auth check for registration pages (/register/*)
    if (path.startsWith("/register")) {
      setLoading(false);
      setAuthReady(true);
      return;
    }

    // 🚫 Skip auth check for public pages
    const skipPaths = [
      "/",
      "/otp",
      "/forgot-password",
      "/reset-password",
      "/all-login",
      "/login",
      "/admin/login",
    ];
    if (skipPaths.includes(path)) {
      setLoading(false);
      setAuthReady(true);
      return;
    }

    // ✅ If user already exists (from cache or previous auth), skip /me
    if (user) {
      setLoading(false);
      setAuthReady(true);
      return;
    }

    // ✅ Only fetch user for tenant subdomains (amar.localhost, abc.imsmymunc.com, etc.)
    const isTenantSubdomain = !(
      host === "localhost" ||
      host === "imsmymunc.com" ||
      host.startsWith("admin.")
    );

    if (isTenantSubdomain) {
      const params = new URLSearchParams(window.location.search);
      const tokenParam = params.get("token");
      const adminTokenParam = params.get("adminToken");
      const subdomainParam = params.get("subdomain");
      const dbNameParam = params.get("dbName");

      if (tokenParam) {
        localStorage.setItem("token", tokenParam);
      }
      if (adminTokenParam) {
        localStorage.setItem("adminToken", adminTokenParam);
      }
      if (subdomainParam) {
        localStorage.setItem("subdomain", subdomainParam);
      }
      if (dbNameParam) {
        localStorage.setItem("dbName", dbNameParam);
      }

      if (tokenParam || adminTokenParam || subdomainParam || dbNameParam) {
        window.history.replaceState(
          {},
          "",
          `${window.location.pathname}${window.location.hash || ""}`,
        );
      }

      fetchUser().finally(() => {
        setAuthReady(true);
      });
    } else {
      setLoading(false);
      setAuthReady(true);
    }
  }, [user]);

  useEffect(() => {
    if (user) {
      try {
        window.__authGraceUntil = Date.now() + 3000;
      } catch (e) {
        void e;
      }
    }
  }, [user]);

  return (
    <AuthContext.Provider
      value={{ user, setUser, loading, authReady, logout, refreshUser }}
    >
      {!loading && children}
    </AuthContext.Provider>
  );
};
