# JWT Token Creation Audit

## Summary
Found **20 JWT token creation locations** across the codebase (18 active, 2 commented out). Tokens are created for:
- **Super Admin users** (Master DB)
- **Tenant users** (Company employees)
- **OTP verification** (Password reset flow)

---

## 🔴 CRITICAL DISCREPANCIES FOUND

### Issue 1: Inconsistent Payload Field Names
Different parts of the code use different field names for the same data:
- Token payload: `id`, `userId`, `adminId`
- Auth middleware expects: `adminId` or `role === "SUPER_ADMIN"` OR `decoded.id` OR `decoded.dbName`

### Issue 2: Missing Role Information in Tenant Tokens
- **Tenant login tokens** do NOT include `role` field in most cases
- **Auth middleware** tries to fetch full user from DB to get role/permissions
- This causes N+1 query problem on every authenticated request

### Issue 3: Inconsistent Tenant Identifier Fields
- Some tokens use `companyId` + `subdomain` + `dbName`
- Some use only `userId` + `companyId` + `subdomain`
- Auth middleware expects `dbName` to resolve tenant database

---

## 📍 Location 1: Super Admin Login (Main)
**File:** `server/controllers/authController.js` (Line 72)  
**Context:** Super admin login without subdomain  
**Token Payload:**
```javascript
{
  adminId: admin._id,
  email: admin.email,
  role: "SUPER_ADMIN",
}
```
**Expiry:** 1 day (or 7 days if rememberMe)  
**Code Snippet:**
```javascript
// Lines 48-76
if (!subdomain) {
  const admin = await SuperAdmin.findOne({ email: emailLower });
  if (admin) {
    if (admin.status === "Inactive") {
      return res.status(403).json({
        message: "Your account is inactive. Please contact support.",
        code: "ACCOUNT_INACTIVE",
      });
    }

    const isAdminMatch = await bcrypt.compare(passwordStr, admin.password);
    if (!isAdminMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    await SuperAdmin.updateOne(
      { _id: admin._id },
      { $set: { lastLogin: new Date() } }
    );

    const tokenPayload = {
      adminId: admin._id,
      email: admin.email,
      role: "SUPER_ADMIN",
    };

    const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
      expiresIn: rememberMe ? "7d" : "1d",
    });
    // ... continues
```

---

## 📍 Location 2: Tenant Login (Mixed Company Lookup)
**File:** `server/controllers/authController.js` (Line 178)  
**Context:** Tenant user login - searched by email across multiple companies  
**Token Payload:**
```javascript
{
  id: user._id,
  email: user.email,
  companyId: company._id,
  subdomain: company.subdomain,
  dbName: company.dbName,
}
```
**Expiry:** 1 day (or 7 days if rememberMe)  
**Code Snippet:**
```javascript
// Lines 160-190
const tokenPayload = {
  id: user._id,
  email: user.email,
  companyId: company._id,
  subdomain: company.subdomain,
  dbName: company.dbName,
};

const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
  expiresIn: rememberMe ? "7d" : "1d",
});

const finalCookieOptions = {
  ...cookieOptions,
  maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
};

if (!user.twoFactorEnabled || (user.twoFactorEnabled && isTrustedDevice)) {
  res.cookie("token", token, finalCookieOptions);
  res.cookie("userId", user._id, finalCookieOptions);
  res.cookie("subdomain", company.subdomain, { ...finalCookieOptions, httpOnly: false });

  return res.status(200).json({
    message: "Login successful(trusted device)",
    role: "TENANT",
    token,
    user: {
      id: user._id,
      name: user.name || user.username,
      email: user.email,
      phone: user.phone,
      profileImage: user.profileImage,
      status: user.status,
      role: roleData,
    },
    subdomain: company.subdomain,
    dbName: company.dbName,
    redirectPath: "/dashboard",
  });
}
```

---

## 📍 Location 3: Tenant Login (Conditional Payload)
**File:** `server/controllers/authController.js` (Line 383)  
**Context:** Conditional token payload based on whether user is tenant or master  
**Token Payload (Tenant):**
```javascript
{
  id: user._id,
  email: user.email,
  companyId: company._id,
  subdomain: company.subdomain,
  dbName: company.dbName,
}
```
**Token Payload (Master):**
```javascript
{
  id: user._id,
  email: user.email,
}
```
**Expiry:** 1 day (or 7 days if rememberMe)  
**Code Snippet:**
```javascript
// Lines 360-413
let tokenPayload;
if (isTenant && company) {
  tokenPayload = {
    id: user._id,
    email: user.email,
    companyId: company._id,
    subdomain: company.subdomain,
    dbName: company.dbName,
  };
} else {
  tokenPayload = {
    id: user._id,
    email: user.email,
  };
}

const tokenExpiry = rememberMe ? "7d" : "1d";
const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
  expiresIn: tokenExpiry,
});

// Set cookie options
const finalCookieOptions = {
  ...cookieOptions,
  maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "Lax",
  path: "/",
};

// Set auth cookies
res.cookie("token", token, finalCookieOptions);
res.cookie("userId", user._id.toString(), finalCookieOptions);

// ✅ Store tenant info in cookies if tenant
if (isTenant && company) {
  res.cookie("subdomain", company.subdomain, { ...finalCookieOptions, httpOnly: false });
  res.cookie("dbName", company.dbName, { ...finalCookieOptions, httpOnly: false });
}
```

---

## 📍 Location 4: Super Admin Login (Subdomain-based)
**File:** `server/controllers/authController.js` (Line 749)  
**Context:** Super admin login when subdomain is provided  
**Token Payload:**
```javascript
{
  adminId: admin._id,
  email: admin.email,
  role: "SUPER_ADMIN",
}
```
**Expiry:** 1 day (or 7 days if rememberMe)  
**Code Snippet:**
```javascript
// Lines 730-762
const isAdminMatch = await bcrypt.compare(password, admin.password);
if (!isAdminMatch) {
  return res.status(401).json({ message: "Invalid credentials" });
}

// Update last login
await SuperAdmin.updateOne(
  { _id: admin._id },
  { $set: { lastLogin: new Date() } }
);

const tokenPayload = {
  adminId: admin._id,
  email: admin.email,
  role: "SUPER_ADMIN",
};

const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
  expiresIn: rememberMe ? "7d" : "1d",
});

const finalCookieOptions = {
  ...cookieOptions,
  maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
};

res.cookie("token", token, finalCookieOptions);
res.cookie("userId", admin._id.toString(), finalCookieOptions);

return res.status(200).json({
  message: "Login successful",
  role: "SUPER_ADMIN",
  token,
  user: {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    phone: admin.phone || "",
    status: admin.status,
  },
  redirectPath: "/admin/dashboard",
});
```

---

## 📍 Location 5: Tenant Login (Direct Subdomain)
**File:** `server/controllers/authController.js` (Line 832)  
**Context:** Tenant login when subdomain is explicitly provided  
**Token Payload:**
```javascript
{
  id: user._id,
  email: user.email,
  companyId: company._id,
  subdomain: company.subdomain,
  dbName: company.dbName,
}
```
**Expiry:** 1 day (or 7 days if rememberMe)  
**Code Snippet:**
```javascript
// Lines 812-862
// Update last login
await Employee.updateOne(
  { _id: user._id },
  { $set: { lastLogin: new Date() } }
);

// 5️⃣ Create token
const tokenPayload = {
  id: user._id,
  email: user.email,
  companyId: company._id,
  subdomain: company.subdomain,
  dbName: company.dbName,
};

const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
  expiresIn: rememberMe ? "7d" : "1d",
});

const finalCookieOptions = {
  ...cookieOptions,
  maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
};

res.cookie("token", token, finalCookieOptions);
res.cookie("userId", user._id.toString(), finalCookieOptions);

return res.status(200).json({
  message: "Login successful",
  role: "TENANT",
  token,
  user: {
    id: user._id,
    name: user.name || user.username,
    email: user.email,
    phone: user.phone || "",
    status: user.status,
  },
  subdomain: company.subdomain,
  dbName: company.dbName,
  redirectPath: "/dashboard",
});
```

---

## 📍 Location 6: Tenant Login (All-in-one)
**File:** `server/controllers/authController.js` (Line 940)  
**Context:** General tenant login combining multiple flows  
**Token Payload:**
```javascript
{
  id: user._id,
  email: user.email,
  companyId: company._id,
  subdomain: company.subdomain,
  dbName: company.dbName,
}
```
**Expiry:** 1 day (or 7 days if rememberMe)  
**Code Snippet:**
```javascript
// Lines 920-970
const isMatch = await bcrypt.compare(password, user.password);
if (!isMatch) {
  return res.status(401).json({ message: "Invalid credentials" });
}

// Update last login
await Employee.updateOne(
  { _id: user._id },
  { $set: { lastLogin: new Date() } }
);

// 5️⃣ Create token
const tokenPayload = {
  id: user._id,
  email: user.email,
  companyId: company._id,
  subdomain: company.subdomain,
  dbName: company.dbName,
};

const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
  expiresIn: rememberMe ? "7d" : "1d",
});

const finalCookieOptions = {
  ...cookieOptions,
  maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
};

res.cookie("token", token, finalCookieOptions);
res.cookie("userId", user._id.toString(), finalCookieOptions);

return res.status(200).json({
  message: "Login successful",
  role: "TENANT",
  token,
  user: {
    id: user._id,
    name: user.name || user.username,
    email: user.email,
    phone: user.phone || "",
    status: user.status,
  },
  subdomain: company.subdomain,
  dbName: company.dbName,
  redirectPath: "/dashboard",
});
```

---

## 📍 Location 7: OTP Verification (Settings)
**File:** `server/controllers/settings/loginController.js` (Line 90)  
**Context:** OTP verification after password reset  
**Token Payload:**
```javascript
{
  id: user._id,
}
```
**Expiry:** 1 hour  
**Code Snippet:**
```javascript
// Lines 60-100
const verifyotp = async (req, res) => {
  try {
    const { email, otp } = req.body;
    const user = await User.findOne({ email: email.toLowerCase() });

    if (!user) return res.status(404).json({ message: "User not found" });
    // compare otp and expiry
    const isOtpValid = await bcrypt.compare(String(otp), user.otp);
    if (!isOtpValid || user.otpExpires < Date.now()) {
      return res.status(400).json({ message: "Invalid or expired OTP" });
    }
    // clear otp value after success
    user.otp = null;
    user.otpExpires = null;
    await user.save();
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "1h",
    });
    // send response back
    res.status(200).json({
      message: "OTP Verified successfully",
      token,
      user: {
        _id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    res.status(500).json({ message: "Server error during otp verification" });
    console.error("OTP verification error", error);
  }
};
```

---

## 📍 Location 8: OTP Verification (Main)
**File:** `server/controllers/loginController.js` (Line 91)  
**Context:** OTP verification - identical to Location 7  
**Token Payload:**
```javascript
{
  id: user._id,
}
```
**Expiry:** 1 hour  
**Code Snippet:** Same as Location 7

---

## 📍 Location 9: Tenant Login (SaaS - Email Search)
**File:** `server/controllers/SaaS/auth/login.controller.js` (Line 69)  
**Context:** Tenant login by email across companies (without subdomain)  
**Token Payload:**
```javascript
{
  id: user._id,
  email: user.email,
  companyId: company._id,
  subdomain: company.subdomain,
  dbName: company.dbName,
}
```
**Expiry:** 1 day (or 7 days if rememberMe)  
**Code Snippet:**
```javascript
// Lines 40-90
if (!user.twoFactorEnabled || (user.twoFactorEnabled && isTrustedDevice)) {
  // Direct login
  const tokenPayload = {
    id: user._id,
    email: user.email,
    companyId: company._id,
    subdomain: company.subdomain,
    dbName: company.dbName,
  };

  const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
    expiresIn: rememberMe ? "7d" : "1d",
  });

  const finalCookieOptions = {
    ...cookieOptions,
    maxAge: rememberMe ? 7 * 24 * 60 * 60 * 1000 : 24 * 60 * 60 * 1000,
  };

  res.cookie("token", token, finalCookieOptions);
  res.cookie("userId", user._id.toString(), finalCookieOptions);

  return res.status(200).json({
    message: "Login successful",
    token,
    user: {
      id: user._id,
      name: user.name || user.username,
      email: user.email,
      phone: user.phone || "",
      status: user.status,
      role: roleData,
    },
    subdomain: company.subdomain,
    dbName: company.dbName,
  });
}
```

---

## 📍 Location 10: Tenant OTP Verification (SaaS)
**File:** `server/controllers/SaaS/auth/login.controller.js` (Line 165)  
**Context:** OTP verification for tenant 2FA  
**Token Payload:**
```javascript
{
  id: user._id,
  email: user.email,
  companyId: company._id,
  subdomain: company.subdomain,
  dbName: company.dbName,
}
```
**Expiry:** 1 day (or 7 days if rememberMe)  
**Code Snippet:**
```javascript
// Lines 140-180
// Inside OTP verification section
const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
  expiresIn: rememberMe ? "7d" : "1d",
});
```

---

## 📍 Location 11: Unified Login (SaaS All-in-One)
**File:** `server/controllers/SaaS/auth/login.controller.js` (Line 309)  
**Context:** Handles both super admin and tenant login in one endpoint  
**Token Payload (Tenant):**
```javascript
{
  userId: user._id,
  companyId: company._id,
  subdomain: company.subdomain,
  role: user.role,
}
```
**Expiry:** 1 day  
**Code Snippet:**
```javascript
// Lines 280-340
const token = jwt.sign(
  {
    userId: user._id,
    companyId: company._id,
    subdomain: company.subdomain,
    role: user.role,
  },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);

res.json({
  message: "Login successful",
  role: "TENANT",
  token,
  subdomain: company.subdomain,
  dbName: company.dbName,
  redirectPath: "/dashboard"
});
```

---

## 📍 Location 12: Super Admin Login (SaaS)
**File:** `server/controllers/SaaS/superAdmin/login.controller.js` (Line 23)  
**Context:** SaaS super admin login  
**Token Payload:**
```javascript
{
  adminId: admin._id,
  role: "SUPER_ADMIN",
}
```
**Expiry:** 1 day  
**Code Snippet:**
```javascript
// Lines 1-30
exports.superAdminLogin = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    const masterDB = await connectMasterDB();
    const SuperAdmin = SuperAdminModel(masterDB);

    const admin = await SuperAdmin.findOne({ email });
    if (!admin) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const match = await bcrypt.compare(password, admin.password);
    if (!match) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign(
      { adminId: admin._id, role: "SUPER_ADMIN" },
      process.env.JWT_SECRET,
      { expiresIn: "1d" }
    );

    res.json({ token });
  } catch (err) {
    next(err);
  }
};
```

---

## 📍 Location 13: Tenant Login (SaaS)
**File:** `server/controllers/SaaS/tenant/employee.controller.js` (Line 47)  
**Context:** Tenant employee login  
**Token Payload:**
```javascript
{
  userId: user._id,
  companyId: company._id,
  subdomain: company.subdomain,
}
```
**Expiry:** 1 day  
**Code Snippet:**
```javascript
// Lines 25-80
// 5️⃣ Check password
const isMatch = await bcrypt.compare(password, user.password);
if (!isMatch) {
  return res.status(401).json({ message: "Invalid credentials" });
}

// 6️⃣ Generate JWT
const token = jwt.sign(
  {
    userId: user._id,
    companyId: company._id,
    subdomain: company.subdomain,
  },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);

res.json({ message: "Login successful", token });
```

---

## 📍 Location 14: Super Admin Login (SaaS-Dev)
**File:** `SaaS-Dev/saas-backend/src/controllers/superAdmin/login.controller.js` (Line 23)  
**Context:** Separate SaaS-Dev backend super admin login  
**Token Payload:**
```javascript
{
  adminId: admin._id,
  role: "SUPER_ADMIN",
}
```
**Expiry:** 1 day  
**Code Snippet:** Same as Location 12

---

## 📍 Location 15: Tenant Login (SaaS-Dev - Email)
**File:** `SaaS-Dev/saas-backend/src/controllers/auth/login.controller.js` (Line 59)  
**Context:** Tenant login by email (searches across companies)  
**Token Payload:**
```javascript
{
  userId: user._id,
  companyId: company._id,
  subdomain: company.subdomain,
  role: user.role,
}
```
**Expiry:** 1 day  
**Code Snippet:**
```javascript
// Lines 35-75
const token = jwt.sign(
  {
    userId: user._id,
    companyId: company._id,
    subdomain: company.subdomain,
    role: user.role,
  },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);
```

---

## 📍 Location 16: Super Admin Login (SaaS-Dev - All-in-One)
**File:** `SaaS-Dev/saas-backend/src/controllers/auth/login.controller.js` (Line 98)  
**Context:** All-in-one login handling super admin  
**Token Payload:**
```javascript
{
  adminId: admin._id,
  role: "SUPER_ADMIN",
}
```
**Expiry:** 1 day  
**Code Snippet:**
```javascript
// Lines 90-105
const token = jwt.sign(
  { adminId: admin._id, role: "SUPER_ADMIN" },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);

return res.json({
  message: "Login successful",
  role: "SUPER_ADMIN",
  token,
  redirectPath: "/admin/dashboard"
});
```

---

## 📍 Location 17: Tenant Login (SaaS-Dev - All-in-One)
**File:** `SaaS-Dev/saas-backend/src/controllers/auth/login.controller.js` (Line 144)  
**Context:** All-in-one login handling tenant  
**Token Payload:**
```javascript
{
  userId: user._id,
  companyId: company._id,
  subdomain: company.subdomain,
  role: user.role,
}
```
**Expiry:** 1 day  
**Code Snippet:**
```javascript
// Lines 130-160
const token = jwt.sign(
  {
    userId: user._id,
    companyId: company._id,
    subdomain: company.subdomain,
    role: user.role,
  },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);
```

---

## 📍 Location 18: Tenant Login (SaaS-Dev Employee)
**File:** `SaaS-Dev/saas-backend/src/controllers/tenant/employee.controller.js` (Line 45)  
**Context:** Employee login endpoint  
**Token Payload:**
```javascript
{
  userId: user._id,
  companyId: company._id,
  subdomain: company.subdomain,
}
```
**Expiry:** 1 day  
**Code Snippet:**
```javascript
// Lines 25-75
// 5️⃣ Check password
const isMatch = await bcrypt.compare(password, user.password);
if (!isMatch) {
  return res.status(401).json({ message: "Invalid credentials" });
}

// 6️⃣ Generate JWT
const token = jwt.sign(
  {
    userId: user._id,
    companyId: company._id,
    subdomain: company.subdomain,
  },
  process.env.JWT_SECRET,
  { expiresIn: "1d" }
);

res.json({ message: "Login successful", token });
```

---

## 📍 Location 19 & 20: COMMENTED OUT - Password Reset Tokens
**File:** `server/controllers/forgotController.js` (Lines 252 & 258)  
**Context:** Password reset flow (currently disabled)  
**Token Payloads:**
```javascript
// Main token
{
  id: user._id,
  email: user.email,
  role: roleData,
}

// 2FA token
{
  id: user._id,
}
```
**Code Snippet:**
```javascript
// Lines 235-280
// const token = jwt.sign(
//   { id: user._id, email: user.email, role: roleData },
//   process.env.JWT_SECRET,
//   { expiresIn: "1d" }
// );

// const twoFAToken = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
//   expiresIn: "7d",
// });
```

---

## 🔍 Auth Middleware Analysis

### Main Auth Middleware: `server/middleware/auth.js`

**Expects token to contain any of:**
```javascript
// SUPER ADMIN
decoded.adminId
decoded.role === "SUPER_ADMIN"

// MASTER USER (non-tenant)
decoded.id && !decoded.dbName

// TENANT USER (must have all 3)
decoded.id
decoded.dbName
decoded.subdomain (optional)
```

**Middleware Actions:**
1. If `adminId` or `role === "SUPER_ADMIN"` → Treat as super admin
2. If `decoded.id` but NO `dbName` → Load from master DB, populate role
3. If `decoded.id` AND `dbName` → Load from tenant DB
4. Uses `decoded.subdomain` or `decoded.dbName` to find company in master DB

---

## 🚨 DISCREPANCIES SUMMARY

| Location | Field for ID | Tenant Fields | Issue |
|----------|---------|-------|-------|
| authController.js (#1,4) | `adminId` | N/A | ✅ Super admin only |
| authController.js (#2,3,5,6) | `id` | `companyId`, `subdomain`, `dbName` | ✅ Complete tenant info |
| loginController.js (#7,8) | `id` | None | ⚠️ OTP only - incomplete |
| SaaS/auth (#9,10) | `id` | `companyId`, `subdomain`, `dbName` | ✅ Complete tenant info |
| SaaS/auth (#11) | `userId` | `companyId`, `subdomain` | ❌ NO `dbName` |
| SaaS/superAdmin (#12) | `adminId` | N/A | ✅ Super admin only |
| SaaS/tenant (#13) | `userId` | `companyId`, `subdomain` | ❌ NO `dbName` |
| SaaS-Dev/employee (#18) | `userId` | `companyId`, `subdomain` | ❌ NO `dbName` |
| SaaS-Dev/auth (#15,16,17) | `userId`/`adminId` | `companyId`, `subdomain` | ❌ NO `dbName` |

---

## 🎯 Recommendations

### Critical Fixes Needed:

1. **Standardize field names across all token payloads:**
   - Use `id` consistently (not `userId`, not `adminId` for regular users)
   - Or create a wrapper that normalizes field names in auth middleware

2. **Include `dbName` in ALL tenant tokens:**
   - Locations 11, 13, 15, 17, 18 are missing `dbName`
   - Auth middleware needs this to resolve correct tenant database

3. **Add role to tenant tokens:**
   - Include user's role directly in token instead of fetching from DB
   - Reduces N+1 queries on every authenticated request

4. **Consolidate token creation:**
   - Multiple auth endpoints creating similar tokens with different payloads
   - Create utility functions: `createSuperAdminToken()`, `createTenantToken()`

5. **Document token expectations:**
   - Create an auth contract document
   - All token creation MUST follow documented schema
   - All middleware MUST validate against documented schema

