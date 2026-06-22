import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  FiChevronLeft,
  FiChevronRight,
  FiEye,
  FiMoreVertical,
  FiSearch,
} from "react-icons/fi";
import "../SuperAdminDashboard.css";
import {
  approveCompany,
  deleteTenant,
  getTenants,
  updateStatus,
} from "../../../services/adminApi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import CompanyDetails from "./CompanyDetails";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString() : "-";

const formatPlan = (plan) => {
  if (!plan) return "Free";
  return String(plan).charAt(0).toUpperCase() + String(plan).slice(1);
};

const compactNumber = (value) =>
  new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 1,
  }).format(Number(value || 0));

const CompanyOperations = () => {
  const [selectedCompanyId, setSelectedCompanyId] = useState(null);

  const [openMenuIdx, setOpenMenuIdx] = useState(null);
  const [tenants, setTenants] = useState([]);
  const [pagination, setPagination] = useState({});
  const [loading, setLoading] = useState(true);
  const [rowLoading, setRowLoading] = useState({});
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [page, setPage] = useState(1);

  const load = useCallback(
    async ({ silent = false } = {}) => {
      try {
        if (!silent) setLoading(true);
        const tenantsRes = await getTenants({ search, status, page, limit: 8 });

        if (Array.isArray(tenantsRes)) {
          setTenants(tenantsRes);
          setPagination({
            totalPages: 1,
            page: 1,
            total: tenantsRes.length,
          });
        } else {
          setTenants(tenantsRes.data || []);
          setPagination({
            totalPages: tenantsRes.pagination?.pages || 1,
            page: tenantsRes.pagination?.page || 1,
            total: tenantsRes.pagination?.total || 0,
          });
        }
      } catch (err) {
        console.error(err);
        toast.error(err.message || "Failed to load companies");
      } finally {
        if (!silent) setLoading(false);
      }
    },
    [page, search, status],
  );

  useEffect(() => {
    load();
  }, [load]);

  const handleApprove = async (companyId) => {
    if (!window.confirm("Approve this company?")) return;

    const previousTenants = tenants;

    try {
      setRowLoading((prev) => ({ ...prev, [companyId]: true }));
      setTenants((prev) =>
        prev.map((tenant) =>
          tenant._id === companyId
            ? { ...tenant, isActive: true, updatedAt: new Date().toISOString() }
            : tenant,
        ),
      );

      await approveCompany(companyId);
      toast.success("Company approved successfully!");
      load({ silent: true });
    } catch (err) {
      setTenants(previousTenants);
      console.error(err);
      toast.error(err.message || "Approval failed");
    } finally {
      setRowLoading((prev) => ({ ...prev, [companyId]: false }));
    }
  };

  const handleDeactivate = async (companyId) => {
    if (!window.confirm("Deactivate this company?")) return;

    const previousTenants = tenants;

    try {
      setRowLoading((prev) => ({ ...prev, [companyId]: true }));
      setTenants((prev) =>
        prev.map((tenant) =>
          tenant._id === companyId
            ? {
                ...tenant,
                isActive: false,
                updatedAt: new Date().toISOString(),
              }
            : tenant,
        ),
      );

      await updateStatus(companyId, false);
      toast.success("Company deactivated!");
      load({ silent: true });
    } catch (err) {
      setTenants(previousTenants);
      console.error(err);
      toast.error(err.message || "Deactivation failed");
    } finally {
      setRowLoading((prev) => ({ ...prev, [companyId]: false }));
    }
  };

  const handleDelete = async (companyId) => {
    if (!window.confirm("Delete this company permanently?")) return;

    const previousTenants = tenants;
    const previousPagination = pagination;

    try {
      setRowLoading((prev) => ({ ...prev, [companyId]: true }));
      setTenants((prev) => prev.filter((tenant) => tenant._id !== companyId));
      setPagination((prev) => ({
        ...prev,
        total: Math.max((prev.total || 0) - 1, 0),
      }));

      await deleteTenant(companyId);
      toast.success("Company deleted!");
      load({ silent: true });
    } catch (err) {
      setTenants(previousTenants);
      setPagination(previousPagination);
      console.error(err);
      toast.error(err.message || "Delete failed");
    } finally {
      setRowLoading((prev) => ({ ...prev, [companyId]: false }));
    }
  };

  const totalPages = pagination.totalPages || 1;
  const currentPage = pagination.page || page;
  const totalItems = pagination.total || tenants.length;

  // =========================
  // COMPANY DETAILS PAGE
  // =========================

  if (selectedCompanyId) {
    return (
      <CompanyDetails
        companyId={selectedCompanyId}
        onBack={() => setSelectedCompanyId(null)}
      />
    );
  }

  return (
    <section className="sa-panel sa-table-panel">
      <ToastContainer position="top-right" autoClose={2200} pauseOnHover />
      <div className="sa-panel__header sa-table-panel__header">
        <div>
          <p className="sa-eyebrow">Company Operations</p>
          <h3>Manage all registered companies</h3>
        </div>
      </div>

      <div className="sa-search-filter">
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
      </div>

      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table datatable">
            <thead className="thead-light">
              {/* <tr>
                <th>Company Name</th>
                <th>Company Email</th>
                <th>Company Phone</th>
                <th>Employee Size</th>
                <th>Industry</th>
                <th>GST</th>
                <th>Website</th>
                <th>Subdomain</th>
                <th>DB Name</th>
                <th>Plan</th>
                <th>Billing Cycle</th>
                <th>Plan Price</th>
                <th>Max Employees</th>
                <th>Status</th>
                <th>Admin Email</th>
                <th>Created</th>
                <th>Expire Date</th>
                <th>Updated</th>
                <th>Actions</th>
              </tr> */}
              <tr>
                <th>Company Name</th>
                <th>Email</th>
                <th>Account URL</th>
                <th>Plan</th>
                <th>Created Date</th>
                <th>Expire Date</th>
                <th>Status</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="19" className="sa-table__empty">
                    Loading companies...
                  </td>
                </tr>
              ) : tenants.length === 0 ? (
                <tr>
                  <td colSpan="19" className="sa-table__empty">
                    No companies match the current filters.
                  </td>
                </tr>
              ) : (
                tenants.map((tenant, idx) => (
                  // <tr key={tenant._id || idx}>
                  //   <td data-label="Company">
                  //     <div className="sa-company-cell">
                  //       <button
                  //         type="button"
                  //         className="sa-company-link"
                  //         onClick={() =>
                  //           navigate(`/admin/dashboard/companies/${tenant._id}`)
                  //         }
                  //       >
                  //         <strong>{tenant.companyName || "-"}</strong>
                  //       </button>
                  //     </div>
                  //   </td>
                  //   <td>{tenant.companyEmail || "-"}</td>
                  //   <td>{tenant.companyPhone || "-"}</td>
                  //   <td>{tenant.employeeSize || "-"}</td>
                  //   <td>{tenant.industry || "-"}</td>
                  //   <td>{tenant.gst || "-"}</td>
                  //   <td>
                  //     {tenant.website ? (
                  //       <a
                  //         href={tenant.website}
                  //         target="_blank"
                  //         rel="noreferrer"
                  //       >
                  //         {tenant.website}
                  //       </a>
                  //     ) : (
                  //       "-"
                  //     )}
                  //   </td>
                  //   <td>{tenant.subdomain || "-"}</td>
                  //   <td className="code">{tenant.dbName || "-"}</td>
                  //   <td>
                  //     <span className="plan-chip">
                  //       {formatPlan(tenant.plan)}
                  //     </span>
                  //   </td>
                  //   <td>{tenant.billingCycle || "-"}</td>
                  //   <td>{tenant.planPrice ?? 0}</td>
                  //   <td>{tenant.maxEmployees ?? 0}</td>
                  //   <td>
                  //     <span
                  //       className={`status-pill ${tenant.isActive ? "is-active" : "is-pending"}`}
                  //     >
                  //       {tenant.isActive ? "Active" : "Inactive"}
                  //     </span>
                  //   </td>
                  //   <td>{tenant.adminEmail || "-"}</td>
                  //   <td>{formatDate(tenant.createdAt)}</td>
                  //   <td
                  //     style={{
                  //       color:
                  //         tenant.expireDate &&
                  //         new Date(tenant.expireDate) < new Date()
                  //           ? "#C62828"
                  //           : "inherit",
                  //       fontWeight:
                  //         tenant.expireDate &&
                  //         new Date(tenant.expireDate) < new Date()
                  //           ? 600
                  //           : "normal",
                  //     }}
                  //   >
                  //     {tenant.expireDate ? formatDate(tenant.expireDate) : "-"}
                  //   </td>
                  //   <td>{formatDate(tenant.updatedAt)}</td>
                  //   <td className="sa-table__actions">
                  //     <button
                  //       type="button"
                  //       className="sa-icon-btn"
                  //       title="View details"
                  //       onClick={() => setSelectedCompanyId(tenant._id)}
                  //     >
                  //       <FiEye />
                  //     </button>
                  //     <button
                  //       type="button"
                  //       className="sa-more-btn"
                  //       onClick={() =>
                  //         setOpenMenuIdx(openMenuIdx === idx ? null : idx)
                  //       }
                  //     >
                  //       <FiMoreVertical />
                  //     </button>

                  //     {openMenuIdx === idx && (
                  //       <div className="sa-action-menu">
                  //         {!tenant.isActive && (
                  //           <button
                  //             type="button"
                  //             disabled={rowLoading[tenant._id]}
                  //             onClick={() => {
                  //               handleApprove(tenant._id);
                  //               setOpenMenuIdx(null);
                  //             }}
                  //           >
                  //             Approve company
                  //           </button>
                  //         )}

                  //         {tenant.isActive && (
                  //           <button
                  //             type="button"
                  //             disabled={rowLoading[tenant._id]}
                  //             onClick={() => {
                  //               handleDeactivate(tenant._id);
                  //               setOpenMenuIdx(null);
                  //             }}
                  //           >
                  //             Deactivate company
                  //           </button>
                  //         )}

                  //         <button
                  //           type="button"
                  //           className="danger"
                  //           disabled={rowLoading[tenant._id]}
                  //           onClick={() => {
                  //             handleDelete(tenant._id);
                  //             setOpenMenuIdx(null);
                  //           }}
                  //         >
                  //           Delete permanently
                  //         </button>
                  //       </div>
                  //     )}
                  //   </td>
                  // </tr>

                  <tr key={tenant._id || idx}>
                    <td>
                      <div className="d-flex align-items-center file-name-icon">
                        {/* COMPANY LETTER AVATAR */}
                        <div
                          className="avatar avatar-md border rounded-circle d-flex align-items-center justify-content-center fw-bold text-uppercase"
                          style={{
                            backgroundColor: "#f3f4f6",
                            color: "#111827",
                            fontSize: "18px",
                          }}
                        >
                          {tenant.companyName?.charAt(0) || "C"}
                        </div>

                        <div className="ms-2">
                          <h6 className="fw-medium">
                            <button
                              type="button"
                              className="btn btn-link p-0 text-decoration-none fw-medium"
                              onClick={() => setSelectedCompanyId(tenant._id)}
                            >
                              {tenant.companyName || "-"}
                            </button>
                          </h6>
                        </div>
                      </div>
                    </td>

                    <td>{tenant.companyEmail || "-"}</td>

                    <td>{tenant.subdomain || "-"}.imsmymunc.com</td>

                    <td>
                      <div className="d-flex align-items-center justify-content-between">
                        <p className="mb-0 me-2">{formatPlan(tenant.plan)}</p>
                      </div>
                    </td>

                    <td>{formatDate(tenant.createdAt)}</td>
                    <td
                      style={{
                        color:
                          tenant.expireDate &&
                          new Date(tenant.expireDate) < new Date()
                            ? "#C62828"
                            : "inherit",
                        fontWeight:
                          tenant.expireDate &&
                          new Date(tenant.expireDate) < new Date()
                            ? 600
                            : "normal",
                      }}
                    >
                      {tenant.expireDate ? formatDate(tenant.expireDate) : "-"}
                    </td>

                    <td>
                      <span
                        className={`badge d-inline-flex align-items-center badge-xs ${
                          tenant.isActive ? "badge-success" : "badge-danger"
                        }`}
                      >
                        <i className="ti ti-point-filled me-1" />
                        {tenant.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>

                    <td>
                      <div className="action-icon d-inline-flex align-items-center position-relative">
                        {/* VIEW */}
                        <button
                          type="button"
                          className="p-2 d-flex align-items-center border rounded me-2 bg-white"
                          onClick={() => setSelectedCompanyId(tenant._id)}
                          title="View details"
                        >
                          <FiEye />
                        </button>

                        {/* MORE MENU */}
                        <button
                          type="button"
                          className="p-2 d-flex align-items-center border rounded bg-white"
                          onClick={() =>
                            setOpenMenuIdx(openMenuIdx === idx ? null : idx)
                          }
                        >
                          <FiMoreVertical />
                        </button>

                        {/* DROPDOWN MENU */}
                        {openMenuIdx === idx && (
                          <div className="sa-action-menu">
                            {/* APPROVE */}
                            {!tenant.isActive && (
                              <button
                                type="button"
                                disabled={rowLoading[tenant._id]}
                                onClick={() => {
                                  handleApprove(tenant._id);
                                  setOpenMenuIdx(null);
                                }}
                              >
                                Activate Company
                              </button>
                            )}

                            {/* DEACTIVATE */}
                            {tenant.isActive && (
                              <button
                                type="button"
                                disabled={rowLoading[tenant._id]}
                                onClick={() => {
                                  handleDeactivate(tenant._id);
                                  setOpenMenuIdx(null);
                                }}
                              >
                                Deactivate Company
                              </button>
                            )}

                            {/* DELETE */}
                            <button
                              type="button"
                              className="danger"
                              disabled={rowLoading[tenant._id]}
                              onClick={() => {
                                handleDelete(tenant._id);
                                setOpenMenuIdx(null);
                              }}
                            >
                              Delete Permanently
                            </button>
                          </div>
                        )}
                      </div>
                    </td>
                  </tr>
                  // <tr key={tenant._id || idx}>
                  //   <td>
                  //     <div className="d-flex align-items-center file-name-icon">
                  //       <a
                  //         href="#"
                  //         className="avatar avatar-md border rounded-circle"
                  //       >
                  //         <img
                  //           src="assets/img/company/company-01.svg"
                  //           className="img-fluid"
                  //           alt="img"
                  //         />
                  //       </a>
                  //       <div className="ms-2">
                  //         <h6 className="fw-medium">
                  //           <a href="#">{tenant.companyName || "-"}</a>
                  //         </h6>
                  //       </div>
                  //     </div>
                  //   </td>
                  //   <td>{tenant.companyEmail || "-"}</td>
                  //   <td>{tenant.subdomain || "-"}.imsmymunc.com</td>
                  //   <td>
                  //     <div className="d-flex align-items-center justify-content-between">
                  //       <p className="mb-0 me-2">{tenant.plan || "-"}</p>
                  //       {/* <a
                  //         href="#"
                  //         data-bs-toggle="modal"
                  //         className="badge badge-purple badge-xs"
                  //         data-bs-target="#upgrade_info"
                  //       >
                  //         Upgrade
                  //       </a> */}
                  //     </div>
                  //   </td>
                  //   <td>{formatDate(tenant.createdAt)}</td>
                  //   <td>
                  //     <span className="badge badge-success d-inline-flex align-items-center badge-xs">
                  //       <i className="ti ti-point-filled me-1" />
                  //        {tenant.isActive ? "Active" : "Inactive"}
                  //     </span>
                  //   </td>
                  //   <td>
                  //     <div className="action-icon d-inline-flex align-items-center">
                  //       <a
                  //         href="#"
                  //         className="p-2 d-flex align-items-center border rounded me-2"
                  //         data-bs-toggle="modal"
                  //         data-bs-target="#company_detail"
                  //       >
                  //         <FiEye />
                  //       </a>
                  //       <a
                  //         href="#"
                  //         className="p-2 d-flex align-items-center border rounded me-2"
                  //         data-bs-toggle="modal"
                  //         data-bs-target="#edit_company"
                  //       >
                  //         <i className="ti ti-edit" />
                  //       </a>
                  //       <a
                  //         href="javascript:void(0);"
                  //         className="p-2 d-flex align-items-center border rounded"
                  //         data-bs-toggle="modal"
                  //         data-bs-target="#delete_modal"
                  //       >
                  //         <i className="ti ti-trash" />
                  //       </a>
                  //     </div>
                  //   </td>
                  // </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="sa-pagination">
        <div className="sa-table-summary">
          <span>
            Showing {tenants.length} of {totalItems}
          </span>
          <span>
            Page {currentPage} / {totalPages}
          </span>
        </div>

        <div className="sa-pagination__nav">
          <button
            type="button"
            disabled={currentPage <= 1 || loading}
            onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
          >
            <FiChevronLeft /> Previous
          </button>

          <span>
            Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
          </span>

          <button
            type="button"
            disabled={currentPage >= totalPages || loading}
            onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
          >
            Next <FiChevronRight />
          </button>
        </div>
      </div>
    </section>
  );
};

export default CompanyOperations;
