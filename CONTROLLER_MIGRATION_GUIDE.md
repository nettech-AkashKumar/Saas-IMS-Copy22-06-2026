# 🔧 Controller Migration Guide - Use getAutoModels(req)

## Problem
All controllers must use connection-scoped models (forMaster/forTenant) instead of direct imports.

## Solution Pattern

### BEFORE (❌ WRONG)
```javascript
// productController.js
const Product = require("../models/productModels");

exports.createProduct = async (req, res) => {
  const product = await Product.create(req.body); // ❌ Uses WRONG connection
  res.json(product);
};
```

### AFTER (✅ CORRECT)
```javascript
// productController.js
const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");

exports.createProduct = async (req, res) => {
  const { Product } = getAutoModels(req); // ✅ Auto-detects correct connection
  const product = await Product.create(req.body);
  res.json(product);
};
```

---

## Migration Steps

### Step 1: Add Import
```javascript
// Add at top of controller
const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");
```

### Step 2: Remove Old Model Imports
```javascript
// ❌ REMOVE these:
const Product = require("../models/productModels");
const Category = require("../models/categoryModels");
const Brand = require("../models/brandModels");
// etc.
```

### Step 3: Replace in Each Function
```javascript
// ❌ OLD:
exports.getAllProducts = async (req, res) => {
  const products = await Product.find();
};

// ✅ NEW:
exports.getAllProducts = async (req, res) => {
  const { Product } = getAutoModels(req);
  const products = await Product.find();
};
```

### Step 4: For Multiple Models
```javascript
// ✅ Can destructure multiple models
exports.createProduct = async (req, res) => {
  const { Product, Category, Brand } = getAutoModels(req);
  
  const category = await Category.findById(req.body.categoryId);
  const brand = await Brand.findById(req.body.brandId);
  
  const product = await Product.create({
    name: req.body.name,
    category: req.body.categoryId,
    brand: req.body.brandId,
  });
};
```

---

## Controllers to Update (Priority Order)

### 🔴 CRITICAL (Most Used)
1. **productController.js** - Product CRUD
2. **categoryController.js** - Category CRUD
3. **purchaseController.js** - Purchase CRUD
4. **salesController.js** - Sales CRUD
5. **CustomerInvoiceController.js** - Invoice CRUD

### 🟡 HIGH (Frequently Used)
6. **supplierModel.js** - Supplier CRUD
7. **customerController.js** - Customer CRUD (already working?)
8. **brandController.js** - Brand CRUD
9. **posSaleController.js** - POS Sales

### 🟢 MEDIUM (Regularly Used)
10. **warehouseControllers.js**
11. **stockController.js**
12. **invoiceSettingsController.js**
13. **creditNoteController.js**
14. **debitNoteController.js**

---

## Search & Replace Commands

### Find all model imports in a file:
```bash
grep -n "const.*require.*models" productController.js
```

### Find all Product/Category/Brand usage:
```bash
grep -n "Product\.\|Category\.\|Brand\." productController.js
```

---

## Common CRUD Patterns

### Create
```javascript
const { Product, Category } = getAutoModels(req);

const product = await Product.create({
  name: req.body.name,
  category: req.body.categoryId,
  ...
});
```

### Read (Find & FindById)
```javascript
const { Product } = getAutoModels(req);

const product = await Product.findById(id);
const products = await Product.find({ status: "Active" });
const product = await Product.findOne({ name: "xyz" });
```

### Update
```javascript
const { Product } = getAutoModels(req);

const product = await Product.findByIdAndUpdate(
  id,
  { name: req.body.name },
  { new: true }
);
```

### Delete
```javascript
const { Product } = getAutoModels(req);

await Product.findByIdAndDelete(id);
```

### Aggregation
```javascript
const { Product } = getAutoModels(req);

const results = await Product.aggregate([
  { $match: { status: "Active" } },
  { $group: { _id: "$category", count: { $sum: 1 } } },
]);
```

---

## Testing Each Controller

### Test Pattern
```bash
# 1. Login as tenant user (get token)
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "tenant@company.com",
    "password": "password"
  }'

# 2. Create with token
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "productName": "Test Product",
    "category": "...",
    "price": 100
  }'

# 3. Verify data  is in TENANT database only, not master
```

---

## Error Handling

### If getAutoModels(req) Fails
```javascript
try {
  const { Product } = getAutoModels(req);
  // Use Product...
} catch (error) {
  console.error("Model resolution failed:", error.message);
  return res.status(500).json({
    error: "Database context not available",
    message: error.message
  });
}
```

---

## Batch Update Script

For rapid migration, run this in each controller:

1. Add import at line 1:
   ```javascript
   const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");
   ```

2. Find each export function
3. Add this line as first line of function:
   ```javascript
   const { Product, Category, Brand, ... } = getAutoModels(req);
   ```

4. Delete old `const Product = require(...)` imports

---

## Verification Checklist

- [ ] getAutoModels imported in controller
- [ ] All model constants removed from top-level imports
- [ ] Each function gets models from getAutoModels(req)
- [ ] All Product/Category/Brand/.etc usage goes through Models
- [ ] No `mongoose.model()` direct calls
- [ ] Auth middleware provides req.db
- [ ] Test create, read, update, delete
- [ ] Verify data isolation (tenant only sees own data)

---

## Example: Full Product Controller Migration

### Before
```javascript
const Product = require("../models/productModels");
const Category = require("../models/ categoryModels");

exports.createProduct = async (req, res) => {
  const product = await Product.create(req.body);
  res.json(product);
};

exports.getAllProducts = async (req, res) => {
  const products = await Product.find();
  res.json(products);
};
```

### After
```javascript
const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");

exports.createProduct = async (req, res) => {
  const { Product, Category } = getAutoModels(req);
  const product = await Product.create(req.body);
  res.json(product);
};

exports.getAllProducts = async (req, res) => {
  const { Product } = getAutoModels(req);
  const products = await Product.find();
  res.json(products);
};
```

---

## Migration Timeline

- **Phase 1 (Immediate):** Update 5 critical controllers
- **Phase 2 (1-2 hours):** Update 4 high-priority controllers
- **Phase 3 (Next session):** Update remaining controllers
- **Phase 4 (Final):** Test all CRUD operations across all modules

---

## Support

If a controller fails after migration:
1. Check if getAutoModels returns the model
2. Verify auth middleware sets req.db
3. Ensure model has forTenant/forMaster factories
4. Check console for specific error messages
