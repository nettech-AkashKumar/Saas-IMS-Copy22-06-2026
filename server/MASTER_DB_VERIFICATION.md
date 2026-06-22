# Master DB Models - Structure & Verification

## ✅ All 5 Master Models Verified with Factory Pattern

### Model Files Location
```
server/models/SaaS/master/
├── Company.model.js              ✅ Factory pattern
├── Otp.model.js                  ✅ Factory pattern
├── SuperAdmin.js                 ✅ Factory pattern
├── ReminderTemplate.model.js      ✅ Factory pattern
└── ReminderSendLog.model.js       ✅ Factory pattern
```

### Factory Pattern Implementation (All models use this):
```javascript
module.exports = (conn) =>
  conn.models.ModelName || conn.model("ModelName", Schema, "collectionName");
```

---

## Master DB Data Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    MASTER DATABASE                           │
│              (zeelani_master_db)                             │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ SuperAdmins Collection                               │  │
│  │ ├─ email (unique)                                    │  │
│  │ ├─ password (hashed)                                 │  │
│  │ └─ Seeded at server startup                          │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ Companies Collection                                 │  │
│  │ ├─ companyName                                       │  │
│  │ ├─ subdomain (unique) ← Routing key                  │  │
│  │ ├─ dbName ← Tenant DB reference                      │  │
│  │ ├─ adminEmail                                        │  │
│  │ ├─ isActive ← Approval status                        │  │
│  │ └─ approvedAt                                        │  │
│  └──────────────────────────────────────────────────────┘  │
│             ↓                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ OTPs Collection                                      │  │
│  │ ├─ email                                             │  │
│  │ ├─ otp (6-digit code)                                │  │
│  │ ├─ expiresAt                                         │  │
│  │ └─ verified (boolean)                                │  │
│  └──────────────────────────────────────────────────────┘  │
│             ↓                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ReminderTemplates Collection                         │  │
│  │ ├─ title                                             │  │
│  │ ├─ description                                       │  │
│  │ ├─ createdById (ref: SuperAdmin)                     │  │
│  │ └─ sendCount                                         │  │
│  └──────────────────────────────────────────────────────┘  │
│             ↓                                                │
│  ┌──────────────────────────────────────────────────────┐  │
│  │ ReminderSendLogs Collection                          │  │
│  │ ├─ companyId (ref: Company)                          │  │
│  │ ├─ companyName                                       │  │
│  │ └─ logs[] (array of sends)                           │  │
│  │    └─ templateId, sentBy, sentAt                     │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## Model Relationships

```
┌──────────────┐
│  SuperAdmin  │ (Creates templates & approves companies)
└──────┬───────┘
       │ ref: createdById
       ↓
┌──────────────────────────┐
│ ReminderTemplate         │ (Email/SMS templates)
└──────┬───────────────────┘
       │ ref: templateId
       ↓
┌──────────────────────────┐
│ ReminderSendLog          │ (Send history)
└──────┬───────────────────┘
       │ ref: companyId
       ↓
┌──────────────────────────┐
│ Company                  │ (Company registry)
└──────┬───────────────────┘
       │ uses: subdomain → tenant DB
       ↓
   [Tenant DB] (company_hrms_db)
   ├─ Users
   ├─ Roles
   ├─ Products
   ├─ Invoices
   └─ ... all business data
```

---

## Usage in Controllers

### Example: Company Registration
```javascript
// /controllers/SaaS/public/registerCompany.controller.js

const connectMasterDB = require("../../../config/SaaS/masterDb");
const getTenantDB = require("../../../config/SaaS/tenantDb");
const CompanyModel = require("../../../models/SaaS/master/Company.model");

exports.registerCompany = async (req, res) => {
  const masterConn = await connectMasterDB();
  const Company = CompanyModel(masterConn); // ✅ Bind to Master DB

  // Check if company exists
  const existing = await Company.findOne({ 
    $or: [
      { subdomain: req.body.subdomain },
      { adminEmail: req.body.adminEmail }
    ]
  });

  // Create company record in Master DB
  const company = await Company.create({
    companyName: req.body.companyName,
    subdomain: req.body.subdomain,
    adminEmail: req.body.adminEmail,
    dbName: `${req.body.subdomain}_hrms_db`,
    isActive: false // ⚠️ Inactive until approved
  });

  // Create Tenant DB
  const tenantConn = await getTenantDB(company.dbName);
  // ... seed roles and admin user in tenant ...
};
```

### Example: Super Admin Approval
```javascript
// /controllers/SaaS/superAdmin/approveCompany.controller.js

exports.approveCompany = async (req, res) => {
  const masterConn = await connectMasterDB();
  const Company = CompanyModel(masterConn); // ✅ Master DB

  const company = await Company.findByIdAndUpdate(
    req.params.companyId,
    {
      isActive: true,
      approvedAt: new Date()
    },
    { new: true }
  );

  res.json({ message: "Company approved", company });
};
```

### Example: Send Reminder
```javascript
// Scheduler or background job

const ReminderSendLog = ReminderSendLogModel(masterConn);
const ReminderTemplate = ReminderTemplateModel(masterConn);

// Get all companies
const companies = await Company.find({ isActive: true });

for (const company of companies) {
  // Get template
  const template = await ReminderTemplate.findById(templateId);

  // Send email to company
  await sendEmail({ to: company.adminEmail, body: template.description });

  // Log the send
  await ReminderSendLog.findByIdAndUpdate(logId, {
    $push: {
      logs: {
        templateId: template._id,
        templateTitle: template.title,
        sentByName: "System",
        sentAt: new Date()
      }
    }
  });
}
```

---

## Master DB Routes

```javascript
// Public routes (no Master DB check needed - for registration)
POST   /api/public/register-company

// Super Admin routes (Master DB required)
GET    /api/super/companies                 // List all companies
GET    /api/super/companies/:id             // Get company
PATCH  /api/super/companies/:id/approve     // Activate company
GET    /api/super/reminders/templates       // List templates
POST   /api/super/reminders/templates       // Create template
GET    /api/super/reminders/logs            // View send logs

// Auth routes (Master DB for super admin login)
POST   /api/super/auth/login                // SuperAdmin login
POST   /api/super/auth/refresh              // Refresh token
```

---

## Checklist - All Master DB Models Ready ✅

- [x] Company.model.js - Factory pattern implemented
- [x] Otp.model.js - Factory pattern implemented
- [x] SuperAdmin.js - Factory pattern implemented
- [x] ReminderTemplate.model.js - Factory pattern implemented
- [x] ReminderSendLog.model.js - Factory pattern implemented
- [x] All models use mongoose.createConnection() pattern
- [x] All models specify collection names
- [x] All models have proper indexes (unique fields)
- [x] All models used in seeders with factory pattern
- [x] Master DB connection caching implemented

**Master Database is fully configured and ready for production!** ✅
