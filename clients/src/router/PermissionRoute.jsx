import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../components/auth/AuthContext";

const PermissionRoute = ({ module, action = "read" }) => {
  const { user } = useAuth();

  // ❌ not logged in
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // ✅ Admin / Super Admin full access
  const roleName = user?.role?.roleName?.toLowerCase();
  if (roleName === "admin" || roleName === "super admin") {
    return <Outlet />;
  }

  const permissions = user?.role?.modulePermissions;

  // ❌ no permission object
  if (!permissions || !permissions[module]) {
    return <Navigate to="/access-denied" replace />;
  }

  const modulePerm = permissions[module];

  // ❌ action not allowed
  if (!(modulePerm.all === true || modulePerm[action] === true)) {
    return <Navigate to="/access-denied" replace />;
  }

  // ✅ allowed
  return <Outlet />;
};

export default PermissionRoute;
