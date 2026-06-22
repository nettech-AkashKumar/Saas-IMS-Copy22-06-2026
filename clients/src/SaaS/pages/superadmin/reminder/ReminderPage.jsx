import React, { useCallback, useEffect, useMemo, useState } from "react";
import { FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi";
import { useNavigate } from "react-router-dom"; // ✅ ADD THIS
import {
  getReminderCompanyStatus,
  getReminderTemplates,
  getTenants,
  sendReminderToCompany,
} from "../../../services/adminApi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

const formatDateTime = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const ReminderPage = () => { // ✅ REMOVE PROPS
  const navigate = useNavigate(); // ✅ ADD THIS
  const [companies, setCompanies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [templateLoading, setTemplateLoading] = useState(true);
  const [statusLoading, setStatusLoading] = useState(true);
  const [sendingByCompany, setSendingByCompany] = useState({});
  const [selectedTemplateByCompany, setSelectedTemplateByCompany] = useState(
    {},
  );
  const [templates, setTemplates] = useState([]);
  const [companyReminderStatus, setCompanyReminderStatus] = useState({});
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });

  const loadCompanies = useCallback(async () => {
    try {
      setLoading(true);
      const res = await getTenants({ search, page, limit: 10 });

      if (Array.isArray(res)) {
        setCompanies(res);
        setPagination({ total: res.length, pages: 1, page: 1 });
        return;
      }

      setCompanies(res?.data || []);
      setPagination({
        total: res?.pagination?.total || 0,
        pages: res?.pagination?.pages || 1,
        page: res?.pagination?.page || 1,
      });
    } catch (err) {
      setCompanies([]);
      setPagination({ total: 0, pages: 1, page: 1 });
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [page, search]);

  useEffect(() => {
    loadCompanies();
  }, [loadCompanies]);

  const loadTemplates = useCallback(async () => {
    try {
      setTemplateLoading(true);
      const data = await getReminderTemplates();
      setTemplates(Array.isArray(data.templates) ? data.templates : []);
    } catch (err) {
      setTemplates([]);
      toast.error(err.message || "Failed to load templates");
    } finally {
      setTemplateLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates]);

  const loadReminderStatus = useCallback(async () => {
    try {
      setStatusLoading(true);
      const data = await getReminderCompanyStatus();
      const rows = Array.isArray(data?.data) ? data.data : [];
      const map = rows.reduce((acc, row) => {
        const key = String(row.companyId || row._id || "");
        if (key) {
          const logs = Array.isArray(row.logs) ? row.logs : [];
          acc[key] = {
            ...row,
            logs,
          };
        }
        return acc;
      }, {});
      setCompanyReminderStatus(map);
    } catch (err) {
      setCompanyReminderStatus({});
      toast.error(err.message || "Failed to load reminder history");
    } finally {
      setStatusLoading(false);
    }
  }, []);

  useEffect(() => {
    loadReminderStatus();
  }, [loadReminderStatus]);

  const reminderStatusByCompanyId = useMemo(
    () => companyReminderStatus,
    [companyReminderStatus],
  );

  const handleSendReminder = async (companyId) => {
    const templateId = selectedTemplateByCompany[companyId];
    if (!templateId) {
      toast.warning("Please select template");
      return;
    }

    try {
      setSendingByCompany((prev) => ({ ...prev, [companyId]: true }));
      await sendReminderToCompany({ companyId, templateId });
      toast.success("Reminder sent to company admin email");
      loadTemplates();
      loadReminderStatus();
    } catch (err) {
      toast.error(err.message || "Failed to send reminder");
    } finally {
      setSendingByCompany((prev) => ({ ...prev, [companyId]: false }));
    }
  };

  const totalPages = pagination.pages || 1;
  const currentPage = pagination.page || page;

  return (
    <section className="sa-panel sa-reminder-panel">
      <ToastContainer position="top-right" autoClose={2200} pauseOnHover />
      <div className="sa-panel__header sa-table-panel__header">
        <div>
          <p className="sa-eyebrow">Reminder Center</p>
          <h3>Company reminder details</h3>
        </div>
        <div className="sa-reminder-header-actions">
          <button
            type="button"
            className="sa-btn sa-btn--primary"
            onClick={() => navigate("/admin/dashboard/create-reminder")} 
          >
            Create Reminder
          </button>
          <button
            type="button"
            className="sa-btn sa-btn--secondary"
            onClick={() => navigate("/admin/dashboard/templates")} 
          >
            Open Templates Page
          </button>
        </div>
      </div>

      <div className="sa-search-filter">
        <label className="sa-search-box">
          <FiSearch />
          <input
            type="text"
            placeholder="Search by company, email or phone"
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </label>
      </div>

      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table datatable">
            <thead className="thead-light">
              <tr>
                <th>Company Name</th>
                <th>Company Email</th>
                <th>Phone Number</th>
                <th>Template</th>
                <th>Send</th>
                <th>Sent Template</th>
                <th>Send Date</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="sa-table__empty">
                    Loading company details...
                  </td>
                </tr>
              ) : companies.length === 0 ? (
                <tr>
                  <td colSpan="7" className="sa-table__empty">
                    No company details found.
                  </td>
                </tr>
              ) : (
                companies.map((company) => {
                  const status =
                    reminderStatusByCompanyId[String(company._id)] || {};
                  const logs = Array.isArray(status.logs) ? status.logs : [];
                  return (
                    <tr key={company._id}>
                      <td data-label="Company Name" className="sa-company-cell">
                        <strong>{company.companyName || "-"}</strong>
                      </td>
                      <td data-label="Company Email">
                        {company.companyEmail || "-"}
                      </td>
                      <td data-label="Phone Number">
                        {company.companyPhone || "-"}
                      </td>
                      <td data-label="Template">
                        <select
                          className="sa-filter-select sa-reminder-template-select"
                          value={selectedTemplateByCompany[company._id] || ""}
                          onChange={(e) =>
                            setSelectedTemplateByCompany((prev) => ({
                              ...prev,
                              [company._id]: e.target.value,
                            }))
                          }
                          disabled={templateLoading || templates.length === 0}
                        >
                          <option value="">
                            {templateLoading
                              ? "Loading templates..."
                              : "Select template"}
                          </option>
                          {templates.map((tpl) => (
                            <option key={tpl._id} value={tpl._id}>
                              {tpl.title}
                            </option>
                          ))}
                        </select>
                      </td>
                      <td data-label="Send">
                        <button
                          type="button"
                          className="sa-btn sa-btn--primary"
                          onClick={() => handleSendReminder(company._id)}
                          disabled={
                            templateLoading ||
                            templates.length === 0 ||
                            sendingByCompany[company._id]
                          }
                        >
                          {sendingByCompany[company._id]
                            ? "Sending..."
                            : "Send Reminder"}
                        </button>
                      </td>
                      <td data-label="Sent Template">
                        {logs.length ? (
                          <div className="sa-reminder-log-list">
                            {logs.map((log, index) => (
                              <div key={`${log.templateId || "tpl"}-${index}`}>
                                {log.templateTitle || "-"}
                              </div>
                            ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                      <td data-label="Send Date">
                        {statusLoading ? (
                          "Loading..."
                        ) : logs.length ? (
                          <div className="sa-reminder-log-list">
                            {logs.map((log, index) => (
                              <div key={`${log.sentAt || "date"}-${index}`}>
                                {formatDateTime(log.sentAt)}
                              </div>
                            ))}
                          </div>
                        ) : (
                          "-"
                        )}
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>

      <div className="sa-pagination sa-reminder-pagination">
        <div className="sa-table-summary">
          <span>Total {pagination.total || 0}</span>
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

export default ReminderPage;


// import React, { useCallback, useEffect, useMemo, useState } from "react";
// import { FiChevronLeft, FiChevronRight, FiSearch } from "react-icons/fi";
// import {
//   getReminderCompanyStatus,
//   getReminderTemplates,
//   getTenants,
//   sendReminderToCompany,
// } from "../../../services/adminApi";
// import { ToastContainer, toast } from "react-toastify";
// import "react-toastify/dist/ReactToastify.css";
// // import "./SuperAdminDashboard.css";

// const formatDateTime = (value) =>
//   value
//     ? new Date(value).toLocaleString("en-IN", {
//         year: "numeric",
//         month: "short",
//         day: "numeric",
//         hour: "2-digit",
//         minute: "2-digit",
//       })
//     : "-";

// const ReminderPage = ({ onOpenTemplates, onOpenCreateReminder }) => {
//   const [companies, setCompanies] = useState([]);
//   const [loading, setLoading] = useState(true);
//   const [templateLoading, setTemplateLoading] = useState(true);
//   const [statusLoading, setStatusLoading] = useState(true);
//   const [sendingByCompany, setSendingByCompany] = useState({});
//   const [selectedTemplateByCompany, setSelectedTemplateByCompany] = useState(
//     {},
//   );
//   const [templates, setTemplates] = useState([]);
//   const [companyReminderStatus, setCompanyReminderStatus] = useState({});
//   const [search, setSearch] = useState("");
//   const [page, setPage] = useState(1);
//   const [pagination, setPagination] = useState({ total: 0, pages: 1, page: 1 });

//   const loadCompanies = useCallback(async () => {
//     try {
//       setLoading(true);
//       const res = await getTenants({ search, page, limit: 10 });

//       if (Array.isArray(res)) {
//         setCompanies(res);
//         setPagination({ total: res.length, pages: 1, page: 1 });
//         return;
//       }

//       setCompanies(res?.data || []);
//       setPagination({
//         total: res?.pagination?.total || 0,
//         pages: res?.pagination?.pages || 1,
//         page: res?.pagination?.page || 1,
//       });
//     } catch (err) {
//       setCompanies([]);
//       setPagination({ total: 0, pages: 1, page: 1 });
//       // Keep the page stable even if API fails.
//       console.error(err);
//     } finally {
//       setLoading(false);
//     }
//   }, [page, search]);

//   useEffect(() => {
//     loadCompanies();
//   }, [loadCompanies]);

//   const loadTemplates = useCallback(async () => {
//     try {
//       setTemplateLoading(true);
//       const data = await getReminderTemplates();
//       setTemplates(Array.isArray(data.templates) ? data.templates : []);
//     } catch (err) {
//       setTemplates([]);
//       toast.error(err.message || "Failed to load templates");
//     } finally {
//       setTemplateLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadTemplates();
//   }, [loadTemplates]);

//   const loadReminderStatus = useCallback(async () => {
//     try {
//       setStatusLoading(true);
//       const data = await getReminderCompanyStatus();
//       const rows = Array.isArray(data?.data) ? data.data : [];
//       const map = rows.reduce((acc, row) => {
//         const key = String(row.companyId || row._id || "");
//         if (key) {
//           const logs = Array.isArray(row.logs) ? row.logs : [];
//           acc[key] = {
//             ...row,
//             logs,
//           };
//         }
//         return acc;
//       }, {});
//       setCompanyReminderStatus(map);
//     } catch (err) {
//       setCompanyReminderStatus({});
//       toast.error(err.message || "Failed to load reminder history");
//     } finally {
//       setStatusLoading(false);
//     }
//   }, []);

//   useEffect(() => {
//     loadReminderStatus();
//   }, [loadReminderStatus]);

//   const reminderStatusByCompanyId = useMemo(
//     () => companyReminderStatus,
//     [companyReminderStatus],
//   );

//   const handleSendReminder = async (companyId) => {
//     const templateId = selectedTemplateByCompany[companyId];
//     if (!templateId) {
//       toast.warning("Please select template");
//       return;
//     }

//     try {
//       setSendingByCompany((prev) => ({ ...prev, [companyId]: true }));
//       await sendReminderToCompany({ companyId, templateId });
//       toast.success("Reminder sent to company admin email");
//       loadTemplates();
//       loadReminderStatus();
//     } catch (err) {
//       toast.error(err.message || "Failed to send reminder");
//     } finally {
//       setSendingByCompany((prev) => ({ ...prev, [companyId]: false }));
//     }
//   };

//   const totalPages = pagination.pages || 1;
//   const currentPage = pagination.page || page;

//   return (
//     <section className="sa-panel sa-reminder-panel">
//       <ToastContainer position="top-right" autoClose={2200} pauseOnHover />
//       <div className="sa-panel__header sa-table-panel__header">
//         <div>
//           <p className="sa-eyebrow">Reminder Center</p>
//           <h3>Company reminder details</h3>
//         </div>
//         <div className="sa-reminder-header-actions">
//           <button
//             type="button"
//             className="sa-btn sa-btn--primary"
//             onClick={onOpenCreateReminder}
//           >
//             Create Reminder
//           </button>
//           <button
//             type="button"
//             className="sa-btn sa-btn--secondary"
//             onClick={onOpenTemplates}
//           >
//             Open Templates Page
//           </button>
//         </div>
//       </div>

//       <div className="sa-search-filter">
//         <label className="sa-search-box">
//           <FiSearch />
//           <input
//             type="text"
//             placeholder="Search by company, email or phone"
//             value={search}
//             onChange={(e) => {
//               setSearch(e.target.value);
//               setPage(1);
//             }}
//           />
//         </label>
//       </div>

//    <div className="card-body p-0">
//         <div className="table-responsive">
//           <table className="table datatable">
//             <thead className="thead-light">
//             <tr>
//               <th>Company Name</th>
//               <th>Company Email</th>
//               <th>Phone Number</th>
//               <th>Template</th>
//               <th>Send</th>
//               <th>Sent Template</th>
//               <th>Send Date</th>
//             </tr>
//           </thead>
//           <tbody>
//             {loading ? (
//               <tr>
//                 <td colSpan="7" className="sa-table__empty">
//                   Loading company details...
//                 </td>
//               </tr>
//             ) : companies.length === 0 ? (
//               <tr>
//                 <td colSpan="7" className="sa-table__empty">
//                   No company details found.
//                 </td>
//               </tr>
//             ) : (
//               companies.map((company) => {
//                 const status =
//                   reminderStatusByCompanyId[String(company._id)] || {};
//                 const logs = Array.isArray(status.logs) ? status.logs : [];
//                 return (
//                   <tr key={company._id}>
//                     <td data-label="Company Name" className="sa-company-cell">
//                       <strong>{company.companyName || "-"}</strong>
//                     </td>
//                     <td data-label="Company Email">
//                       {company.companyEmail || "-"}
//                     </td>
//                     <td data-label="Phone Number">
//                       {company.companyPhone || "-"}
//                     </td>
//                     <td data-label="Template">
//                       <select
//                         className="sa-filter-select sa-reminder-template-select"
//                         value={selectedTemplateByCompany[company._id] || ""}
//                         onChange={(e) =>
//                           setSelectedTemplateByCompany((prev) => ({
//                             ...prev,
//                             [company._id]: e.target.value,
//                           }))
//                         }
//                         disabled={templateLoading || templates.length === 0}
//                       >
//                         <option value="">
//                           {templateLoading
//                             ? "Loading templates..."
//                             : "Select template"}
//                         </option>
//                         {templates.map((tpl) => (
//                           <option key={tpl._id} value={tpl._id}>
//                             {tpl.title}
//                           </option>
//                         ))}
//                       </select>
//                     </td>
//                     <td data-label="Send">
//                       <button
//                         type="button"
//                         className="sa-btn sa-btn--primary"
//                         onClick={() => handleSendReminder(company._id)}
//                         disabled={
//                           templateLoading ||
//                           templates.length === 0 ||
//                           sendingByCompany[company._id]
//                         }
//                       >
//                         {sendingByCompany[company._id]
//                           ? "Sending..."
//                           : "Send Reminder"}
//                       </button>
//                     </td>
//                     <td data-label="Sent Template">
//                       {logs.length ? (
//                         <div className="sa-reminder-log-list">
//                           {logs.map((log, index) => (
//                             <div key={`${log.templateId || "tpl"}-${index}`}>
//                               {log.templateTitle || "-"}
//                             </div>
//                           ))}
//                         </div>
//                       ) : (
//                         "-"
//                       )}
//                     </td>
//                     <td data-label="Send Date">
//                       {statusLoading ? (
//                         "Loading..."
//                       ) : logs.length ? (
//                         <div className="sa-reminder-log-list">
//                           {logs.map((log, index) => (
//                             <div key={`${log.sentAt || "date"}-${index}`}>
//                               {formatDateTime(log.sentAt)}
//                             </div>
//                           ))}
//                         </div>
//                       ) : (
//                         "-"
//                       )}
//                     </td>
//                   </tr>
//                 );
//               })
//             )}
//           </tbody>
//         </table>
//         </div>
//       </div>

//       <div className="sa-pagination sa-reminder-pagination">
//         <div className="sa-table-summary">
//           <span>Total {pagination.total || 0}</span>
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

// export default ReminderPage;
