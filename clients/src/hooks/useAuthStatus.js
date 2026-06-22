

import { useEffect } from "react";
import axiosInstance from "../pages/config/axiosInstance";

const useAuthStatus = () => {
  useEffect(() => {
    const checkStatus = async () => {
      const path = window.location.pathname;

      // 🚫 DO NOT check auth during auth flows
      const skipPaths = [
        "/login",
        "/signin",
        "/otp",
        "/forgot-password",
        "/reset-password",
      ];

      if (skipPaths.includes(path)) return;

      try {
        const res = await axiosInstance.get("/api/auth/me");

        if (res.data.user.status !== "Active") {
          await axiosInstance.post("/api/auth/logout");
          window.location.replace("/signin");
        }
      } catch {
        // let interceptor handle it
      }
    };

    checkStatus();
    const interval = setInterval(checkStatus, 10_000);

    return () => clearInterval(interval);
  }, []);
};

export default useAuthStatus;
