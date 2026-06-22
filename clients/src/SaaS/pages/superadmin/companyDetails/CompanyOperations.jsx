import React, { useMemo } from "react";
import { FiCopy } from "react-icons/fi";

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString("en-IN") : "-";

const formatPlan = (plan) => {
  if (!plan) return "Free";
  return String(plan).charAt(0).toUpperCase() + String(plan).slice(1);
};

const calcExpireDate = (createdAt, billingCycle) => {
  if (!createdAt || !billingCycle) return null;
  const base = new Date(createdAt);
  const raw = String(billingCycle).trim().toLowerCase();
  const match = raw.match(/^(\d+)?\s*(monthly|annually)$/);
  if (!match) return null;
  const qty = match[1] ? parseInt(match[1], 10) : 1;
  const expire = new Date(base);
  if (match[2] === "monthly") expire.setMonth(expire.getMonth() + qty);
  else expire.setMonth(expire.getMonth() + qty * 12);
  return expire;
};

const CompanyOperations = ({ company }) => {
  const expireDate = calcExpireDate(company?.createdAt, company?.billingCycle);
  const isExpired = expireDate && new Date(expireDate) < new Date();
  // const tableRows = useMemo(() => {
  //   if (!company) return [];

  //   return [
  //     { section: "Company", label: "Company Name", value: company.companyName },
  //     { section: "Company", label: "Industry", value: company.industry },
  //     {
  //       section: "Company",
  //       label: "Employee Size",
  //       value: company.employeeSize,
  //     },
  //     { section: "Company", label: "GST", value: company.gst },
  //     { section: "Company", label: "Website", value: company.website },

  //     { section: "System", label: "Subdomain", value: company.subdomain },
  //     { section: "System", label: "Database", value: company.dbName },

  //     {
  //       section: "Contact",
  //       label: "Company Email",
  //       value: company.companyEmail,
  //     },
  //     { section: "Contact", label: "Phone", value: company.companyPhone },
  //     { section: "Contact", label: "Admin Email", value: company.adminEmail },

  //     { section: "Billing", label: "Plan", value: company.plan },
  //     { section: "Billing", label: "Price", value: company.planPrice },
  //     {
  //       section: "Billing",
  //       label: "Max Employees",
  //       value: company.maxEmployees,
  //     },

  //     {
  //       section: "Account",
  //       label: "Created",
  //       value: formatDate(company.createdAt),
  //     },
  //     {
  //       section: "Account",
  //       label: "Updated",
  //       value: formatDate(company.updatedAt),
  //     },
  //   ];
  // }, [company]);
  
  
  const tableRows = useMemo(() => {
    if (!company) return [];
    return [
      {
        key: "companyName",
        section: "Company",
        label: "Company Name",
        value: company.companyName || "-",
      },
      {
        key: "industry",
        section: "Company",
        label: "Industry",
        value: company.industry || "-",
      },
      {
        key: "employeeSize",
        section: "Company",
        label: "Employee Size",
        value: company.employeeSize || "-",
      },
      {
        key: "gst",
        section: "Company",
        label: "GST Number",
        value: company.gst || "-",
      },
      {
        key: "website",
        section: "Company",
        label: "Website",
        value: company.website || "-",
      },
      {
        key: "subdomain",
        section: "Company",
        label: "Subdomain",
        value: company.subdomain || "-",
      },
      {
        key: "dbName",
        section: "Company",
        label: "Database",
        value: company.dbName || "-",
      },
      {
        key: "companyEmail",
        section: "Contact",
        label: "Company Email",
        value: company.companyEmail || "-",
      },
      {
        key: "companyPhone",
        section: "Contact",
        label: "Company Phone",
        value: company.companyPhone || "-",
      },
      {
        key: "adminEmail",
        section: "Contact",
        label: "Admin Email",
        value: company.adminEmail || "-",
      },
      {
        key: "plan",
        section: "Billing",
        label: "Plan",
        value: formatPlan(company.plan),
      },
      {
        key: "billingCycle",
        section: "Billing",
        label: "Billing Cycle",
        value: company.billingCycle || "-",
      },
      {
        key: "planPrice",
        section: "Billing",
        label: "Plan Price",
        value: `Rs. ${company.planPrice ?? 0}`,
      },
      {
        key: "maxEmployees",
        section: "Billing",
        label: "Max Employees",
        value: String(company.maxEmployees ?? 0),
      },
      {
        key: "expireDate",
        section: "Billing",
        label: "Expire Date",
        value: expireDate
          ? `${formatDate(expireDate)}${isExpired ? " (Expired)" : ""}`
          : "-",
      },
      {
        key: "status",
        section: "Account",
        label: "Status",
        value: company.isActive ? "Active" : "Inactive",
      },
      {
        key: "createdAt",
        section: "Account",
        label: "Created Date",
        value: formatDate(company.createdAt),
      },
      {
        key: "approvedAt",
        section: "Account",
        label: "Approved Date",
        value: formatDate(company.approvedAt),
      },
      {
        key: "updatedAt",
        section: "Account",
        label: "Updated Date",
        value: formatDate(company.updatedAt),
      },
      // {
      //   key: "id",
      //   section: "System",
      //   label: "Record ID",
      //   value: company._id || "-",
      // },
    ];
  }, [company]);

  const grouped = useMemo(() => {
    const map = {};
    tableRows.forEach((r) => {
      if (!map[r.section]) map[r.section] = [];
      map[r.section].push(r);
    });
    return map;
  }, [tableRows]);

  const groupedSections = useMemo(() => {
    const map = {};
    tableRows.forEach((row) => {
      if (!map[row.section]) map[row.section] = [];
      map[row.section].push(row);
    });
    return map;
  }, [tableRows]);

  return (
    <div className="cdp-export-layout">
      <h3 className="cdp-table-title">Complete Company Information</h3>
      <div className="cdp-section-master-card">
        {Object.keys(grouped).map((section) => (
          <div key={section} className="cdp-section-block">
            <div className="cdp-section-head">
              <span className="cdp-pill">{section}</span>
            </div>
            <div className="cdp-section-body">
              {groupedSections[section].map((row) => (
                <div key={row.key} className="cdp-field-row">
                  <span className="cdp-field-label">{row.label}</span>
                  <span
                    className={`cdp-field-value ${
                      row.key === "status"
                        ? company.isActive
                          ? "status-active"
                          : "status-inactive"
                        : ""
                    } ${
                      row.key === "expireDate" && isExpired ? "expired" : ""
                    }`}
                  >
                    {row.value}
                    {(row.key === "companyEmail" ||
                      row.key === "adminEmail" ||
                      row.key === "subdomain" ||
                      row.key === "dbName") && (
                      <button
                        type="button"
                        className="cdp-copy-btn"
                        onClick={() => copyText(row.value, row.label)}
                      >
                        <FiCopy size={12} />
                      </button>
                    )}
                  </span>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* <div className="cdp-employees-card">
        <div className="cdp-employees-head">
          <h3>Tenant Employees</h3>
          <span>
            {employeesLoading ? "Loading..." : `${employeeTotal} records`}
          </span>
        </div>

        <div className="cdp-emp-controls">
          <input
            type="text"
            className="cdp-emp-search"
            placeholder="Search by name or email"
            value={employeeSearch}
            onChange={(e) => setEmployeeSearch(e.target.value)}
          />
          <select
            className="cdp-emp-filter"
            value={employeeRole}
            onChange={(e) => setEmployeeRole(e.target.value)}
          >
            <option value="all">All Roles</option>
            {employeeRoles.map((role) => (
              <option key={role} value={String(role).toLowerCase()}>
                {role}
              </option>
            ))}
          </select>
        </div>

        {employeesLoading ? (
          <p className="cdp-emp-empty">Fetching employee details...</p>
        ) : employees.length === 0 ? (
          <p className="cdp-emp-empty">No employees found for this tenant.</p>
        ) : (
          <>
            <div className="cdp-emp-table-wrap">
              <table className="cdp-emp-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Created</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((emp) => (
                    <tr key={emp._id || emp.email}>
                      <td>{emp.name || "-"}</td>
                      <td>{emp.email || "-"}</td>
                      <td>{emp.role || "-"}</td>
                      <td>
                        <span className="cdp-emp-status">Active</span>
                      </td>
                      <td>{formatDate(emp.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="cdp-emp-pagination">
              <button
                type="button"
                disabled={employeePage <= 1}
                onClick={() => setEmployeePage((p) => Math.max(1, p - 1))}
              >
                Prev
              </button>
              <span>
                Page {employeePage} / {employeeTotalPages}
              </span>
              <button
                type="button"
                disabled={employeePage >= employeeTotalPages}
                onClick={() =>
                  setEmployeePage((p) => Math.min(employeeTotalPages, p + 1))
                }
              >
                Next
              </button>
            </div>
          </>
        )}
      </div> */}
    </div>
    // <div className="cdp-section-master-card">
    //   <h3>Complete Company Information</h3>

    //   {Object.keys(grouped).map((section) => (
    //     <div key={section} className="cdp-section-block">
    //       <h4>{section}</h4>

    //       {grouped[section].map((row, i) => (
    //         <div key={i} className="cdp-field-row">
    //           <span>{row.label}</span>
    //           <span>{row.value || "-"}</span>
    //         </div>
    //       ))}
    //     </div>
    //   ))}
    // </div>
  );
};

export default CompanyOperations;

// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import {
//   FiChevronLeft,
//   FiChevronRight,
//   FiEye,
//   FiMoreVertical,
//   FiSearch,
// } from "react-icons/fi";
// import "../SuperAdminDashboard.css";
// import {
//   approveCompany,
//   deleteTenant,
//   getTenants,
//   updateStatus,
// } from "../../../services/adminApi";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import CompanyDetails from "./CompanyDetails";

// const formatDate = (value) =>
//   value ? new Date(value).toLocaleDateString() : "-";

// const formatPlan = (plan) => {
//   if (!plan) return "Free";
//   return String(plan).charAt(0).toUpperCase() + String(plan).slice(1);
// };

// const compactNumber = (value) =>
//   new Intl.NumberFormat("en-IN", {
//     notation: "compact",
//     maximumFractionDigits: 1,
//   }).format(Number(value || 0));

// const CompanyOperations = () => {
//   const [selectedCompanyId, setSelectedCompanyId] = useState(null);

//   const [openMenuIdx, setOpenMenuIdx] = useState(null);
//   const [tenants, setTenants] = useState([]);
//   const [pagination, setPagination] = useState({});
//   const [loading, setLoading] = useState(true);
//   const [rowLoading, setRowLoading] = useState({});
//   const [search, setSearch] = useState("");
//   const [status, setStatus] = useState("");
//   const [page, setPage] = useState(1);

//   const load = useCallback(
//     async ({ silent = false } = {}) => {
//       try {
//         if (!silent) setLoading(true);
//         const tenantsRes = await getTenants({ search, status, page, limit: 8 });

//         if (Array.isArray(tenantsRes)) {
//           setTenants(tenantsRes);
//           setPagination({
//             totalPages: 1,
//             page: 1,
//             total: tenantsRes.length,
//           });
//         } else {
//           setTenants(tenantsRes.data || []);
//           setPagination({
//             totalPages: tenantsRes.pagination?.pages || 1,
//             page: tenantsRes.pagination?.page || 1,
//             total: tenantsRes.pagination?.total || 0,
//           });
//         }
//       } catch (err) {
//         console.error(err);
//         toast.error(err.message || "Failed to load companies");
//       } finally {
//         if (!silent) setLoading(false);
//       }
//     },
//     [page, search, status],
//   );

//   useEffect(() => {
//     load();
//   }, [load]);

//   const handleApprove = async (companyId) => {
//     if (!window.confirm("Approve this company?")) return;

//     const previousTenants = tenants;

//     try {
//       setRowLoading((prev) => ({ ...prev, [companyId]: true }));
//       setTenants((prev) =>
//         prev.map((tenant) =>
//           tenant._id === companyId
//             ? { ...tenant, isActive: true, updatedAt: new Date().toISOString() }
//             : tenant,
//         ),
//       );

//       await approveCompany(companyId);
//       toast.success("Company approved successfully!");
//       load({ silent: true });
//     } catch (err) {
//       setTenants(previousTenants);
//       console.error(err);
//       toast.error(err.message || "Approval failed");
//     } finally {
//       setRowLoading((prev) => ({ ...prev, [companyId]: false }));
//     }
//   };

//   const handleDeactivate = async (companyId) => {
//     if (!window.confirm("Deactivate this company?")) return;

//     const previousTenants = tenants;

//     try {
//       setRowLoading((prev) => ({ ...prev, [companyId]: true }));
//       setTenants((prev) =>
//         prev.map((tenant) =>
//           tenant._id === companyId
//             ? {
//                 ...tenant,
//                 isActive: false,
//                 updatedAt: new Date().toISOString(),
//               }
//             : tenant,
//         ),
//       );

//       await updateStatus(companyId, false);
//       toast.success("Company deactivated!");
//       load({ silent: true });
//     } catch (err) {
//       setTenants(previousTenants);
//       console.error(err);
//       toast.error(err.message || "Deactivation failed");
//     } finally {
//       setRowLoading((prev) => ({ ...prev, [companyId]: false }));
//     }
//   };

//   const handleDelete = async (companyId) => {
//     if (!window.confirm("Delete this company permanently?")) return;

//     const previousTenants = tenants;
//     const previousPagination = pagination;

//     try {
//       setRowLoading((prev) => ({ ...prev, [companyId]: true }));
//       setTenants((prev) => prev.filter((tenant) => tenant._id !== companyId));
//       setPagination((prev) => ({
//         ...prev,
//         total: Math.max((prev.total || 0) - 1, 0),
//       }));

//       await deleteTenant(companyId);
//       toast.success("Company deleted!");
//       load({ silent: true });
//     } catch (err) {
//       setTenants(previousTenants);
//       setPagination(previousPagination);
//       console.error(err);
//       toast.error(err.message || "Delete failed");
//     } finally {
//       setRowLoading((prev) => ({ ...prev, [companyId]: false }));
//     }
//   };

//   const totalPages = pagination.totalPages || 1;
//   const currentPage = pagination.page || page;
//   const totalItems = pagination.total || tenants.length;

//   // =========================
//   // COMPANY DETAILS PAGE
//   // =========================

//   if (selectedCompanyId) {
//     return (
//       <CompanyDetails
//         companyId={selectedCompanyId}
//         onBack={() => setSelectedCompanyId(null)}
//       />
//     );
//   }

//   return (
//     <section className="sa-panel sa-table-panel">
//       <ToastContainer position="top-right" autoClose={2200} pauseOnHover />
//       <div className="sa-panel__header sa-table-panel__header">
//         <div>
//           <p className="sa-eyebrow">Company Operations</p>
//           <h3>Manage all registered companies</h3>
//         </div>
//       </div>

//       <div className="sa-search-filter">
//         <label className="sa-search-box">
//           <FiSearch />
//           <input
//             type="text"
//             placeholder="Search companies, email, subdomain"
//             value={search}
//             onChange={(e) => {
//               setSearch(e.target.value);
//               setPage(1);
//             }}
//           />
//         </label>

//         <select
//           className="sa-filter-select"
//           value={status}
//           onChange={(e) => {
//             setStatus(e.target.value);
//             setPage(1);
//           }}
//         >
//           <option value="">All status</option>
//           <option value="active">Active</option>
//           <option value="inactive">Inactive</option>
//         </select>
//       </div>

//       <div className="sa-table-wrap">
//         <table className="sa-table">
//           <thead>
//             <tr>
//               <th>Company Name</th>
//               <th>Company Email</th>
//               <th>Company Phone</th>
//               <th>Employee Size</th>
//               <th>Industry</th>
//               <th>GST</th>
//               <th>Website</th>
//               <th>Subdomain</th>
//               <th>DB Name</th>
//               <th>Plan</th>
//               <th>Billing Cycle</th>
//               <th>Plan Price</th>
//               <th>Max Employees</th>
//               <th>Status</th>
//               <th>Admin Email</th>
//               <th>Created</th>
//               <th>Expire Date</th>
//               <th>Updated</th>
//               <th>Actions</th>
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr>
//                 <td colSpan="19" className="sa-table__empty">
//                   Loading companies...
//                 </td>
//               </tr>
//             ) : tenants.length === 0 ? (
//               <tr>
//                 <td colSpan="19" className="sa-table__empty">
//                   No companies match the current filters.
//                 </td>
//               </tr>
//             ) : (
//               tenants.map((tenant, idx) => (
//                 <tr key={tenant._id || idx}>
//                   <td>{tenant.companyName || "-"}</td>
//                   <td>{tenant.companyEmail || "-"}</td>
//                   <td>{tenant.companyPhone || "-"}</td>
//                   <td>{tenant.employeeSize || "-"}</td>
//                   <td>{tenant.industry || "-"}</td>
//                   <td>{tenant.gst || "-"}</td>
//                   <td>
//                     {tenant.website ? (
//                       <a href={tenant.website} target="_blank" rel="noreferrer">
//                         {tenant.website}
//                       </a>
//                     ) : (
//                       "-"
//                     )}
//                   </td>
//                   <td>{tenant.subdomain || "-"}</td>
//                   <td className="code">{tenant.dbName || "-"}</td>
//                   <td>
//                     <span className="plan-chip">{formatPlan(tenant.plan)}</span>
//                   </td>
//                   <td>{tenant.billingCycle || "-"}</td>
//                   <td>{tenant.planPrice ?? 0}</td>
//                   <td>{tenant.maxEmployees ?? 0}</td>
//                   <td>
//                     <span
//                       className={`status-pill ${tenant.isActive ? "is-active" : "is-pending"}`}
//                     >
//                       {tenant.isActive ? "Active" : "Inactive"}
//                     </span>
//                   </td>
//                   <td>{tenant.adminEmail || "-"}</td>
//                   <td>{formatDate(tenant.createdAt)}</td>
//                   <td
//                     style={{
//                       color:
//                         tenant.expireDate &&
//                         new Date(tenant.expireDate) < new Date()
//                           ? "#C62828"
//                           : "inherit",
//                       fontWeight:
//                         tenant.expireDate &&
//                         new Date(tenant.expireDate) < new Date()
//                           ? 600
//                           : "normal",
//                     }}
//                   >
//                     {tenant.expireDate ? formatDate(tenant.expireDate) : "-"}
//                   </td>
//                   <td>{formatDate(tenant.updatedAt)}</td>
//                   <td className="sa-table__actions">
//                     <button
//                       type="button"
//                       className="sa-icon-btn"
//                       title="View details"
//                       // onClick={() => onSelectCompany(tenant._id)}
//                       onClick={() => setSelectedCompanyId(tenant._id)}
//                     >
//                       <FiEye />
//                     </button>
//                     <button
//                       type="button"
//                       className="sa-more-btn"
//                       onClick={() =>
//                         setOpenMenuIdx(openMenuIdx === idx ? null : idx)
//                       }
//                     >
//                       <FiMoreVertical />
//                     </button>

//                     {openMenuIdx === idx && (
//                       <div className="sa-action-menu">
//                         {!tenant.isActive && (
//                           <button
//                             type="button"
//                             disabled={rowLoading[tenant._id]}
//                             onClick={() => {
//                               handleApprove(tenant._id);
//                               setOpenMenuIdx(null);
//                             }}
//                           >
//                             Approve company
//                           </button>
//                         )}

//                         {tenant.isActive && (
//                           <button
//                             type="button"
//                             disabled={rowLoading[tenant._id]}
//                             onClick={() => {
//                               handleDeactivate(tenant._id);
//                               setOpenMenuIdx(null);
//                             }}
//                           >
//                             Deactivate company
//                           </button>
//                         )}

//                         <button
//                           type="button"
//                           className="danger"
//                           disabled={rowLoading[tenant._id]}
//                           onClick={() => {
//                             handleDelete(tenant._id);
//                             setOpenMenuIdx(null);
//                           }}
//                         >
//                           Delete permanently
//                         </button>
//                       </div>
//                     )}
//                   </td>
//                 </tr>
//               ))
//             )}
//           </tbody>
//         </table>
//       </div>

//       <div className="sa-pagination">
//         <div className="sa-table-summary">
//           <span>
//             Showing {tenants.length} of {totalItems}
//           </span>
//           <span>
//             Page {currentPage} / {totalPages}
//           </span>
//         </div>

//         <div className="sa-pagination__nav">
//           <button
//             type="button"
//             disabled={currentPage <= 1 || loading}
//             onClick={() => setPage((prev) => Math.max(prev - 1, 1))}
//           >
//             <FiChevronLeft /> Previous
//           </button>

//           <span>
//             Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong>
//           </span>

//           <button
//             type="button"
//             disabled={currentPage >= totalPages || loading}
//             onClick={() => setPage((prev) => Math.min(prev + 1, totalPages))}
//           >
//             Next <FiChevronRight />
//           </button>
//         </div>
//       </div>
//     </section>
//   );
// };

// export default CompanyOperations;
