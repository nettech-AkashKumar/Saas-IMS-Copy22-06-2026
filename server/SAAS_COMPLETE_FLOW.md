# Complete SaaS Company Registration & Access Flow

## Overview Flow

```
┌─────────────────────────────────────────────────────────────────────┐
│                    SAAS MULTI-TENANT SYSTEM                         │
├─────────────────────────────────────────────────────────────────────┤
│                                                                      │
│  MASTER DATABASE (zeelani_master_db)                               │
│  ├─ Companies                                                       │
│  ├─ SuperAdmins                                                     │
│  ├─ OTPs                                                            │
│  └─ ReminderTemplates                                              │
│                                                                      │
│  TENANT DATABASES (company_hrms_db)                                │
│  ├─ Users                                                           │
│  ├─ Roles → ADMIN, MANAGER, EMPLOYEE                              │
│  ├─ Products                                                        │
│  ├─ Invoices                                                        │
│  └─ All business data                                              │
│                                                                      │
└─────────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Company Registration

### 1️⃣ **User Registers Company**
```
POST /api/public/register-company
{
  "companyName": "Tech Corp",
  "subdomain": "techcorp",
  "adminEmail": "admin@techcorp.com",
  "adminPassword": "Admin@123",
  "adminName": "John Admin",
  "phone": "9876543210",
  ... other fields
}
```

### 2️⃣ **Server Creates Master DB Record**
```javascript
// File: controllers/SaaS/public/registerCompany.controller.js

const dbName = `${subdomain.toLowerCase()}_hrms_db`;  // techcorp_hrms_db

const company = await Company.create({
  companyName: "Tech Corp",
  subdomain: "techcorp",        // ✅ Unique identifier
  dbName: "techcorp_hrms_db",    // ✅ Links to tenant DB
  adminEmail: "admin@techcorp.com",
  isActive: false                 // ⚠️ Inactive until approved
});

console.log("✅ Master DB Record: Company saved to zeelani_master_db/companies");
```

### 3️⃣ **Server Creates Tenant Database**
```javascript
const tenantConn = await getTenantDB("techcorp_hrms_db");

// Database "techcorp_hrms_db" is auto-created at MongoDB
console.log("✅ Tenant DB Created: techcorp_hrms_db");
```

### 4️⃣ **Server Seeds Default Roles in Tenant DB**
```javascript
const defaultRoles = await seedDefaultRoles(tenantConn);
// Creates 3 roles in techcorp_hrms_db:
// ✅ ADMIN        - Full permissions
// ✅ MANAGER       - Staff management
// ✅ EMPLOYEE      - Limited access

console.log("✅ Roles created in techcorp_hrms_db");
```

### 5️⃣ **Server Creates Admin User in Tenant DB**
```javascript
const adminRole = defaultRoles.find(r => r.roleName === 'ADMIN');

const adminUser = await TenantUser.create({
  name: "John Admin",
  email: "admin@techcorp.com",
  password: bcrypt.hash("Admin@123"),
  role: adminRole._id,          // Associate with ADMIN role
  status: "Active"
});

console.log("✅ Admin user created in techcorp_hrms_db/users");
```

### 6️⃣ **Server Sends Emails**
```
📧 Super Admin: "New company registered. Please approve."
📧 Company Admin: "Thanks for registering. Waiting for approval."
```

### 7️⃣ **Company Status: PENDING APPROVAL**
```javascript
// Master DB record:
{
  _id: ObjectId(...),
  companyName: "Tech Corp",
  subdomain: "techcorp",
  dbName: "techcorp_hrms_db",
  adminEmail: "admin@techcorp.com",
  isActive: false,              // ⚠️ NOT ACTIVE YET
  approvedAt: null,
  createdAt: "2026-04-15T..."
}

// Tenant DB created but not accessible yet
```

---

## Step-by-Step User Access via Subdomain

### After Super Admin Approval

```javascript
// Super Admin approves company
PATCH /api/super/companies/:companyId/approve

// Updates Master DB:
{
  isActive: true,               // ✅ NOW ACTIVE
  approvedAt: "2026-04-15T..."
}
```

### User Login Flow

```
1️⃣ User accesses: https://techcorp.imsmymunc.com/login

2️⃣ Request hits tenantResolver middleware:
   - Extract subdomain from host: "techcorp"
   - Query Master DB: Find company with subdomain="techcorp"
   - Get dbName: "techcorp_hrms_db"
   - Load tenant DB connection: getTenantDB("techcorp_hrms_db")
   - Attach to req.db and req.tenant

3️⃣ Login endpoint queries req.db (techcorp_hrms_db):
   POST /api/auth/login
   - Query users collection in techcorp_hrms_db
   - Find: email="admin@techcorp.com", password match ✅
   - Get role from roles collection in techcorp_hrms_db ✅

4️⃣ User logged in with token

5️⃣ All subsequent requests use req.db (techcorp_hrms_db)
   - GET /api/products → techcorp_hrms_db/products ✅
   - GET /api/invoices → techcorp_hrms_db/invoices ✅
   - GET /api/users → techcorp_hrms_db/users ✅
```

---

## Subdomain-to-Database Routing

### How tenantResolver Works

```javascript
// File: middleware/SaaS/tenantResolver.js

module.exports = async (req, res, next) => {
  const host = req.headers.host;  // "techcorp.imsmymunc.com"
  const subdomain = host.split(".")[0];  // "techcorp"

  // Skip for public domains
  if (subdomain === "mymunc" || subdomain === "admin") {
    return next();
  }

  // 1. Query Master DB with subdomain
  const tenant = await Company.findOne({ subdomain: "techcorp" });
  
  if (!tenant) return res.status(404).json({ message: "Company not found" });
  if (!tenant.isActive) return res.status(403).json({ message: "Company inactive" });

  // 2. Load tenant DB
  const tenantDB = await getTenantDB(tenant.dbName);  // "techcorp_hrms_db"

  // 3. Attach to request object
  req.tenant = tenant;        // Company record from Master DB
  req.db = tenantDB;          // Connection to techcorp_hrms_db

  next();
};
```

### Applied to All Routes

```javascript
// index.js - All routes protected with tenantResolver

app.use("/api/products", globalLimiter, tenantResolver, productRoutes);
//                                      ^^^^^^^^^^^^^^^ 
//                        Ensures req.db is tenant-specific

app.use("/api/users", globalLimiter, tenantResolver, usersRoutes);
app.use("/api/invoices", globalLimiter, tenantResolver, invoiceRoutes);
```

---

## Complete Data Flow Example

### Company Registration (Master DB)
```
Company: Tech Corp
└─ Master DB (zeelani_master_db)
   └─ companies collection
      {
        subdomain: "techcorp",
        dbName: "techcorp_hrms_db",
        adminEmail: "admin@techcorp.com",
        isActive: false
      }
```

### After Activation (Both DBs)

**Master DB (zeelani_master_db)**
```
companies: {
  subdomain: "techcorp",
  dbName: "techcorp_hrms_db",
  adminEmail: "admin@techcorp.com",
  isActive: true,                    // ✅ NOW ACTIVE
  approvedAt: "2026-04-15T..."
}
```

**Tenant DB (techcorp_hrms_db)**
```
roles: [
  { roleName: "ADMIN", permissions: {...} },
  { roleName: "MANAGER", permissions: {...} },
  { roleName: "EMPLOYEE", permissions: {...} }
]

users: [
  {
    name: "John Admin",
    email: "admin@techcorp.com",
    password: "hashed",
    role: ObjectId(adminRole),      // Reference to ADMIN role
    status: "Active"
  }
]

products: []
invoices: []
... other business data
```

---

## Access During User Request

```
Request: https://techcorp.imsmymunc.com/api/products

1. tenantResolver middleware extracts subdomain="techcorp"
2. Queries Master DB: Company.findOne({subdomain: "techcorp"})
3. Gets result: { dbName: "techcorp_hrms_db", isActive: true, ... }
4. Loads: tenantConn = getTenantDB("techcorp_hrms_db")
5. Sets: req.db = tenantConn
6. Routes use req.db

productRoutes:
  GET /api/products
  ↓
  const products = await req.db.model('Product').find();
  // Queries techcorp_hrms_db/products ✅
```

---

## Database Isolation Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                      MONGODB                                     │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  zeelani_master_db         techcorp_hrms_db    acme_hrms_db    │
│  ├─ superadmins            ├─ users             ├─ users        │
│  ├─ companies              ├─ roles             ├─ roles        │
│  ├─ otps                   ├─ products          ├─ products     │
│  └─ templates              ├─ invoices          ├─ invoices     │
│                            └─ ...profit data    └─ ...profit    │
│                                                                  │
│  ↑                          ↑                    ↑              │
│  Super Admin requests       Tech Corp requests  Acme requests   │
│  (Master DB only)           (Tenant DB only)    (Tenant DB only)│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Key Points
✅ Each company has completely isolated database
✅ No cross-company data access possible
✅ Subdomain determines database routing
✅ Master DB only contains system-level data
✅ Tenant DB contains all business data
✅ Factory pattern models prevent connection misuse

---

## Complete Request Lifecycle

```
User Request: techcorp.imsmymunc.com/api/users

1️⃣ Express Server receives request

2️⃣ Routing
   app.use("/api/users", tenantResolver, usersRoutes);

3️⃣ Middleware: tenantResolver
   ├─ Extract subdomain: "techcorp"
   ├─ Query Master DB: Company.findOne({subdomain: "techcorp"})
   ├─ Verify company exists & isActive=true
   ├─ getTenantDB("techcorp_hrms_db")
   └─ req.db = tenantDB connection

4️⃣ Route Handler: usersRoutes
   ↓
   GET /api/users
   ↓
   const users = await User.forTenant(req.db).find();
   ↓
   Query techcorp_hrms_db/users ✅

5️⃣ Response to client
   [
     { name: "John Admin", email: "...", role: "ADMIN" }
   ]
```

---

## Summary: Complete Architecture Ready ✅

| Component | Status | Details |
|-----------|--------|---------|
| **Company Registration** | ✅ | Master DB record created |
| **Tenant DB Creation** | ✅ | Auto-created when needed |
| **Default Roles Seeding** | ✅ | ADMIN, MANAGER, EMPLOYEE |
| **Admin User Creation** | ✅ | Created in tenant DB |
| **Subdomain Routing** | ✅ | tenantResolver extracts subdomain |
| **Database Isolation** | ✅ | Each company separate DB |
| **Role-Based Access** | ✅ | Roles managed per tenant |
| **User Authentication** | ✅ | Per-tenant user verification |

**Ab sab kuch properly setup hai! Company register → Tenant DB create → Roles seed → Admin user create → User access via subdomain → All data isolated! 🎯**
