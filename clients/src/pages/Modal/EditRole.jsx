// components/Role/EditRole.jsx
import React, { useState, useEffect } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { toast } from "react-toastify";
import { MdKeyboardArrowLeft } from "react-icons/md";
import api from "../config/axiosInstance";
import { ALL_MODULES, DEFAULT_PERMISSIONS } from "../../utils/roleDefaults";
const EditRole = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [roleName, setRoleName] = useState("");
  const [modulePermissions, setModulePermissions] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [companyModules, setCompanyModules] = useState(null); // Modules available in company

  useEffect(() => {
    fetchCompanyDetails();
  }, []);

  useEffect(() => {
    if (companyModules) {
      fetchRole();
    }
  }, [companyModules, id]);

  const fetchCompanyDetails = async () => {
    try {
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
      } else {
        setCompanyModules(ALL_MODULES);
      }
    } catch (error) {
      console.error("Failed to fetch company details:", error);
      setCompanyModules(ALL_MODULES);
    }
  };

  const fetchRole = async () => {
    try {
      setLoading(true);
      const response = await api.get(`/api/role/roleById/${id}`);
      const role = response.data;

      setRoleName(role.roleName);

      // Use modulePermissions from backend - only include company's available modules
      if (role.modulePermissions) {
        const enhancedPermissions = {};
        const availableModules = Object.keys(companyModules || ALL_MODULES);

        // Only add modules that are available in company
        availableModules.forEach((module) => {
          if (role.modulePermissions[module]) {
            enhancedPermissions[module] = {
              export: role.modulePermissions[module].export || false,
              import: role.modulePermissions[module].import || false,
              create: role.modulePermissions[module].create || false,
              read: role.modulePermissions[module].read || false,
              update: role.modulePermissions[module].update || false,
              delete: role.modulePermissions[module].delete || false,
              all:
                role.modulePermissions[module].export &&
                role.modulePermissions[module].import &&
                role.modulePermissions[module].create &&
                role.modulePermissions[module].read &&
                role.modulePermissions[module].update &&
                role.modulePermissions[module].delete,
            };
          } else {
            // Add as unchecked for available but not yet configured modules
            enhancedPermissions[module] = {
              ...DEFAULT_PERMISSIONS,
              all: false,
            };
          }
        });
        setModulePermissions(enhancedPermissions);
      } else {
        // Initialize with default permissions for available modules
        const defaultPermissions = {};
        const availableModules = Object.keys(companyModules || ALL_MODULES);
        availableModules.forEach((module) => {
          defaultPermissions[module] = { ...DEFAULT_PERMISSIONS, all: false };
        });
        setModulePermissions(defaultPermissions);
      }
    } catch (error) {
      // console.error("Fetch role error:", error);
      toast.error("Failed to load role");
      navigate("/Users");
    } finally {
      setLoading(false);
    }
  };

  // Toggle all permissions for a module
  const toggleModuleAll = (module) => {
    setModulePermissions((prev) => {
      const current = prev[module] || { ...DEFAULT_PERMISSIONS, all: false };
      const newAll = !current.all;
      return {
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
      };
    });
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
  const selectAllPermissions = () => {
    const allPermissions = {};
    const availableModules = Object.keys(companyModules || ALL_MODULES);
    availableModules.forEach((module) => {
      allPermissions[module] = {
        export: true,
        import: true,
        create: true,
        read: true,
        update: true,
        delete: true,
        all: true,
      };
    });
    setModulePermissions(allPermissions);
  };

  // Reset all permissions
  const resetPermissions = () => {
    const defaultPermissions = {};
    const availableModules = Object.keys(companyModules || ALL_MODULES);
    availableModules.forEach((module) => {
      defaultPermissions[module] = { ...DEFAULT_PERMISSIONS, all: false };
    });
    setModulePermissions(defaultPermissions);
  };

  const handleUpdate = async () => {
    if (!roleName.trim()) {
      toast.error("Please enter a role name");
      return;
    }

    setSaving(true);
    try {
      const roleData = {
        roleName,
        modulePermissions,
      };

      const response = await api.put(`/api/role/update/${id}`, roleData);

      toast.success("Role updated successfully!");
      setTimeout(() => {
        window.location.reload();
      }, 300);
      navigate("/Users");
    } catch (error) {
      // console.error("Update role error:", error);
      const errorMessage =
        error.response?.data?.message || "Failed to update role";
      toast.error(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  // Group modules by category for display (same as CreateRole)
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
      // "SubCategory",
      "DamageRecord",
      // "LowStocks",
      // "Unit",
      // "VariantAttributes",
      // "Warranty",
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
    // Stock: ["Stock", "StockAdjustment"],
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
      "Dispatch"
    ],
    MyOnlineStore: ["MyOnlineStore"],
    Promo: ["PointsRewards"],
    Trash: ["Trash"],
    Expense: ["Expense"],
    // Location: ["Country", "State", "City"],
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
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "80vh" }}
      >
        <div>Loading role...</div>
      </div>
    );
  }

  return (
    <div className="p-4 bg-gray-50" style={{ height: "100vh" }}>
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
          Edit Role: {roleName}
        </h3>
      </div>

      <div
        style={{
          margin: "0 auto",
          background: "white",
          borderRadius: "16px",
          padding: "20px",
          boxShadow: "0 1px 3px rgba(0,0,0,0.1)",
          maxHeight: "calc(100vh - 220px)",
          overflow: "auto",
          width: "100%",
        }}
      >
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
            disabled={saving}
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
            disabled={saving}
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
            disabled={saving}
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
                          onChange={() => {
                            const allChecked = modules.every(
                              (m) => modulePermissions[m]?.all,
                            );
                            modules.forEach((module) => {
                              if (allChecked) {
                                // Uncheck all
                                setModulePermissions((prev) => ({
                                  ...prev,
                                  [module]: {
                                    ...DEFAULT_PERMISSIONS,
                                    all: false,
                                  },
                                }));
                              } else {
                                // Check all
                                setModulePermissions((prev) => ({
                                  ...prev,
                                  [module]: {
                                    create: true,
                                    read: true,
                                    update: true,
                                    delete: true,
                                    export: true,
                                    import: true,
                                    all: true,
                                  },
                                }));
                              }
                            });
                          }}
                          style={{ display: "none" }}
                          disabled={saving}
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
                              disabled={saving}
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
                                disabled={saving}
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
                              disabled={saving}
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
          disabled={saving}
        >
          Cancel
        </button>
        <button
          onClick={handleUpdate}
          disabled={saving || !roleName.trim()}
          style={{
            padding: "10px 32px",
            backgroundColor: saving ? "#93C5FD" : "#1F7FFF",
            color: "white",
            border: "none",
            borderRadius: "8px",
            fontSize: "14px",
            fontWeight: "500",
            fontFamily: "Inter",
            cursor: saving ? "not-allowed" : "pointer",
          }}
        >
          {saving ? "Updating..." : "Update Role"}
        </button>
      </div>
    </div>
  );
};

export default EditRole;
