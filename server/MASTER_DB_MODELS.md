# Master DB Models - Complete Overview

SaaS Master Database contains these 5 models, all with factory pattern implementation:

## 1. **Company Model** (`models/SaaS/master/Company.model.js`)
Company registry for all organizations

### Fields:
- `companyName` - Company name
- `companyEmail` - Company email
- `companyPhone` - Company phone
- `subdomain` - Unique subdomain (e.g., "abc" in abc.imsmymunc.com)
- `dbName` - Tenant database name (e.g., "abc_hrms_db")
- `adminEmail` - Admin email (unique)
- `plan` - Subscription plan (free/standard/pro)
- `billingCycle` - monthly/annually
- `planPrice` - Plan cost
- `maxEmployees` - Employee limit
- `isActive` - Company activation status
- `approvedAt` - Approval timestamp
- `otp` - Registration OTP
- `otpExpiresAt` - OTP expiry time

### Usage:
```javascript
const connectMasterDB = require("./config/SaaS/masterDb");
const CompanyModel = require("./models/SaaS/master/Company.model");

const masterConn = await connectMasterDB();
const Company = CompanyModel(masterConn);

// Create company
const company = await Company.create({
  companyName: "Acme Corp",
  subdomain: "acme",
  dbName: "acme_hrms_db",
  adminEmail: "admin@acme.com"
});

// Find company
const company = await Company.findOne({ subdomain: "acme" });

// Activate company
await Company.findByIdAndUpdate(company._id, {
  isActive: true,
  approvedAt: new Date()
});
```

---

## 2. **OTP Model** (`models/SaaS/master/Otp.model.js`)
OTP records for email verification during registration

### Fields:
- `email` - Email to verify
- `otp` - 6-digit OTP code
- `expiresAt` - Expiry timestamp
- `verified` - Verification status

### Usage:
```javascript
const OtpModel = require("./models/SaaS/master/Otp.model");
const Otp = OtpModel(masterConn);

// Create OTP
const otpRecord = await Otp.create({
  email: "user@company.com",
  otp: "123456",
  expiresAt: new Date(Date.now() + 10 * 60 * 1000) // 10 mins
});

// Verify OTP
const verified = await Otp.findOne({ email, otp });
if (verified && verified.expiresAt > Date.now()) {
  await Otp.updateOne({ _id: verified._id }, { verified: true });
}
```

---

## 3. **SuperAdmin Model** (`models/SaaS/master/SuperAdmin.js`)
System administrators who manage companies and approvals

### Fields:
- `name` - Admin name
- `email` - Admin email (unique)
- `password` - Hashed password

### Usage:
```javascript
const SuperAdminModel = require("./models/SaaS/master/SuperAdmin");
const SuperAdmin = SuperAdminModel(masterConn);

// Create super admin
const admin = await SuperAdmin.create({
  name: "Main Admin",
  email: "admin@imsmymunc.com",
  password: hashedPassword
});

// Find admin
const admin = await SuperAdmin.findOne({ email });

// Seed default super admin (done in userSeeder.js)
```

---

## 4. **ReminderTemplate Model** (`models/SaaS/master/ReminderTemplate.model.js`)
Email/SMS templates for reminders (Invoice reminders, Payment due, etc.)

### Fields:
- `title` - Template title
- `description` - Template body/content
- `image` - Template image URL
- `createdById` - SuperAdmin ObjectId
- `createdByName` - Admin name
- `createdByEmail` - Admin email
- `lastSentByName` - Last sender name
- `lastSentByEmail` - Last sender email
- `lastSentAt` - Last send timestamp
- `sendCount` - Total sends count

### Usage:
```javascript
const ReminderTemplateModel = require("./models/SaaS/master/ReminderTemplate.model");
const ReminderTemplate = ReminderTemplateModel(masterConn);

// Create template
const template = await ReminderTemplate.create({
  title: "Invoice Reminder",
  description: "Dear {{customerName}}, your invoice {{invoiceNo}} is due.",
  createdById: superAdminId,
  createdByName: "Admin"
});

// Get all templates
const templates = await ReminderTemplate.find({});

// Update send count
await ReminderTemplate.findByIdAndUpdate(templateId, {
  $inc: { sendCount: 1 },
  lastSentAt: new Date(),
  lastSentByName: "Company Admin"
});
```

---

## 5. **ReminderSendLog Model** (`models/SaaS/master/ReminderSendLog.model.js`)
Log of all reminders sent to companies

### Fields:
- `companyId` - Company ObjectId (ref to Company)
- `companyName` - Company name
- `companyAdminEmail` - Admin email
- `logs[]` - Array of send logs:
  - `templateId` - Template ObjectId
  - `templateTitle` - Template title
  - `sentByName` - Who sent it
  - `sentByEmail` - Sender email
  - `sentAt` - Send timestamp

### Usage:
```javascript
const ReminderSendLogModel = require("./models/SaaS/master/ReminderSendLog.model");
const ReminderSendLog = ReminderSendLogModel(masterConn);

// Create log entry
const log = await ReminderSendLog.create({
  companyId: companyId,
  companyName: "Acme Corp",
  companyAdminEmail: "admin@acme.com"
});

// Add send log
await ReminderSendLog.findByIdAndUpdate(log._id, {
  $push: {
    logs: {
      templateId: templateId,
      templateTitle: "Invoice Reminder",
      sentByName: "System",
      sentByEmail: "noreply@imsmymunc.com",
      sentAt: new Date()
    }
  }
});

// Get company logs
const logs = await ReminderSendLog.findOne({ companyId });
```

---

## Usage Pattern - All Master Models

```javascript
// 1. Import factory pattern function
const connectMasterDB = require("./config/SaaS/masterDb");
const CompanyModel = require("./models/SaaS/master/Company.model");
const OtpModel = require("./models/SaaS/master/Otp.model");
const SuperAdminModel = require("./models/SaaS/master/SuperAdmin");
const ReminderTemplateModel = require("./models/SaaS/master/ReminderTemplate.model");
const ReminderSendLogModel = require("./models/SaaS/master/ReminderSendLog.model");

// 2. Connect to Master DB
const masterConn = await connectMasterDB();

// 3. Create models bound to Master DB connection
const Company = CompanyModel(masterConn);
const Otp = OtpModel(masterConn);
const SuperAdmin = SuperAdminModel(masterConn);
const ReminderTemplate = ReminderTemplateModel(masterConn);
const ReminderSendLog = ReminderSendLogModel(masterConn);

// 4. Use models - all queries go to Master DB
const company = await Company.findOne({ subdomain: "abc" });
const otp = await Otp.findOne({ email });
const admin = await SuperAdmin.findOne({ email });
```

---

## Master DB Collections (Auto-created)

When you use these models, MongoDB automatically creates:
- `companies` - Company records
- `otps` - OTP verification records
- `superadmins` - Super admin users
- `reminder_templates` - Email/SMS templates
- `reminder_send_logs` - Send logs

---

## Complete Initialization Flow

```javascript
// server/index.js
(async () => {
  // 1. Connect to Master DB
  const masterConn = await connectDB(); // Uses connectMasterDB internally

  // 2. Seed roles (in tenant, not master)
  await seedRoles(masterConn);

  // 3. Seed SuperAdmin user in Master DB
  await seedSuperAdmin(masterConn);

  // 4. Create Express app with tenant routes
  const app = express();
  app.use("/api/public", publicRoutesSaaS); // Company registration
  app.use("/api/super", superAdminRoutesSaaS); // SuperAdmin management
  app.use("/api/tenant", tenantResolver, tenantRoutes); // Tenant-specific

  // 5. Start server
  server.listen(PORT);
})();
```

---

## Key Points

✅ All models use factory pattern: `module.exports = (conn) => ...`
✅ All models are bound to Master DB connection
✅ No default mongoose connection
✅ Each model specifies collection name
✅ References between models (Company, ReminderTemplate, ReminderSendLog)
✅ Proper indexing for performance (subdomain, email, companyId)
