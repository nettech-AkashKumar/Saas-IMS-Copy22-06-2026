const router = require("express").Router();

// Import tenant-related controllers from tenant.controller.js
const {
  getDashboardStats,
  dashCard,
  getTenants,
  getTenantById,
  getTenantEmployees,
  updateTenantStatus,
  updateTenantPlan,
  updateTenantModulePermissions,
  deleteTenant,
  approveCompany,
  updateTenantMaxEmployees,
} = require("../../controllers/SaaS/superAdmin/tenant.controller");

const {
  createReminderTemplate,
  getReminderTemplates,
  getReminderTemplateById,
  updateReminderTemplate,
  deleteReminderTemplate,
  getReminderCompanyStatus,
  sendReminderToCompany,
} = require("../../controllers/SaaS/superAdmin/reminder.controller");

const {
  getPublicFAQs,
  getAllFAQs,
  updateFAQs,
  createFAQ,
  updateFAQ,
  deleteFAQ,
} = require("../../controllers/SaaS/superAdmin/faq.controller");

const { getContactMessages } = require("../../controllers/SaaS/superAdmin/contact.controller");

// Import login controller separately
const { superAdminLogin } = require("../../controllers/SaaS/superAdmin/login.controller");

const { verifyAdminToken } = require("../../middleware/SaaS/superAdminAuth");

// ================= PUBLIC =================
router.post("/login", superAdminLogin);

// ================= PROTECTED =================
router.get("/dashboard/stats", verifyAdminToken, getDashboardStats);
router.get("/dashboard/totalcard", verifyAdminToken, dashCard);
router.get("/tenants", verifyAdminToken, getTenants);
router.get("/tenant/:id", verifyAdminToken, getTenantById);
router.get("/tenant/:id/employees", verifyAdminToken, getTenantEmployees);

router.get("/reminder/templates", verifyAdminToken, getReminderTemplates);
router.get("/reminder/templates/:id", verifyAdminToken, getReminderTemplateById);
router.get("/reminder/company-status", verifyAdminToken, getReminderCompanyStatus);
router.post("/reminder/templates", verifyAdminToken, createReminderTemplate);
router.patch("/reminder/templates/:id", verifyAdminToken, updateReminderTemplate);
router.delete("/reminder/templates/:id", verifyAdminToken, deleteReminderTemplate);
router.post("/reminder/send", verifyAdminToken, sendReminderToCompany);

// ================= FAQ ROUTES =================
router.get("/faqs", getAllFAQs); // Get all FAQs (admin view)
router.post("/faqs", verifyAdminToken, createFAQ); // Create FAQ
router.patch("/faqs/:id", verifyAdminToken, updateFAQ); // Update FAQ by ID
router.delete("/faqs/:id", verifyAdminToken, deleteFAQ); // Delete FAQ by ID
router.put("/faqs", verifyAdminToken, updateFAQs); // Bulk update FAQs

// Contact messages from public website
router.get("/contact-messages", verifyAdminToken, getContactMessages);

router.patch("/tenant/:id/status", verifyAdminToken, updateTenantStatus);
router.patch("/tenant/:id/plan", verifyAdminToken, updateTenantPlan);
router.patch(
  "/tenant/:id/max-employees",
  verifyAdminToken,
  updateTenantMaxEmployees
);
router.patch(
  "/tenant/:id/module-permissions",
  verifyAdminToken,
  updateTenantModulePermissions
);

// ✅ APPROVE COMPANY
router.patch("/tenant/:companyId/approve", verifyAdminToken, approveCompany);

router.delete("/tenant/:id", verifyAdminToken, deleteTenant);

module.exports = router;
