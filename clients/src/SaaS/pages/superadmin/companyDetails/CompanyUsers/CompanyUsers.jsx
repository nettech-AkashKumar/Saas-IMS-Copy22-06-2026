import React, { useEffect, useState } from "react";
import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";
import {
  getTenantEmployees,
  getTenantById,
  updateMaxEmployees,
} from "../../../../services/adminApi";
import BASE_URL from "../../../../services/config/config";

const resolveRoleString = (role) => {
  if (!role) return "";
  if (typeof role === "string") return role;
  if (typeof role === "object")
    return String(role.roleName || role._id || "").trim();
  return "";
};

const PasswordVerificationModal = ({
  show,
  onClose,
  onSubmit,
  password,
  setPassword,
  passwordError,
  verifying,
  actionLoading,
  maxEmployeesInput,
}) => {
  if (!show) return null;

  return (
    <div
      className="modal-overlay"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: "rgba(0,0,0,0.5)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        zIndex: 1000,
      }}
    >
      <div
        className="modal-content"
        style={{
          backgroundColor: "white",
          padding: "20px",
          borderRadius: "8px",
          width: "400px",
          maxWidth: "90%",
        }}
      >
        <h3 style={{ marginBottom: "20px", color: "#333" }}>Verify Password</h3>
        <p style={{ marginBottom: "20px", color: "#666" }}>
          Please enter your password to confirm updating max employees to{" "}
          {maxEmployeesInput}.
        </p>
        <form onSubmit={onSubmit}>
          <div style={{ marginBottom: "15px" }}>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              style={{
                width: "100%",
                padding: "10px",
                border: "1px solid #ddd",
                borderRadius: "4px",
                fontSize: "14px",
              }}
              required
              disabled={verifying || actionLoading}
            />
            {passwordError && (
              <p style={{ color: "red", fontSize: "12px", marginTop: "5px" }}>
                {passwordError}
              </p>
            )}
          </div>
          <div
            style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}
          >
            <button
              type="button"
              onClick={onClose}
              disabled={verifying || actionLoading}
              style={{
                padding: "8px 16px",
                border: "1px solid #ddd",
                backgroundColor: "white",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={verifying || actionLoading || !password.trim()}
              style={{
                padding: "8px 16px",
                backgroundColor: "#007bff",
                color: "white",
                border: "none",
                borderRadius: "4px",
                cursor: "pointer",
              }}
            >
              {verifying
                ? "Verifying..."
                : actionLoading
                  ? "Updating..."
                  : "Verify & Update"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const CompanyUsers = ({ companyId }) => {
  const [employees, setEmployees] = useState([]);
  const [employeesLoading, setEmployeesLoading] = useState(false);
  const [employeeSearch, setEmployeeSearch] = useState("");
  const [employeeRole, setEmployeeRole] = useState("all");
  const [employeePage, setEmployeePage] = useState(1);
  const [employeeTotal, setEmployeeTotal] = useState(0);
  const [employeeTotalPages, setEmployeeTotalPages] = useState(1);
  const [employeeRoles, setEmployeeRoles] = useState([]);
  const [debouncedEmployeeSearch, setDebouncedEmployeeSearch] = useState("");
  const [company, setCompany] = useState(null);
  const [companyLoading, setCompanyLoading] = useState(false);
  const [isEditingMaxEmployees, setIsEditingMaxEmployees] = useState(false);
  const [maxEmployeesInput, setMaxEmployeesInput] = useState(0);
  const [actionLoading, setActionLoading] = useState(false);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [pendingMaxEmployees, setPendingMaxEmployees] = useState(null);
  const EMP_PAGE_SIZE = 6;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedEmployeeSearch(employeeSearch.trim());
    }, 350);
    return () => clearTimeout(timer);
  }, [employeeSearch]);

  useEffect(() => {
    if (!companyId) return;
    setEmployeePage(1);
  }, [debouncedEmployeeSearch, employeeRole, companyId]);

  useEffect(() => {
    if (!companyId) return;
    setCompanyLoading(true);
    getTenantById(companyId)
      .then((data) => {
        setCompany(data);
        setMaxEmployeesInput(data.maxEmployees ?? 0);
      })
      .catch((err) => {
        toast.error(err.message || "Failed to load company details");
      })
      .finally(() => setCompanyLoading(false));
  }, [companyId]);

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
        setEmployeeRoles([]);
        toast.error(err.message || "Failed to load tenant employees");
      })
      .finally(() => setEmployeesLoading(false));
  }, [companyId, employeePage, debouncedEmployeeSearch, employeeRole]);

  const handleSaveMaxEmployees = () => {
    const parsedValue = Number(maxEmployeesInput);
    if (!Number.isInteger(parsedValue) || parsedValue < 1) {
      toast.error("Max employees must be a positive whole number");
      return;
    }

    setPendingMaxEmployees(parsedValue);
    setPassword("");
    setPasswordError("");
    setShowPasswordModal(true);
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    setPasswordError("");
    setVerifying(true);

    try {
      const response = await fetch(`${BASE_URL}/api/hero/verify-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password }),
      });

      if (!response.ok) {
        const data = await response.json();
        setPasswordError(data.message || "Invalid password");
        return;
      }

      if (pendingMaxEmployees === null) {
        setPasswordError("Unable to save max employees. Please retry.");
        return;
      }

      setActionLoading(true);
      try {
        const data = await updateMaxEmployees(companyId, pendingMaxEmployees);
        setCompany(data.company || company);
        setIsEditingMaxEmployees(false);
        setShowPasswordModal(false);
        setPendingMaxEmployees(null);
        setPassword("");
        toast.success("Max employees updated successfully");
      } catch (err) {
        toast.error(err.message || "Failed to update max employees");
      } finally {
        setActionLoading(false);
      }
    } catch (error) {
      setPasswordError("Error verifying password. Please try again.");
      console.error(error);
    } finally {
      setVerifying(false);
    }
  };

  const closePasswordModal = () => {
    setShowPasswordModal(false);
    setPassword("");
    setPasswordError("");
    setPendingMaxEmployees(null);
  };

  if (!companyId) {
    return <p>Select a company to view users</p>;
  }

  return (
    <div className="cdp-employees-card">
      <ToastContainer position="top-right" autoClose={2200} pauseOnHover />
      <div className="cdp-employees-head">
        <h3>Tenant Employees</h3>
        <span>
          {employeesLoading ? "Loading..." : `${employeeTotal} records`}
        </span>
      </div>

      {company && (
        <div className="cdp-max-employees-section">
          <div className="max-employees-control">
            <span>Max Employees:</span>
            {isEditingMaxEmployees ? (
              <div className="max-employees-input-group">
                <button
                  type="button"
                  onClick={() =>
                    setMaxEmployeesInput((current) => Math.max(1, current - 1))
                  }
                  disabled={actionLoading}
                >
                  -
                </button>
                <input
                  type="number"
                  min="1"
                  step="1"
                  value={maxEmployeesInput}
                  onChange={(e) =>
                    setMaxEmployeesInput(Number(e.target.value) || 0)
                  }
                />
                <button
                  type="button"
                  onClick={() => setMaxEmployeesInput((current) => current + 1)}
                  disabled={actionLoading}
                >
                  +
                </button>
                <button
                  type="button"
                  className="sa-btn sa-btn--primary"
                  onClick={handleSaveMaxEmployees}
                  disabled={actionLoading}
                >
                  {actionLoading ? "Saving..." : "Save"}
                </button>
                <button
                  type="button"
                  className="sa-btn sa-btn--secondary"
                  onClick={() => {
                    setMaxEmployeesInput(company.maxEmployees ?? 0);
                    setIsEditingMaxEmployees(false);
                  }}
                  disabled={actionLoading}
                >
                  Cancel
                </button>
              </div>
            ) : (
              <div className="max-employees-display">
                <strong>{company.maxEmployees ?? 0}</strong>
                <button
                  type="button"
                  className="sa-btn sa-btn--secondary"
                  onClick={() => setIsEditingMaxEmployees(true)}
                >
                  Edit
                </button>
              </div>
            )}
          </div>
        </div>
      )}

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
          {employeeRoles.map((roleName, index) => {
            const formattedRole = resolveRoleString(roleName);
            return (
              <option
                key={`${formattedRole}-${index}`}
                value={formattedRole.toLowerCase()}
              >
                {formattedRole || "Unknown Role"}
              </option>
            );
          })}
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
                    <td>
                      {resolveRoleString(emp.roleName || emp.role) || "-"}
                    </td>
                    <td>
                      <span className="cdp-emp-status">Active</span>
                    </td>
                    <td>
                      {emp.createdAt
                        ? new Date(emp.createdAt).toLocaleDateString("en-IN")
                        : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="cdp-emp-pagination">
            <button
              type="button"
              disabled={employeePage <= 1 || employeesLoading}
              onClick={() => setEmployeePage((p) => Math.max(1, p - 1))}
            >
              Prev
            </button>
            <span>
              Page {employeePage} / {employeeTotalPages}
            </span>
            <button
              type="button"
              disabled={employeePage >= employeeTotalPages || employeesLoading}
              onClick={() =>
                setEmployeePage((p) => Math.min(employeeTotalPages, p + 1))
              }
            >
              Next
            </button>
          </div>
        </>
      )}

      {/* Password Verification Modal */}
      <PasswordVerificationModal
        show={showPasswordModal}
        onClose={closePasswordModal}
        onSubmit={handlePasswordSubmit}
        password={password}
        setPassword={setPassword}
        passwordError={passwordError}
        verifying={verifying}
        actionLoading={actionLoading}
        maxEmployeesInput={pendingMaxEmployees ?? maxEmployeesInput}
      />
    </div>
  );
};

export default CompanyUsers;
