import React, { useEffect, useMemo, useState } from "react";
import { toast } from "react-toastify";
import {
  getTenantById,
  getTenantEmployees,
  updateTenantModulePermissions,
} from "../../../../services/adminApi";
import {
  ALL_MODULES,
  DEFAULT_PERMISSIONS,
  GROUPED_MODULES,
} from "../../../../../utils/roleDefaults";

const groupedModules = GROUPED_MODULES;

const buildPermissions = (permissions = {}) => {
  return Object.keys(ALL_MODULES).reduce((acc, module) => {
    const current = permissions[module] || {};
    acc[module] = {
      export: Boolean(current.export),
      import: Boolean(current.import),
      create: Boolean(current.create),
      read: Boolean(current.read),
      update: Boolean(current.update),
      delete: Boolean(current.delete),
      all:
        (Boolean(current.export) &&
          Boolean(current.import) &&
          Boolean(current.create) &&
          Boolean(current.read) &&
          Boolean(current.update) &&
          Boolean(current.delete)) ||
        Boolean(current.all),
    };
    return acc;
  }, {});
};

const PermissionModuls = ({ companyId }) => {
  const [modulePermissions, setModulePermissions] = useState({});
  const [roles, setRoles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (!companyId) return;

    const fetchPermissions = async () => {
      setLoading(true);
      setError(null);

      try {
        const [company, employeesData] = await Promise.all([
          getTenantById(companyId),
          getTenantEmployees(companyId, { page: "1", limit: "1" }),
        ]);

        setModulePermissions(buildPermissions(company.modulePermissions || {}));
        setRoles(Array.isArray(employeesData.roles) ? employeesData.roles : []);
      } catch (err) {
        const message = err?.message || "Failed to load module permissions";
        setError(message);
        toast.error(message);
      } finally {
        setLoading(false);
      }
    };

    fetchPermissions();
  }, [companyId]);

  const availableModules = useMemo(() => Object.keys(ALL_MODULES), []);

  const visibleGroups = useMemo(
    () =>
      Object.entries(groupedModules)
        .map(([category, modules]) => ({
          category,
          modules: modules.filter((module) =>
            availableModules.includes(module),
          ),
        }))
        .filter((group) => group.modules.length > 0),
    [availableModules],
  );

  const isCategoryChecked = (modules) =>
    modules.every((module) => modulePermissions[module]?.all);

  const toggleCategoryAll = (modules) => {
    const allChecked = modules.every(
      (module) => modulePermissions[module]?.all,
    );
    setModulePermissions((prev) => {
      const next = { ...prev };
      modules.forEach((module) => {
        next[module] = {
          export: !allChecked,
          import: !allChecked,
          create: !allChecked,
          read: !allChecked,
          update: !allChecked,
          delete: !allChecked,
          all: !allChecked,
        };
      });
      return next;
    });
  };

  const toggleModuleAll = (module) => {
    setModulePermissions((prev) => {
      const current = prev[module] || { ...DEFAULT_PERMISSIONS, all: false };
      const nextAll = !current.all;
      return {
        ...prev,
        [module]: {
          export: nextAll,
          import: nextAll,
          create: nextAll,
          read: nextAll,
          update: nextAll,
          delete: nextAll,
          all: nextAll,
        },
      };
    });
  };

  const toggleModulePermission = (module, permission) => {
    setModulePermissions((prev) => {
      const current = prev[module] || { ...DEFAULT_PERMISSIONS, all: false };
      const updated = {
        ...current,
        [permission]: !current[permission],
      };
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

  const selectAllPermissions = () => {
    setModulePermissions((prev) => {
      const next = { ...prev };
      availableModules.forEach((module) => {
        next[module] = {
          export: true,
          import: true,
          create: true,
          read: true,
          update: true,
          delete: true,
          all: true,
        };
      });
      return next;
    });
  };

  const resetPermissions = () => {
    setModulePermissions((prev) => {
      const next = { ...prev };
      availableModules.forEach((module) => {
        next[module] = { ...DEFAULT_PERMISSIONS, all: false };
      });
      return next;
    });
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Only save modules that have at least one permission enabled
      const filteredPermissions = Object.fromEntries(
        Object.entries(modulePermissions).filter(([module, perms]) =>
          Object.values(perms).some(Boolean),
        ),
      );
      await updateTenantModulePermissions(companyId, filteredPermissions);
      toast.success("Company module permissions updated successfully");
    } catch (err) {
      toast.error(err?.message || "Failed to update module permissions");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="cdp-section-block">
      <div className="cdp-section-head">
        <span className="cdp-pill">Permission Modules</span>
      </div>
      <div className="cdp-section-body">
        {loading ? (
          <p>Loading module permissions and role data…</p>
        ) : error ? (
          <p className="cdp-empty-state">{error}</p>
        ) : (
          <>
            <div style={{ marginBottom: "15px" }}>
              <label
                style={{
                  display: "block",
                  fontWeight: 500,
                  marginBottom: "10px",
                }}
              >
                Plan Permissions
              </label>

              <div
                style={{ display: "flex", gap: "12px", marginBottom: "12px" }}
              >
                <button
                  onClick={selectAllPermissions}
                  type="button"
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#1F7FFF",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  Select All Permissions
                </button>
                <button
                  onClick={resetPermissions}
                  type="button"
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#F3F4F6",
                    color: "#374151",
                    border: "1px solid #D1D5DB",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                >
                  Reset All
                </button>
                <button
                  onClick={handleSave}
                  type="button"
                  style={{
                    padding: "10px 16px",
                    backgroundColor: "#22C55E",
                    color: "white",
                    border: "none",
                    borderRadius: "8px",
                    cursor: "pointer",
                    fontWeight: "500",
                  }}
                  disabled={saving}
                >
                  {saving ? "Saving..." : "Update Permissions"}
                </button>
              </div>

              <div
                style={{
                  borderRadius: "16px",
                  overflow: "hidden",
                  border: "1px solid #E5E7EB",
                }}
              >
                {visibleGroups.length === 0 ? (
                  <div style={{ padding: "16px" }}>
                    No permissions available for this company.
                  </div>
                ) : (
                  visibleGroups.map(({ category, modules }) => (
                    <div key={category} style={{ marginBottom: "24px" }}>
                      <div
                        style={{
                          backgroundColor: "#F3F8FB",
                          padding: "12px 16px",
                          display: "flex",
                          alignItems: "center",
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
                              checked={isCategoryChecked(modules)}
                              onChange={() => toggleCategoryAll(modules)}
                              style={{ display: "none" }}
                            />
                            <div
                              style={{
                                width: "18px",
                                height: "18px",
                                borderRadius: "4px",
                                border: `2px solid ${isCategoryChecked(modules) ? "#1F7FFF" : "#A2A8B8"}`,
                                backgroundColor: isCategoryChecked(modules)
                                  ? "#1F7FFF"
                                  : "white",
                                position: "relative",
                                display: "flex",
                                alignItems: "center",
                                justifyContent: "center",
                              }}
                            >
                              {isCategoryChecked(modules) && (
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
                        <div style={{ width: "150px", textAlign: "left" }}>
                          {category}
                        </div>
                        <div style={{ flex: 1, textAlign: "center" }}>
                          Create
                        </div>
                        <div style={{ flex: 1, textAlign: "center" }}>Read</div>
                        <div style={{ flex: 1, textAlign: "center" }}>
                          Update
                        </div>
                        <div style={{ flex: 1, textAlign: "center" }}>
                          Delete
                        </div>
                        <div style={{ flex: 1, textAlign: "center" }}>
                          Export
                        </div>
                        <div style={{ flex: 1, textAlign: "center" }}>
                          Import
                        </div>
                        <div style={{ flex: 1, textAlign: "center" }}>All</div>
                      </div>

                      {modules.map((module) => {
                        const permissions = modulePermissions[module] || {
                          ...DEFAULT_PERMISSIONS,
                          all: false,
                        };
                        const isEnabled =
                          Object.values(permissions).some(Boolean);
                        return (
                          <div
                            key={module}
                            style={{
                              display: "flex",
                              alignItems: "center",
                              padding: "12px 16px",
                              backgroundColor: isEnabled ? "white" : "#F9FAFB",
                              borderTop: "1px solid #FCFCFC",
                              opacity: isEnabled ? 1 : 0.6,
                            }}
                          >
                            <div
                              style={{
                                width: "50px",
                                display: "flex",
                                justifyContent: "center",
                              }}
                            >
                              <label
                                style={{
                                  cursor: isEnabled ? "pointer" : "not-allowed",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={permissions.all}
                                  onChange={() =>
                                    isEnabled && toggleModuleAll(module)
                                  }
                                  style={{ display: "none" }}
                                  disabled={!isEnabled}
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
                                    opacity: isEnabled ? 1 : 0.5,
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
                                width: "150px",
                                textAlign: "left",
                                fontSize: "14px",
                                color: isEnabled ? "#0E101A" : "#9CA3AF",
                              }}
                            >
                              {module} {!isEnabled && "(Disabled)"}
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
                                key={`${module}-${perm}`}
                                style={{
                                  flex: 1,
                                  display: "flex",
                                  justifyContent: "center",
                                }}
                              >
                                <label
                                  style={{
                                    cursor: isEnabled
                                      ? "pointer"
                                      : "not-allowed",
                                  }}
                                >
                                  <input
                                    type="checkbox"
                                    checked={permissions[perm]}
                                    onChange={() =>
                                      isEnabled &&
                                      toggleModulePermission(module, perm)
                                    }
                                    style={{ display: "none" }}
                                    disabled={!isEnabled}
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
                                      opacity: isEnabled ? 1 : 0.5,
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
                                        left: permissions[perm]
                                          ? "18px"
                                          : "2px",
                                        transition: "left 0.2s",
                                      }}
                                    />
                                  </div>
                                </label>
                              </div>
                            ))}

                            <div
                              style={{
                                flex: 1,
                                display: "flex",
                                justifyContent: "center",
                              }}
                            >
                              <label
                                style={{
                                  cursor: isEnabled ? "pointer" : "not-allowed",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={permissions.all}
                                  onChange={() =>
                                    isEnabled && toggleModuleAll(module)
                                  }
                                  style={{ display: "none" }}
                                  disabled={!isEnabled}
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
                                    opacity: isEnabled ? 1 : 0.5,
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
                  ))
                )}
              </div>
            </div>

            <div className="cdp-section-block">
              <div className="cdp-section-head">
                <span className="cdp-pill">Tenant Roles</span>
              </div>
              <div className="cdp-section-body">
                {roles.length === 0 ? (
                  <p className="cdp-empty-state">
                    No roles found for this company.
                  </p>
                ) : (
                  <ul style={{ paddingLeft: 16, margin: 0 }}>
                    {roles.map((role, index) => {
                      const label =
                        typeof role === "string"
                          ? role
                          : role?.name || role?.role || "Unknown role";
                      return (
                        <li
                          key={`${label}-${index}`}
                          style={{ marginBottom: 6 }}
                        >
                          {label}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PermissionModuls;
