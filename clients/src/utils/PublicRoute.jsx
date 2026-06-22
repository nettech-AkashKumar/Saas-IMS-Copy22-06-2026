import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../components/auth/AuthContext";

const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) return null;

  // Allow OTP page even if user exists
  if (user && location.pathname !== "/otp") {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
};

export default PublicRoute;
