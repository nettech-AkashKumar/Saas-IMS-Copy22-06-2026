// src/pages/superadmin/AdminLogin.js
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { loginAdmin } from "../../services/adminApi";
import "../../pages/superadmin/admin.css";

export default function AdminLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return alert("All fields required");

    try {
      setLoading(true);
      await loginAdmin(form.email, form.password);
      navigate("/admin/dashboard");
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-login-page">
      <form onSubmit={submit} className="login-card">
        <h2>🔐 SuperAdmin Login</h2>
        <input
          type="email"
          placeholder="Email"
          value={form.email}
          onChange={(e) => setForm({ ...form, email: e.target.value })}
        />
        <input
          type="password"
          placeholder="Password"
          value={form.password}
          onChange={(e) => setForm({ ...form, password: e.target.value })}
        />
        <button type="submit" disabled={loading}>
          {loading ? "Logging in..." : "Login"}
        </button>
      </form>
    </div>
  );
}
