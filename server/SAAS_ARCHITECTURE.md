# SaaS Multi-Tenant Architecture

## Database Segregation

### Master Database (`zeelani_master_db`)
Contains ONLY company-level system data:
- ✅ **Companies** - Company registry, billing info, plan details
- ✅ **SuperAdmins** - System administrators who approve companies
- ✅ **OTPs** - Registration and verification codes
- ✅ **ReminderTemplates** - Email/SMS templates
- ✅ **ReminderSendLog** - Template send logs

### Tenant Databases (`{company}_hrms_db`)
Each company gets a separate database with ALL business data:
- ✅ **Users** - Company employees
- ✅ **Roles** - Company-specific roles (ADMIN, MANAGER, EMPLOYEE)
- ✅ **Products** - Company products/inventory
- ✅ **Customers** - Company customers
- ✅ **Invoices** - Sales invoices
- ✅ **Purchases** - Purchase orders
- ✅ **Stock** - Inventory management
- ✅ **Sales** - Sales transactions
- ✅ All other business routes

## Route Protection Strategy

### Public Routes (No Protection)
```javascript
/api/public/*              // Company registration
/api/otp/*                 // OTP verification (master-level)
```

### Master-Level Routes (Super Admin Only)
```javascript
/api/super/*               // Company approval, super admin management
```

### Tenant-Protected Routes (WITH tenantResolver Middleware)
All routes that access business data are protected:
```javascript
/api/role,                 /api/user,              /api/products,
/api/customers,            /api/invoices,          /api/purchases,
/api/sales,                /api/stock,             ...
```

## Tenant Resolver Middleware

**Location**: `server/middleware/SaaS/tenantResolver.js`

**Purpose**: 
- Extracts subdomain from request headers (e.g., `abc.imsmymunc.com`)
- Validates company exists in Master DB
- Checks if company is active
- Attaches tenant database connection to `req.db`
- Routes use `req.db` to access tenant-specific data

**Request Flow**:
```
Client Request (abc.imsmymunc.com)
    ↓
Extract Subdomain (abc)
    ↓
Find Company in Master DB
    ↓
Load Tenant DB (abc_hrms_db)
    ↓
Attach to req.db
    ↓
Process Route with req.db
```

## Company Registration Flow

1. **User registers** → `/api/public/register-company`
2. **Create in Master DB**: Company record (inactive)
3. **Create Tenant DB**: `{subdomain}_hrms_db`
4. **Seed Default Roles**: ADMIN, MANAGER, EMPLOYEE (in tenant DB)
5. **Create Admin User**: With ADMIN role (in tenant DB)
6. **Await Approval**: Company marked inactive until super admin approves
7. **Activate**: Super admin approves via `/api/super/companies/:id/approve`
8. **Company Ready**: Can login and access tenant data via subdomain

## Model Factory Pattern

All models use factory methods to bind to specific connections:

```javascript
// Master DB
const Company = CompanyModel(masterConn);
const SuperAdmin = SuperAdminModel(masterConn);

// Tenant DB
const User = UserModel.forTenant(tenantConn);
const Role = RoleModel.forTenant(tenantConn);
const Product = require('../productModels').forTenant(tenantConn);
```

## Data Isolation Guarantee

- ✅ No cross-tenant data access (separate DB connections)
- ✅ Each route requires subdomain validation via tenantResolver
- ✅ Company must be active to access routes
- ✅ All models use tenant-bound connections

## Implementation Checklist

- ✅ Master DB connection (connectMasterDB)
- ✅ Tenant DB connection (getTenantDB)
- ✅ Tenant resolver middleware
- ✅ Company registration with tenant creation
- ✅ Default role seeding
- ✅ Admin user creation
- ✅ Route protection with tenantResolver
- ✅ Factory pattern for models
- ✅ Async server initialization

## Testing Checklist

- ✅ Register company → Master DB record created
- ✅ Tenant DB created with roles
- ✅ Admin user created
- ✅ Routes require subdomain access
- ✅ Each company sees only their data
