const connectMasterDB = require("../../config/SaaS/masterDb");
const getTenantDB = require("../../config/SaaS/tenantDb");
const CompanyModel = require("../../models/SaaS/master/Company.model");

// ⚡ simple in-memory cache (huge performance boost)
const tenantCache = new Map();

module.exports = async (req, res, next) => {
  try {
    let host = req.headers.host || "";

    // ✅ remove port (important)
    host = host.split(":")[0];

    const parts = host.split(".");
    let subdomain = parts[0];

    // ✅ Handle localhost cases
    if (host.includes("localhost")) {
      subdomain = parts.length > 1 ? parts[0] : "localhost";
    }

    // ✅ Skip public domains
    const skipDomains = ["imsmymunc", "admin", "localhost", "127", "www"];
    if (skipDomains.includes(subdomain)) {
      return next();
    }

    // =========================
    // ✅ CACHE CHECK (FAST PATH)
    // =========================
    if (tenantCache.has(subdomain)) {
      const cached = tenantCache.get(subdomain);

      req.tenant = cached.tenant;
      req.db = cached.db;

      return next();
    }

    // =========================
    // ✅ FETCH FROM MASTER DB
    // =========================
    const masterDB = await connectMasterDB();

    const Company = CompanyModel.forMaster
      ? CompanyModel.forMaster(masterDB)
      : CompanyModel(masterDB); // fallback

    const tenant = await Company.findOne({ subdomain }).lean();

    if (!tenant) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (!tenant.isActive) {
      return res.status(403).json({ message: "Company inactive" });
    }

    if (!tenant.dbName) {
      return res.status(500).json({ message: "Tenant DB not configured" });
    }

    // =========================
    // ✅ CONNECT TENANT DB
    // =========================
    const tenantDB = await getTenantDB(tenant.dbName);

    // =========================
    // ✅ ATTACH TO REQUEST
    // =========================
    req.tenant = {
      ...tenant,
      dbName: tenant.dbName,
    };

    req.db = tenantDB;

    // =========================
    // ✅ CACHE IT (IMPORTANT)
    // =========================
    tenantCache.set(subdomain, {
      tenant: req.tenant,
      db: tenantDB,
    });

    // Optional: auto expire cache (10 min)
    setTimeout(() => {
      tenantCache.delete(subdomain);
    }, 10 * 60 * 1000);

    next();
  } catch (err) {
    console.error("❌ Tenant resolver error:", err.message);
    next(err);
  }
};


// const connectMasterDB = require("../../config/SaaS/masterDb");
// const getTenantDB = require("../../config/SaaS/tenantDb");
// const CompanyModel = require("../../models/SaaS/master/Company.model");

// module.exports = async (req, res, next) => {
//   try {
//     const host = req.headers.host; // abc.imsmymunc.com or abc.localhost
//     const parts = host.split(".");
//     let subdomain = parts[0];

//     // Handle localhost subdomains (e.g., abc.localhost)
//     if (host.includes("localhost") && parts.length > 1) {
//       subdomain = parts[0];
//     } else if (parts.length > 2) {
//       // For production domains like abc.imsmymunc.com
//       subdomain = parts[0];
//     }

//     // Public & admin domains
//     if (subdomain === "mymunc" || subdomain === "admin" || subdomain === "localhost" || subdomain === "127" || subdomain === "www") {
//       return next();
//     }

//     const masterDB = await connectMasterDB();
//     const Company = CompanyModel(masterDB);

//     const tenant = await Company.findOne({ subdomain });

//     if (!tenant) {
//       return res.status(404).json({ message: "Company not found" });
//     }

//     if (!tenant.isActive) {
//       return res.status(403).json({ message: "Company inactive" });
//     }

//     const tenantDB = await getTenantDB(tenant.dbName);

//     req.tenant = tenant;
//     req.db = tenantDB;

//     next();
//   } catch (err) {
//     console.error("Tenant resolver error:", err);
//     next(err);
//   }
// };