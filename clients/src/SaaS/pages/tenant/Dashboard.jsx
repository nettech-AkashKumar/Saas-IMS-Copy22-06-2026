import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./Dashboard.css";

export default function Dashboard() {
  const navigate = useNavigate();
  const subdomain = window.location.hostname.split(".")[0];

  // 🔐 Protect dashboard
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) {
      navigate("/login", { replace: true });
    }
  }, [navigate]);

  // 🚪 Logout handler
  const logout = () => {
    localStorage.removeItem("token");
    navigate("/login", { replace: true });
  };

  return (
    <div className="dashboard">
      {/* ===== Sidebar ===== */}
      <aside className="sidebar">
        <h2 className="workspace">{subdomain.toUpperCase()}</h2>

        <ul className="menu">
          <li>📊 Dashboard</li>
          <li>👥 Employees</li>
          <li>🕒 Attendance</li>
          <li>⚙ Settings</li>
        </ul>

        <button className="logout" onClick={logout}>
          🚪 Logout
        </button>
      </aside>

      {/* ===== Main Content ===== */}
      <main className="main">
        <h1>Welcome to {subdomain} Dashboard 👋</h1>
        <p className="subtitle">Your tenant workspace is active</p>

        <div className="cards">
          <div className="card">
            <h3>Total Employees</h3>
            <p>24</p>
          </div>

          <div className="card">
            <h3>Present Today</h3>
            <p>180</p>
          </div>

          <div className="card">
            <h3>Plan</h3>
            <p>PRO</p>
          </div>
        </div>
      </main>
    </div>
  );
}
