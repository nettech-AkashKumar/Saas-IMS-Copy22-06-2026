import { Routes, Route, Navigate } from "react-router-dom";
import AdminLogin from "../pages/superadmin/Login";
import AdminDashboard from "../pages/superadmin/Dashboard";
import PrivateRoute from "./PrivateRoute";

export default function SuperAdminApp() {
  return (
    <Routes>
      <Route path="/admin/login" element={<AdminLogin />} />

      <Route
        path="/admin/dashboard/*"
        element={
          <PrivateRoute>
            <AdminDashboard />
          </PrivateRoute>
        }
      />

      <Route path="*" element={<Navigate to="/admin/login" replace />} />
    </Routes>
  );
}
