import BASE_URL from "./config/config";
const SUPER_BASE_URL = `${BASE_URL}/api/super`;

/* ================= AUTH HEADER ================= */
const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
  "Content-Type": "application/json",
});

/* ================= LOGIN ================= */
export const loginAdmin = async (email, password) => {
  const res = await fetch(`${SUPER_BASE_URL}/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password }),
  });

  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  localStorage.setItem("adminToken", data.token);
  return data;
};

/* ================= DASHBOARD ================= */
export const getDashboardStats = async () => {
  const res = await fetch(`${SUPER_BASE_URL}/dashboard/stats`, {
    headers: getAuthHeader(),
  });
  return res.json();
};

/* ================= TENANTS ================= */
export const getTenants = async (query) => {
  const params = new URLSearchParams(query);
  const res = await fetch(`${SUPER_BASE_URL}/tenants?${params}`, {
    headers: getAuthHeader(),
  });
  return res.json();
};

/* ================= APPROVE ================= */
export const approveCompany = async (companyId) => {
  const res = await fetch(
    `${SUPER_BASE_URL}/tenant/${companyId}/approve`,
    {
      method: "PATCH",
      headers: getAuthHeader(),
    }
  );
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  return data;
};

/* ================= STATUS ================= */
export const updateStatus = async (id, isActive) => {
  const res = await fetch(`${SUPER_BASE_URL}/tenant/${id}/status`, {
    method: "PATCH",
    headers: getAuthHeader(),
    body: JSON.stringify({ isActive }),
  });
  return res.json();
};

/* ================= PLAN ================= */
export const updatePlan = async (id, plan) => {
  const res = await fetch(`${SUPER_BASE_URL}/tenant/${id}/plan`, {
    method: "PATCH",
    headers: getAuthHeader(),
    body: JSON.stringify({ plan }),
  });
  return res.json();
};

/* ================= DELETE ================= */
export const deleteTenant = async (id) => {
  const res = await fetch(`${SUPER_BASE_URL}/tenant/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
  return res.json();
};
