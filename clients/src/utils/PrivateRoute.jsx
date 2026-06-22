import { Navigate } from "react-router-dom";
import { useAuth } from "../components/auth/AuthContext";

const PrivateRoute = ({ children }) => {
  const { user, loading } = useAuth();

  // ⛔ wait until auth check completes
  if (loading) return null; // or spinner

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return children;
};

export default PrivateRoute;
