import { useState } from "react";
import { useNavigate } from "react-router-dom";
import "./TenantLogin.css";

export default function TenantLogin() {
  const [form, setForm] = useState({ email: "", password: "" });
  const navigate = useNavigate();

  const subdomain = window.location.hostname.split(".")[0];

  const submit = async (e) => {
    e.preventDefault();
    if (!form.email || !form.password) return alert("All fields required");

    try {
      const apiUrl = import.meta.env.VITE_APP_API_BASE_URL || "/api";
      const res = await fetch(`${apiUrl}/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, subdomain }),
      });

      const data = await res.json();

      if (res.ok) {
        localStorage.setItem("token", data.token);
        navigate("/dashboard");
      } else {
        alert(data.message);
      }
    } catch (error) {
      console.error("Login request failed", error);
      alert("Login failed");
    }
  };

  return (
    <div className="login-page">
      <form className="login-card" onSubmit={submit}>
        <h2>Welcome Back 👋</h2>
        <p className="workspace">
          Workspace: <b>{subdomain}</b>
        </p>

        <div className="input-group">
          <input
            type="email"
            placeholder="Email address"
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />
        </div>

        <div className="input-group">
          <input
            type="password"
            placeholder="Password"
            value={form.password}
            onChange={(e) => setForm({ ...form, password: e.target.value })}
          />
        </div>

        <button type="submit">Login</button>

        <p className="footer-text">
          Secure tenant login 🔐
        </p>
      </form>
    </div>
  );
}
