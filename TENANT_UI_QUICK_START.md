# ✅ Quick Reference - Tenant DB Auto-Initialization

## **What Happens When Company Registers**

### **Request**
```javascript
POST /api/public/register
{
  "subdomain": "acme",
  "companyName": "Acme Corp",
  "companyEmail": "hello@acmecorp.com",
  "adminName": "John Doe",
  "adminEmail": "john@acmecorp.com",
  "adminPassword": "SecurePass123",
  "phone": "+1234567890",
  "plan": "professional"
}
```

### **Automatic Process**
```
1. ✅ Company created in MASTER DB
   └─ dbName: "acme_hrms_db"

2. ✅ Tenant database connection established
   └─ getTenantDB("acme_hrms_db")

3. ✅ ALL MODELS INITIALIZED (17 total)
   ├─ User
   ├─ Role
   ├─ Product, Category, Brand
   ├─ CompanySetting, SystemSettings
   ├─ Warehouse, Supplier, Customer
   ├─ Purchase, Sales, Invoice
   ├─ Tax, Unit, Size, Color
   └─ (All with indexes and empty collections)

4. ✅ Admin user created in tenant DB
5. ✅ ADMIN role created with full permissions
6. ✅ Connections cached for reuse
```

---

## **How to Use in Controllers**

### **Method 1: Auto-Detection (Recommended)**

```javascript
const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");

exports.createProduct = async (req, res) => {
  try {
    // ✅ Automatically uses correct connection
    const Models = getAutoModels(req);
    
    const product = await Models.Product.create({
      name: req.body.name,
      sku: req.body.sku,
      category: req.body.categoryId,
    });
    
    res.status(201).json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### **Method 2: Explicit Tenant (When You Know It's Tenant)**

```javascript
const { getTenantModels } = require("../utils/SaaS/autoModelInitializer");

exports.updateProduct = async (req, res) => {
  try {
    // ✅ Only works for tenant users
    const Models = getTenantModels(req);
    
    const product = await Models.Product.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true }
    );
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### **Method 3: Explicit Master (For Admin Operations)**

```javascript
const { getMasterModels } = require("../utils/SaaS/autoModelInitializer");

exports.getAllCompanies = async (req, res) => {
  try {
    // ✅ Only uses master connection
    const Models = getMasterModels(req);
    
    // This would be Company model from SaaS
    // But using same pattern for consistency
    
    res.json(companies);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## **Models Available Automatically**

When you call `getAutoModels(req)`, you get access to:

```javascript
const Models = getAutoModels(req);

Models.User              // Users in correct DB
Models.Role              // Roles in correct DB
Models.Product           // Products in correct DB
Models.Category          // Categories in correct DB
Models.Brand             // Brands in correct DB
Models.CompanySetting    // Company settings
Models.SystemSettings    // System settings
Models.Warehouse         // Warehouses
Models.Supplier          // Suppliers
Models.Customer          // Customers
Models.Purchase          // Purchases
Models.Sales             // Sales
Models.Invoice           // Invoices
Models.Tax               // Taxes
Models.Unit              // Units
Models.Size              // Sizes
Models.Color             // Colors
```

---

## **Database Connection Flow**

```
REQUEST (with token)
    ↓
Auth Middleware
    ├─ Verify JWT
    ├─ Check if Tenant or Master user
    ├─ Load correct connection
    └─ Set req.db = connection
              │
              ├─ Tenant? → req.db = TenantConnection
              └─ Master? → req.db = MasterConnection
    ↓
Controller
    ├─ const Models = getAutoModels(req)
    ├─ Models.User uses req.db
    ├─ Models.Product uses req.db
    └─ ALL queries go to correct DB
    ↓
✅ DATA ISOLATION MAINTAINED
```

---

## **Common Patterns**

### **Pattern 1: Get Multiple Models**

```javascript
exports.getDashboard = async (req, res) => {
  try {
    const { Product, Sales, Customer } = getAutoModels(req);
    
    const totalProducts = await Product.countDocuments();
    const totalSales = await Sales.countDocuments();
    const totalCustomers = await Customer.countDocuments();
    
    res.json({
      products: totalProducts,
      sales: totalSales,
      customers: totalCustomers,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### **Pattern 2: Related Data Queries**

```javascript
exports.getProductDetails = async (req, res) => {
  try {
    const { Product, Category, Brand } = getAutoModels(req);
    
    const product = await Product.findById(req.params.id)
      .populate({
        path: "category",
        model: Category,
      })
      .populate({
        path: "brand",
        model: Brand,
      });
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

### **Pattern 3: Conditional Logic**

```javascript
exports.getOverview = async (req, res) => {
  try {
    const Models = getAutoModels(req);
    
    // Check if tenant or master
    if (req.user?.tenant) {
      // Tenant-specific logic
      const data = await Models.Product.find()
        .limit(10)
        .sort({ createdAt: -1 });
      res.json({ type: "tenant", data });
    } else {
      // Master-specific logic
      const data = await Models.User.find()
        .limit(5)
        .sort({ createdAt: -1 });
      res.json({ type: "master", data });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

---

## **Testing**

### **1. Create Company**
```bash
curl -X POST http://localhost:5000/api/public/register \
  -H "Content-Type: application/json" \
  -d '{
    "subdomain": "demo",
    "companyName": "Demo Company",
    "companyEmail": "demo@company.com",
    "adminName": "Admin User",
    "adminEmail": "admin@demo.com",
    "adminPassword": "Admin@123",
    "phone": "+919876543210",
    "plan": "professional"
  }'

# Check server logs for:
# ✅ Tenant DB connection established: demo_hrms_db
# ✅ Initializing Tenant Database: demo_hrms_db
# ✅ User initialized
# ✅ Product initialized
# ... (17 models)
# ✅ Admin employee created successfully
```

### **2. Query with Tenant User**
```bash
# After company approval, admin can login
POST /api/auth/login
{
  "email": "admin@demo.com",
  "password": "Admin@123"
}

# Use returned token:
curl -X GET http://localhost:5000/api/products \
  -H "Authorization: Bearer <token>"

# Should return only DEMO company's products
```

---

## **Troubleshooting**

### **Issue: Models not initializing**
```javascript
// Check if initializeTenantDB is called
// in registerCompany controller AFTER getTenantDB()
const tenantConn = await getTenantDB(dbName);
const initResult = await initializeTenantDB(tenantConn); // ✅ Must be called
```

### **Issue: Wrong database queries**
```javascript
// Don't do this:
const Product = require("../../models/productModal");
await Product.find() // ❌ Uses wrong connection

// Do this instead:
const { Product } = getAutoModels(req);
await Product.find() // ✅ Uses correct connection
```

### **Issue: req.db not set**
```javascript
// Ensure auth middleware runs before controller
app.use("/api/products", authMiddleware, productController);
//                       ↑ Must come BEFORE

// Auth middleware MUST set req.db
// Check middleware/auth.js lines for req.db assignment
```

---

## **Summary**

✅ **When new company registers:**
- Tenant database automatically created
- All 17 models initialized
- Connection cached and ready

✅ **In controllers:**
- Use `getAutoModels(req)` to get connection-scoped models
- Works for both tenant and master users
- Automatic data isolation

✅ **No manual DB initialization needed!**
