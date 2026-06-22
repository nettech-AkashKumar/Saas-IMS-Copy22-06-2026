# 🏗️ Tenant Database Architecture - Complete Guide

## **Problem Statement**
```
Jab koi company/tenant subdomain ke sath register hota hai:
- uska ek nya database create hona chahiye
- us database me automatically sab models aur collections create ho jayein
- sab routes aur controllers automatically us tenant DB se connect ho jayein
```

## **Solution Implemented**

### **1. Tenant Database Initialization** (`tenantInitializer.js`)

When a new company registers:

```javascript
// Automatically called when company registers
const initResult = await initializeTenantDB(tenantConn);

// ✅ Creates all 17 models in tenant database:
// - User, Role, Product, Category, Brand
// - CompanySetting, SystemSettings, Warehouse, Supplier, Customer
// - Purchase, Sales, Invoice, Tax, Unit, Size, Color
```

**Output:**
```
🚀 Initializing Tenant Database: company_db

✅ User initialized
✅ Role initialized
✅ Product initialized
... (17 models total)

✅ Tenant Database Initialization Complete
📊 Initialized: 17/17 models ready
```

---

### **2. Auto Model Initializer** (`autoModelInitializer.js`)

Helper functions to get connection-scoped models:

```javascript
// In any controller after auth middleware:

// ✅ Auto-detect tenant vs master
const Models = getAutoModels(req);
const User = Models.User;      // ✅ Correct connection
const Role = Models.Role;      // ✅ Correct connection
const Product = Models.Product; // ✅ Correct connection

// OR explicitly:
const TenantModels = getTenantModels(req); // Only for tenant
const MasterModels = getMasterModels(req); // Only for master
```

---

### **3. Complete Flow Diagram**

```
🔴 COMPANY REGISTRATION REQUEST
    ↓
POST /api/public/register
    {
      subdomain: "acme",
      companyName: "Acme Corp",
      ...
    }
    ↓
registerCompany Controller
    ↓
    ✅ Create Company in Master DB
        dbName: "acme_hrms_db"
    ↓
    ✅ Get Tenant Connection
        await getTenantDB("acme_hrms_db")
    ↓
    ✅ INITIALIZE TENANT DATABASE
        await initializeTenantDB(tenantConn)
        ├─ User model created
        ├─ Role model created
        ├─ Product model created
        ├─ Category model created
        ├─ Brand model created
        ├─ ... (17 total models)
        └─ All collections indexed
    ↓
    ✅ Create Admin User in Tenant DB
        User.forTenant(tenantConn).create(admin)
    ↓
    ✅ Create ADMIN Role in Tenant DB
        Role.forTenant(tenantConn).create(adminRole)
    ↓
    📧 Send emails (pending approval)
    ↓
🟢 Company registered + Database ready!
```

---

### **4. Routes Usage**

When a tenant user makes a request:

```javascript
GET /api/products?subdomain=acme
Authorization: Bearer <tenant-token>

↓
Auth Middleware
    ├─ Verify JWT token
    ├─ Resolve company from master DB (filter: subdomain="acme")
    ├─ Get tenant connection: await getTenantDB("acme_hrms_db")
    ├─ Set req.db = tenantConnection
    └─ Set req.user.tenant = company info

↓
Product Controller
    const Models = getAutoModels(req);
    const Product = Models.Product; // ✅ acme_hrms_db Product model
    
    await Product.find() // ✅ Queries ACME's database only!

↓
Response: [acme's products only]
```

---

### **5. Model Creation - Before vs After**

#### **❌ BEFORE (Wrong)**
```javascript
// Models could be created on default connection
const Product = mongoose.model("Product", schema);
// Problem: Could query wrong database
```

#### **✅ AFTER (Correct)**
```javascript
// Models MUST use connection-scoped factories
const Product = require("../../models/productModal");

// Tenant usage:
const TenantProduct = Product.forTenant(tenantConn);
await TenantProduct.find() // ✅ Query tenant DB

// Master usage:
const MasterProduct = Product.forMaster(masterConn);
await MasterProduct.find() // ✅ Query master DB
```

---

## **Files Created/Modified**

### **New Files**
- ✅ `server/utils/SaaS/tenantInitializer.js` - Initialize all models in tenant DB
- ✅ `server/utils/SaaS/autoModelInitializer.js` - Auto-get connection-scoped models

### **Modified Files**
- ✅ `server/controllers/SaaS/public/registerCompany.controller.js`
  - Added `initializeTenantDB()` call after connection
  - All 17 models now created automatically

---

## **Architecture Principles**

| Principle | Implementation |
|-----------|----------------|
| **No Default Connection** | ✅ All models use forMaster/forTenant |
| **Auto Initialize** | ✅ initializeTenantDB() on company registration |
| **Connection Per Request** | ✅ req.db set by auth middleware |
| **Model Factory Pattern** | ✅ getAutoModels(req) returns correct models |
| **Tenant Isolation** | ✅ each company in separate database |
| **Caching** | ✅ connections cached in getTenantDB |

---

## **Usage in Controllers**

### **Simple Example - Get All Products**

```javascript
exports.getAllProducts = async (req, res) => {
  try {
    // ✅ Auto-detect if tenant or master
    const Models = getAutoModels(req);
    
    const products = await Models.Product.find()
      .populate("category")
      .populate("brand");
    
    res.json(products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### **Advanced Example - Create Product**

```javascript
exports.createProduct = async (req, res) => {
  try {
    // ✅ Will use tenant DB automatically
    const { Product, Category, Brand } = getAutoModels(req);
    
    // Verify category exists
    const category = await Category.findById(req.body.categoryId);
    if (!category) {
      return res.status(404).json({ error: "Category not found" });
    }
    
    // Create product - ONLY in this tenant's database
    const product = await Product.create({
      name: req.body.name,
      category: req.body.categoryId,
      brand: req.body.brandId,
      ...
    });
    
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## **Verification Checklist**

- ✅ When company registers, tenant DB automatically initialized
- ✅ All 17 models created in tenant database
- ✅ Auth middleware sets req.db correctly
- ✅ Routes use getAutoModels(req) for connection-scoped models
- ✅ No models created on default mongoose connection
- ✅ Tenant data isolated per company
- ✅ Master DB stores company metadata only

---

## **Testing**

### **Test 1: Company Registration**
```bash
curl -X POST http://localhost:5000/api/public/register \
  -H "Content-Type: application/json" \
  -d '{
    "subdomain": "testco",
    "companyName": "Test Company",
    "adminEmail": "admin@testco.com",
    "adminPassword": "Admin@123",
    ...
  }'

# Check logs:
# ✅ Tenant DB connection established: testco_hrms_db
# ✅ User initialized
# ✅ Role initialized
# ... (17 models initialized)
```

### **Test 2: Tenant User Login & Query**
```bash
# 1. Login as tenant user
# 2. Get token from response
# 3. Query products with token:

curl -X GET http://localhost:5000/api/products \
  -H "Authorization: Bearer <token>"

# Check logs:
# ✅ Auth middleware resolved tenant DB: testco_hrms_db
# ✅ Product.find() queries ONLY testco's database
```

---

## **Summary**

🎯 **When company registers with subdomain:**
1. ✅ Master DB stores company metadata
2. ✅ Tenant database created automatically
3. ✅ All 17 models initialized in tenant DB
4. ✅ Indexes created for fast querying
5. ✅ Admin user created in tenant DB
6. ✅ Connection cached for reuse

🔐 **Complete data isolation** - each company's data in separate database!
