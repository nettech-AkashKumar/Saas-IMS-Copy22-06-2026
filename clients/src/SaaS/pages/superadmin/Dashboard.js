import { useEffect, useState, useCallback } from "react";
import {
  getDashboardStats,
  getTenants,
  updateStatus,
  updatePlan,
  deleteTenant,
  approveCompany,
} from "../../services/adminApi";
import "./admin.css";

export default function AdminDashboard() {
  const [stats, setStats] = useState({});
  const [tenants, setTenants] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [rowLoading, setRowLoading] = useState({}); // Track loading per row

  // filters
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  /* ================= LOAD DATA ================= */
  const load = useCallback(async () => {
    try {
      setLoading(true);
      const [statsRes, tenantsRes] = await Promise.all([
        getDashboardStats(),
        getTenants({ search, status, page, limit: 8 }),
      ]);

      setStats(statsRes);

      if (Array.isArray(tenantsRes)) {
        setTenants(tenantsRes);
        setPagination({});
      } else {
        setTenants(tenantsRes.data || []);
        setPagination(tenantsRes.pagination || {});
      }
    } catch (err) {
      console.error(err);
      alert(err.message || "Failed to load dashboard");
    } finally {
      setLoading(false);
    }
  }, [search, status, page]);

  useEffect(() => {
    load();
  }, [load]);

  /* ================= LOGOUT ================= */
  const logout = () => {
    localStorage.removeItem("adminToken");
    window.location.href = "/admin/login";
  };

  /* ================= HANDLE APPROVE ================= */
  const handleApprove = async (companyId) => {
    if (!window.confirm("Approve this company?")) return;

    try {
      setRowLoading((prev) => ({ ...prev, [companyId]: true }));
      await approveCompany(companyId);
      alert("Company approved successfully!");
      load();
    } catch (err) {
      console.error(err);
      alert(err.message || "Approval failed");
    } finally {
      setRowLoading((prev) => ({ ...prev, [companyId]: false }));
    }
  };

  /* ================= HANDLE DEACTIVATE ================= */
  const handleDeactivate = async (companyId) => {
    if (!window.confirm("Deactivate this company?")) return;

    try {
      setRowLoading((prev) => ({ ...prev, [companyId]: true }));
      await updateStatus(companyId, false);
      alert("Company deactivated!");
      load();
    } catch (err) {
      console.error(err);
      alert(err.message || "Deactivation failed");
    } finally {
      setRowLoading((prev) => ({ ...prev, [companyId]: false }));
    }
  };

  /* ================= HANDLE DELETE ================= */
  const handleDelete = async (companyId) => {
    if (!window.confirm("Delete this company permanently?")) return;

    try {
      setRowLoading((prev) => ({ ...prev, [companyId]: true }));
      await deleteTenant(companyId);
      alert("Company deleted!");
      load();
    } catch (err) {
      console.error(err);
      alert(err.message || "Delete failed");
    } finally {
      setRowLoading((prev) => ({ ...prev, [companyId]: false }));
    }
  };

  /* ================= UI ================= */
  return (
    <div className="admin-dashboard">
      {/* HEADER */}
      <header className="admin-header">
        <h2>Super Admin Dashboard</h2>
        <button className="logout-btn" onClick={logout}>
          Logout
        </button>
      </header>

      {/* STATS */}
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Total Companies</h4>
          <p>{stats.totalCompanies ?? 0}</p>
        </div>
        <div className="stat-card green">
          <h4>Active</h4>
          <p>{stats.activeCompanies ?? 0}</p>
        </div>
        <div className="stat-card purple">
          <h4>PRO Plans</h4>
          <p>{stats.proCompanies ?? 0}</p>
        </div>
      </div>

      {/* FILTERS */}
      <div className="filter-bar">
        <input
          placeholder="Search company..."
          value={search}
          onChange={(e) => {
            setPage(1);
            setSearch(e.target.value);
          }}
        />

        <select
          value={status}
          onChange={(e) => {
            setPage(1);
            setStatus(e.target.value);
          }}
        >
          <option value="">All Status</option>
          <option value="active">Active</option>
          <option value="inactive">Pending</option>
        </select>
      </div>

      {/* TABLE */}
      {loading ? (
        <p className="loading">Loading companies...</p>
      ) : tenants.length === 0 ? (
        <p className="loading">No companies found</p>
      ) : (
        <div className="table-wrapper">
          <table>
            <thead>
              <tr>
                <th>Company</th>
                <th>Subdomain</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {tenants.map((t) => (
                <tr key={t._id}>
                  <td>
                    <strong>{t.companyName}</strong>
                  </td>

                  <td>{t.subdomain}</td>

                  <td>
                    <select
                      value={t.plan}
                      disabled={rowLoading[t._id]}
                      onChange={(e) =>
                        updatePlan(t._id, e.target.value).then(load)
                      }
                    >
                      <option value="FREE">FREE</option>
                      <option value="PRO">PRO</option>
                    </select>
                  </td>

                  <td>
                    <span
                      className={`status-badge ${
                        t.isActive ? "active" : "inactive"
                      }`}
                    >
                      {t.isActive ? "Active" : "Pending Approval"}
                    </span>
                  </td>

                  <td className="actions">
                    {!t.isActive && (
                      <button
                        className="btn approve"
                        disabled={rowLoading[t._id]}
                        onClick={() => handleApprove(t._id)}
                      >
                        Approve
                      </button>
                    )}

                    {t.isActive && (
                      <button
                        className="btn deactivate"
                        disabled={rowLoading[t._id]}
                        onClick={() => handleDeactivate(t._id)}
                      >
                        Deactivate
                      </button>
                    )}

                    <button
                      className="btn danger"
                      disabled={rowLoading[t._id]}
                      onClick={() => handleDelete(t._id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* PAGINATION */}
      <div className="pagination">
        <button
          disabled={page === 1}
          onClick={() => setPage((p) => p - 1)}
        >
          ◀ Prev
        </button>

        <span>
          Page {page}
          {pagination.totalPages ? ` of ${pagination.totalPages}` : ""}
        </span>

        <button
          disabled={pagination.totalPages && page >= pagination.totalPages}
          onClick={() => setPage((p) => p + 1)}
        >
          Next ▶
        </button>
      </div>
    </div>
  );
}
