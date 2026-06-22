const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const axios = require("axios");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { connectDB } = require("./config/db");
const path = require("path");
const cookieParser = require("cookie-parser");

// Routes
const productRoutes = require("./routes/productRoutes");
const countryRoutes = require("./routes/countryRoutes");
const stateRoutes = require("./routes/stateRoutes");
const cityRoutes = require("./routes/cityRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const subCategoryRoutes = require("./routes/subCategoryRoutes");
const brandRoutes = require("./routes/brandRoutes");
const unitsRoutes = require("./routes/unitsRoutes");
const colorRoutes = require("./routes/colorRoutes");
const sizeRoutes = require("./routes/sizeRoutes");
const taxRoutes = require("./routes/taxRoutes");
const roleRoutes = require("./routes/roleRoutes");
const usersRoutes = require("./routes/usersRoutes");
const authRoutes = require("./routes/authRoutes");
const forgotRoutes = require("./routes/forgotRoutes.js");
const moduleRoutes = require("./routes/moduleRoutes");
const couponRoutes = require("./routes/CouponsRoute");
const GiftcardRoutes = require("./routes/GiftCardRoutes");
const conversations = require('./routes/message')
const messages = require('./routes/message')
const stockHistoryRoutes = require("./routes/stockHistoryRoutes");
const VarientRoutes = require("./routes/variantRoutes");
const debitNoteRoutes = require("./routes/debitNoteRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const devicemanagementrouter = require("./routes/settings/devicemanagementroute.js");
const balanceSheetRoutes = require("./routes/balanceSheetRoutes.js");
// const creditNoteRoutes = require("./routes/creditNoteRoutes");
const bagRoutes = require("./routes/bagRoutes.js")
// const AddVehicleRoutes = require("./routes/AddVehicleRoutes");
// const AddDriverRoutes = require("./routes/AddDriverRoutes");
// const purchaseRoutes = require("./routes/purchaseRoutes");
const salesRoutes = require("./routes/salesRoutes");
const CreatePurchaseOrderRoutes = require("./routes/CreatePurchaseOrderRoutes.js");
const grnRoutes = require("./routes/GRNRoutes.js");
const CreatePurchaseRoutes = require("./routes/CreatePurchaseRoutes.js");
const productPurchaseDetailsRoutes = require("./routes/productPurchaseDetailsRoutes");
const customerRoutes = require("./routes/customerRoutes");
const quotationRoutes = require("./routes/customerquotationRoutes.js");
const messageRoutes = require("./routes/messageRoutes");
const conversationRoutes = require("./routes/conversationsRoutes");
const purchaseSettingsRoutes = require("./routes/purchaseSettingRoutes");
const hsnRoutes = require("./routes/hsnRoutes");
const warehouseRoutes = require("./routes/warehouseRoutes");
const WarrantyRoutes = require("./routes/warrantyRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const userProfileRoutes = require("./routes/profileRoutes");
const emailverifyroute = require("./routes/settings/EmailVerificationroute.js");
const authrouter = require("./routes/settings/authroutes.js");
const mobileverifyrouter = require("./routes/settings/mobileverifyroute.js");
const companysettingrouter = require("./routes/settings/companysettingroute.js");
const localizationrouter = require("./routes/settings/Localizationroute.js");
const posSaleRoutes = require("./routes/posSaleRoutes.js");
const posReturnRoutes = require("./routes/posReturnRoutes.js");
const invoiceSettingsRoutes = require("./routes/invoiceSettings");
const expenseRoutes = require("./routes/expenseRoutes.js");
const GstRoutes = require("./routes/gstRoutes.js");
const stockRoutes = require("./routes/stockRoutes");
const auditrouter = require("./routes/auditRoutes.js");
const damageReturnRoutes = require("./routes/damageReturnRoutes.js");
const customerinvoiceRoutes = require("./routes/CustomerInvoiceRoutes.js");
const salesOrderRoutes = require("./routes/SalesOrderRoutes");
const proformaInvoiceRoutes = require("./routes/CustomerProformaInvoiceRoutes");
const customercreditNotesRoutes = require("./routes/customercreditNotesRoutes.js");
const rewardRoutes = require("./routes/Points&RewardsRoutes.js");
const supplierDebitNoteRoutes = require("./routes/supplierDebitNoteRoutes");
const PrintTemplateRoutes = require("./routes/settings/printTemplateRoutes.js");
const barcodeSettingsRoutes = require("./routes/settings/barcodeSettingsRoutes");
const notesTermsRoutes = require("./routes/settings/notesTermsRoutes.js")
const taxGstRoutes = require("./routes/settings/taxGstRoutes.js")
const SystemSettingsRoutes = require("./routes/systemSettingsRoutes.js")
const companyBankRoutes = require("./routes/settings/companyBankRoutes.js")
const errorRoutes = require("./routes/errorRoutes");
const errorController = require("./controllers/errorController");
const seedSuperAdmin = require("././utils/SaaS/seedSuperAdmin.js");
const AddCustomersRoutes = require("./routes/AddCustomersRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const superAdminRoutes = require("./routes/superAdminRoutes");
const settingsUserRoutes = require("./routes/settings/userRoute");
const settingsLoginRoutes = require("./routes/settings/loginRoute");
const shipmentRoutes = require("./routes/shipmentRoutes");

// Vehicle Routes
const VehicleRoutes = require("./routes/VehicleRoutes.js");
const DriverRoutes = require("./routes/DriverRoutes.js");

// Broker Routes
const BrokerRoutes = require("./routes/brokerRoutes.js");
const SalesmanRoutes = require("./routes/salesmanRoutes.js");
const AssignTargetRoutes = require("./routes/assignTargetRoutes.js");

const transporterRoutes = require("./routes/TransporterRoutes.js")
const deliveryChallanRoutes = require("./routes/deliveryChallanRoutes");

// Add this after your other middleware setups
const { startInterestRecalculationJob } = require('./jobs/interestRecalculation');
const http = require("http");
const emailrouter = require("./routes/emailroutes.js");
const { Server } = require("socket.io");


//=================== SECURITY MIDDLEWARE ==================================================================
const hostValidation = require("./middleware/security/hostValidation");
const { securityHeaders, inputValidation, parameterPollutionCheck, corsSecurityCheck } = require("./middleware/security/securityHeaders");
const tenantIsolationValidation = require("./middleware/security/tenantIsolationValidation");

//=================== SaaS Routes ==================================================================
const tenantResolver = require("./middleware/SaaS/tenantResolver.js");
const { globalLimiter, authLimiter } = require("./middleware/SaaS/rateLimiter");

const otpRoutes = require("./routes/SaaS/otp.routes.js");
// const authRoutesSaaS = require("./routes/SaaS/auth.routes.js"); // merged into main authRoutes
const publicRoutesSaaS = require("./routes/SaaS/public.routes.js");
const superAdminRoutesSaaS = require("./routes/SaaS/superAdmin.routes.js");
const heroRoutesSaaS = require("./routes/SaaS/hero.routes.js");
const pricingRoutesSaaS = require("./routes/SaaS/pricing.routes.js");
// const employeeRoutesSaaS = require("./routes/SaaS/employee.routes.js");
const globalTenantMiddleware = require("./middleware/SaaS/globalTenantMiddleware");

//=================== SaaS Routes ==================================================================


const ewbRoutes = require("./routes/E-wayBill/ewb.routes");
const updateVehicleRoutes = require("./routes/E-wayBill/updateVehicle.routes");
const getDetailsRoutes = require("./routes/E-wayBill/getDetails.routes");
const distanceRoutes = require("./routes/E-wayBill/distance.routes");

// Load env variables
dotenv.config();

// Connect to MongoDB
// connectDB();

const app = express();
app.set("trust proxy", Number(process.env.TRUST_PROXY || 1));

const allowedOrigins = [
  /^https?:\/\/(localhost|.*\.localhost)(:\d+)?$/,        // local
  /^https?:\/\/.*\.imsmymunc\.local(:\d+)?$/,             // local SaaS (optional)
  /^https?:\/\/imsmymunc\.com$/,                          // root
  /^https?:\/\/.*\.imsmymunc\.com$/,                      // ALL subdomains (IMPORTANT)
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    const isAllowed = allowedOrigins.some((regex) =>
      regex.test(origin)
    );

    if (isAllowed) return callback(null, true);

    console.log("❌ Blocked by CORS:", origin);
    return callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
};

app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(cookieParser());

// ============================================================================
// 🔒 SECURITY MIDDLEWARE LAYER (Safe - No Breaking Changes)
// ============================================================================

// Host validation - Prevents host header injection attacks
// Safe: Just validates Host header, doesn't block normal requests
app.use(hostValidation);

// Security headers - Add OWASP security headers (CSP, X-Frame-Options, etc)
// Safe: Just adds response headers
app.use(securityHeaders);

// Input validation - Detect and log injection attempts (SQL, XSS)
// Safe: Just logs warnings, doesn't block normal requests
app.use(inputValidation);

// Parameter pollution check - Detect HTTP parameter pollution attacks
// Safe: Just logs warnings, doesn't block normal requests
app.use(parameterPollutionCheck);

// CORS security checks - Monitor cross-origin requests
// Safe: Just logs debug info
app.use(corsSecurityCheck);

// ============================================================================
// BODY PARSING
// ============================================================================

// Middleware
// app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));

// ============================================================================
// TENANT MIDDLEWARE
// ============================================================================

// ✅ APPLY GLOBALLY - Tenant resolution from subdomain
app.use(globalTenantMiddleware);

// ✅ CRITICAL SECURITY: Tenant Isolation Validation
// Ensures authenticated users can only access their own tenant's data
app.use(tenantIsolationValidation);
// File uploads path (optional)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// API Routes
app.use("/api/gst", GstRoutes);
app.use("/api/role", roleRoutes);
app.use("/api/user", usersRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/forgot", forgotRoutes);
app.use("/api/products", productRoutes);
app.use("/api/countries", countryRoutes);
app.use("/api/states", stateRoutes);
app.use("/api/city", cityRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/subcategory", subCategoryRoutes);
app.use("/api/brands", brandRoutes);
app.use("/api/unit", unitsRoutes);
app.use("/api/color", colorRoutes);
app.use("/api/size", sizeRoutes);
app.use("/api/tax", taxRoutes);
app.use("/api/modules", moduleRoutes);
app.use("/api/coupons", couponRoutes);
app.use("/api/giftcard", GiftcardRoutes);
// app.use("/api/credit-notes", creditNoteRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/quotations", quotationRoutes);
app.use("/api/credit-notes", customercreditNotesRoutes);
app.use("/api/sales-orders", salesOrderRoutes); //add
app.use("/api/invoices", customerinvoiceRoutes);
app.use("/api/proforma-invoices", proformaInvoiceRoutes);
app.use("/api/suppliers", supplierRoutes);
app.use("/api/purchase-orders", CreatePurchaseOrderRoutes);
app.use("/api/grn", grnRoutes);
app.use("/api/purchase", CreatePurchaseRoutes);
app.use("/api/supplier-debit-notes", supplierDebitNoteRoutes);
app.use("/api/shipments", shipmentRoutes);
app.use("/api/conversations", conversations);
app.use("/api/messages", messages);
app.use("/api/messages", messageRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/notifications", notificationRoutes);
// app.use("/api/purchases", purchaseRoutes);
app.use("/api/stock-history", stockHistoryRoutes);
// app.use("/api/purchases", purchaseRoutes);
app.use("/api/stock-history", stockHistoryRoutes);
app.use("/api/settings", purchaseSettingsRoutes);
app.use("/api/hsn", hsnRoutes);
app.use("/api/warehouse", warehouseRoutes);
app.use("/api/variant-attributes", VarientRoutes);
app.use("/api/warranty", WarrantyRoutes);
app.use("/api/debit-notes", debitNoteRoutes);
app.use("/api/profile", userProfileRoutes);
app.use("/api/invoice", invoiceRoutes);
app.use("/api/sales", salesRoutes);
app.use("/api/pos-sales", posSaleRoutes);
app.use("/api/pos-returns", posReturnRoutes);
app.use("/api/email/mail", emailrouter);
app.use("/api/email", emailverifyroute);
// google auth api
app.use("/api/auth", authrouter);
// mobile verify via sms
app.use("/api/mobile", mobileverifyrouter);
app.use("/api/devices", devicemanagementrouter);
app.use("/uploads", express.static("uploads"));
// register companyprofile api
app.use("/api/companyprofile", companysettingrouter);
app.use("/api/company-bank", companyBankRoutes);
app.use("/api/vehicle", VehicleRoutes);
app.use("/api/driver", DriverRoutes);
app.use("/api/broker", BrokerRoutes);
app.use("/api/salesman", SalesmanRoutes);
app.use("/api/assignTarget", AssignTargetRoutes);
// Localization api
app.use("/api/localizationsetting", localizationrouter);
// cloudnary configuration
app.use("/api/cloudinary-signature", require("./routes/file"));
app.use("/api/balancesheet", balanceSheetRoutes);
app.use("/api/invoice-settings", invoiceSettingsRoutes);
// api for printtemplate
app.use("/api/print-templates", PrintTemplateRoutes);
app.use("/api/barcode-settings", barcodeSettingsRoutes);
// api for notes terms
app.use('/api/notes-terms-settings',notesTermsRoutes);
app.use('/api/tax-gst-settings', taxGstRoutes)
app.use('/api/system-settings', SystemSettingsRoutes)
app.use("/api/expenses", expenseRoutes);
app.use("/api/stock", stockRoutes);
app.use("/api/damage-return", damageReturnRoutes);
// app.use("/api/bags", bagRoutes);
// app.use("/api/bags", bagRoutes);
app.use("/category", express.static(path.join(__dirname, "category")));
app.use("/api/reward-systems", rewardRoutes);
app.use("/api/delivery-challans", deliveryChallanRoutes);
startInterestRecalculationJob();
app.use("/api/audit-logs", auditrouter);
app.use("/api/reward-systems", rewardRoutes);
app.use("/api/transporter", transporterRoutes);
app.use("/api/errors", errorRoutes);

// Create HTTP server for Socket.IO
const server = http.createServer(app);


//=================== SaaS Routes ==================================================================



// Public routes (no tenant needed)
app.use("/api/public", publicRoutesSaaS);

// Hero content routes for website and super-admin
app.use("/api/hero", heroRoutesSaaS);

// Pricing routes for website and super-admin
app.use("/api/pricing", pricingRoutesSaaS);

// Super Admin routes
app.use("/api/super", globalLimiter, superAdminRoutesSaaS);

// Tenant-protected routes
// app.use("/api/tenant", globalLimiter, tenantResolver, employeeRoutesSaaS);

// OTP routes (separate)
app.use("/api/otp", otpRoutes );

app.use("/api/ewaybill", distanceRoutes);
app.use("/api/ewaybill", ewbRoutes); 

app.use("/api", errorController.notFound);
app.use(errorController.errorHandler);

//============================== saas ==================================================================

// ✅ Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: [
      "http://localhost:3000",
      /.*\.localhost:3000$/,
      "http://imsmymunc.com",
      "https://imsmymunc.com",
      "http://api.imsmymunc.com",
      "https://api.imsmymunc.com",
      /.*\.imsmymunc\.com$/,
    ],
    credentials: true,
  },
});

app.set("io", io);

// // 🔥 Website room
// io.on("connection", (socket) => {
//   socket.on("join-website-room", () => {
//     socket.join("website");
//   });
// })

// Online users map (you can replace this with DB or Redis later)
const onlineUsers = new Map();
io.on("connection", (socket) => {
  // console.log("🟢 Socket connected:", socket.id);

  socket.on("add-user", (userId) => {
    // console.log("👤 User added to online list:", userId, "Type:", typeof userId);
    onlineUsers.set(userId, socket.id);
    // console.log("👤 Current online users:", Array.from(onlineUsers.keys()));
    // Emit the updated online users list to all connected clients
    io.emit("online-users", Array.from(onlineUsers.keys()));
  });

  socket.on("send-msg", (data) => {
    const sendUserSocket = onlineUsers.get(data.to);
    if (sendUserSocket) {
      socket.to(sendUserSocket).emit("msg-receive", data);
      // Emit notification to the recipient
      socket.to(sendUserSocket).emit("new-notification", {
        type: "message",
        sender: data.from,
        message: data.message,
        timestamp: new Date(),
      });
    }
  });

  socket.on("delete-msg", (data) => {
    const recipientSocket = onlineUsers.get(data.to);
    if (recipientSocket) {
      socket.to(recipientSocket).emit("delete-msg", {
        from: data.from,
        messageTimestamp: data.messageTimestamp,
      });
    }
  });

  socket.on("message-read", (data) => {
    const senderSocket = onlineUsers.get(data.from);
    if (senderSocket) {
      socket.to(senderSocket).emit("msg-read", {
        from: data.to,
        to: data.from,
      });
    }
  });

  // ✅ WEBSITE REAL-TIME UPDATES
  socket.on("join-website-room", () => {
    socket.join("website");
    // console.log("📱 Client joined website room for real-time updates");
  });

  socket.on("disconnect", () => {
    // console.log("🔴 Socket disconnected:", socket.id);
    let disconnectedUserId = null;
    [...onlineUsers.entries()].forEach(([uid, sid]) => {
      if (sid === socket.id) {
        onlineUsers.delete(uid);
        disconnectedUserId = uid;
      }
    });
    // Emit the updated online users list to all connected clients
    if (disconnectedUserId) {
      // console.log("👤 User removed from online list:", disconnectedUserId);
      // console.log("👤 Remaining online users:", Array.from(onlineUsers.keys()));
      io.emit("online-users", Array.from(onlineUsers.keys()));
    }
  });
});

if (process.env.NODE_ENV === "production") {
  const buildPath = path.join(__dirname, "../clients/dist");

  app.use(express.static(buildPath));

  // do not intercept API routes
  app.get(/^\/(?!api).*/, (req, res) => {
    res.sendFile(path.join(buildPath, "index.html"));
  });
}

const PORT = process.env.PORT || 5000;

 (async () => {
  try {
    // ✅ 1. Connect DB properly
    await connectDB();

    console.log("✅ MongoDB Connected");

    // ✅ 2. Seed (optional)
    await seedSuperAdmin();

    // ✅ 3. START SERVER (THIS IS MISSING IN YOUR CODE)
    server.listen(PORT, "0.0.0.0", () => {
      console.log(`🚀 Server running on port ${PORT}`);
    });

  } catch (err) {
    console.error("❌ Startup failed:", err.message);
    process.exit(1);
  }
})();

const gracefulShutdown = async (signal) => {
  console.log(`⚠️ ${signal} received. Shutting down...`);

  try {
    await mongoose.disconnect(); // works for all connections
    console.log("✅ MongoDB disconnected");
  } catch (err) {
    console.error("❌ DB shutdown error:", err.message);
  }

  server.close(() => {
    console.log("✅ Server closed");
    process.exit(0);
  });

  setTimeout(() => process.exit(1), 5000).unref();
};

process.once("SIGINT", gracefulShutdown);
process.once("SIGTERM", gracefulShutdown);
