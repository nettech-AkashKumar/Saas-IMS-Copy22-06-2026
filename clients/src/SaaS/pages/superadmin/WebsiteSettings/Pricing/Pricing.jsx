import React, { useState, useEffect } from "react";
import { FiEdit2, FiTrash2 } from "react-icons/fi";
import { LuCheck } from "react-icons/lu";
import PricingEditor from "./PricingEditor";
import PricingDesign from "./PricingDesign";
import * as adminApi from "../../../../services/adminApi";
import BASE_URL from "../../../../services/config/config";
import { useSocket } from "../../../../../Context/SocketContext";

export default function Pricing() {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState(null);
  const [showForm, setShowForm] = useState(false);
  const [error, setError] = useState("");
  const [showPublishModal, setShowPublishModal] = useState(false);
  const [publishPlanId, setPublishPlanId] = useState(null);
  const [publishPassword, setPublishPassword] = useState("");
  const [publishError, setPublishError] = useState("");
  const [publishing, setPublishing] = useState(false);
  const { connectSocket, onCMSUpdate, removeCMSListener } = useSocket();

  const loadPlans = async () => {
    try {
      setError("");
      const data = await adminApi.getAllPricing();
      console.log("✅ Admin Pricing: Loaded plans:", data);
      setPlans(data || []);
    } catch (err) {
      setError(err.message);
      console.error("❌ Admin Pricing: Failed to load:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadPlans();

    // 🔌 Socket Connect
    console.log(
      "🔌 Admin Pricing: Attempting socket connection to:",
      import.meta.env.VITE_API_URL,
    );
    const socket = connectSocket(import.meta.env.VITE_API_URL);

    if (socket && socket.connected) {
      console.log("✅ Admin Pricing Dashboard: Socket connected");
    } else {
      console.log("⏳ Admin Pricing Dashboard: Socket connecting...");
    }

    // Listen for pricing updates
    onCMSUpdate((payload) => {
      console.log("📡 Admin Pricing Dashboard received cms-updated:", payload);
      if (payload.section === "pricing") {
        console.log("🔄 Admin Pricing: Reloading plans...");
        loadPlans();
      }
    });

    return () => {
      console.log("🧹 Admin Pricing: Cleaning up listeners");
      removeCMSListener();
    };
  }, []);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this pricing plan?")) {
      return;
    }

    try {
      setError("");
      await adminApi.deletePricing(id);
      console.log("✅ Admin Pricing: Plan deleted successfully");
      loadPlans();
    } catch (err) {
      setError(err.message);
      console.error("❌ Admin Pricing: Delete failed:", err);
    }
  };

  const handlePublishClick = (id) => {
    setPublishPlanId(id);
    setPublishPassword("");
    setPublishError("");
    setShowPublishModal(true);
  };

  const closePublishModal = () => {
    setShowPublishModal(false);
    setPublishPlanId(null);
    setPublishPassword("");
    setPublishError("");
  };

  const handlePublishConfirm = async (e) => {
    e.preventDefault();
    setPublishError("");
    setPublishing(true);

    try {
      const response = await fetch(`${BASE_URL}/api/hero/verify-password`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ password: publishPassword }),
      });

      if (!response.ok) {
        const data = await response.json();
        setPublishError(data.message || "Invalid password");
        return;
      }

      if (!publishPlanId) {
        setPublishError("Unable to publish plan. No plan selected.");
        return;
      }

      await adminApi.updatePricing(publishPlanId, { isActive: true });
      alert("Pricing plan published to website successfully!");
      closePublishModal();
      loadPlans();
    } catch (err) {
      console.error(err);
      setPublishError("Error verifying password. Please try again.");
    } finally {
      setPublishing(false);
    }
  };

  if (loading) {
    return (
      <div style={{ padding: "20px" }}>
        <p>Loading pricing plans...</p>
      </div>
    );
  }

  return (
    <div
      style={{
        padding: "24px",
        backgroundColor: "#f4f7fb",
        minHeight: "100vh",
      }}
    >
      <div
        style={{
          backgroundColor: "#fff",
          borderRadius: "24px",
          padding: "26px",
          boxShadow: "0 20px 60px rgba(15, 23, 42, 0.08)",
          marginBottom: "24px",
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: "20px",
          flexWrap: "wrap",
        }}
      >
        <div>
          <p style={{ margin: 0, color: "#5b6770", fontSize: "14px" }}>
            Website Pricing Settings
          </p>
          <h1
            style={{
              margin: "8px 0 0",
              fontSize: "28px",
              color: "#111827",
            }}
          >
            Manage Pricing Plans
          </h1>
        </div>

        <button
          onClick={() => {
            setShowForm(!showForm);
            setEditingId(null);
          }}
          style={{
            padding: "14px 22px",
            backgroundColor: showForm ? "#eef2ff" : "#2563eb",
            color: showForm ? "#1f2937" : "white",
            border: "none",
            borderRadius: "12px",
            cursor: "pointer",
            fontWeight: 600,
            minWidth: "170px",
          }}
        >
          {showForm ? "Cancel" : "Add New Plan"}
        </button>
      </div>

      {error && (
        <div
          style={{
            color: "#b91c1c",
            marginBottom: "20px",
            padding: "16px",
            backgroundColor: "#fef2f2",
            borderRadius: "12px",
            border: "1px solid #fecaca",
          }}
        >
          {error}
        </div>
      )}

      {showPublishModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(15, 23, 42, 0.6)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            zIndex: 1000,
            padding: "20px",
          }}
        >
          <div
            style={{
              width: "100%",
              maxWidth: "460px",
              backgroundColor: "white",
              borderRadius: "24px",
              padding: "28px",
              boxShadow: "0 24px 80px rgba(15, 23, 42, 0.16)",
            }}
          >
            <h2
              style={{
                margin: 0,
                fontSize: "24px",
                color: "#111827",
              }}
            >
              Confirm Publish
            </h2>
            <p style={{ margin: "14px 0 20px", color: "#475569" }}>
              Enter your password to publish this pricing plan to the website.
            </p>
            <form onSubmit={handlePublishConfirm}>
              <input
                type="password"
                value={publishPassword}
                onChange={(event) => setPublishPassword(event.target.value)}
                placeholder="Password"
                style={{
                  width: "100%",
                  padding: "12px 14px",
                  borderRadius: "12px",
                  border: "1px solid #cbd5e1",
                  marginBottom: "14px",
                  fontSize: "15px",
                }}
              />
              {publishError && (
                <div
                  style={{
                    color: "#b91c1c",
                    marginBottom: "14px",
                    fontSize: "14px",
                  }}
                >
                  {publishError}
                </div>
              )}
              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  flexWrap: "wrap",
                  justifyContent: "flex-end",
                }}
              >
                <button
                  type="button"
                  onClick={closePublishModal}
                  style={{
                    padding: "12px 18px",
                    backgroundColor: "#e2e8f0",
                    color: "#0f172a",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontWeight: 700,
                  }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={publishing || !publishPassword}
                  style={{
                    padding: "12px 18px",
                    backgroundColor: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    cursor: publishing ? "not-allowed" : "pointer",
                    fontWeight: 700,
                  }}
                >
                  {publishing ? "Publishing..." : "Publish"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showForm ? (
        <PricingEditor
          initialPlan={plans.find((p) => p._id === editingId)}
          onSave={() => {
            setShowForm(false);
            setEditingId(null);
            loadPlans();
          }}
          onCancel={() => {
            setShowForm(false);
            setEditingId(null);
          }}
        />
      ) : (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))",
            gap: "24px",
          }}
        >
          {plans.map((plan) => (
            <div
              key={plan._id}
              style={{
                backgroundColor: "white",
                borderRadius: "24px",
                padding: "24px",
                boxShadow: "0 12px 32px rgba(15, 23, 42, 0.06)",
                border: plan.recommended
                  ? "2px solid #2563eb"
                  : "1px solid #e5e7eb",
                position: "relative",
                overflow: "hidden",
              }}
            >
              {plan.offerType && plan.offerType !== "none" && (
                <div
                  style={{
                    position: "absolute",
                    top: 16,
                    left: 16,
                    backgroundColor: "#ef4444",
                    color: "white",
                    padding: "6px 12px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  {plan.offerType === "fixed"
                    ? `Save ${plan.offerValue}`
                    : `${plan.offerValue}% OFF`}
                </div>
              )}

              {plan.recommended && (
                <div
                  style={{
                    position: "absolute",
                    top: 16,
                    right: 16,
                    backgroundColor: "#facc15",
                    color: "#111827",
                    padding: "6px 12px",
                    borderRadius: "999px",
                    fontSize: "12px",
                    fontWeight: 700,
                  }}
                >
                  Recommended
                </div>
              )}

              <div style={{ marginBottom: "22px" }}>
                <p
                  style={{
                    margin: 0,
                    color: "#475569",
                    fontSize: "14px",
                  }}
                >
                  {plan.buttonText || "Pricing Plan"}
                </p>
                <h2
                  style={{
                    margin: "10px 0 0",
                    fontSize: "40px",
                    color: "#2563eb",
                  }}
                >
                  {plan.currencySymbol || "₹"}
                  {plan.price}
                </h2>
                <span
                  style={{
                    color: "#64748b",
                    fontSize: "14px",
                  }}
                >
                  / month
                </span>
              </div>

              <h3
                style={{
                  margin: "0 0 10px 0",
                  fontSize: "20px",
                  color: "#111827",
                }}
              >
                {plan.title}
              </h3>
              <p style={{ color: "#475569", marginBottom: "16px" }}>
                {plan.description}
              </p>

              <ul
                style={{
                  listStyle: "none",
                  padding: 0,
                  margin: 0,
                  display: "grid",
                  gap: "10px",
                }}
              >
                {(plan.features || []).map((feature, index) => (
                  <li
                    key={index}
                    style={{
                      display: "flex",
                      alignItems: "center",
                      gap: "10px",
                      color: "#334155",
                      fontSize: "14px",
                    }}
                  >
                    <LuCheck
                      style={{
                        color: "#22c55e",
                        minWidth: "18px",
                        minHeight: "18px",
                      }}
                    />
                    {feature.name || "Feature description"}
                  </li>
                ))}
              </ul>

              {plan.buttonUrl && (
                <p
                  style={{
                    margin: "20px 0 0",
                    fontSize: "13px",
                    color: "#64748b",
                    wordBreak: "break-all",
                  }}
                >
                  Button URL:
                  <a
                    href={plan.buttonUrl}
                    target="_blank"
                    rel="noreferrer"
                    style={{ color: "#2563eb" }}
                  >
                    {plan.buttonUrl}
                  </a>
                </p>
              )}

              <div
                style={{
                  marginTop: "20px",
                  marginBottom: "20px",
                }}
              >
                <div
                  style={{
                    fontSize: "14px",
                    fontWeight: 600,
                    color: "#111827",
                    marginBottom: "10px",
                  }}
                >
                  Selected Modules
                </div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "10px",
                    maxHeight: "56px",
                    overflowY: "auto",
                    paddingRight: "4px",
                  }}
                >
                  {Object.entries(plan.modulePermissions || {})
                    .filter(([, perms]) =>
                      Object.entries(perms).some(([, value]) => value),
                    )
                    .map(([module]) => (
                      <span
                        key={module}
                        style={{
                          padding: "8px 12px",
                          backgroundColor: "#eff6ff",
                          color: "#1d4ed8",
                          borderRadius: "999px",
                          fontSize: "13px",
                          border: "1px solid #bfdbfe",
                        }}
                      >
                        {module}
                      </span>
                    ))}
                  {Object.entries(plan.modulePermissions || {}).every(
                    ([, perms]) =>
                      !Object.entries(perms).some(([, value]) => value),
                  ) && (
                    <span
                      style={{
                        color: "#9ca3af",
                        fontSize: "13px",
                      }}
                    >
                      No selected modules
                    </span>
                  )}
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: "12px",
                  flexWrap: "wrap",
                }}
              >
                <span
                  style={{
                    display: "inline-flex",
                    alignItems: "center",
                    justifyContent: "center",
                    padding: "8px 14px",
                    borderRadius: "999px",
                    fontSize: "13px",
                    fontWeight: 700,
                    color: plan.isActive ? "#134e4a" : "#525252",
                    backgroundColor: plan.isActive ? "#d1fae5" : "#f3f4f6",
                  }}
                >
                  {plan.isActive
                    ? "Published on Website"
                    : "Draft / Not Published"}
                </span>
                {!plan.isActive && (
                  <button
                    onClick={() => handlePublishClick(plan._id)}
                    style={{
                      flex: 1,
                      minWidth: "140px",
                      padding: "12px 16px",
                      backgroundColor: "#16a34a",
                      color: "white",
                      border: "none",
                      borderRadius: "12px",
                      cursor: "pointer",
                      fontWeight: 700,
                    }}
                  >
                    Publish
                  </button>
                )}
              </div>

              <div
                style={{
                  display: "flex",
                  gap: "12px",
                  marginTop: "24px",
                  flexWrap: "wrap",
                }}
              >
                <button
                  onClick={() => {
                    setEditingId(plan._id);
                    setShowForm(true);
                  }}
                  style={{
                    flex: 1,
                    minWidth: "120px",
                    padding: "12px 16px",
                    backgroundColor: "#2563eb",
                    color: "white",
                    border: "none",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <FiEdit2 size={16} /> Edit
                </button>
                <button
                  onClick={() => handleDelete(plan._id)}
                  style={{
                    flex: 1,
                    minWidth: "120px",
                    padding: "12px 16px",
                    backgroundColor: "#e2e8f0",
                    color: "#0f172a",
                    border: "1px solid #cbd5e1",
                    borderRadius: "12px",
                    cursor: "pointer",
                    fontWeight: 600,
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                  }}
                >
                  <FiTrash2 size={16} /> Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
