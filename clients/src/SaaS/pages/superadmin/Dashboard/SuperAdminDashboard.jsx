import React, { useCallback, useEffect, useMemo, useState } from "react";
import { useOutletContext, useNavigate } from "react-router-dom";

import {
  FiActivity,
  FiBell,
  FiChevronLeft,
  FiChevronRight,
  FiMenu,
  FiMoreVertical,
  FiSearch,
  FiUserPlus,
} from "react-icons/fi";

import "./SuperAdminDashboard.css";

import Revenue from "./revenue/Revenue";

import {
  approveCompany,
  deleteTenant,
  getDashboardStats,
  getTotalCard,
  getTenants,
  updateStatus,
} from "../../../services/adminApi";

const compactNumber = (value) =>
  new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "-";

const formatPlan = (plan) => {
  if (!plan) return "Free";
  return String(plan).charAt(0).toUpperCase() + String(plan).slice(1);
};

const formatCurrency = (value) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(Number(value || 0));

const SuperAdminDashboard = () => {
  const { setSidebarOpen } = useOutletContext();
  const navigate = useNavigate();

  const [openMenuIdx, setOpenMenuIdx] = useState(null);

  const [stats, setStats] = useState({});

  const [totalCard, setTotalCard] = useState({});

  const [tenants, setTenants] = useState([]);

  const [pagination, setPagination] = useState({});

  const [loading, setLoading] = useState(true);

  const [rowLoading, setRowLoading] = useState({});

  const [search, setSearch] = useState("");

  const [status, setStatus] = useState("");

  const [page, setPage] = useState(1);

  const load = useCallback(async () => {
    try {
      setLoading(true);

      const [statsRes, totalCardRes, tenantsRes] = await Promise.all([
        getDashboardStats(),
        getTotalCard(),
        getTenants({
          search,
          status,
          page,
          limit: 8,
        }),
      ]);

      setStats(statsRes || {});
      setTotalCard(totalCardRes || {});

      if (Array.isArray(tenantsRes)) {
        setTenants(tenantsRes);

        setPagination({
          totalPages: 1,
          currentPage: 1,
          total: tenantsRes.length,
        });
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
  }, [page, search, status]);

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (companyId) => {
    if (!window.confirm("Approve this company?")) return;

    try {
      setRowLoading((prev) => ({
        ...prev,
        [companyId]: true,
      }));

      await approveCompany(companyId);

      alert("Company approved successfully!");

      load();
    } catch (err) {
      console.error(err);

      alert(err.message || "Approval failed");
    } finally {
      setRowLoading((prev) => ({
        ...prev,
        [companyId]: false,
      }));
    }
  };

  const handleDeactivate = async (companyId) => {
    if (!window.confirm("Deactivate this company?")) return;

    try {
      setRowLoading((prev) => ({
        ...prev,
        [companyId]: true,
      }));

      await updateStatus(companyId, false);

      alert("Company deactivated!");

      load();
    } catch (err) {
      console.error(err);

      alert(err.message || "Deactivation failed");
    } finally {
      setRowLoading((prev) => ({
        ...prev,
        [companyId]: false,
      }));
    }
  };

  const handleDelete = async (companyId) => {
    if (!window.confirm("Delete this company permanently?")) return;

    try {
      setRowLoading((prev) => ({
        ...prev,
        [companyId]: true,
      }));

      await deleteTenant(companyId);

      alert("Company deleted!");

      load();
    } catch (err) {
      console.error(err);

      alert(err.message || "Delete failed");
    } finally {
      setRowLoading((prev) => ({
        ...prev,
        [companyId]: false,
      }));
    }
  };

  const statsCards = useMemo(
    () => [
      {
        label: "Total Companies",
        value: totalCard.totalCompanies ?? stats.totalCompanies ?? 0,
        meta: `${stats.newSignupsToday ?? 0} new today`,
        tone: "blue",
      },
      {
        label: "Total Earnings",
        value: totalCard.totalEarnings ?? 0,
        meta: "From all company plans",
        tone: "green",
        isCurrency: true,
      },
      {
        label: "Free Plan Base",
        value: totalCard.freePlanCount ?? stats.freeUsers ?? 0,
        meta: "Upsell opportunity",
        tone: "violet",
      },
      {
        label: "Standard Plan Base",
        value: totalCard.standardPlanCount ?? 0,
        meta: "Growth-ready companies",
        tone: "amber",
      },
      {
        label: "Pro Plan Base",
        value: totalCard.proPlanCount ?? 0,
        meta: "Premium subscribers",
        tone: "blue",
      },
      {
        label: "Active Companies",
        value: stats.activeCompanies ?? 0,
        meta: `${Math.max(
          (stats.totalCompanies ?? 0) - (stats.activeCompanies ?? 0),
          0,
        )} pending`,
        tone: "green",
      },
      {
        label: "Employees Managed",
        value: stats.totalEmployees ?? 0,
        meta: `${stats.monthlyActiveUsers ?? 0} monthly active`,
        tone: "amber",
      },
    ],
    [stats, totalCard],
  );

  const overviewMetrics = useMemo(
    () => [
      {
        label: "Activation Rate",
        value:
          stats.totalCompanies > 0
            ? `${Math.round(
                ((stats.activeCompanies ?? 0) / stats.totalCompanies) * 100,
              )}%`
            : "0%",
      },
      {
        label: "New Signups",
        value: compactNumber(stats.newSignupsToday ?? 0),
      },
      {
        label: "Monthly Active",
        value: compactNumber(stats.monthlyActiveUsers ?? 0),
      },
    ],
    [stats],
  );

  const revenueBars = useMemo(() => {
    const values = [
      stats.totalCompanies ?? 0,
      stats.activeCompanies ?? 0,
      stats.totalEmployees ?? 0,
      stats.monthlyActiveUsers ?? 0,
      stats.freeUsers ?? 0,
      stats.newSignupsToday ?? 0,
    ];

    const labels = ["Companies", "Active", "Employees", "MAU", "Free", "Today"];

    const maxValue = Math.max(...values, 1);

    return values.map((value, index) => ({
      label: labels[index],
      value,
      height: `${Math.max((value / maxValue) * 100, value > 0 ? 18 : 6)}%`,
    }));
  }, [stats]);

  const activityFeed = useMemo(
    () =>
      tenants.slice(0, 4).map((tenant) => ({
        id: tenant._id,
        title: tenant.companyName,
        subtitle: tenant.adminEmail,
        status: tenant.isActive ? "Active" : "Pending",
        time: formatDate(tenant.createdAt),
      })),
    [tenants],
  );

  const totalPages = pagination.totalPages || 1;

  const paginationPage = pagination.currentPage || page;

  const totalItems = pagination.total || tenants.length;

  return (
    <div className="sa-mainss">
      {/* <header className="sa-topbar">
        <div className="sa-topbar__left">
          <button
            type="button"
            className="sa-menu-toggle"
            onClick={() => setSidebarOpen((prev) => !prev)}
          >
            <FiMenu />
          </button>

          <div>
            <p className="sa-eyebrow">Super Admin Dashboard</p>

            <h1>Premium SaaS command center</h1>
          </div>
        </div>

        <div className="sa-topbar__right">
          <label className="sa-search-box">
            <FiSearch />

            <input
              type="text"
              placeholder="Search companies, email, subdomain"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
            />
          </label>

          <select
            className="sa-filter-select"
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
          >
            <option value="">All status</option>

            <option value="active">Active</option>

            <option value="inactive">Inactive</option>
          </select>

          <button type="button" className="sa-icon-button">
            <FiBell />
          </button>
        </div>
      </header> */}

      <section className="sa-hero-card">
        <div>
          <p className="sa-eyebrow">Today’s pulse</p>

          <h2>Keep registrations moving and approvals tight.</h2>

          <p className="sa-hero-copy">
            You have{" "}
            {Math.max(
              (stats.totalCompanies ?? 0) - (stats.activeCompanies ?? 0),
              0,
            )}{" "}
            companies awaiting stronger follow-through across activation and
            onboarding.
          </p>
        </div>

        <div className="sa-hero-metrics">
          {overviewMetrics.map((item) => (
            <div key={item.label} className="sa-hero-metric">
              <span>{item.label}</span>

              <strong>{item.value}</strong>
            </div>
          ))}
        </div>
      </section>

      <section className="sa-stats-grid">
        {statsCards.map((card) => (
          <article
            key={card.label}
            className={`sa-stat-card tone-${card.tone}`}
          >
            <div className="sa-stat-card__label">{card.label}</div>

            <div className="sa-stat-card__value">
              {card.isCurrency
                ? formatCurrency(card.value)
                : compactNumber(card.value)}
            </div>

            <div className="sa-stat-card__meta">{card.meta}</div>
          </article>
        ))}
      </section>

      <Revenue stats={stats} totalCard={totalCard} />

      <section className="sa-insights-grid">
        <article className="sa-panel sa-panel--primary">
          <div className="sa-panel__header">
            <div>
              <p className="sa-eyebrow">Growth Snapshot</p>

              <h3>Operational momentum</h3>
            </div>

            <span className="sa-panel-badge">Live</span>
          </div>

          <div className="sa-bars">
            {revenueBars.map((bar) => (
              <div key={bar.label} className="sa-bars__item">
                <div className="sa-bars__track">
                  <div
                    className="sa-bars__fill"
                    style={{
                      height: bar.height,
                    }}
                  />
                </div>

                <strong>{compactNumber(bar.value)}</strong>

                <span>{bar.label}</span>
              </div>
            ))}
          </div>
        </article>

        <div className="sa-insights-stack">
          <article className="sa-panel">
            <div className="sa-panel__header">
              <div>
                <p className="sa-eyebrow">Plan Mix</p>

                <h3>Subscription balance</h3>
              </div>

              <FiActivity className="sa-panel-icon" />
            </div>

            <div className="sa-plan-breakdown">
              <div className="sa-ring-mock">
                <span>{stats.totalCompanies ?? 0}</span>

                <small>Total</small>
              </div>

              <div className="sa-plan-list">
                <div>
                  <span className="dot dot-free" />
                  Free base
                  <strong>{compactNumber(stats.freeUsers ?? 0)}</strong>
                </div>

                <div>
                  <span className="dot dot-active" />
                  Active companies
                  <strong>{compactNumber(stats.activeCompanies ?? 0)}</strong>
                </div>

                <div>
                  <span className="dot dot-new" />
                  New signups
                  <strong>{compactNumber(stats.newSignupsToday ?? 0)}</strong>
                </div>
              </div>
            </div>
          </article>

          <article className="sa-panel">
            <div className="sa-panel__header">
              <div>
                <p className="sa-eyebrow">Recent Activity</p>

                <h3>Latest registrations</h3>
              </div>

              <FiUserPlus className="sa-panel-icon" />
            </div>

            <div className="sa-activity-list">
              {activityFeed.length === 0 ? (
                <p className="sa-empty-state">No registrations found yet.</p>
              ) : (
                activityFeed.map((item) => (
                  <div key={item.id} className="sa-activity-item">
                    <div>
                      <strong>{item.title}</strong>

                      <span>{item.subtitle}</span>
                    </div>

                    <div>
                      <em
                        className={`status-pill ${
                          item.status === "Active" ? "is-active" : "is-pending"
                        }`}
                      >
                        {item.status}
                      </em>

                      <small>{item.time}</small>
                    </div>
                  </div>
                ))
              )}
            </div>
          </article>
        </div>
      </section>

      <section className="sa-panel sa-table-panel">
        <div className="sa-panel__header sa-table-panel__header">
          <div>
            <p className="sa-eyebrow">Company Operations</p>

            <h3>Tenant registry</h3>
          </div>

          <div className="sa-table-summary">
            <span>
              Showing {tenants.length} of {totalItems}
            </span>

            <span>
              Page <strong>{paginationPage}</strong> /{" "}
              <strong>{totalPages}</strong>
            </span>
          </div>
        </div>

        <div className="sa-table-wrap">
          <table className="sa-table">
            <thead>
              <tr>
                <th>Company</th>
                <th>Plan</th>
                <th>Status</th>
                <th>Team</th>
                <th>Subdomain</th>
                <th>Admin Email</th>
                <th>Created</th>
                <th>Actions</th>
              </tr>
            </thead>

            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="8" className="sa-table__empty">
                    Loading dashboard...
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan="8" className="sa-table__empty">
                    No companies match the current filters.
                  </td>
                </tr>
              ) : (
                tenants.map((tenant, idx) => (
                  <tr key={tenant._id || idx}>
                    <td data-label="Company">
                      <div className="sa-company-cell">
                        <button
                          type="button"
                          className="sa-company-link"
                          onClick={() =>
                            navigate(`/admin/dashboard/companies/${tenant._id}`)
                          }
                        >
                          <strong>{tenant.companyName || "-"}</strong>
                        </button>

                        <span>{tenant.companyEmail || "-"}</span>
                      </div>
                    </td>

                    <td data-label="Plan">
                      <span className="plan-chip">
                        {formatPlan(tenant.plan)}
                      </span>
                    </td>

                    <td data-label="Status">
                      <span
                        className={`status-pill ${
                          tenant.isActive ? "is-active" : "is-pending"
                        }`}
                      >
                        {tenant.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td data-label="Team">{tenant.employeeSize || "-"}</td>

                    <td data-label="Subdomain">{tenant.subdomain || "-"}</td>

                    <td data-label="Admin Email">{tenant.adminEmail || "-"}</td>

                    <td data-label="Created">{formatDate(tenant.createdAt)}</td>

                    <td className="sa-table__actions">
                      <button
                        type="button"
                        className="sa-more-btn"
                        onClick={() =>
                          setOpenMenuIdx(openMenuIdx === idx ? null : idx)
                        }
                      >
                        <FiMoreVertical />
                      </button>

                      {openMenuIdx === idx && (
                        <div className="sa-action-menu">
                          {!tenant.isActive && (
                            <button
                              type="button"
                              disabled={rowLoading[tenant._id]}
                              onClick={() => {
                                handleApprove(tenant._id);

                                setOpenMenuIdx(null);
                              }}
                            >
                              Approve company
                            </button>
                          )}

                          {tenant.isActive && (
                            <button
                              type="button"
                              disabled={rowLoading[tenant._id]}
                              onClick={() => {
                                handleDeactivate(tenant._id);

                                setOpenMenuIdx(null);
                              }}
                            >
                              Deactivate company
                            </button>
                          )}

                          <button
                            type="button"
                            className="danger"
                            disabled={rowLoading[tenant._id]}
                            onClick={() => {
                              handleDelete(tenant._id);

                              setOpenMenuIdx(null);
                            }}
                          >
                            Delete permanently
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="sa-pagination">
          <button
            type="button"
            disabled={paginationPage <= 1 || loading}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          >
            <FiChevronLeft /> Previous
          </button>

          <span>
            Page <strong>{paginationPage}</strong> of{" "}
            <strong>{totalPages}</strong>
          </span>

          <button
            type="button"
            disabled={paginationPage >= totalPages || loading}
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          >
            Next <FiChevronRight />
          </button>
        </div>
      </section>
    </div>
  );
};

export default SuperAdminDashboard;
