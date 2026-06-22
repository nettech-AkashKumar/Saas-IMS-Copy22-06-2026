

const mongoose = require("mongoose");
const OtpModel = require("../../../models/SaaS/master/Otp.model");
const connectMasterDB = require("../../../config/SaaS/masterDb");
const getTenantDB = require("../../../config/SaaS/tenantDb");
const CompanyModel = require("../../../models/SaaS/master/Company.model"); // Master DB company model
const PricingModel = require("../../../models/SaaS/master/Pricing");
const User = require("../../../models/usersModels"); // User model for tenant
const RoleModel = require("../../../models/roleModels"); // Role model for tenant
const bcrypt = require("bcryptjs");
const { loadPlansFromDatabase } = require("../../../config/SaaS/plans");
const { initializeTenantDB } = require("../../../utils/SaaS/tenantInitializer");
const CompanySetting = require("../../../models/settings/companysettingmodal");

const { sendMail } = require("../../../utils/SaaS/sendMail");


exports.registerCompany = async (req, res) => {
   let tenantConn = null;
  let company = null;
  let Company = null;

  const cleanupFailedRegistration = async () => {
    if (tenantConn && tenantConn.readyState === 1) {
      try {
        await tenantConn.dropDatabase();
        console.log(`✅ Dropped incomplete tenant DB: ${tenantConn.name}`);
      } catch (dropError) {
        console.error(`❌ Failed to drop tenant DB ${tenantConn.name}:`, dropError.message);
      }

      try {
        await tenantConn.close();
      } catch (closeError) {
        console.error(`❌ Failed to close tenant DB connection ${tenantConn.name}:`, closeError.message);
      }
    }

    if (company && company._id && Company) {
      try {
        await Company.deleteOne({ _id: company._id });
        console.log(`✅ Rolled back master company record: ${company._id}`);
      } catch (deleteError) {
        console.error(`❌ Failed to rollback master company ${company._id}:`, deleteError.message);
      }
    }
  };

  try {
    const {
      companyName,
      companyEmail,
      companyPhone,
      employeeSize,
      industry,
      gst,
      website,
      subdomain,
      adminName,
      adminEmail,
      adminPassword,
      phone,
      plan,
      billingCycle,
    } = req.body;

    // Normalize plan key for company schema using SaaS plan aliases

    const masterConn = await connectMasterDB();
    // const Company = CompanyModel(masterConn);
      Company = CompanyModel(masterConn);
    const Pricing = PricingModel(masterConn);

    // ✨ Load dynamic plans from database
    const PLANS = await loadPlansFromDatabase(Pricing);
    console.log(`✅ Plans loaded from database:`, Object.keys(PLANS));

    const cycle = billingCycle === "annually" ? "annually" : "monthly";

    const resolvePricingRecord = async (identifier) => {
      if (!identifier) return null;
      if (mongoose.isValidObjectId(identifier)) {
        const record = await Pricing.findById(identifier).lean();
        if (record) return record;
      }

      const normalized = identifier.toString().trim();
      return Pricing.findOne({
        $or: [
          { name: { $regex: new RegExp(`^${normalized}$`, "i") } },
          { title: { $regex: new RegExp(`^${normalized}$`, "i") } },
        ],
      }).lean();
    };

    const pricingRecord = await resolvePricingRecord(plan);
    const planName = (pricingRecord?.title || pricingRecord?.name || plan || "free").toLowerCase().trim();
    const selectedPlanName = PLANS[planName]?.displayName || planName;
    const planPermissions = PLANS[planName]?.modulePermissions || {};
    const planPrice = PLANS[planName]?.price?.[cycle] || 0;

    const maxEmployees = PLANS[planName]?.maxEmployees || 1;

    const dbName = `${subdomain.toLowerCase()}_ims_db`;

    const existingCompany = await Company.findOne({
      $or: [
        { subdomain: subdomain.toLowerCase() },
        { adminEmail },
        { companyEmail },
        { dbName },
      ],
    });

    if (existingCompany) {
      let conflictField = "unknown";
      if (existingCompany.subdomain === subdomain.toLowerCase()) {
        conflictField = "subdomain";
      } else if (existingCompany.adminEmail === adminEmail) {
        conflictField = "admin email";
      } else if (existingCompany.companyEmail === companyEmail) {
        conflictField = "company email";
      } else if (existingCompany.dbName === dbName) {
        conflictField = "database name";
      }

      return res.status(409).json({
        message: `Company already registered with this ${conflictField}.`,
        conflictField,
        existingValue: existingCompany[Object.keys(existingCompany.toObject()).find(key => 
          existingCompany[key] === adminEmail || 
          existingCompany[key] === companyEmail || 
          existingCompany[key] === subdomain.toLowerCase()
        )],
      });
    }

 

    // Create admin user in tenant DB
    // const tenantConn = await getTenantDB(dbName);
    tenantConn = await getTenantDB(dbName);
    console.log(`✅ Tenant DB connection established: ${tenantConn.name}`);

    // ✅ Initialize all models in tenant database
    console.log(`🔧 Initializing tenant database...`);
    const initResult = await initializeTenantDB(tenantConn);
    console.log(`✅ Tenant DB initialized:`, initResult.totalModels, "models ready");

    // Create tenant-specific models
    const CompanySettingModel = CompanySetting.forTenant(tenantConn);
    const TenantUser = User.forTenant(tenantConn);
    const TenantRole = RoleModel.forTenant(tenantConn);

   
    
    
    // Create default company settings in tenant DB so the Settings modal has initial data
    const normalizePhone = (value) => {
      const cleaned = String(value || "").replace(/\D/g, "");
      return cleaned.length === 10 ? cleaned : "";
    };

    const normalizedCompanyPhone = normalizePhone(companyPhone) || normalizePhone(phone) || "0000000000";
    const normalizedAlternativePhone = normalizePhone(phone) || "";

    const fallbackCompanyName = companyName || subdomain || "New Company";
    const fallbackCompanyEmail =
      companyEmail || adminEmail || `${subdomain || "company"}@example.com`;
    const fallbackAddress = fallbackCompanyName;

    const defaultCompanySetting = {
      companyName: fallbackCompanyName,
      companyTitle: fallbackCompanyName,
      companyemail: fallbackCompanyEmail,
      companyphone: normalizedCompanyPhone,
      website: website || "",
      gstin: gst || "",
      businessType: industry || "",
      alternativePhone: normalizedAlternativePhone,
      companyaddress: fallbackAddress,
      billingAddress: fallbackAddress,
      shippingAddress: fallbackAddress,
      companycountry: "India",
      companystate: "",
      companycity: "",
      companypostalcode: "",
      cin: "",
      companydescription: industry || "",
    };

    try {
      const existingCompanySetting = await CompanySettingModel.findOne();
      if (!existingCompanySetting) {
        await CompanySettingModel.create(defaultCompanySetting);
        console.log(`✅ Default company settings created for tenant ${dbName}`);
      }
    } catch (companySettingError) {
      console.error(`❌ Failed to create default tenant company settings:`, companySettingError);
      throw new Error(`Failed to initialize tenant company settings: ${companySettingError.message}`);
    }

    const defaultAdminPermissions = {
      users: {
        create: true,
        read: true,
        update: true,
        delete: true,
        export: true,
        import: true,
        all: true,
      },
      roles: {
        create: true,
        read: true,
        update: true,
        delete: true,
        export: true,
        import: true,
        all: true,
      },
    };

    // Ensure ADMIN always has the default admin permissions.
    // Merge plan permissions with defaults but give priority to defaults
    // so ADMIN always retains full access for core modules.
    let adminPermissions = Object.keys(planPermissions || {}).length
      ? { ...planPermissions }
      : {};

    Object.keys(defaultAdminPermissions).forEach((mod) => {
      // default values should override/ensure presence
      adminPermissions[mod] = defaultAdminPermissions[mod];
    });

    // Find or create ADMIN role
    let adminRole = await TenantRole.findOne({ roleName: "ADMIN" });
    if (!adminRole) {
      adminRole = await TenantRole.create({
        roleName: "ADMIN",
        status: "Active",
        modulePermissions: adminPermissions,
      });
      console.log(`✅ ADMIN role created: ${adminRole._id}`);
    } else {
      // Always enforce default-admin merged permissions on the ADMIN role
      adminRole.modulePermissions = adminPermissions;
      await adminRole.save();
      console.log(`✅ ADMIN role permissions enforced/updated: ${adminRole._id}`);
    }

    const hashedPassword = await bcrypt.hash(adminPassword, 10);
    console.log(`🔐 Password hashed for ${adminEmail}`);

    const employeeData = {
      name: adminName,
      email: adminEmail,
      password: hashedPassword,
      role: adminRole._id,
      phone: phone || "",
      status: "Active",
    };
    console.log(`👤 Creating employee with data:`, {
      name: employeeData.name,
      email: employeeData.email,
      role: employeeData.role,
      phone: employeeData.phone,
      status: employeeData.status,
    });

    try {
      const employee = await TenantUser.create(employeeData);
      console.log(`✅ Admin employee created successfully: ${employee._id}`);
    } catch (employeeError) {
      console.error(`❌ Failed to create employee:`, employeeError);
      throw new Error(`Employee creation failed: ${employeeError.message}`);
    }

    // Create company in master DB only after tenant role and admin user are successfully created
    company = await Company.create({
      companyName,
      companyEmail,
      companyPhone,
      employeeSize,
      industry,
      gst,
      website,
      subdomain: subdomain.toLowerCase(),
      dbName,
      plan: planName,
      billingCycle: cycle,
      planPrice,
      maxEmployees,
      modulePermissions: planPermissions,
      adminEmail,
      isActive: false, // 🔥 inactive by default
    });
    console.log(`✅ Master company record created: ${company._id}`);

    console.log(`🔧 Tenant User model created:`, typeof TenantUser);
    console.log(`🔧 Tenant Role model created:`, typeof TenantRole);

    // 📧 email super admin
    await sendMail({
      to: process.env.SUPER_ADMIN_EMAIL,
      subject: "🆕 New Company Registration",
      html: `
        <div style="padding:0 0 20px;">
          <p style="margin:0;font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">New company application</p>
          <h2 style="margin:10px 0 0;font-size:24px;color:#111827;">${companyName || fallbackCompanyName} is waiting for approval</h2>
        </div>
        <div style="background:#f7fbff;padding:18px 20px;border-radius:14px;margin:20px 0;">
          <p style="margin:0;font-size:15px;color:#22303c;"><strong>Subdomain:</strong> ${subdomain}</p>
          <p style="margin:8px 0 0;font-size:15px;color:#22303c;"><strong>Plan:</strong> ${selectedPlanName} (${cycle})</p>
          <p style="margin:8px 0 0;font-size:15px;color:#22303c;"><strong>Price:</strong> ₹${planPrice}</p>
          <p style="margin:8px 0 0;font-size:15px;color:#22303c;"><strong>Max Employees:</strong> ${maxEmployees}</p>
        </div>
        <p style="margin:0 0 24px;font-size:15px;color:#4b5563;">Please review the company details in the admin panel and approve the account when ready.</p>
        <div style="text-align:center;margin-top:10px;">
          <a href="${process.env.ADMIN_DASHBOARD_URL || "#"}" style="display:inline-block;padding:12px 24px;background:#2558ff;color:#ffffff;border-radius:10px;text-decoration:none;font-weight:600;">Open Admin Dashboard</a>
        </div>
      `,
    });

    // 📧 email company admin
    await sendMail({
      to: adminEmail,
      subject: "⏳ Company Pending Approval",
      html: `
        <div style="padding:0 0 20px;">
          <p style="margin:0;font-size:14px;color:#6b7280;text-transform:uppercase;letter-spacing:1px;">Registration received</p>
          <h2 style="margin:10px 0 0;font-size:24px;color:#111827;">Thanks for registering with MyMunc SaaS</h2>
        </div>
        <p style="margin:0;font-size:15px;color:#4b5563;">Your company is currently under review. We will notify you via email once approval is complete.</p>
        <div style="background:#f7fbff;padding:18px 20px;border-radius:14px;margin:20px 0;">
          <p style="margin:0;font-size:15px;color:#22303c;"><strong>Company:</strong> ${companyName || fallbackCompanyName}</p>
          <p style="margin:8px 0 0;font-size:15px;color:#22303c;"><strong>Admin email:</strong> ${adminEmail}</p>
          <p style="margin:8px 0 0;font-size:15px;color:#22303c;"><strong>Subdomain:</strong> ${subdomain}</p>
        </div>
        <p style="margin:0;font-size:15px;color:#4b5563;">In the meantime, feel free to prepare your team and company details. We’ll be in touch soon!</p>
      `,
    });

    res.status(201).json({
      message: "Company registered. Waiting for approval.",
    });
  } catch (err) {
    await cleanupFailedRegistration();

    console.error("❌ Register Company Error:", {
      error: err.message,
      code: err.code,
      body: req.body,
    });

    if (err.code === 11000) {
      const field = Object.keys(err.keyPattern)[0];
      return res.status(409).json({
        message: `Company already registered with this ${field}.`,
        conflictField: field,
        error: "DUPLICATE_KEY",
      });
    }
    res.status(500).json({ 
      message: err.message,
      error: "REGISTRATION_FAILED",
    });
  }
};

/**
 * Get company details including modulePermissions
 * @route GET /api/public/company-details
 * @param {string} subdomain - Company subdomain (optional, from query)
 */
exports.getCompanyDetails = async (req, res, next) => {
  try {
    let subdomain = req.query.subdomain || req.body.subdomain || "";

    // If no subdomain provided, try to get from user's tenant
    if (!subdomain && req.user?.tenant?.subdomain) {
      subdomain = req.user.tenant.subdomain;
    }

    if (!subdomain) {
      return res.status(400).json({
        message: "Subdomain is required",
      });
    }

    const masterConn = await connectMasterDB();
    const Company = CompanyModel(masterConn);

    const company = await Company.findOne({
      subdomain: subdomain.toLowerCase(),
    }).select("companyName subdomain modulePermissions plan planName");

    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    // Return company details with modulePermissions
    res.status(200).json({
      _id: company._id,
      companyName: company.companyName,
      subdomain: company.subdomain,
      plan: company.plan,
      planName: company.planName,
      modulePermissions: company.modulePermissions || {},
    });
  } catch (error) {
    console.error("Get company details error:", error);
    if (res.headersSent) return;
    return res.status(error.statusCode || 500).json({
      message: "Server error",
      error: error.message,
    });
  }
};

/**
 * Get all company module permissions for role filtering
 * @route GET /api/public/company-modules
 */
exports.getCompanyModulePermissions = async (req, res, next) => {
  try {
    let subdomain = req.query.subdomain || "";

    if (!subdomain && req.user?.tenant?.subdomain) {
      subdomain = req.user.tenant.subdomain;
    }

    if (!subdomain) {
      return res.status(400).json({
        message: "Subdomain is required",
      });
    }

    const masterConn = await connectMasterDB();
    const Company = CompanyModel(masterConn);

    const company = await Company.findOne({
      subdomain: subdomain.toLowerCase(),
    }).select("modulePermissions");

    if (!company) {
      return res.status(404).json({
        message: "Company not found",
      });
    }

    // Return only the module names (keys) that the company has permissions for
    res.status(200).json({
      modules: Object.keys(company.modulePermissions || {}),
    });
  } catch (error) {
    console.error("Get company modules error:", error);
    if (res.headersSent) return;
    return res.status(error.statusCode || 500).json({
      message: "Server error",
      error: error.message,
    });
  }
};


