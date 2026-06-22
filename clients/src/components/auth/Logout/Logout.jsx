// // src/pages/auth/Logout.jsx
// import { useEffect, useRef } from "react";
// import { useNavigate } from "react-router-dom";
// import { toast } from "react-toastify";

// const Logout = () => {
//   const navigate = useNavigate();
//   const hasLoggedOut = useRef(false); // ✅ Prevent multiple triggers

//   useEffect(() => {
//     if (hasLoggedOut.current) return;
//     hasLoggedOut.current = true;

//     // ✅ Clear stored login data
//     localStorage.removeItem("user");
//     localStorage.removeItem("token");

//     // ✅ Show toast only once
//     toast.success("Logout successful!");

//     // ✅ Redirect to login page
//     navigate("/login", { replace: true });
//   }, [navigate]);

//   return null; // No UI needed
// };

// export default Logout;





import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { toast } from "react-toastify";
import api from "../../../pages/config/axiosInstance"
import { useAuth } from "../AuthContext";

const Logout = () => {
  const navigate = useNavigate();
  const {logout} = useAuth();

  useEffect(() => {
    const logoutt = async () => {
      try {
        await api.post(
          "/api/auth/logout",
          { withCredentials: true }
        );

        toast.success("Logout successful!");
        logout();
        navigate("/login", { replace: true });
      } catch (error) {
        console.error("Logout failed:", error);
      }
    };

    logoutt();
  }, []);

  return null;
};

export default Logout;