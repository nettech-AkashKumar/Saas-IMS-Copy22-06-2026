
import BASE_URL from "./config/config";
const SUPER_BASE_URL = `${BASE_URL}/api/super`;

/* ================= AUTH HEADER ================= */
const getAuthHeader = () => ({
  Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
  "Content-Type": "application/json",
});

/* ================= TENANT LOGIN ================= */
export const loginTenant = async (email, password, subdomain) => {
  const res = await fetch(`${BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password, subdomain }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message);
  localStorage.setItem("token", data.token);
  return data;
};

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

export const getTotalCard = async () => {
  const res = await fetch(`${SUPER_BASE_URL}/dashboard/totalcard`, {
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
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to fetch tenants");
  return data;
};

export const getTenantById = async (id) => {
  const res = await fetch(`${SUPER_BASE_URL}/tenant/${id}`, {
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load company details");
  return data;
};

export const getTenantEmployees = async (id, query = {}) => {
  const params = new URLSearchParams(query);
  const queryString = params.toString();
  const endpoint = queryString
    ? `${SUPER_BASE_URL}/tenant/${id}/employees?${queryString}`
    : `${SUPER_BASE_URL}/tenant/${id}/employees`;

  const res = await fetch(endpoint, {
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load employees");
  return data;
};

export const updateTenantModulePermissions = async (id, modulePermissions) => {
  const res = await fetch(`${SUPER_BASE_URL}/tenant/${id}/module-permissions`, {
    method: "PATCH",
    headers: getAuthHeader(),
    body: JSON.stringify({ modulePermissions }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update company module permissions");
  return data;
};

/* ================= REMINDER ================= */
export const getReminderTemplates = async () => {
  const res = await fetch(`${SUPER_BASE_URL}/reminder/templates`, {
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load templates");
  return data;
};

export const getReminderTemplateById = async (templateId) => {
  const res = await fetch(`${SUPER_BASE_URL}/reminder/templates/${templateId}`, {
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load template");
  return data;
};

export const getReminderCompanyStatus = async () => {
  const res = await fetch(`${SUPER_BASE_URL}/reminder/company-status`, {
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load reminder status");
  return data;
};

export const createReminderTemplate = async (payload) => {
  const res = await fetch(`${SUPER_BASE_URL}/reminder/templates`, {
    method: "POST",
    headers: getAuthHeader(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create template");
  return data;
};

export const updateReminderTemplate = async (templateId, payload) => {
  const res = await fetch(`${SUPER_BASE_URL}/reminder/templates/${templateId}`, {
    method: "PATCH",
    headers: getAuthHeader(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update template");
  return data;
};

export const deleteReminderTemplate = async (templateId) => {
  const res = await fetch(`${SUPER_BASE_URL}/reminder/templates/${templateId}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete template");
  return data;
};

export const sendReminderToCompany = async (payload) => {
  const res = await fetch(`${SUPER_BASE_URL}/reminder/send`, {
    method: "POST",
    headers: getAuthHeader(),
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to send reminder");
  return data;
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
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update status");
  return data;
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

export const updateMaxEmployees = async (id, maxEmployees) => {
  const res = await fetch(`${SUPER_BASE_URL}/tenant/${id}/max-employees`, {
    method: "PATCH",
    headers: getAuthHeader(),
    body: JSON.stringify({ maxEmployees }),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update max employees");
  return data;
};

/* ================= DELETE ================= */
export const deleteTenant = async (id) => {
  const res = await fetch(`${SUPER_BASE_URL}/tenant/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete company");
  return data;
};

/* ================= HERO SECTIONS ================= */
export const getHeroContent = async () => {
  const res = await fetch(`${BASE_URL}/api/hero`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load hero content");
  return data;
};

export const getAllHeroContents = async () => {
  const res = await fetch(`${BASE_URL}/api/hero/all`, {
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load hero sections");
  return data;
};

export const getContactMessages = async () => {
  const res = await fetch(`${SUPER_BASE_URL}/contact-messages`, {
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load contact messages");
  return data;
};

export const getHeroByTemplateType = async (templateType) => {
  const res = await fetch(`${BASE_URL}/api/hero/template/${templateType}`, {
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load hero content");
  return data;
};

export const createHeroContent = async (heroData) => {
  const res = await fetch(`${BASE_URL}/api/hero`, {
    method: "POST",
    headers: getAuthHeader(),
    body: JSON.stringify(heroData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create hero section");
  return data;
};

export const updateHeroContent = async (id, heroData) => {
  const res = await fetch(`${BASE_URL}/api/hero/${id}`, {
    method: "PATCH",
    headers: getAuthHeader(),
    body: JSON.stringify(heroData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update hero section");
  return data;
};

export const uploadHeroImage = async (id, formData) => {
  const res = await fetch(`${BASE_URL}/api/hero/${id}/upload`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
    },
    body: formData,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to upload hero image");
  return data;
};

export const deleteHeroContent = async (id) => {
  const res = await fetch(`${BASE_URL}/api/hero/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete hero section");
  return data;
};
/* ================= PUBLIC WEBSITE HERO ================= */
export const getPublicWebsiteHero = async () => {
  const res = await fetch(`${BASE_URL}/api/hero/public-website`);
  const data = await res.json();

  if (!res.ok) {
    throw new Error(data.message || "Failed to load public website hero");
  }

  return data;
};

/* ================= PRICING PLANS ================= */
export const getPublicPricing = async () => {
  const res = await fetch(`${BASE_URL}/api/pricing`);
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load pricing plans");
  return data;
};

export const getAllPricing = async () => {
  const res = await fetch(`${BASE_URL}/api/pricing/all`, {
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to load pricing plans");
  return data;
};

export const createPricing = async (pricingData) => {
  const res = await fetch(`${BASE_URL}/api/pricing`, {
    method: "POST",
    headers: getAuthHeader(),
    body: JSON.stringify(pricingData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to create pricing plan");
  return data;
};

export const updatePricing = async (id, pricingData) => {
  const res = await fetch(`${BASE_URL}/api/pricing/${id}`, {
    method: "PATCH",
    headers: getAuthHeader(),
    body: JSON.stringify(pricingData),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to update pricing plan");
  return data;
};

export const deletePricing = async (id) => {
  const res = await fetch(`${BASE_URL}/api/pricing/${id}`, {
    method: "DELETE",
    headers: getAuthHeader(),
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.message || "Failed to delete pricing plan");
  return data;
};

/* ================= FAQS  ================= */
export const getPublicFAQs = async () => {
  try {
    const res = await fetch(`${BASE_URL}/api/public/faqs`);
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Failed to fetch FAQs");
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error fetching FAQs:", error);
    throw error;
  }
};

export const updatePublicFAQs = async (faqs) => {
  try {
    const res = await fetch(`${SUPER_BASE_URL}/faqs`, {
      method: "PUT",
      headers: getAuthHeader(),
      body: JSON.stringify({ faqs }),
    });
    if (!res.ok) {
      const data = await res.json();
      throw new Error(data.message || "Failed to update FAQs");
    }
    const data = await res.json();
    return data;
  } catch (error) {
    console.error("Error updating FAQs:", error);
    throw error;
  }
};

