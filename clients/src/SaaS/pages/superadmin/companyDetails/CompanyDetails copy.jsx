import React, { useEffect, useMemo, useState } from "react";
import {
  FiAlertCircle,
  FiArrowLeft,
  FiCalendar,
  FiCheckCircle,
  FiCopy,
  FiCreditCard,
  FiDatabase,
  FiDownload,
  FiFileText,
  FiGlobe,
  FiHash,
  FiMail,
  FiPhone,
  FiUsers,
  FiXCircle,
} from "react-icons/fi";
import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import "../SuperAdminDashboard.css";
import {
  approveCompany,
  getTenantById,
  getTenantEmployees,
  updateStatus,
} from "../../../services/adminApi";
import PermissionModuls from "./CompanyModules/PermissionModuls";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
      })
    : "-";

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

const CompanyDetails = ({ companyId, onBack }) => {
  const [company, setCompany] = useState(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeRole, setEmployeeRole] = useState("all");
  const [employeePage, setEmployeePage] = useState(1);
  const [employeeTotal, setEmployeeTotal] = useState(0);
  const [employeeTotalPages, setEmployeeTotalPages] = useState(1);
  const [employeeRoles, setEmployeeRoles] = useState([]);
  const [debouncedEmployeeSearch, setDebouncedEmployeeSearch] = useState("");
  const EMP_PAGE_SIZE = 6;

  useEffect(() => {
    if (!companyId) return;
    setLoading(true);
    getTenantById(companyId)
      .then(setCompany)
      .catch((err) => {
        toast.error(err.message || "Failed to load company details");
        onBack();
      })
      .finally(() => setLoading(false));
  }, [companyId, onBack]);

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEmployeeSearch(employeeSearch.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [employeeSearch]);

  useEffect(() => {
    if (!companyId) return;
    setEmployeesLoading(true);

    const query = {
      page: String(employeePage),
      limit: String(EMP_PAGE_SIZE),
    };

    if (debouncedEmployeeSearch) {
      query.search = debouncedEmployeeSearch;
    }

    if (employeeRole !== "all") {
      query.role = employeeRole;
    }

    getTenantEmployees(companyId, query)
      .then((data) => {
        setEmployees(Array.isArray(data.employees) ? data.employees : []);
        setEmployeeTotal(Number(data?.pagination?.total ?? data?.total ?? 0));
        setEmployeeTotalPages(
          Math.max(1, Number(data?.pagination?.pages ?? 1)),
        );
        setEmployeeRoles(Array.isArray(data?.roles) ? data.roles : []);
      })
      .catch((err) => {
        setEmployees([]);
        setEmployeeTotal(0);
        setEmployeeTotalPages(1);
        toast.error(err.message || "Failed to load tenant employees");
      })
      .finally(() => setEmployeesLoading(false));
  }, [companyId, employeePage, employeeRole, debouncedEmployeeSearch]);

  const expireDate = calcExpireDate(company?.createdAt, company?.billingCycle);
  const isExpired = expireDate && new Date(expireDate) < new Date();

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
      {
        key: "id",
        section: "System",
        label: "Record ID",
        value: company._id || "-",
      },
    ];
  }, [company, expireDate, isExpired]);

  const groupedSections = useMemo(() => {
    const map = {};
    tableRows.forEach((row) => {
      if (!map[row.section]) map[row.section] = [];
      map[row.section].push(row);
    });
    return map;
  }, [tableRows]);

  const orderedSections = useMemo(() => {
    const preferredOrder = ["Company", "Billing", "Contact", "Account"];
    const availableSections = Object.keys(groupedSections).filter(
      (section) => section !== "System",
    );

    const ordered = preferredOrder.filter((section) =>
      availableSections.includes(section),
    );
    const rest = availableSections.filter(
      (section) => !ordered.includes(section),
    );

    return [...ordered, ...rest];
  }, [groupedSections]);

  useEffect(() => {
    setEmployeePage(1);
  }, [employeeSearch, employeeRole]);

  useEffect(() => {
    if (employeePage > employeeTotalPages) {
      setEmployeePage(employeeTotalPages);
    }
  }, [employeePage, employeeTotalPages]);

  const copyText = async (text, label) => {
    const value = String(text || "").trim();
    if (!value || value === "-") {
      toast.info(`No ${label} to copy`);
      return;
    }
    try {
      await navigator.clipboard.writeText(value);
      toast.success(`${label} copied`);
    } catch {
      toast.error("Copy not supported in this browser");
    }
  };

  const handleApprove = async () => {
    if (!window.confirm("Approve this company?")) return;
    try {
      setActionLoading(true);
      await approveCompany(companyId);
      toast.success("Company approved successfully");
      setCompany((prev) => ({
        ...prev,
        isActive: true,
        approvedAt: new Date().toISOString(),
      }));
    } catch (err) {
      toast.error(err.message || "Approval failed");
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeactivate = async () => {
    if (!window.confirm("Deactivate this company?")) return;
    try {
      setActionLoading(true);
      await updateStatus(companyId, false);
      toast.success("Company deactivated");
      setCompany((prev) => ({ ...prev, isActive: false }));
    } catch (err) {
      toast.error(err.message || "Deactivation failed");
    } finally {
      setActionLoading(false);
    }
  };

  const exportPdf = () => {
    if (!tableRows.length) {
      toast.warning("No data available for export");
      return;
    }
    const doc = new jsPDF({ unit: "pt", format: "a4" });
    doc.setFontSize(14);
    doc.text(
      `Company Full Details - ${company.companyName || "Company"}`,
      40,
      40,
    );
    autoTable(doc, {
      startY: 60,
      head: [["Section", "Field", "Value"]],
      body: tableRows.map((row) => [row.section, row.label, String(row.value)]),
      styles: { fontSize: 10, cellPadding: 6 },
      headStyles: { fillColor: [13, 94, 255] },
    });
    doc.save(`${company.subdomain || "company"}-full-details.pdf`);
  };

  const exportExcel = () => {
    if (!tableRows.length) {
      toast.warning("No data available for export");
      return;
    }
    const rows = tableRows.map((row) => ({
      Section: row.section,
      Field: row.label,
      Value: String(row.value),
    }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Company Details");
    XLSX.writeFile(wb, `${company.subdomain || "company"}-full-details.xlsx`);
  };

  if (loading) {
    return (
      <div className="cdp-loading">
        <div className="cdp-spinner" />
        <p>Loading company details...</p>
      </div>
    );
  }

  if (!company) {
    return (
      <div className="cdp-loading">
        <FiAlertCircle size={40} color="#e34343" />
        <p>Company not found</p>
      </div>
    );
  }

  return (
    <div className="cdp-page">
      <ToastContainer position="top-right" autoClose={2200} pauseOnHover />

      <div className="cdp-card">
        {/* header */}
        <div className="cdp-top">
          <button type="button" className="cdp-back" onClick={onBack}>
            <FiArrowLeft /> Back
          </button>
          <span
            className={`cdp-status ${company.isActive ? "active" : "inactive"}`}
          >
            {company.isActive ? <FiCheckCircle /> : <FiXCircle />}
            {company.isActive ? "Active" : "Inactive"}
          </span>
        </div>

        <div className="cdp-headline">
          <h1>{company.companyName}</h1>
          <p>
            <FiGlobe /> {company.subdomain || "-"}
            <span className="cdp-dot">•</span>
            <FiDatabase /> {company.dbName || "-"}
            <span className="cdp-dot">•</span>
            {company.industry || "Unknown Industry"}
          </p>
        </div>

        <div className="cdp-kpis">
          <div>
            <span>
              <FiUsers /> Max Employees
            </span>
            <strong>{company.maxEmployees ?? 0}</strong>
          </div>
          <div>
            <span>
              <FiCreditCard /> Plan
            </span>
            <strong>{formatPlan(company.plan)}</strong>
          </div>
          <div>
            <span>
              <FiHash /> Plan Price
            </span>
            <strong>{`Rs. ${company.planPrice ?? 0}`}</strong>
          </div>
          <div>
            <span>
              <FiCalendar /> Expire Date
            </span>
            <strong className={isExpired ? "danger" : ""}>
              {expireDate ? formatDate(expireDate) : "-"}
            </strong>
          </div>
        </div>

        {/* <PermissionModuls companyId={companyId} /> */}

        <div className="cdp-actions">
          {!company.isActive && (
            <button
              type="button"
              className="sa-btn sa-btn--primary"
              onClick={handleApprove}
              disabled={actionLoading}
            >
              {actionLoading ? "Approving..." : "Approve"}
            </button>
          )}
          {company.isActive && (
            <button
              type="button"
              className="sa-btn sa-btn--danger"
              onClick={handleDeactivate}
              disabled={actionLoading}
            >
              {actionLoading ? "Deactivating..." : "Deactivate"}
            </button>
          )}
          <button
            type="button"
            className="sa-btn sa-btn--secondary"
            onClick={exportPdf}
          >
            <FiFileText /> PDF Download
          </button>
          <button
            type="button"
            className="sa-btn sa-btn--secondary"
            onClick={exportExcel}
          >
            <FiDownload /> Excel Download
          </button>
        </div>

        <div className="cdp-export-layout">
          <h3 className="cdp-table-title">Complete Company Information</h3>
          <div className="cdp-section-master-card">
            {orderedSections.map((section) => (
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

          <div className="cdp-employees-card">
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
              <p className="cdp-emp-empty">
                No employees found for this tenant.
              </p>
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
                      setEmployeePage((p) =>
                        Math.min(employeeTotalPages, p + 1),
                      )
                    }
                  >
                    Next
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default CompanyDetails;

// import React, { useEffect, useState } from "react";
// import {
//   FiArrowLeft,
//   FiCheckCircle,
//   FiXCircle,
//   FiCalendar,
//   FiMail,
//   FiPhone,
//   FiBriefcase,
//   FiGlobe,
//   FiDatabase,
//   FiUsers,
//   FiCreditCard,
//   FiHash,
//   FiAlertCircle,
//   FiClock,
// } from "react-icons/fi";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// import "./SuperAdminDashboard.css";
// import {
//   getTenantById,
//   updateStatus,
//   approveCompany,
// } from "../../services/adminApi";

// /* ─── helpers ─── */
// const fmt = (value) =>
//   value
//     ? new Date(value).toLocaleDateString("en-IN", {
//         year: "numeric",
//         month: "short",
//         day: "numeric",
//       })
//     : null;

// const formatPlan = (plan) => {
//   if (!plan) return "Free";
//   return String(plan).charAt(0).toUpperCase() + String(plan).slice(1);
// };

// const calcExpireDate = (createdAt, billingCycle) => {
//   if (!createdAt || !billingCycle) return null;
//   const base = new Date(createdAt);
//   const raw = String(billingCycle).trim().toLowerCase();
//   const match = raw.match(/^(\d+)?\s*(monthly|annually)$/);
//   if (!match) return null;
//   const qty = match[1] ? parseInt(match[1], 10) : 1;
//   const d = new Date(base);
//   if (match[2] === "monthly") d.setMonth(d.getMonth() + qty);
//   else d.setMonth(d.getMonth() + qty * 12);
//   return d;
// };

// /* ─── CDField ─── */
// const CDField = ({
//   label,
//   value,
//   mono,
//   isLink,
//   isEmail,
//   isPlan,
//   isStatus,
//   isDanger,
// }) => {
//   const empty =
//     value === null || value === undefined || String(value).trim() === "";

//   let display;
//   if (empty) {
//     display = <span className="cd-field-empty">—</span>;
//   } else if (isLink) {
//     display = (
//       <a
//         href={String(value)}
//         target="_blank"
//         rel="noopener noreferrer"
//         className="cd-field-link"
//       >
//         <FiGlobe size={12} /> {value}
//       </a>
//     );
//   } else if (isEmail) {
//     display = (
//       <a href={`mailto:${value}`} className="cd-field-link">
//         {value}
//       </a>
//     );
//   } else if (isPlan) {
//     display = <span className="cd-field-chip plan">{value}</span>;
//   } else if (isStatus !== undefined) {
//     display = (
//       <span className={`cd-field-chip ${isStatus ? "active" : "inactive"}`}>
//         {isStatus ? (
//           <>
//             <FiCheckCircle size={11} /> Active
//           </>
//         ) : (
//           <>
//             <FiXCircle size={11} /> Inactive
//           </>
//         )}
//       </span>
//     );
//   } else {
//     display = (
//       <span
//         className={`cd-field-val${mono ? " cd-mono" : ""}${isDanger ? " cd-danger" : ""}`}
//       >
//         {value}
//       </span>
//     );
//   }

//   return (
//     <div className="cd-field-row">
//       <span className="cd-field-lbl">{label}</span>
//       {display}
//     </div>
//   );
// };

// /* ─── CompanyDetails ─── */
// const CompanyDetails = ({ companyId, onBack }) => {
//   const [company, setCompany] = useState(null);
//   const [loading, setLoading] = useState(true);
//   const [busy, setBusy] = useState(false);

//   useEffect(() => {
//     if (!companyId) return;
//     setLoading(true);
//     getTenantById(companyId)
//       .then(setCompany)
//       .catch((err) => {
//         toast.error(err.message || "Failed to load company");
//         onBack();
//       })
//       .finally(() => setLoading(false));
//   }, [companyId, onBack]);

//   const handleApprove = async () => {
//     if (!window.confirm("Approve this company?")) return;
//     try {
//       setBusy(true);
//       await approveCompany(companyId);
//       toast.success("Company approved!");
//       setCompany((p) => ({
//         ...p,
//         isActive: true,
//         approvedAt: new Date().toISOString(),
//       }));
//     } catch (err) {
//       toast.error(err.message || "Approval failed");
//     } finally {
//       setBusy(false);
//     }
//   };

//   const handleDeactivate = async () => {
//     if (!window.confirm("Deactivate this company?")) return;
//     try {
//       setBusy(true);
//       await updateStatus(companyId, false);
//       toast.success("Company deactivated!");
//       setCompany((p) => ({ ...p, isActive: false }));
//     } catch (err) {
//       toast.error(err.message || "Deactivation failed");
//     } finally {
//       setBusy(false);
//     }
//   };

//   if (loading) {
//     return (
//       <div className="cd-loading">
//         <div className="cd-spinner" />
//         <p>Loading company details…</p>
//       </div>
//     );
//   }

//   if (!company) {
//     return (
//       <div className="cd-loading">
//         <FiAlertCircle size={40} color="var(--sa-danger)" />
//         <p>Company not found</p>
//       </div>
//     );
//   }

//   const expireDate = calcExpireDate(company.createdAt, company.billingCycle);
//   const isExpired = !!(expireDate && new Date(expireDate) < new Date());

//   return (
//     <div className="cd-wrap">
//       <ToastContainer position="top-right" autoClose={2200} pauseOnHover />

//       {/* ── PAGE HEADER ── */}
//       <div className="cd-page-header">
//         <button type="button" className="cd-back-btn" onClick={onBack}>
//           <FiArrowLeft /> Back to Companies
//         </button>
//         <div>
//           <p className="sa-eyebrow">Company Profile</p>
//           <h2 className="cd-page-h2">Company Details</h2>
//         </div>
//       </div>

//       {/* ── HERO CARD ── */}
//       <div className="sa-hero-card cd-hero-card">
//         {/* left */}
//         <div className="cd-hero-left">
//           <div className="cd-identity">
//             <div className="cd-avatar">
//               {company.companyName?.charAt(0).toUpperCase() || "C"}
//             </div>
//             <div>
//               <div className="cd-name-row">
//                 <h2 className="cd-company-name">{company.companyName}</h2>
//                 <span
//                   className={`status-pill ${company.isActive ? "is-active" : "is-pending"}`}
//                 >
//                   {company.isActive ? (
//                     <>
//                       <FiCheckCircle size={11} /> Active
//                     </>
//                   ) : (
//                     <>
//                       <FiXCircle size={11} /> Inactive
//                     </>
//                   )}
//                 </span>
//               </div>
//               <p className="cd-meta-row">
//                 <span>
//                   <FiGlobe size={12} /> {company.subdomain || "—"}
//                 </span>
//                 <span className="cd-dot">·</span>
//                 <span>
//                   <FiDatabase size={12} /> {company.dbName || "—"}
//                 </span>
//                 <span className="cd-dot">·</span>
//                 <span>{company.industry || "Unknown Industry"}</span>
//                 {company.employeeSize && (
//                   <>
//                     <span className="cd-dot">·</span>
//                     <span>
//                       <FiUsers size={12} /> {company.employeeSize}
//                     </span>
//                   </>
//                 )}
//               </p>
//               <div className="cd-chips-row">
//                 {company.companyEmail && (
//                   <a
//                     href={`mailto:${company.companyEmail}`}
//                     className="cd-chip-item"
//                   >
//                     <FiMail size={12} /> {company.companyEmail}
//                   </a>
//                 )}
//                 {company.companyPhone && (
//                   <span className="cd-chip-item">
//                     <FiPhone size={12} /> {company.companyPhone}
//                   </span>
//                 )}
//                 {company.website && (
//                   <a
//                     href={company.website}
//                     target="_blank"
//                     rel="noopener noreferrer"
//                     className="cd-chip-item"
//                   >
//                     <FiGlobe size={12} /> Website
//                   </a>
//                 )}
//               </div>
//             </div>
//           </div>
//         </div>

//         {/* right */}
//         <div className="cd-hero-right">
//           <div className="cd-date-block">
//             <div className="cd-date-item">
//               <span className="cd-date-lbl">Member Since</span>
//               <strong className="cd-date-val">
//                 {fmt(company.createdAt) || "—"}
//               </strong>
//             </div>
//             {company.approvedAt && (
//               <div className="cd-date-item">
//                 <span className="cd-date-lbl">Approved On</span>
//                 <strong className="cd-date-val">
//                   {fmt(company.approvedAt)}
//                 </strong>
//               </div>
//             )}
//             {expireDate && (
//               <div className="cd-date-item">
//                 <span
//                   className="cd-date-lbl"
//                   style={isExpired ? { color: "var(--sa-danger)" } : {}}
//                 >
//                   {isExpired ? "⚠ Expired On" : "Expires On"}
//                 </span>
//                 <strong
//                   className="cd-date-val"
//                   style={isExpired ? { color: "var(--sa-danger)" } : {}}
//                 >
//                   {fmt(expireDate)}
//                 </strong>
//               </div>
//             )}
//           </div>
//           <div className="cd-btn-group">
//             {!company.isActive && (
//               <button
//                 type="button"
//                 className="cd-btn cd-btn--approve"
//                 onClick={handleApprove}
//                 disabled={busy}
//               >
//                 <FiCheckCircle /> {busy ? "Approving…" : "Approve Company"}
//               </button>
//             )}
//             {company.isActive && (
//               <button
//                 type="button"
//                 className="cd-btn cd-btn--deactivate"
//                 onClick={handleDeactivate}
//                 disabled={busy}
//               >
//                 <FiXCircle /> {busy ? "Deactivating…" : "Deactivate"}
//               </button>
//             )}
//           </div>
//         </div>
//       </div>

//       {/* ── STAT CARDS ── */}
//       <div className="sa-stats-grid">
//         <div className="sa-stat-card tone-blue">
//           <FiUsers
//             color="var(--sa-primary)"
//             size={20}
//             style={{ marginBottom: 8 }}
//           />
//           <p className="sa-eyebrow">Max Employees</p>
//           <div className="sa-stat-card__value cd-stat-val">
//             {company.maxEmployees ?? 0}
//           </div>
//           <p className="sa-stat-card__meta">Allowed seats</p>
//         </div>
//         <div className="sa-stat-card tone-violet">
//           <FiCreditCard color="#7c3aed" size={20} style={{ marginBottom: 8 }} />
//           <p className="sa-eyebrow">Plan</p>
//           <div className="sa-stat-card__value cd-stat-val">
//             {formatPlan(company.plan)}
//           </div>
//           <p className="sa-stat-card__meta">
//             {company.billingCycle
//               ? company.billingCycle.charAt(0).toUpperCase() +
//                 company.billingCycle.slice(1)
//               : "Subscription"}
//           </p>
//         </div>
//         <div className="sa-stat-card tone-green">
//           <FiHash
//             color="var(--sa-success)"
//             size={20}
//             style={{ marginBottom: 8 }}
//           />
//           <p className="sa-eyebrow">Plan Price</p>
//           <div className="sa-stat-card__value cd-stat-val">
//             ₹{company.planPrice ?? 0}
//           </div>
//           <p className="sa-stat-card__meta">Per billing cycle</p>
//         </div>
//         <div
//           className={`sa-stat-card ${isExpired ? "cd-stat-expired" : "tone-amber"}`}
//         >
//           <FiCalendar
//             color={isExpired ? "var(--sa-danger)" : "var(--sa-warning)"}
//             size={20}
//             style={{ marginBottom: 8 }}
//           />
//           <p className="sa-eyebrow">Expire Date</p>
//           <div
//             className={`sa-stat-card__value cd-stat-val${isExpired ? " cd-stat-expired-val" : ""}`}
//           >
//             {expireDate ? fmt(expireDate) : "—"}
//           </div>
//           <p
//             className={`sa-stat-card__meta${isExpired ? " cd-stat-expired-lbl" : ""}`}
//           >
//             {isExpired ? "⚠ Plan Expired" : "Subscription end"}
//           </p>
//         </div>
//       </div>

//       {/* ── INFO GRID ── */}
//       <div className="cd-info-grid">
//         {/* LEFT column */}
//         <div className="cd-info-col">
//           {/* Company Info */}
//           <div className="sa-panel">
//             <div className="sa-panel__header">
//               <div>
//                 <p className="sa-eyebrow">Profile</p>
//                 <h3>
//                   <FiBriefcase
//                     style={{ marginRight: 8, verticalAlign: "middle" }}
//                   />
//                   Company Information
//                 </h3>
//               </div>
//             </div>
//             <div className="cd-fields">
//               <CDField label="Company Name" value={company.companyName} />
//               <CDField label="Industry" value={company.industry} />
//               <CDField label="Employee Size" value={company.employeeSize} />
//               <CDField label="GST Number" value={company.gst} mono />
//               <CDField label="Website" value={company.website} isLink />
//               <CDField label="Subdomain" value={company.subdomain} mono />
//               <CDField label="Database Name" value={company.dbName} mono />
//             </div>
//           </div>

//           {/* Contact */}
//           <div className="sa-panel">
//             <div className="sa-panel__header">
//               <div>
//                 <p className="sa-eyebrow">Contact</p>
//                 <h3>
//                   <FiMail style={{ marginRight: 8, verticalAlign: "middle" }} />
//                   Contact Information
//                 </h3>
//               </div>
//             </div>
//             <div className="cd-fields">
//               <CDField
//                 label="Company Email"
//                 value={company.companyEmail}
//                 isEmail
//               />
//               <CDField label="Phone Number" value={company.companyPhone} />
//               <CDField label="Admin Email" value={company.adminEmail} isEmail />
//             </div>
//           </div>
//         </div>

//         {/* RIGHT column */}
//         <div className="cd-info-col">
//           {/* Plan & Billing */}
//           <div className="sa-panel">
//             <div className="sa-panel__header">
//               <div>
//                 <p className="sa-eyebrow">Billing</p>
//                 <h3>
//                   <FiCreditCard
//                     style={{ marginRight: 8, verticalAlign: "middle" }}
//                   />
//                   Plan & Billing
//                 </h3>
//               </div>
//             </div>
//             <div className="cd-fields">
//               <CDField
//                 label="Current Plan"
//                 value={formatPlan(company.plan)}
//                 isPlan
//               />
//               <CDField
//                 label="Billing Cycle"
//                 value={
//                   company.billingCycle
//                     ? company.billingCycle.charAt(0).toUpperCase() +
//                       company.billingCycle.slice(1)
//                     : null
//                 }
//               />
//               <CDField
//                 label="Plan Price"
//                 value={
//                   company.planPrice != null ? `₹${company.planPrice}` : null
//                 }
//               />
//               <CDField
//                 label="Max Employees"
//                 value={company.maxEmployees ?? 0}
//               />
//               <CDField
//                 label="Expire Date"
//                 value={
//                   expireDate
//                     ? fmt(expireDate) + (isExpired ? "  (Expired)" : "")
//                     : null
//                 }
//                 isDanger={isExpired}
//               />
//             </div>
//           </div>

//           {/* Account Status */}
//           <div className="sa-panel">
//             <div className="sa-panel__header">
//               <div>
//                 <p className="sa-eyebrow">Account</p>
//                 <h3>
//                   <FiClock
//                     style={{ marginRight: 8, verticalAlign: "middle" }}
//                   />
//                   Account Status & Dates
//                 </h3>
//               </div>
//             </div>
//             <div className="cd-fields">
//               <CDField
//                 label="Status"
//                 value={company.isActive ? "Active" : "Inactive"}
//                 isStatus={company.isActive}
//               />
//               <CDField label="Created Date" value={fmt(company.createdAt)} />
//               <CDField label="Approved Date" value={fmt(company.approvedAt)} />
//               <CDField label="Updated Date" value={fmt(company.updatedAt)} />
//               <CDField label="Record ID" value={company._id} mono />
//             </div>
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default CompanyDetails;
