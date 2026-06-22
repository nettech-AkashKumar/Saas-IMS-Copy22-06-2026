import React, { useState } from "react";
import { FiX, FiPlus } from "react-icons/fi";
import PricingDesign from "./PricingDesign";
import * as adminApi from "../../../../services/adminApi";
import BASE_URL from "../../../../services/config/config";
import {
  ALL_MODULES,
  DEFAULT_PERMISSIONS,
  GROUPED_MODULES,
} from "../../../../../utils/roleDefaults";

const initializeModulePermissions = (existing = {}) => {
  return Object.keys(ALL_MODULES).reduce((acc, module) => {
    if (isFixedModule(module)) {
      acc[module] = { ...FIXED_PERMISSIONS };
      return acc;
    }

    const current = existing[module] || {};
    acc[module] = {
      export: !!current.export,
      import: !!current.import,
      create: !!current.create,
      read: !!current.read,
      update: !!current.update,
      delete: !!current.delete,
      all: !!current.all,
    };
    return acc;
  }, {});
};

const groupedModules = GROUPED_MODULES;

const FIXED_PLAN_MODULES = [
  "Dashboard",
  "Users",
  "Settings",
  "CompanySettings",
  "BankDetails",
];

const FIXED_PERMISSIONS = {
  export: true,
  import: true,
  create: true,
  read: true,
  update: true,
  delete: true,
  all: true,
};

const isFixedModule = (module) => FIXED_PLAN_MODULES.includes(module);

export default function PricingEditor({ initialPlan, onSave, onCancel }) {
  const [plan, setPlan] = useState(
    initialPlan
      ? {
          ...initialPlan,
          modulePermissions: initializeModulePermissions(
            initialPlan.modulePermissions,
          ),
        }
      : {
          name: "",
          title: "",
          price: "",
          currencySymbol: "₹",
          description: "",
          offerType: "none",
          offerValue: 0,
          features: [{ name: "", included: true }],
          recommended: false,
          buttonText: "Get Started",
          buttonUrl: "#",
          displayOrder: 0,
          modulePermissions: initializeModulePermissions(),
        },
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [pendingPlanData, setPendingPlanData] = useState(null);

  const handleSave = async () => {
    try {
      setError("");
      setSaving(true);

      if (!plan.name?.trim()) {
        throw new Error("Plan name is required");
      }
      if (!plan.title?.trim()) {
        throw new Error("Title is required");
      }
      if (!plan.price?.trim()) {
        throw new Error("Price is required");
      }

      // Filter modulePermissions - only include modules that have at least one permission enabled
      const filteredPermissions = Object.keys(
        plan.modulePermissions || {},
      ).reduce((acc, module) => {
        const perms = plan.modulePermissions[module];
        const hasAnyPermission =
          perms.create ||
          perms.read ||
          perms.update ||
          perms.delete ||
          perms.export ||
          perms.import ||
          perms.all;

        if (hasAnyPermission) {
          acc[module] = perms;
        }
        return acc;
      }, {});

      const payload = {
        ...plan,
        features: plan.features || [],
        modulePermissions: filteredPermissions, // Only selected modules
      };

      if (initialPlan?._id) {
        // Update - require password verification
        setPendingPlanData(payload);
        setShowPasswordModal(true);
        setSaving(false);
        return;
      } else {
        // Create
        await adminApi.createPricing(payload);
      }

      onSave();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
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

      if (response.ok) {
        // Password verified - now update the plan
        await adminApi.updatePricing(initialPlan._id, pendingPlanData);
        alert("Pricing plan updated successfully!");
        onSave();
        setShowPasswordModal(false);
        setPassword("");
        setPendingPlanData(null);
      } else {
        const data = await response.json();
        setPasswordError(data.message || "Invalid password");
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
    setPendingPlanData(null);
  };

  const addFeature = () => {
    setPlan({
      ...plan,
      features: [...(plan.features || []), { name: "", included: true }],
    });
  };

  const removeFeature = (index) => {
    setPlan({
      ...plan,
      features: plan.features.filter((_, i) => i !== index),
    });
  };

  const updateFeature = (index, field, value) => {
    const newFeatures = [...(plan.features || [])];
    newFeatures[index] = { ...newFeatures[index], [field]: value };
    setPlan({ ...plan, features: newFeatures });
  };

  const toggleModulePermission = (module, permission) => {
    if (isFixedModule(module)) return;

    setPlan((prevState) => {
      const current = prevState.modulePermissions?.[module] || {
        ...DEFAULT_PERMISSIONS,
        all: false,
      };
      const updated = {
        ...current,
        [permission]: !current[permission],
      };
      updated.all =
        updated.read &&
        updated.create &&
        updated.update &&
        updated.delete &&
        updated.import &&
        updated.export;

      return {
        ...prevState,
        modulePermissions: {
          ...prevState.modulePermissions,
          [module]: updated,
        },
      };
    });
  };

  const toggleModuleAll = (module) => {
    if (isFixedModule(module)) return;

    setPlan((prevState) => {
      const current = prevState.modulePermissions?.[module] || {
        ...DEFAULT_PERMISSIONS,
        all: false,
      };
      const newAll = !current.all;
      return {
        ...prevState,
        modulePermissions: {
          ...prevState.modulePermissions,
          [module]: {
            export: newAll,
            import: newAll,
            create: newAll,
            read: newAll,
            update: newAll,
            delete: newAll,
            all: newAll,
          },
        },
      };
    });
  };

  const selectAllPermissions = () => {
    setPlan((prevState) => {
      const allPermissions = {};
      Object.keys(ALL_MODULES).forEach((module) => {
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
      return { ...prevState, modulePermissions: allPermissions };
    });
  };

  const resetPermissions = () => {
    setPlan((prevState) => {
      const defaultPermissions = {};
      Object.keys(ALL_MODULES).forEach((module) => {
        defaultPermissions[module] = isFixedModule(module)
          ? { ...FIXED_PERMISSIONS }
          : { ...DEFAULT_PERMISSIONS, all: false };
      });
      return { ...prevState, modulePermissions: defaultPermissions };
    });
  };

  const toggleCategoryAll = (category, modules) => {
    setPlan((prevState) => {
      const allChecked = modules.every(
        (m) => prevState.modulePermissions?.[m]?.all,
      );
      const updatedPerms = { ...prevState.modulePermissions };
      modules.forEach((module) => {
        if (isFixedModule(module)) {
          updatedPerms[module] = { ...FIXED_PERMISSIONS };
          return;
        }

        if (allChecked) {
          updatedPerms[module] = { ...DEFAULT_PERMISSIONS, all: false };
        } else {
          updatedPerms[module] = {
            create: true,
            read: true,
            update: true,
            delete: true,
            export: true,
            import: true,
            all: true,
          };
        }
      });
      return { ...prevState, modulePermissions: updatedPerms };
    });
  };

  const isCategoryChecked = (modules) => {
    return modules.every((m) => plan.modulePermissions?.[m]?.all);
  };

  const inputStyle = {
    width: "100%",
    padding: "12px 14px",
    border: "1px solid #D1D5DB",
    borderRadius: "10px",
    fontSize: "14px",
    outline: "none",
    fontFamily: "inherit",
    backgroundColor: "#fff",
    boxSizing: "border-box",
  };

  const [showPermissionsModal, setShowPermissionsModal] = useState(false);

  const selectedModules = Object.keys(plan.modulePermissions || {}).filter(
    (module) => plan.modulePermissions[module]?.all,
  );

  return (
    <>
      {/* PASSWORD MODAL */}
      {showPasswordModal && (
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
              padding: 40,
              borderRadius: 12,
              boxShadow: "0 10px 40px rgba(0,0,0,0.2)",
              maxWidth: 400,
              width: "90%",
              textAlign: "center",
            }}
          >
            <h2 style={{ marginBottom: 20, color: "#1d4ed8" }}>
              Verify Password
            </h2>
            <p style={{ color: "#6b7280", marginBottom: 24 }}>
              Enter super admin password to update this pricing plan
            </p>

            <form onSubmit={handlePasswordSubmit}>
              <input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={verifying}
                style={{
                  width: "100%",
                  padding: "12px 16px",
                  borderRadius: 8,
                  border: "1px solid #d1d5db",
                  fontSize: 14,
                  marginBottom: 12,
                  boxSizing: "border-box",
                }}
                autoFocus
              />

              {passwordError && (
                <p
                  style={{
                    color: "#dc3545",
                    fontSize: 12,
                    marginBottom: 12,
                  }}
                >
                  {passwordError}
                </p>
              )}

              <div style={{ display: "flex", gap: 12 }}>
                <button
                  type="button"
                  onClick={closePasswordModal}
                  disabled={verifying}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    background: "#e5e7eb",
                    color: "#374151",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: verifying ? "not-allowed" : "pointer",
                    opacity: verifying ? 0.6 : 1,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={verifying || !password}
                  style={{
                    flex: 1,
                    padding: "12px 16px",
                    background: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: 8,
                    fontSize: 14,
                    fontWeight: 600,
                    cursor: verifying || !password ? "not-allowed" : "pointer",
                    opacity: verifying || !password ? 0.6 : 1,
                  }}
                >
                  {verifying ? "Verifying..." : "Verify & Update"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 420px",
          gap: "24px",
          alignItems: "start",
          marginTop: "20px",
          position: "relative",
        }}
      >
        {/* LEFT SIDE FORM */}
        <div
          style={{
            backgroundColor: "#ffffff",
            padding: "24px",
            borderRadius: "18px",
            border: "1px solid #E5E7EB",
            boxShadow: "0 2px 10px rgba(0,0,0,0.04)",
          }}
        >
          <h2
            style={{
              marginBottom: "24px",
              fontSize: "24px",
              fontWeight: "700",
              color: "#111827",
            }}
          >
            {initialPlan?._id ? "Edit Pricing Plan" : "Create Pricing Plan"}
          </h2>

          {error && (
            <div
              style={{
                color: "#DC2626",
                marginBottom: "16px",
                padding: "12px",
                backgroundColor: "#FEF2F2",
                borderRadius: "8px",
                border: "1px solid #FECACA",
              }}
            >
              {error}
            </div>
          )}

          {/* FORM GRID */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: "18px",
            }}
          >
            {/* PLAN NAME */}
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "600",
                  marginBottom: "6px",
                  color: "#374151",
                }}
              >
                Plan Name *
              </label>

              <input
                type="text"
                value={plan.name}
                onChange={(e) => setPlan({ ...plan, name: e.target.value })}
                placeholder="Starter"
                style={inputStyle}
              />
            </div>

            {/* DISPLAY TITLE */}
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "600",
                  marginBottom: "6px",
                  color: "#374151",
                }}
              >
                Display Title *
              </label>

              <input
                type="text"
                value={plan.title}
                onChange={(e) => setPlan({ ...plan, title: e.target.value })}
                placeholder="Starter Plan"
                style={inputStyle}
              />
            </div>

            {/* PRICE */}
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "600",
                  marginBottom: "6px",
                  color: "#374151",
                }}
              >
                Monthly Price *
              </label>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "10px",
                }}
              >
                <select
                  value={plan.currencySymbol}
                  onChange={(e) =>
                    setPlan({
                      ...plan,
                      currencySymbol: e.target.value,
                    })
                  }
                  style={{
                    ...inputStyle,
                    width: "90px",
                  }}
                >
                  <option value="₹">₹</option>
                  <option value="$">$</option>
                  <option value="€">€</option>
                  <option value="£">£</option>
                </select>

                <input
                  type="text"
                  value={plan.price}
                  onChange={(e) => setPlan({ ...plan, price: e.target.value })}
                  placeholder="5000"
                  style={{
                    ...inputStyle,
                    flex: 1,
                  }}
                />
              </div>
            </div>

            {/* BUTTON TEXT */}
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "600",
                  marginBottom: "6px",
                  color: "#374151",
                }}
              >
                Button Text
              </label>

              <input
                type="text"
                value={plan.buttonText}
                onChange={(e) =>
                  setPlan({
                    ...plan,
                    buttonText: e.target.value,
                  })
                }
                placeholder="Get Started"
                style={inputStyle}
              />
            </div>

            {/* BUTTON URL */}
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "600",
                  marginBottom: "6px",
                  color: "#374151",
                }}
              >
                Button URL
              </label>

              <input
                type="url"
                value={plan.buttonUrl}
                onChange={(e) =>
                  setPlan({
                    ...plan,
                    buttonUrl: e.target.value,
                  })
                }
                placeholder="https://example.com"
                style={inputStyle}
              />
            </div>
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "600",
                  marginBottom: "6px",
                  color: "#374151",
                }}
              >
                Offer Type
              </label>

              <select
                value={plan.offerType}
                onChange={(e) =>
                  setPlan({
                    ...plan,
                    offerType: e.target.value,
                  })
                }
                style={inputStyle}
              >
                <option value="none">No Offer</option>
                <option value="fixed">Fixed Amount</option>
                <option value="percentage">Percentage Discount</option>
              </select>
            </div>

            {/* OFFER VALUE */}
            {plan.offerType !== "none" && (
              <div>
                <label
                  style={{
                    display: "block",
                    fontWeight: "600",
                    marginBottom: "6px",
                    color: "#374151",
                  }}
                >
                  Offer Value
                </label>

                <input
                  type="number"
                  value={plan.offerValue}
                  onChange={(e) =>
                    setPlan({
                      ...plan,
                      offerValue: parseFloat(e.target.value) || 0,
                    })
                  }
                  style={inputStyle}
                />
              </div>
            )}

            {/* DISPLAY ORDER */}
            <div>
              <label
                style={{
                  display: "block",
                  fontWeight: "600",
                  marginBottom: "6px",
                  color: "#374151",
                }}
              >
                Display Order
              </label>

              <input
                type="number"
                value={plan.displayOrder}
                onChange={(e) =>
                  setPlan({
                    ...plan,
                    displayOrder: parseInt(e.target.value),
                  })
                }
                style={inputStyle}
              />
            </div>
          </div>

          {/* DESCRIPTION */}
          <div style={{ marginTop: "20px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "6px",
                color: "#374151",
              }}
            >
              Description
            </label>

            <textarea
              value={plan.description}
              onChange={(e) =>
                setPlan({
                  ...plan,
                  description: e.target.value,
                })
              }
              placeholder="Describe this pricing plan..."
              style={{
                ...inputStyle,
                minHeight: "100px",
                resize: "vertical",
              }}
            />
          </div>

          {/* RECOMMENDED */}
          <div
            style={{
              marginTop: "20px",
              display: "flex",
              alignItems: "center",
              gap: "10px",
            }}
          >
            <input
              type="checkbox"
              checked={plan.recommended}
              onChange={(e) =>
                setPlan({
                  ...plan,
                  recommended: e.target.checked,
                })
              }
            />

            <label
              style={{
                fontWeight: "600",
                color: "#374151",
              }}
            >
              Mark as Recommended
            </label>
          </div>

          {/* FEATURES */}
          <div style={{ marginTop: "30px" }}>
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "12px",
              }}
            >
              <h3
                style={{
                  fontSize: "18px",
                  fontWeight: "700",
                  color: "#111827",
                }}
              >
                Features
              </h3>

              <button
                onClick={addFeature}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: "6px",
                  backgroundColor: "#1F7FFF",
                  color: "white",
                  border: "none",
                  borderRadius: "8px",
                  padding: "8px 14px",
                  cursor: "pointer",
                  fontWeight: "600",
                }}
              >
                <FiPlus size={16} />
                Add Feature
              </button>
            </div>

            {plan.features?.map((feature, index) => (
              <div
                key={index}
                style={{
                  display: "flex",
                  gap: "10px",
                  marginBottom: "10px",
                }}
              >
                <input
                  type="text"
                  value={feature.name}
                  onChange={(e) => updateFeature(index, "name", e.target.value)}
                  placeholder="Feature name"
                  style={{
                    ...inputStyle,
                    flex: 1,
                  }}
                />

                <button
                  onClick={() => removeFeature(index)}
                  style={{
                    width: "42px",
                    height: "42px",
                    backgroundColor: "#EF4444",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                  }}
                >
                  <FiX size={18} />
                </button>
              </div>
            ))}
          </div>

          {/* Module Permission Button */}
          <div style={{ marginTop: "20px", marginBottom: "20px" }}>
            <label
              style={{
                display: "block",
                fontWeight: "600",
                marginBottom: "10px",
                color: "#374151",
              }}
            >
              Selected Modules
            </label>

            <div
              style={{
                display: "flex",
                gap: "10px",
                flexWrap: "wrap",
                marginBottom: "12px",
              }}
            >
              {selectedModules.length > 0 ? (
                selectedModules.map((module) => (
                  <div
                    key={module}
                    style={{
                      padding: "8px 14px",
                      backgroundColor: "#EFF6FF",
                      color: "#1D4ED8",
                      borderRadius: "999px",
                      fontSize: "13px",
                      fontWeight: "600",
                      border: "1px solid #BFDBFE",
                    }}
                  >
                    {module}
                  </div>
                ))
              ) : (
                <span
                  style={{
                    fontSize: "14px",
                    color: "#9CA3AF",
                  }}
                >
                  No module selected
                </span>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowPermissionsModal(true)}
              style={{
                padding: "12px 18px",
                backgroundColor: "#1F7FFF",
                color: "white",
                border: "none",
                borderRadius: "10px",
                cursor: "pointer",
                fontWeight: "600",
                fontSize: "14px",
                boxShadow: "0 4px 10px rgba(31,127,255,0.2)",
              }}
            >
              Manage Module Permissions
            </button>
          </div>

          {/* BUTTONS */}
          <div
            style={{
              display: "flex",
              gap: "12px",
              marginTop: "30px",
            }}
          >
            <button
              onClick={handleSave}
              disabled={saving}
              style={{
                flex: 1,
                padding: "14px",
                backgroundColor: saving ? "#9CA3AF" : "#1F7FFF",
                color: "white",
                border: "none",
                borderRadius: "12px",
                cursor: saving ? "not-allowed" : "pointer",
                fontWeight: "700",
                fontSize: "15px",
              }}
            >
              {saving
                ? "Saving..."
                : initialPlan?._id
                  ? "Update Plan"
                  : "Create Plan"}
            </button>

            <button
              onClick={onCancel}
              style={{
                flex: 1,
                padding: "14px",
                backgroundColor: "#F3F4F6",
                color: "#374151",
                border: "1px solid #D1D5DB",
                borderRadius: "12px",
                cursor: "pointer",
                fontWeight: "700",
                fontSize: "15px",
              }}
            >
              Cancel
            </button>
          </div>
        </div>

        {/* RIGHT SIDE PREVIEW */}
        <div
          style={{
            position: "sticky",
            top: "20px",
            alignSelf: "start",
          }}
        >
          <PricingDesign plan={plan} />
        </div>

        {/* MODULE PERMISSION MODAL */}
        {showPermissionsModal && (
          <div
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              width: "100%",
              height: "100%",
              backgroundColor: "rgba(0,0,0,0.45)",
              zIndex: 9999,
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              padding: "20px",
            }}
          >
            <div
              style={{
                width: "100%",
                maxWidth: "1200px",
                maxHeight: "90vh",
                overflow: "hidden",
                backgroundColor: "#fff",
                borderRadius: "20px",
                display: "flex",
                flexDirection: "column",
                boxShadow: "0 10px 40px rgba(0,0,0,0.15)",
              }}
            >
              {/* HEADER */}
              <div
                style={{
                  padding: "18px 24px",
                  borderBottom: "1px solid #E5E7EB",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <h2
                  style={{
                    margin: 0,
                    fontSize: "22px",
                    fontWeight: "700",
                    color: "#111827",
                  }}
                >
                  Manage Module Permissions
                </h2>

                <button
                  onClick={() => setShowPermissionsModal(false)}
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    border: "none",
                    backgroundColor: "#F3F4F6",
                    cursor: "pointer",
                    fontSize: "20px",
                    fontWeight: "bold",
                  }}
                >
                  ×
                </button>
              </div>

              {/* ACTIONS */}
              <div
                style={{
                  padding: "18px 24px",
                  display: "flex",
                  gap: "12px",
                  borderBottom: "1px solid #F3F4F6",
                }}
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
                    fontWeight: "600",
                  }}
                >
                  Select All
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
                    fontWeight: "600",
                  }}
                >
                  Reset
                </button>
              </div>

              {/* BODY */}
              <div
                style={{
                  padding: "20px",
                  overflowY: "auto",
                  overflowX: "auto",
                }}
              >
                <div
                  style={{
                    minWidth: "1100px",
                    border: "1px solid #E5E7EB",
                    borderRadius: "16px",
                    overflow: "hidden",
                  }}
                >
                  {Object.entries(groupedModules).map(([category, modules]) => (
                    <div key={category}>
                      {/* HEADER */}
                      <div
                        style={{
                          backgroundColor: "#F8FAFC",
                          padding: "14px 18px",
                          display: "grid",
                          gridTemplateColumns: "60px 180px repeat(7, 1fr)",
                          alignItems: "center",
                          fontWeight: "600",
                          color: "#6B7280",
                          borderBottom: "1px solid #E5E7EB",
                        }}
                      >
                        <div
                          style={{
                            display: "flex",
                            justifyContent: "center",
                          }}
                        >
                          <input
                            type="checkbox"
                            checked={isCategoryChecked(modules)}
                            onChange={() =>
                              toggleCategoryAll(category, modules)
                            }
                          />
                        </div>

                        <div>{category}</div>

                        {[
                          "Create",
                          "Read",
                          "Update",
                          "Delete",
                          "Export",
                          "Import",
                          "All",
                        ].map((item) => (
                          <div key={item} style={{ textAlign: "center" }}>
                            {item}
                          </div>
                        ))}
                      </div>

                      {/* ROWS */}
                      {modules.map((module) => {
                        const permissions = plan.modulePermissions?.[
                          module
                        ] || {
                          ...DEFAULT_PERMISSIONS,
                          all: false,
                        };

                        return (
                          <div
                            key={module}
                            style={{
                              display: "grid",
                              gridTemplateColumns: "60px 180px repeat(7, 1fr)",
                              alignItems: "center",
                              padding: "14px 18px",
                              borderBottom: "1px solid #F3F4F6",
                            }}
                          >
                            {/* MODULE CHECK */}
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "center",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={permissions.all}
                                disabled={isFixedModule(module)}
                                onChange={() => toggleModuleAll(module)}
                              />
                            </div>

                            {/* MODULE NAME */}
                            <div
                              style={{
                                fontWeight: "500",
                                color: "#111827",
                              }}
                            >
                              {module}
                            </div>

                            {/* PERMISSIONS */}
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
                                  display: "flex",
                                  justifyContent: "center",
                                }}
                              >
                                <input
                                  type="checkbox"
                                  checked={permissions[perm]}
                                  disabled={isFixedModule(module)}
                                  onChange={() =>
                                    toggleModulePermission(module, perm)
                                  }
                                />
                              </div>
                            ))}

                            {/* ALL */}
                            <div
                              style={{
                                display: "flex",
                                justifyContent: "center",
                              }}
                            >
                              <input
                                type="checkbox"
                                checked={permissions.all}
                                disabled={isFixedModule(module)}
                                onChange={() => toggleModuleAll(module)}
                              />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}
                </div>
              </div>

              {/* FOOTER */}
              <div
                style={{
                  padding: "18px 24px",
                  borderTop: "1px solid #E5E7EB",
                  display: "flex",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  onClick={() => setShowPermissionsModal(false)}
                  style={{
                    padding: "12px 18px",
                    backgroundColor: "#1F7FFF",
                    color: "white",
                    border: "none",
                    borderRadius: "10px",
                    cursor: "pointer",
                    fontWeight: "600",
                  }}
                >
                  Done
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );

  // return (
  //   <div
  //     style={{
  //       display: "grid",
  //       gridTemplateColumns: "1fr 1fr",
  //       gap: "20px",
  //       marginTop: "20px",
  //     }}
  //   >
  //     {/* Form */}
  //     <div
  //       style={{
  //         backgroundColor: "#fff",
  //         padding: "20px",
  //         borderRadius: "8px",
  //         border: "1px solid #ddd",
  //       }}
  //     >
  //       <h3 style={{ marginBottom: "15px" }}>
  //         {initialPlan?._id ? "Edit Pricing Plan" : "Create Pricing Plan"}
  //       </h3>

  //       {error && (
  //         <div
  //           style={{
  //             color: "red",
  //             marginBottom: "10px",
  //             padding: "10px",
  //             backgroundColor: "#ffe0e0",
  //             borderRadius: "4px",
  //           }}
  //         >
  //           {error}
  //         </div>
  //       )}

  //       {/* Name */}
  //       <div style={{ marginBottom: "15px" }}>
  //         <label
  //           style={{ display: "block", fontWeight: "500", marginBottom: "5px" }}
  //         >
  //           Plan Name *
  //         </label>
  //         <input
  //           type="text"
  //           value={plan.name}
  //           onChange={(e) => setPlan({ ...plan, name: e.target.value })}
  //           placeholder="e.g., Starter, Professional, Enterprise"
  //           style={{
  //             width: "100%",
  //             padding: "8px",
  //             border: "1px solid #ddd",
  //             borderRadius: "4px",
  //             fontFamily: "inherit",
  //           }}
  //         />
  //       </div>

  //       {/* Title */}
  //       <div style={{ marginBottom: "15px" }}>
  //         <label
  //           style={{ display: "block", fontWeight: "500", marginBottom: "5px" }}
  //         >
  //           Display Title *
  //         </label>
  //         <input
  //           type="text"
  //           value={plan.title}
  //           onChange={(e) => setPlan({ ...plan, title: e.target.value })}
  //           placeholder="e.g., Starter Plan"
  //           style={{
  //             width: "100%",
  //             padding: "8px",
  //             border: "1px solid #ddd",
  //             borderRadius: "4px",
  //             fontFamily: "inherit",
  //           }}
  //         />
  //       </div>

  //       {/* Currency Symbol */}
  //       <div style={{ marginBottom: "15px" }}>
  //         <label
  //           style={{ display: "block", fontWeight: "500", marginBottom: "5px" }}
  //         >
  //           Currency Symbol
  //         </label>
  //         <select
  //           value={plan.currencySymbol}
  //           onChange={(e) =>
  //             setPlan({ ...plan, currencySymbol: e.target.value })
  //           }
  //           style={{
  //             width: "100%",
  //             padding: "8px",
  //             border: "1px solid #ddd",
  //             borderRadius: "4px",
  //             fontFamily: "inherit",
  //           }}
  //         >
  //           <option value="₹">₹ Indian Rupee</option>
  //           <option value="$">$ US Dollar</option>
  //           <option value="€">€ Euro</option>
  //           <option value="£">£ British Pound</option>
  //           <option value="¥">¥ Chinese Yuan</option>
  //         </select>
  //       </div>

  //       {/* Price */}
  //       <div style={{ marginBottom: "15px" }}>
  //         <label
  //           style={{ display: "block", fontWeight: "500", marginBottom: "5px" }}
  //         >
  //           Monthly Price *
  //           <span style={{ fontSize: "12px", color: "#999" }}>
  //             {" "}
  //             (Yearly auto-calculates with 15% discount)
  //           </span>
  //         </label>
  //         <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
  //           <span style={{ fontWeight: "500", fontSize: "14px" }}>
  //             {plan.currencySymbol}
  //           </span>
  //           <input
  //             type="text"
  //             value={plan.price}
  //             onChange={(e) => setPlan({ ...plan, price: e.target.value })}
  //             placeholder="e.g., 5000 or 99"
  //             style={{
  //               flex: 1,
  //               padding: "8px",
  //               border: "1px solid #ddd",
  //               borderRadius: "4px",
  //               fontFamily: "inherit",
  //             }}
  //           />
  //         </div>
  //       </div>

  //       {/* Description */}
  //       <div style={{ marginBottom: "15px" }}>
  //         <label
  //           style={{ display: "block", fontWeight: "500", marginBottom: "5px" }}
  //         >
  //           Description
  //         </label>
  //         <textarea
  //           value={plan.description}
  //           onChange={(e) => setPlan({ ...plan, description: e.target.value })}
  //           placeholder="Describe this plan"
  //           style={{
  //             width: "100%",
  //             padding: "8px",
  //             border: "1px solid #ddd",
  //             borderRadius: "4px",
  //             fontFamily: "inherit",
  //             minHeight: "60px",
  //           }}
  //         />
  //       </div>

  //       {/* Button Text */}
  //       <div style={{ marginBottom: "15px" }}>
  //         <label
  //           style={{ display: "block", fontWeight: "500", marginBottom: "5px" }}
  //         >
  //           Button Text
  //         </label>
  //         <input
  //           type="text"
  //           value={plan.buttonText}
  //           onChange={(e) => setPlan({ ...plan, buttonText: e.target.value })}
  //           placeholder="e.g., Get Started"
  //           style={{
  //             width: "100%",
  //             padding: "8px",
  //             border: "1px solid #ddd",
  //             borderRadius: "4px",
  //             fontFamily: "inherit",
  //           }}
  //         />
  //       </div>

  //       {/* Offer Type */}
  //       <div style={{ marginBottom: "15px" }}>
  //         <label
  //           style={{ display: "block", fontWeight: "500", marginBottom: "5px" }}
  //         >
  //           Offer Type
  //         </label>
  //         <select
  //           value={plan.offerType}
  //           onChange={(e) => setPlan({ ...plan, offerType: e.target.value })}
  //           style={{
  //             width: "100%",
  //             padding: "8px",
  //             border: "1px solid #ddd",
  //             borderRadius: "4px",
  //             fontFamily: "inherit",
  //           }}
  //         >
  //           <option value="none">No Offer</option>
  //           <option value="fixed">Fixed Amount</option>
  //           <option value="percentage">Percentage Discount</option>
  //         </select>
  //       </div>

  //       {/* Offer Value */}
  //       {plan.offerType !== "none" && (
  //         <div style={{ marginBottom: "15px" }}>
  //           <label
  //             style={{
  //               display: "block",
  //               fontWeight: "500",
  //               marginBottom: "5px",
  //             }}
  //           >
  //             Offer Value
  //             <span style={{ fontSize: "12px", color: "#999" }}>
  //               {" "}
  //               {plan.offerType === "fixed" ? "(amount)" : "(%)"}
  //             </span>
  //           </label>
  //           <input
  //             type="number"
  //             value={plan.offerValue}
  //             onChange={(e) =>
  //               setPlan({
  //                 ...plan,
  //                 offerValue: parseFloat(e.target.value) || 0,
  //               })
  //             }
  //             placeholder={
  //               plan.offerType === "fixed" ? "e.g., 500" : "e.g., 15"
  //             }
  //             min="0"
  //             step={plan.offerType === "fixed" ? "100" : "1"}
  //             style={{
  //               width: "100%",
  //               padding: "8px",
  //               border: "1px solid #ddd",
  //               borderRadius: "4px",
  //               fontFamily: "inherit",
  //             }}
  //           />
  //         </div>
  //       )}

  //       {/* Recommended */}
  //       <div
  //         style={{
  //           marginBottom: "15px",
  //           display: "flex",
  //           alignItems: "center",
  //         }}
  //       >
  //         <input
  //           type="checkbox"
  //           checked={plan.recommended}
  //           onChange={(e) =>
  //             setPlan({ ...plan, recommended: e.target.checked })
  //           }
  //           style={{ marginRight: "8px", cursor: "pointer" }}
  //         />
  //         <label style={{ cursor: "pointer", fontWeight: "500" }}>
  //           Mark as Recommended
  //         </label>
  //       </div>

  //       {/* Display Order */}
  //       <div style={{ marginBottom: "15px" }}>
  //         <label
  //           style={{ display: "block", fontWeight: "500", marginBottom: "5px" }}
  //         >
  //           Display Order
  //         </label>
  //         <input
  //           type="number"
  //           value={plan.displayOrder}
  //           onChange={(e) =>
  //             setPlan({ ...plan, displayOrder: parseInt(e.target.value) })
  //           }
  //           style={{
  //             width: "100%",
  //             padding: "8px",
  //             border: "1px solid #ddd",
  //             borderRadius: "4px",
  //             fontFamily: "inherit",
  //           }}
  //         />
  //       </div>

  //       {/* Features */}
  //       <div style={{ marginBottom: "15px" }}>
  //         <label
  //           style={{
  //             display: "block",
  //             fontWeight: "500",
  //             marginBottom: "10px",
  //           }}
  //         >
  //           Features
  //         </label>

  //         {plan.features?.map((feature, index) => (
  //           <div
  //             key={index}
  //             style={{
  //               display: "flex",
  //               gap: "8px",
  //               marginBottom: "8px",
  //               alignItems: "center",
  //             }}
  //           >
  //             <input
  //               type="text"
  //               value={feature.name}
  //               onChange={(e) => updateFeature(index, "name", e.target.value)}
  //               placeholder="Feature name"
  //               style={{
  //                 flex: 1,
  //                 padding: "8px",
  //                 border: "1px solid #ddd",
  //                 borderRadius: "4px",
  //                 fontFamily: "inherit",
  //               }}
  //             />
  //             <button
  //               onClick={() => removeFeature(index)}
  //               style={{
  //                 padding: "6px",
  //                 backgroundColor: "#ff4444",
  //                 color: "white",
  //                 border: "none",
  //                 borderRadius: "4px",
  //                 cursor: "pointer",
  //                 display: "flex",
  //                 alignItems: "center",
  //                 justifyContent: "center",
  //               }}
  //             >
  //               <FiX size={18} />
  //             </button>
  //           </div>
  //         ))}

  //         <button
  //           onClick={addFeature}
  //           style={{
  //             display: "flex",
  //             alignItems: "center",
  //             gap: "6px",
  //             padding: "8px 12px",
  //             backgroundColor: "#e0e0e0",
  //             border: "none",
  //             borderRadius: "4px",
  //             cursor: "pointer",
  //             fontSize: "14px",
  //           }}
  //         >
  //           <FiPlus size={16} /> Add Feature
  //         </button>
  //       </div>

  //       {/* Plan Permissions */}
  //       <div style={{ marginBottom: "15px" }}>
  //         <label
  //           style={{
  //             display: "block",
  //             fontWeight: "500",
  //             marginBottom: "10px",
  //           }}
  //         >
  //           Plan Permissions
  //         </label>

  //         <div style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
  //           <button
  //             onClick={selectAllPermissions}
  //             type="button"
  //             style={{
  //               padding: "10px 16px",
  //               backgroundColor: "#1F7FFF",
  //               color: "white",
  //               border: "none",
  //               borderRadius: "8px",
  //               cursor: "pointer",
  //               fontWeight: "500",
  //             }}
  //           >
  //             Select All Permissions
  //           </button>
  //           <button
  //             onClick={resetPermissions}
  //             type="button"
  //             style={{
  //               padding: "10px 16px",
  //               backgroundColor: "#F3F4F6",
  //               color: "#374151",
  //               border: "1px solid #D1D5DB",
  //               borderRadius: "8px",
  //               cursor: "pointer",
  //               fontWeight: "500",
  //             }}
  //           >
  //             Reset All
  //           </button>
  //         </div>

  //         <div
  //           style={{
  //             // minWidth: "1110px",
  //             borderRadius: "16px",
  //             overflow: "hidden",
  //             border: "1px solid #E5E7EB",
  //           }}
  //         >
  //           {Object.entries(groupedModules).map(([category, modules]) => (
  //             <div key={category} style={{ marginBottom: "24px" }}>
  //               <div
  //                 style={{
  //                   backgroundColor: "#F3F8FB",
  //                   padding: "12px 16px",
  //                   display: "flex",
  //                   alignItems: "center",
  //                   color: "#727681",
  //                   fontWeight: "500",
  //                 }}
  //               >
  //                 <div
  //                   style={{
  //                     width: "50px",
  //                     display: "flex",
  //                     justifyContent: "center",
  //                   }}
  //                 >
  //                   <label style={{ cursor: "pointer" }}>
  //                     <input
  //                       type="checkbox"
  //                       checked={isCategoryChecked(modules)}
  //                       onChange={() => toggleCategoryAll(category, modules)}
  //                       style={{ display: "none" }}
  //                     />
  //                     <div
  //                       style={{
  //                         width: "18px",
  //                         height: "18px",
  //                         borderRadius: "4px",
  //                         border: `2px solid ${isCategoryChecked(modules) ? "#1F7FFF" : "#A2A8B8"}`,
  //                         backgroundColor: isCategoryChecked(modules)
  //                           ? "#1F7FFF"
  //                           : "white",
  //                         position: "relative",
  //                         display: "flex",
  //                         alignItems: "center",
  //                         justifyContent: "center",
  //                       }}
  //                     >
  //                       {isCategoryChecked(modules) && (
  //                         <svg
  //                           width="12"
  //                           height="12"
  //                           viewBox="0 0 12 12"
  //                           fill="none"
  //                         >
  //                           <path
  //                             d="M2 6L5 9L10 3"
  //                             stroke="white"
  //                             strokeWidth="2"
  //                             strokeLinecap="round"
  //                           />
  //                         </svg>
  //                       )}
  //                     </div>
  //                   </label>
  //                 </div>
  //                 <div style={{ width: "150px", textAlign: "left" }}>
  //                   {category}
  //                 </div>
  //                 <div style={{ flex: 1, textAlign: "center" }}>Create</div>
  //                 <div style={{ flex: 1, textAlign: "center" }}>Read</div>
  //                 <div style={{ flex: 1, textAlign: "center" }}>Update</div>
  //                 <div style={{ flex: 1, textAlign: "center" }}>Delete</div>
  //                 <div style={{ flex: 1, textAlign: "center" }}>Export</div>
  //                 <div style={{ flex: 1, textAlign: "center" }}>Import</div>
  //                 <div style={{ flex: 1, textAlign: "center" }}>All</div>
  //               </div>

  //               {modules.map((module) => {
  //                 const permissions = plan.modulePermissions?.[module] || {
  //                   ...DEFAULT_PERMISSIONS,
  //                   all: false,
  //                 };
  //                 return (
  //                   <div
  //                     key={module}
  //                     style={{
  //                       display: "flex",
  //                       alignItems: "center",
  //                       padding: "12px 16px",
  //                       backgroundColor: "white",
  //                       borderTop: "1px solid #FCFCFC",
  //                     }}
  //                   >
  //                     <div
  //                       style={{
  //                         width: "50px",
  //                         display: "flex",
  //                         justifyContent: "center",
  //                       }}
  //                     >
  //                       <label style={{ cursor: "pointer" }}>
  //                         <input
  //                           type="checkbox"
  //                           checked={permissions.all}
  //                           onChange={() => toggleModuleAll(module)}
  //                           style={{ display: "none" }}
  //                         />
  //                         <div
  //                           style={{
  //                             width: "18px",
  //                             height: "18px",
  //                             borderRadius: "4px",
  //                             border: `2px solid ${permissions.all ? "#1F7FFF" : "#A2A8B8"}`,
  //                             backgroundColor: permissions.all
  //                               ? "#1F7FFF"
  //                               : "white",
  //                             position: "relative",
  //                           }}
  //                         >
  //                           {permissions.all && (
  //                             <svg
  //                               style={{
  //                                 position: "absolute",
  //                                 top: "-1px",
  //                                 left: "-1px",
  //                               }}
  //                               width="18"
  //                               height="18"
  //                               viewBox="0 0 18 18"
  //                               fill="none"
  //                             >
  //                               <path
  //                                 d="M4.5 9L7.5 12L13.5 6"
  //                                 stroke="white"
  //                                 strokeWidth="2.5"
  //                                 strokeLinecap="round"
  //                               />
  //                             </svg>
  //                           )}
  //                         </div>
  //                       </label>
  //                     </div>

  //                     <div
  //                       style={{
  //                         width: "150px",
  //                         textAlign: "left",
  //                         fontSize: "14px",
  //                         color: "#0E101A",
  //                       }}
  //                     >
  //                       {module}
  //                     </div>

  //                     {[
  //                       "create",
  //                       "read",
  //                       "update",
  //                       "delete",
  //                       "export",
  //                       "import",
  //                     ].map((perm) => (
  //                       <div
  //                         key={perm}
  //                         style={{
  //                           flex: 1,
  //                           display: "flex",
  //                           justifyContent: "center",
  //                         }}
  //                       >
  //                         <label style={{ cursor: "pointer" }}>
  //                           <input
  //                             type="checkbox"
  //                             checked={permissions[perm]}
  //                             onChange={() =>
  //                               toggleModulePermission(module, perm)
  //                             }
  //                             style={{ display: "none" }}
  //                           />
  //                           <div
  //                             style={{
  //                               width: "36px",
  //                               height: "20px",
  //                               backgroundColor: permissions[perm]
  //                                 ? "#1F7FFF"
  //                                 : "#A2A8B8",
  //                               borderRadius: "20px",
  //                               position: "relative",
  //                             }}
  //                           >
  //                             <div
  //                               style={{
  //                                 width: "16px",
  //                                 height: "16px",
  //                                 backgroundColor: "white",
  //                                 borderRadius: "50%",
  //                                 position: "absolute",
  //                                 top: "2px",
  //                                 left: permissions[perm] ? "18px" : "2px",
  //                                 transition: "left 0.2s",
  //                               }}
  //                             />
  //                           </div>
  //                         </label>
  //                       </div>
  //                     ))}

  //                     <div
  //                       style={{
  //                         flex: 1,
  //                         display: "flex",
  //                         justifyContent: "center",
  //                       }}
  //                     >
  //                       <label style={{ cursor: "pointer" }}>
  //                         <input
  //                           type="checkbox"
  //                           checked={permissions.all}
  //                           onChange={() => toggleModuleAll(module)}
  //                           style={{ display: "none" }}
  //                         />
  //                         <div
  //                           style={{
  //                             width: "36px",
  //                             height: "20px",
  //                             backgroundColor: permissions.all
  //                               ? "#1F7FFF"
  //                               : "#A2A8B8",
  //                             borderRadius: "20px",
  //                             position: "relative",
  //                           }}
  //                         >
  //                           <div
  //                             style={{
  //                               width: "16px",
  //                               height: "16px",
  //                               backgroundColor: "white",
  //                               borderRadius: "50%",
  //                               position: "absolute",
  //                               top: "2px",
  //                               left: permissions.all ? "18px" : "2px",
  //                               transition: "left 0.2s",
  //                             }}
  //                           />
  //                         </div>
  //                       </label>
  //                     </div>
  //                   </div>
  //                 );
  //               })}
  //             </div>
  //           ))}
  //         </div>
  //       </div>

  //       {/* Buttons */}
  //       <div style={{ display: "flex", gap: "10px", marginTop: "20px" }}>
  //         <button
  //           onClick={handleSave}
  //           disabled={saving}
  //           style={{
  //             flex: 1,
  //             padding: "10px",
  //             backgroundColor: saving ? "#ccc" : "#1976d2",
  //             color: "white",
  //             border: "none",
  //             borderRadius: "4px",
  //             cursor: saving ? "not-allowed" : "pointer",
  //             fontWeight: "500",
  //           }}
  //         >
  //           {saving ? "Saving..." : initialPlan?._id ? "Update" : "Create"}
  //         </button>
  //         <button
  //           onClick={onCancel}
  //           style={{
  //             flex: 1,
  //             padding: "10px",
  //             backgroundColor: "#e0e0e0",
  //             border: "none",
  //             borderRadius: "4px",
  //             cursor: "pointer",
  //             fontWeight: "500",
  //           }}
  //         >
  //           Cancel
  //         </button>
  //       </div>
  //     </div>

  //     {/* Preview */}
  //     <PricingDesign plan={plan} />
  //   </div>
  // );
}
