import axios from "axios";
import { toast } from "react-toastify";
import BASE_URL from "./config";

const api = axios.create({
  baseURL: BASE_URL,
  withCredentials: true,
});

api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("token") || localStorage.getItem("adminToken");
    if (token) {
      config.headers = config.headers || {};
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => Promise.reject(error),
);

api.interceptors.response.use(
  (response) => response,
  (error) => {
     if (error.config?.skipAuthInterceptor) {
      return Promise.reject(error);
    }
    try {
      const grace = window.__authGraceUntil || 0;
      if (Date.now() < grace) {
        return Promise.reject(error);
      }
    } catch (e) { void e; }
    if (error.response?.status === 401) {
      const data = error.response.data;
      const message = data?.message?.toLowerCase() || "";

      const isInactive =
        message.includes("inactive") ||
        message.includes("deactivated") ||
        data?.logout === true;
      // Respect grace window even for forced logout flags
      try {
        const grace = window.__authGraceUntil || 0;
        if (Date.now() < grace) {
          return Promise.reject(error);
        }
      } catch (e) { void e; }

      const pathname = window.location.pathname || "";
      const isAuthPage =
        pathname === "/login" ||
        pathname === "/" ||
        pathname === "/otp" ||
        pathname === "/forgot-password" ||
        pathname.startsWith("/reset-password");

      // Only hard-redirect when backend explicitly requests logout and not on auth pages
      if (data?.logout === true && !isAuthPage) {
        window.location.href = "/login";
        return Promise.reject(error);
      }

      // Otherwise, show appropriate message (avoid spam on auth pages)
      if (isInactive) {
        toast.error("You are currently set Inactive by admin. Please contact admin.");
      } else if (!isAuthPage) {
        // toast.error("Your session has expired. Please login again.");
      }
    }

    return Promise.reject(error);
  }
);

export default api;
