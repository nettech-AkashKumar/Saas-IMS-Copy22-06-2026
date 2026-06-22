// components/Role/CreateRole.jsx
import React, { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { MdKeyboardArrowLeft } from "react-icons/md";
import api from "../config/axiosInstance";
import { ALL_MODULES, DEFAULT_PERMISSIONS } from "../../utils/roleDefaults";

const CreateRole = () => {
  const navigate = useNavigate();
  const [roleName, setRoleName] = useState("");
  const [modulePermissions, setModulePermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [companyModules, setCompanyModules] = useState(null); // Modules available in company
  const [isVerifyingAdminPassword, setIsVerifyingAdminPassword] =
    useState(false);

  const [showAdminPasswordModal, setShowAdminPasswordModal] = useState(false);
  const [adminPassword, setAdminPassword] = useState("");
  const [adminPasswordError, setAdminPasswordError] = useState("");
  const [adminVerifying, setAdminVerifying] = useState(false);
  const adminPasswordResolver = useRef(null);

  // Fetch company details on mount
  useEffect(() => {
    fetchCompanyDetails();
  }, []);

  const fetchCompanyDetails = async () => {
    try {
      setLoading(true);
      // Get subdomain from URL or localStorage
      const subdomain =
        new URLSearchParams(window.location.search).get("subdomain") ||
        localStorage.getItem("subdomain") ||
        "";

      // Fetch company with modulePermissions
      const response = await api.get("/api/public/company-details", {
        params: { subdomain: subdomain || undefined },
      });

      if (response.data?.modulePermissions) {
        setCompanyModules(response.data.modulePermissions);
        initializeModules(Object.keys(response.data.modulePermissions));
      } else {
        // Fallback to all modules if company has no restrictions
        setCompanyModules(ALL_MODULES);
        initializeModules(Object.keys(ALL_MODULES));
      }
    } catch (error) {
      console.error("Failed to fetch company details:", error);
      // Fallback to all modules
      setCompanyModules(ALL_MODULES);
      initializeModules(Object.keys(ALL_MODULES));
    } finally {
      setLoading(false);
    }
  };

  // Initialize modules with only company's available modules
  const initializeModules = (availableModules) => {
    const permissions = {};
    availableModules.forEach((module) => {
      permissions[module] = { ...DEFAULT_PERMISSIONS, all: false };
    });
    setModulePermissions(permissions);
  };

  const promptAdminPassword = () => {
    if (isVerifyingAdminPassword) return Promise.resolve(false);
    setAdminPassword("");
    setAdminPasswordError("");
    setShowAdminPasswordModal(true);
    setIsVerifyingAdminPassword(true);

    return new Promise((resolve) => {
      adminPasswordResolver.current = resolve;
    });
  };

  const handleAdminPasswordSubmit = async (e) => {
    if (e && e.preventDefault) e.preventDefault();
    setAdminPasswordError("");
    setAdminVerifying(true);

    try {
      await api.post("/api/auth/verify-admin-password", {
        password: adminPassword,
      });

      setShowAdminPasswordModal(false);
      setAdminVerifying(false);
      setIsVerifyingAdminPassword(false);
      if (adminPasswordResolver.current) adminPasswordResolver.current(true);
    } catch (error) {
      const message =
        error.response?.data?.message || "Admin password verification failed";
      setAdminPasswordError(message);
      setAdminVerifying(false);
    }
  };

  const handleAdminPasswordCancel = () => {
    setShowAdminPasswordModal(false);
    setAdminPassword("");
    setAdminPasswordError("");
    setAdminVerifying(false);
    setIsVerifyingAdminPassword(false);
    if (adminPasswordResolver.current) adminPasswordResolver.current(false);
  };

  const setPermissionsForModules = async (modules, enabled) => {
    let targetModules = [...modules];
    if (enabled && targetModules.includes("Users")) {
      const userManagementEnabled = modulePermissions["Users"]?.all;
      if (!userManagementEnabled) {
        const verified = await promptAdminPassword();
        if (!verified) {
          targetModules = targetModules.filter((module) => module !== "Users");
          toast.info("User Management requires admin password verification.");
        }
      }
    }

    setModulePermissions((prev) => {
      const updatedPermissions = { ...prev };
      targetModules.forEach((module) => {
        updatedPermissions[module] = {
          export: enabled,
          import: enabled,
          create: enabled,
          read: enabled,
          update: enabled,
          delete: enabled,
          all: enabled,
        };
      });
      return updatedPermissions;
    });
  };

  // Toggle all permissions for a module
  const toggleModuleAll = async (module) => {
    const current = modulePermissions[module] || {
      ...DEFAULT_PERMISSIONS,
      all: false,
    };
    const newAll = !current.all;

    if (module === "Users" && newAll) {
      const verified = await promptAdminPassword();
      if (!verified) {
        return;
      }
    }

    setModulePermissions((prev) => ({
      ...prev,
      [module]: {
        export: newAll,
        import: newAll,
        create: newAll,
        read: newAll,
        update: newAll,
        delete: newAll,
        all: newAll,
      },
    }));
  };

  // Toggle specific permission for a module
  const togglePermission = (module, permission) => {
    setModulePermissions((prev) => {
      const current = prev[module] || { ...DEFAULT_PERMISSIONS, all: false };
      const updated = {
        ...current,
        [permission]: !current[permission],
      };

      // Update "all" field if all permissions are true
      updated.all =
        updated.export &&
        updated.import &&
        updated.create &&
        updated.read &&
        updated.update &&
        updated.delete;
      return {
        ...prev,
        [module]: updated,
      };
    });
  };

  // Select all permissions for all modules
  const selectAllPermissions = async () => {
    const availableModules = Object.keys(companyModules || ALL_MODULES);
    await setPermissionsForModules(availableModules, true);
  };

  // Reset all permissions
  const resetPermissions = () => {
    const availableModules = Object.keys(companyModules || ALL_MODULES);
    initializeModules(availableModules);
  };

  // Handle save
  const handleSave = async () => {
    if (!roleName.trim()) {
      toast.error("Please enter a role name");
      return;
    }

    setLoading(true);
    try {
      const roleData = {
        roleName,
        status: "Active",
        modulePermissions,
      };

      const response = await api.post("/api/role/create", roleData);

      toast.success("Role created successfully!");
      navigate("/Users");
    } catch (error) {
      // console.error("Create role error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to create role";
      toast.error(errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Group modules by category for display
  const groupedModules = {
    Main: [
      "Dashboard"
    ],
    Connect: [
      "Chat",
      "Mail",
      "Whatsapp"
    ],
    Inventory: [
      "Product",
      "Brand",
      "Category",
      "Units",
      "Color",
      "Size",
      "Tax",
      "HSN",
      //   "SubCategory",
      "DamageRecord",
      // "LowStocks",
      "Barcode",
    ],
    Customer: [
      "Customer",
      "DuesAdvance",
      "Supplier"
    ],
    BrokerSalesman: [
      "BrokerSalesman",
      "Ledger",
      "AssignTarget"
    ],
    Transporter: [
      "VehicleDriver",
      "Transporter",
      "Shipments"
    ],
    Purchases: [
      "PurchaseOrder",
      "GRNverification",
      "Purchase",
      "DebitNote"
    ],
    // "Stock": ["Stock", "StockAdjustment"],
    // Sales: ["Sales", "CreditNote", "Invoices", "Quotation", "Proforma", "POS"],
    Sales: [
      "Sales",
      "CreditNote",
      "Invoices",
      "Quotation",
      "Proforma",
      "Ewaybill",
      "Delivery Challan",
    ],
    POS: ["POS"],
    Warehouse: [
      "Warehouse",
      "Zones",
      "ProductAllocation",
      "TransferProduct",
      "QRCode",
      "QRCodeScan",
      "Dispatch",
    ],
    MyOnlineStore: ["MyOnlineStore"],
    Promo: ["PointsRewards"],
    Trash: ["Trash"],
    Expense: ["Expense"],
    // "Location": ["Country", "State", "City"],
    UserManagement: ["Users"],
    Reports: [
      "SalesReport",
      "PurchaseReport",
      "InventoryReport",
      "ProductWiseReport",
      "SupplierReport",
      "DamageReport",
      "CreditNoteReport",
      "DebitNoteReport",
      "ExpireReport",
      "CustomerOverdueReport",
      "SupplierOverdueReport",
      "ExpensesReport",
    ],
    Settings: [
      "Settings",
      // "Profile",
      // "Security",
      // "Website",
      "CompanySettings",
      "BankDetails",
      // "Localization",
    ],
    // "Finance & Accounts": ["Finance", "SalesReport", "PurchaseReport", "InventoryReport", "SupplierReport", "ReturnDamageReport", "CreditDebitNoteReport", "OverdueReport", "ExpenseReport"]
  };

  return (
    <div className="p-4 min-h-screen bg-gray-50" style={{ height: "100vh" }}>
      {/* ADMIN PASSWORD MODAL */}
      {showAdminPasswordModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: "rgba(0, 0, 0, 0.5)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            zIndex: 1000,
          }}
        >
          <div
            style={{
              background: "white",
              padding: 28,
              borderRadius: 12,
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              maxWidth: 420,
              width: "92%",
              textAlign: "center",
            }}
          >
            <h2 style={{ marginBottom: 12, color: "#1d4ed8" }}>
              Verify Password
            </h2>
            <p style={{ color: "#6b7280", marginBottom: 12 }}>
              Enter your admin password to enable User Management permissions
            </p>

            <form onSubmit={handleAdminPasswordSubmit}>
              <input
                type="password"
                placeholder="Enter password"
                value={adminPassword}
                onChange={(e) => setAdminPassword(e.target.value)}
                disabled={adminVerifying}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                  marginBottom: 10,
                  boxSizing: "border-box",
                }}
                autoFocus
              />

              {adminPasswordError && (
                <p style={{ color: "#dc3545", fontSize: 12, marginBottom: 10 }}>
                  {adminPasswordError}
                </p>
              )}

              <div style={{ display: "flex", gap: 10 }}>
                <button
                  type="button"
                  onClick={handleAdminPasswordCancel}
                  disabled={adminVerifying}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    background: "#e5e7eb",
                    color: "#374151",
                    border: "none",
                    borderRadius: 8,
                    cursor: adminVerifying ? "not-allowed" : "pointer",
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={adminVerifying || !adminPassword}
                  style={{
                    flex: 1,
                    padding: "10px 12px",
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    cursor:
                      adminVerifying || !adminPassword
                        ? "not-allowed"
                        : "pointer",
                  }}
                >
                  {adminVerifying ? "Verifying..." : "Verify"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Header */}
      <div
        className="d-flex align-items-center gap-2"
        style={{ marginBottom: "20px" }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            background: "#fff",
            borderRadius: 50,
            border: "1px solid #EAEAEA",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <Link to="/Users">
            <MdKeyboardArrowLeft
              style={{ color: "#6C748C", fontSize: "25px" }}
            />
          </Link>
        </div>
        <h3
          style={{
            fontSize: "22px",
            color: "#0E101A",
            fontFamily: '"Inter", sans-serif',
            fontWeight: 500,
            lineHeight: "120%",
            marginBottom: "0",
          }}
        >
          Create Role
        </h3>
      </div>

      <div
        style={{
          margin: "0 auto",
          background: "white",
          borderRadius: "16px",
          padding: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",

          // overflow: "hidden",
          overflow: "auto",
          maxHeight: "calc(100vh - 220px)",
          width: "100%",
        }}
      >
        {/* Title */}
        <h1
          style={{
            fontFamily: "Inter",
            fontSize: "20px",
            fontWeight: "600",
            color: "#0E101A",
            marginBottom: "24px",
          }}
        >
          Create New Role
        </h1>

        {/* Role Name Input */}
        <div style={{ marginBottom: "24px", maxWidth: "400px" }}>
          <label style={{ display: "block", marginBottom: "6px" }}>
            <span
              style={{
                color: "#727681",
                fontSize: "12px",
                fontFamily: "Inter",
              }}
            >
              Role Name
            </span>
            <span style={{ color: "#D00003", marginLeft: "4px" }}>*</span>
          </label>
          <input
            type="text"
            value={roleName}
            onChange={(e) => setRoleName(e.target.value)}
            placeholder="Enter Role Name"
            style={{
              width: "100%",
              height: "40px",
              padding: "0 12px",
              borderRadius: "8px",
              border: "1px solid #EAEAEA",
              fontSize: "14px",
              fontFamily: "Inter",
              color: "#0E101A",
              outline: "none",
            }}
            disabled={loading}
          />
        </div>

        {/* Permission Actions */}
        <div style={{ marginBottom: "20px", display: "flex", gap: "12px" }}>
          <button
            onClick={selectAllPermissions}
            style={{
              padding: "8px 16px",
              backgroundColor: "#1F7FFF",
              color: "white",
              border: "none",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
            disabled={loading || isVerifyingAdminPassword}
          >
            Select All Permissions
          </button>
          <button
            onClick={resetPermissions}
            style={{
              padding: "8px 16px",
              backgroundColor: "#F3F4F6",
              color: "#374151",
              border: "1px solid #D1D5DB",
              borderRadius: "8px",
              fontSize: "14px",
              fontWeight: "500",
              cursor: "pointer",
            }}
            disabled={loading || isVerifyingAdminPassword}
          >
            Reset All
          </button>
        </div>

        <h2
          style={{
            fontFamily: "Inter",
            fontSize: "16px",
            fontWeight: "500",
            color: "#0E101A",
            marginBottom: "12px",
          }}
        >
          Permissions
        </h2>

        {/* Permissions Table */}
        <div
          // style={{ overflow: "auto", maxHeight: "calc(100vh - 470px)" }}
          style={{ minWidth: "1110px" }}
        >
          {Object.entries(groupedModules)
            .map(([category, modules]) => ({
              category,
              modules: modules.filter((m) =>
                Object.keys(companyModules || {}).includes(m),
              ),
            }))
            .filter(({ modules }) => modules.length > 0)
            .map(({ category, modules }) => (
              <div key={category} style={{ marginBottom: "40px" }}>
                <div
                  style={{
                    borderRadius: "8px",
                    overflow: "hidden",
                    fontFamily: "Inter",
                  }}
                >
                  {/* Category Header */}
                  <div
                    style={{
                      backgroundColor: "#F3F8FB",
                      padding: "12px 16px",
                      display: "flex",
                      alignItems: "center",
                      fontSize: "14px",
                      color: "#727681",
                      fontWeight: "500",
                    }}
                  >
                    <div
                      style={{
                        width: "50px",
                        display: "flex",
                        justifyContent: "center",
                      }}
                    >
                      <label style={{ cursor: "pointer" }}>
                        <input
                          type="checkbox"
                          checked={modules.every(
                            (m) => modulePermissions[m]?.all,
                          )}
                          onChange={async () => {
                            const allChecked = modules.every(
                              (m) => modulePermissions[m]?.all,
                            );
                            await setPermissionsForModules(
                              modules,
                              !allChecked,
                            );
                          }}
                          style={{ display: "none" }}
                          disabled={loading || isVerifyingAdminPassword}
                        />
                        <div
                          style={{
                            width: "18px",
                            height: "18px",
                            borderRadius: "4px",
                            border: `2px solid ${modules.every((m) => modulePermissions[m]?.all) ? "#1F7FFF" : "#A2A8B8"}`,
                            backgroundColor: modules.every(
                              (m) => modulePermissions[m]?.all,
                            )
                              ? "#1F7FFF"
                              : "white",
                            position: "relative",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                          }}
                        >
                          {modules.every((m) => modulePermissions[m]?.all) && (
                            <svg
                              width="12"
                              height="12"
                              viewBox="0 0 12 12"
                              fill="none"
                            >
                              <path
                                d="M2 6L5 9L10 3"
                                stroke="white"
                                strokeWidth="2"
                                strokeLinecap="round"
                              />
                            </svg>
                          )}
                        </div>
                      </label>
                    </div>
                    <div style={{ width: "400px", textAlign: "left" }}>
                      {category}
                    </div>
                    <div style={{ flex: 1, textAlign: "center" }}>Create</div>
                    <div style={{ flex: 1, textAlign: "center" }}>Read</div>
                    <div style={{ flex: 1, textAlign: "center" }}>Update</div>
                    <div style={{ flex: 1, textAlign: "center" }}>Delete</div>
                    <div style={{ flex: 1, textAlign: "center" }}>Export</div>
                    <div style={{ flex: 1, textAlign: "center" }}>Import</div>
                    <div style={{ flex: 1, textAlign: "center" }}>All</div>
                  </div>

                  {/* Module Rows */}
                  {modules.map((module) => {
                    const permissions = modulePermissions[module] || {
                      ...DEFAULT_PERMISSIONS,
                      all: false,
                    };
                    return (
                      <div
                        key={module}
                        style={{
                          display: "flex",
                          alignItems: "center",
                          padding: "12px 16px",
                          backgroundColor: "white",
                          borderTop: "1px solid #FCFCFC",
                        }}
                      >
                        <div
                          style={{
                            width: "50px",
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          <label style={{ cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={permissions.all}
                              onChange={() => toggleModuleAll(module)}
                              style={{ display: "none" }}
                              disabled={loading}
                            />
                            <div
                              style={{
                                width: "18px",
                                height: "18px",
                                borderRadius: "4px",
                                border: `2px solid ${permissions.all ? "#1F7FFF" : "#A2A8B8"}`,
                                backgroundColor: permissions.all
                                  ? "#1F7FFF"
                                  : "white",
                                position: "relative",
                              }}
                            >
                              {permissions.all && (
                                <svg
                                  style={{
                                    position: "absolute",
                                    top: "-1px",
                                    left: "-1px",
                                  }}
                                  width="18"
                                  height="18"
                                  viewBox="0 0 18 18"
                                  fill="none"
                                >
                                  <path
                                    d="M4.5 9L7.5 12L13.5 6"
                                    stroke="white"
                                    strokeWidth="2.5"
                                    strokeLinecap="round"
                                  />
                                </svg>
                              )}
                            </div>
                          </label>
                        </div>

                        <div
                          style={{
                            width: "400px",
                            textAlign: "left",
                            fontSize: "14px",
                            color: "#0E101A",
                          }}
                        >
                          {module}
                        </div>

                        {[
                          "create",
                          "read",
                          "update",
                          "delete",
                          "export",
                          "import",
                        ].map((perm) => (
                          <div
                            key={perm}
                            style={{
                              flex: 1,
                              display: "flex",
                              justifyContent: "center",
                            }}
                          >
                            <label style={{ cursor: "pointer" }}>
                              <input
                                type="checkbox"
                                checked={permissions[perm]}
                                onChange={() => togglePermission(module, perm)}
                                style={{ display: "none" }}
                                disabled={loading}
                              />
                              <div
                                style={{
                                  width: "36px",
                                  height: "20px",
                                  backgroundColor: permissions[perm]
                                    ? "#1F7FFF"
                                    : "#A2A8B8",
                                  borderRadius: "20px",
                                  position: "relative",
                                }}
                              >
                                <div
                                  style={{
                                    width: "16px",
                                    height: "16px",
                                    backgroundColor: "white",
                                    borderRadius: "50%",
                                    position: "absolute",
                                    top: "2px",
                                    left: permissions[perm] ? "18px" : "2px",
                                    transition: "left 0.2s",
                                  }}
                                />
                              </div>
                            </label>
                          </div>
                        ))}

                        {/* All Toggle */}
                        <div
                          style={{
                            flex: 1,
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          <label style={{ cursor: "pointer" }}>
                            <input
                              type="checkbox"
                              checked={permissions.all}
                              onChange={() => toggleModuleAll(module)}
                              style={{ display: "none" }}
                              disabled={loading || isVerifyingAdminPassword}
                            />
                            <div
                              style={{
                                width: "36px",
                                height: "20px",
                                backgroundColor: permissions.all
                                  ? "#1F7FFF"
                                  : "#A2A8B8",
                                borderRadius: "20px",
                                position: "relative",
                              }}
                            >
                              <div
                                style={{
                                  width: "16px",
                                  height: "16px",
                                  backgroundColor: "white",
                                  borderRadius: "50%",
                                  position: "absolute",
                                  top: "2px",
                                  left: permissions.all ? "18px" : "2px",
                                  transition: "left 0.2s",
                                }}
                              />
                            </div>
                          </label>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Action Buttons */}
      <div
        style={{
          marginTop: "20px",
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
        }}
      >
        <button
          onClick={() => navigate("/Users")}
          style={{
            padding: "10px 24px",
            backgroundColor: "#F3F4F6",
            color: "#374151",
            border: "1px solid #D1D5DB",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            fontFamily: "Inter",
            cursor: "pointer",
          }}
          disabled={loading}
        >
          Cancel
        </button>
        <button
          onClick={handleSave}
          disabled={loading || !roleName.trim()}
          style={{
            padding: "10px 32px",
            backgroundColor: loading ? "#93C5FD" : "#1F7FFF",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            fontFamily: "Inter",
            cursor: loading ? "not-allowed" : "pointer",
          }}
        >
          {loading ? "Creating..." : "Save Role"}
        </button>
      </div>
    </div>
  );
};

export default CreateRole;
