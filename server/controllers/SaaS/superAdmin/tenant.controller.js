const mongoose = require("mongoose");
const connectMasterDB = require("../../../config/SaaS/masterDb");
const getTenantDB = require("../../../config/SaaS/tenantDb");
const CompanyModel = require("../../../models/SaaS/master/Company.model");
const SuperAdminModel = require("../../../models/SaaS/master/SuperAdmin");
const User = require("../../../models/usersModels");
const Role = require("../../../models/roleModels");
const { sendMail } = require("../../../utils/SaaS/sendMail"); // optional

// const CompanyModel = require("../../models/master/Company.model");

/**
 * Calculate expiry date from createdAt + billingCycle.
 * - "monthly"  → +1 month
 * - "annually" → +12 months
 * - "3monthly" / "3 monthly" → +3 months
 * - "2annually" / "2 annually" → +24 months
 */
const calcExpireDate = (createdAt, billingCycle) => {
  if (!createdAt || !billingCycle) return null;

  const base = new Date(createdAt);
  const raw = String(billingCycle).trim().toLowerCase();

  // Extract leading number if present (e.g. "3monthly" or "3 monthly")
  const match = raw.match(/^(\d+)?\s*(monthly|annually)$/);
  if (!match) return null;

  const qty   = match[1] ? parseInt(match[1], 10) : 1;
  const cycle = match[2]; // "monthly" or "annually"

  const expire = new Date(base);
  if (cycle === "monthly") {
    expire.setMonth(expire.getMonth() + qty);
  } else {
    // annually → qty years = qty * 12 months
    expire.setMonth(expire.getMonth() + qty * 12);
  }

  return expire;
};

const sendMailSafely = (payload, logLabel) => {
  setImmediate(async () => {
    try {
      await sendMail(payload);
      console.log(`Email sent: ${logLabel}`);
    } catch (emailErr) {
      console.error(`Email failed: ${logLabel}`, emailErr);
    }
  });
};

const escapeRegex = (value = "") =>
  String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

// ================= GET TENANTS (SEARCH + FILTER + PAGINATION) =================
exports.getTenants = async (req, res, next) => {
  try {
    const masterDB = await connectMasterDB();
    const Company = CompanyModel(masterDB);

    // 🔹 query params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 8;
    const search = req.query.search || "";
    const status = req.query.status;

    const skip = (page - 1) * limit;

    // 🔹 filters
    const filter = {};

    if (search) {
      filter.companyName = { $regex: search, $options: "i" };
    }

    if (status === "active") filter.isActive = true;
    if (status === "inactive") filter.isActive = false;

    const [rawData, total] = await Promise.all([
      Company.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),

      Company.countDocuments(filter),
    ]);

    // Attach computed expireDate to each company
    const data = rawData.map((company) => ({
      ...company,
      expireDate: calcExpireDate(company.createdAt, company.billingCycle),
    }));

    res.json({
      data,
      pagination: {
        total,
        page,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (err) {
    next(err);
  }
};

// ================= GET SINGLE TENANT =================
exports.getTenantById = async (req, res, next) => {
  try {
    const Company = CompanyModel(await connectMasterDB());

    const company = await Company.findById(req.params.id);
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    res.json(company);
  } catch (err) {
    next(err);
  }
};

// ================= GET TENANT EMPLOYEES =================
exports.getTenantEmployees = async (req, res, next) => {
  try {
    const masterDB = await connectMasterDB();
    const Company = CompanyModel(masterDB);

    const company = await Company.findById(req.params.id).lean();
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (!company.dbName) {
      return res.status(400).json({ message: "Company database not configured" });
    }

    const tenantConn = await getTenantDB(company.dbName);
    const Employee = User.forTenant(tenantConn);
    const TenantRole = Role.forTenant(tenantConn);

    const search = String(req.query.search || req.query.q || "").trim();
    const roleQuery = String(req.query.role || "all").trim();
    const role = roleQuery.toLowerCase();
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const limit = Math.max(parseInt(req.query.limit, 10) || 6, 1);
    const skip = (page - 1) * limit;

    const filter = {};

    if (search) {
      const safeSearch = escapeRegex(search);
      filter.$or = [
        { name: { $regex: safeSearch, $options: "i" } },
        { email: { $regex: safeSearch, $options: "i" } },
      ];
    }

    if (role && role !== "all") {
      const isObjectId = mongoose.Types.ObjectId.isValid(roleQuery);
      if (isObjectId) {
        filter.role = roleQuery;
      } else {
        const matchedRole = await TenantRole.findOne({
          roleName: { $regex: `^${escapeRegex(roleQuery)}$`, $options: "i" },
        }).select("_id").lean();
        if (matchedRole) {
          filter.role = matchedRole._id;
        }
      }
    }

    const [employees, total, roleIds] = await Promise.all([
      Employee.find(filter)
        .select("name email role createdAt updatedAt")
        .populate("role", "roleName", TenantRole)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Employee.countDocuments(filter),
      Employee.distinct("role"),
    ]);

    let roles = [];
    if (Array.isArray(roleIds) && roleIds.length > 0) {
      const roleDocs = await TenantRole.find({ _id: { $in: roleIds } })
        .select("roleName")
        .lean();
      roles = roleDocs.map((r) => String(r.roleName || "").trim()).filter(Boolean);
    }

    const pages = Math.max(1, Math.ceil(total / limit));

    res.json({
      companyId: company._id,
      companyName: company.companyName,
      dbName: company.dbName,
      total,
      pagination: {
        total,
        page,
        limit,
        pages,
      },
      roles: roles.sort((a, b) => a.localeCompare(b)),
      employees,
    });
  } catch (err) {
    next(err);
  }
};



exports.approveCompany = async (req, res) => {
  try {
    const { companyId } = req.params;
    const conn = await connectMasterDB();

    const Company = CompanyModel(conn);
    const SuperAdmin = SuperAdminModel(conn);

    // 1️⃣ Activate company immediately
    const company = await Company.findByIdAndUpdate(
      companyId,
      { isActive: true, approvedAt: new Date() },
      { new: true }
    );
    if (!company) return res.status(404).json({ message: "Company not found" });

    // 2️⃣ Send email to company admin (non-blocking)
    if (company.adminEmail) {
      sendMailSafely(
        {
          to: company.adminEmail,
          subject: "🎉 Your account has been approved!",
          html: `
            <h3>Welcome to MyMunc!</h3>
            <p>Your company <b>${company.companyName}</b> is now approved and active.</p>
            <p>You can now login to your dashboard:</p>
            <a href="http://${company.subdomain}.localhost:3000">Go to Dashboard</a>
          `,
        },
        `approval admin ${company.adminEmail}`
      );
    } else {
      console.warn("No admin email found for this company");
    }

    // 3️⃣ Notify super admin (non-blocking)
    const superAdmin = await SuperAdmin.findOne({}); // pick first super admin
    if (superAdmin?.email) {
      sendMailSafely(
        {
          to: superAdmin.email,
          subject: "✅ Company Approved",
          html: `<p>You approved <b>${company.companyName}</b></p>`,
        },
        `approval superadmin ${superAdmin.email}`
      );
    }

    // 4️⃣ Respond immediately with updated entity for frontend sync
    res.json({ message: "Company approved successfully", company });
  } catch (err) {
    console.error("APPROVE ERROR:", err);
    res.status(500).json({ message: "Failed to approve company" });
  }
};











// ================= ACTIVATE / DEACTIVATE TENANT =================
exports.updateTenantStatus = async (req, res, next) => {
  try {
    const { isActive } = req.body;

    if (typeof isActive !== "boolean") {
      return res.status(400).json({ message: "isActive must be boolean" });
    }

    const masterDB = await connectMasterDB();
    const Company = CompanyModel(masterDB);

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { isActive, ...(isActive ? { approvedAt: new Date() } : {}) },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // 📧 email company admin on activation (non-blocking)
    if (isActive && company.adminEmail) {
      sendMailSafely(
        {
          to: company.adminEmail,
          subject: "🎉 Your Company is Now Active",
          html: `
            <h2>Congratulations!</h2>
            <p>Your company <b>${company.companyName}</b> is now active.</p>
            <p>Login here:</p>
            <a href="https://${company.subdomain}.imsmymunc.com">
              Go to Dashboard
            </a>
          `,
        },
        `status update ${company.adminEmail}`
      );
    }

    res.json({ message: "Company status updated", company });
  } catch (err) {
    next(err);
  }
};

// ================= UPDATE PLAN =================
exports.updateTenantPlan = async (req, res, next) => {
  try {
    const { plan } = req.body;
    const Company = CompanyModel(await connectMasterDB());

    await Company.findByIdAndUpdate(req.params.id, { plan });

    res.json({ message: "Company plan updated" });
  } catch (err) {
    next(err);
  }
};

exports.updateTenantMaxEmployees = async (req, res, next) => {
  try {
    const { maxEmployees } = req.body;
    const parsedMaxEmployees = Number(maxEmployees);

    if (!Number.isInteger(parsedMaxEmployees) || parsedMaxEmployees < 1) {
      return res.status(400).json({
        message: "maxEmployees must be a positive whole number",
      });
    }

    const masterDB = await connectMasterDB();
    const Company = CompanyModel(masterDB);
    const company = await Company.findById(req.params.id);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    const tenantConn = await getTenantDB(company.dbName);
    const Employee = User.forTenant(tenantConn);
    const currentEmployeeCount = await Employee.countDocuments();

    if (parsedMaxEmployees < currentEmployeeCount) {
      return res.status(400).json({
        message: `Cannot reduce max employees below current employee count (${currentEmployeeCount})`,
        currentCount: currentEmployeeCount,
        maxLimit: parsedMaxEmployees,
      });
    }

    company.maxEmployees = parsedMaxEmployees;
    await company.save();

    res.json({ message: "Company max employees updated", company });
  } catch (err) {
    next(err);
  }
};

const normalizeCompanyModulePermissions = (modulePermissions = {}) => {
  const normalized = {};

  Object.keys(modulePermissions || {}).forEach((module) => {
    const perms = modulePermissions[module] || {};
    const all =
      Boolean(perms.all) ||
      (Boolean(perms.export) &&
        Boolean(perms.import) &&
        Boolean(perms.create) &&
        Boolean(perms.read) &&
        Boolean(perms.update) &&
        Boolean(perms.delete));

    normalized[module] = {
      export: all || Boolean(perms.export),
      import: all || Boolean(perms.import),
      create: all || Boolean(perms.create),
      read: all || Boolean(perms.read),
      update: all || Boolean(perms.update),
      delete: all || Boolean(perms.delete),
      all,
    };
  });

  return normalized;
};

// ================= UPDATE TENANT MODULE PERMISSIONS =================
exports.updateTenantModulePermissions = async (req, res, next) => {
  try {
    const { modulePermissions } = req.body;

    if (!modulePermissions || typeof modulePermissions !== "object") {
      return res.status(400).json({ message: "modulePermissions object is required" });
    }

    const normalizedPermissions = normalizeCompanyModulePermissions(modulePermissions);
    const Company = CompanyModel(await connectMasterDB());

    const company = await Company.findByIdAndUpdate(
      req.params.id,
      { modulePermissions: normalizedPermissions },
      { new: true }
    );

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (company.dbName) {
      try {
        const tenantConn = await getTenantDB(company.dbName);
        const TenantRole = Role.forTenant(tenantConn);
        let adminRole = await TenantRole.findOne({ roleName: "ADMIN" });

        if (adminRole) {
          adminRole.modulePermissions = normalizedPermissions;
          await adminRole.save();
          console.log(`✅ Synced ADMIN role permissions for tenant ${company.dbName}`);
        } else {
          adminRole = await TenantRole.create({
            roleName: "ADMIN",
            status: "Active",
            modulePermissions: normalizedPermissions,
          });
          console.log(`✅ Created ADMIN role for tenant ${company.dbName}`);
        }
      } catch (tenantErr) {
        console.error(`Failed to sync ADMIN role permissions for tenant ${company.dbName}:`, tenantErr);
        return res.status(500).json({
          message: "Company permissions updated but failed to sync ADMIN role in tenant database",
          error: tenantErr.message,
        });
      }
    }

    res.json({ message: "Company module permissions updated", company });
  } catch (err) {
    next(err);
  }
};

// ================= UPDATE EMPLOYEE SIZE =================
exports.updateEmployeeSize = async (req, res, next) => {
  try {
    const { employeeSize } = req.body;
    const Company = CompanyModel(await connectMasterDB());

    await Company.findByIdAndUpdate(req.params.id, {
      employeeSize: Number(employeeSize),
    });

    res.json({ message: "Employee size updated" });
  } catch (err) {
    next(err);
  }
};

// ================= DELETE TENANT =================
exports.deleteTenant = async (req, res, next) => {
  try {
    const Company = CompanyModel(await connectMasterDB());

    await Company.findByIdAndDelete(req.params.id);
    res.json({ message: "Company deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// ================= DASHBOARD STATS =================
exports.getDashboardStats = async (req, res, next) => {
  try {
    const masterDB = await connectMasterDB();
    const Company = CompanyModel(masterDB);

    const total = await Company.countDocuments();
    const active = await Company.countDocuments({ isActive: true });
    const pro = await Company.countDocuments({ plan: "PRO" });

    res.json({
      totalCompanies: total,
      activeCompanies: active,
      proCompanies: pro,
    });
  } catch (err) {
    next(err);
  }
};

// ================= DASH CARD (TOTAL COMPANY + TOTAL EARNINGS) =================
exports.dashCard = async (req, res, next) => {
  try {
    const masterDB = await connectMasterDB();
    const Company = CompanyModel(masterDB);

    const [
      totalCompanies,
      earningsAgg,
      freePlanCount,
      standardPlanCount,
      proPlanCount,
    ] = await Promise.all([
      Company.countDocuments(),
      Company.aggregate([
        {
          $match: {
            planPrice: { $type: "number" },
          },
        },
        {
          $group: {
            _id: null,
            totalEarnings: { $sum: "$planPrice" },
          },
        },
      ]),
      Company.countDocuments({ plan: "free" }),
      Company.countDocuments({ plan: "standard" }),
      Company.countDocuments({ plan: "pro" }),
    ]);

    const totalEarnings = earningsAgg?.[0]?.totalEarnings || 0;

    res.json({
      totalCompanies,
      totalEarnings,
      freePlanCount,
      standardPlanCount,
      proPlanCount,
    });
  } catch (err) {
    next(err);
  }
};

