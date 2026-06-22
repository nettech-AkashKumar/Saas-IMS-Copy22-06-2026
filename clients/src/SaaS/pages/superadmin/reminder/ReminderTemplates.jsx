import React, { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  getReminderTemplates,
  deleteReminderTemplate,
} from "../../../services/adminApi";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
// import "./SuperAdminDashboard.css";

const formatDate = (value) =>
  value
    ? new Date(value).toLocaleString("en-IN", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "-";

const ReminderTemplates = ({
  onBack,
  onOpenCreateReminder,
  refreshKey = 0,
}) => {
  const [loading, setLoading] = useState(true);
  const [templates, setTemplates] = useState([]);
  const [viewTemplate, setViewTemplate] = useState(null);

  const loadTemplates = useCallback(async () => {
    try {
      setLoading(true);
      const data = await getReminderTemplates();
      setTemplates(Array.isArray(data.templates) ? data.templates : []);
    } catch (err) {
      setTemplates([]);
      toast.error(err.message || "Failed to load templates");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTemplates();
  }, [loadTemplates, refreshKey]);

  const navigate = useNavigate();

  const handleViewTemplate = (template) => {
    setViewTemplate(template);
  };

  const handleEditTemplate = (template) => {
    if (typeof onOpenCreateReminder === "function") {
      onOpenCreateReminder(template);
      setViewTemplate(null);
      return;
    }
    navigate(`/admin/dashboard/create-reminder/${template._id}`, {
      state: { template },
    });
  };

  const handleDeleteTemplate = async (template) => {
    const confirmed = window.confirm(
      `Delete template "${template.title}"? This cannot be undone.`,
    );
    if (!confirmed) return;

    try {
      await deleteReminderTemplate(template._id);
      toast.success("Template deleted successfully");
      loadTemplates();
    } catch (err) {
      toast.error(err.message || "Failed to delete template");
    }
  };

  return (
    <section className="sa-panel sa-reminder-template-panel">
      <ToastContainer position="top-right" autoClose={2200} pauseOnHover />

      {viewTemplate ? (
        <div className="sa-template-modal">
          <div
            className="sa-template-modal__backdrop"
            onClick={() => setViewTemplate(null)}
          />
          <div className="sa-template-modal__content">
            <button
              type="button"
              className="sa-template-modal__close"
              onClick={() => setViewTemplate(null)}
            >
              Close
            </button>
            <div className="sa-reminder-preview-mobile">
              <div className="sa-reminder-preview-mobile__screen">
                {viewTemplate.image ? (
                  <img
                    src={viewTemplate.image}
                    alt={viewTemplate.title || "Template preview"}
                    className="sa-reminder-preview-image"
                  />
                ) : (
                  <div className="sa-reminder-preview-fallback">
                    No image uploaded for this template.
                  </div>
                )}
                <div className="sa-reminder-preview-mobile__content">
                  <strong>{viewTemplate.title || "Untitled template"}</strong>
                  <p>
                    {viewTemplate.description || "No description provided."}
                  </p>
                  <div className="sa-template-meta-row">
                    <p>
                      <strong>Created by:</strong>{" "}
                      {viewTemplate.createdByName || "Super Admin"}
                      {viewTemplate.createdByEmail
                        ? ` (${viewTemplate.createdByEmail})`
                        : ""}
                    </p>
                    <p>
                      <strong>Last sent by:</strong>{" "}
                      {viewTemplate.lastSentByName || "-"}
                      {viewTemplate.lastSentByEmail
                        ? ` (${viewTemplate.lastSentByEmail})`
                        : ""}
                    </p>
                    <p>
                      <strong>Last sent date:</strong>{" "}
                      {formatDate(viewTemplate.lastSentAt)}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      <div className="sa-panel__header sa-table-panel__header">
        <div>
          <p className="sa-eyebrow">Reminder Templates</p>
          <h3>Create and manage reminder templates</h3>
        </div>
        <div className="sa-reminder-header-actions">
          {typeof onOpenCreateReminder === "function" ? (
            <button
              type="button"
              className="sa-btn sa-btn--primary"
              onClick={onOpenCreateReminder}
            >
              Create Template
            </button>
          ) : null}
          {typeof onBack === "function" ? (
            <button
              type="button"
              className="sa-btn sa-btn--secondary"
              onClick={onBack}
            >
              Back to Reminder Center
            </button>
          ) : null}
        </div>
      </div>

      <div className="card-body p-0">
        <div className="table-responsive">
          <table className="table datatable">
            <thead className="thead-light">
              <tr>
                <th>Title</th>
                <th>Image</th>
                <th>Description</th>
                <th>Created By</th>
                <th>Send By</th>
                <th>Send Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" className="sa-table__empty">
                    Loading templates...
                  </td>
                </tr>
              ) : templates.length === 0 ? (
                <tr>
                  <td colSpan="7" className="sa-table__empty">
                    No templates created yet.
                  </td>
                </tr>
              ) : (
                templates.map((tpl) => (
                  <tr key={tpl._id}>
                    <td data-label="Title">
                      <strong>{tpl.title || "-"}</strong>
                    </td>
                    <td data-label="Image">
                      {tpl.image ? (
                        <img
                          src={tpl.image}
                          alt={tpl.title || "Template"}
                          className="sa-reminder-thumb"
                        />
                      ) : (
                        "-"
                      )}
                    </td>
                    <td data-label="Description" className="sa-reminder-desc">
                      {tpl.description || "-"}
                    </td>
                    <td data-label="Created By">
                      {tpl.createdByName || "Super Admin"}
                      {/* {tpl.createdByEmail ? ` (${tpl.createdByEmail})` : ""} */}
                    </td>
                    <td data-label="Send By">
                      {tpl.lastSentByName || "-"}
                      {/* {tpl.lastSentByEmail ? ` (${tpl.lastSentByEmail})` : ""} */}
                    </td>
                    <td data-label="Send Date">{formatDate(tpl.lastSentAt)}</td>
                    <td data-label="Actions">
                      <div className="sa-template-actions">
                        <button
                          type="button"
                          className="sa-btn sa-btn--ghost"
                          onClick={() => handleViewTemplate(tpl)}
                        >
                          View
                        </button>
                        <button
                          type="button"
                          className="sa-btn sa-btn--secondary"
                          onClick={() => handleEditTemplate(tpl)}
                        >
                          Edit
                        </button>
                        <button
                          type="button"
                          className="sa-btn sa-btn--danger"
                          onClick={() => handleDeleteTemplate(tpl)}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </section>
  );
};

export default ReminderTemplates;
