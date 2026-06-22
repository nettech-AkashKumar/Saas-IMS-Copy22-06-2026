const dns = require('dns');
dns.setServers(['8.8.8.8', '8.8.4.4']);
const axios = require("axios");
const express = require("express");
const cors = require("cors");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const { connectDB } = require("./config/db");
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
const path = require("path");
const moduleRoutes = require("./routes/moduleRoutes");
const couponRoutes = require("./routes/CouponsRoute");
const GiftcardRoutes = require("./routes/GiftCardRoutes");
const customerRoutes = require("./routes/customerRoutes");
const quotationRoutes = require("./routes/customerquotationRoutes.js");
// const conversations = require('./routes/message')
// const messages = require('./routes/message')
const messageRoutes = require("./routes/messageRoutes");
const conversationRoutes = require("./routes/conversationsRoutes");
const purchaseRoutes = require("./routes/purchaseRoutes");
const stockHistoryRoutes = require("./routes/stockHistoryRoutes");
const purchaseSettingsRoutes = require("./routes/purchaseSettingRoutes");
const hsnRoutes = require("./routes/hsnRoutes");
const warehouseRoutes = require("./routes/warehouseRoutes");
const VarientRoutes = require("./routes/variantRoutes");
const WarrantyRoutes = require("./routes/warrantyRoutes");
const debitNoteRoutes = require("./routes/debitNoteRoutes");
const supplierRoutes = require("./routes/supplierRoutes");
const invoiceRoutes = require("./routes/invoiceRoutes");
const salesRoutes = require("./routes/salesRoutes");
const notificationRoutes = require("./routes/notificationRoutes");
const userProfileRoutes = require("./routes/profileRoutes");
const emailverifyroute = require("./routes/settings/EmailVerificationroute.js");
const authrouter = require("./routes/settings/authroutes.js");
const mobileverifyrouter = require("./routes/settings/mobileverifyroute.js");
const devicemanagementrouter = require("./routes/settings/devicemanagementroute.js");
const companysettingrouter = require("./routes/settings/companysettingroute.js");
const localizationrouter = require("./routes/settings/Localizationroute.js");
const balanceSheetRoutes = require("./routes/balanceSheetRoutes.js");
const posSaleRoutes = require("./routes/posSaleRoutes.js");
const invoiceSettingsRoutes = require("./routes/invoiceSettings");
const creditNoteRoutes = require("./routes/creditNoteRoutes");
const expenseRoutes = require("./routes/expenseRoutes.js");
const GstRoutes = require("./routes/gstRoutes.js");
const stockRoutes = require("./routes/stockRoutes");
const auditrouter = require("./routes/auditRoutes.js");
const damageReturnRoutes = require("./routes/damageReturnRoutes.js");
const cookieParser = require("cookie-parser");
const customerinvoiceRoutes = require("./routes/CustomerInvoiceRoutes.js");
const customercreditNotesRoutes = require("./routes/customercreditNotesRoutes.js");
const rewardRoutes = require("./routes/Points&RewardsRoutes.js");
const supplierDebitNoteRoutes = require("./routes/supplierDebitNoteRoutes");
const CreatePurchaseOrderRoutes = require("./routes/CreatePurchaseOrderRoutes.js");
const PrintTemplateRoutes = require("./routes/settings/printTemplateRoutes.js");
const barcodeSettingsRoutes = require("./routes/settings/barcodeSettingsRoutes");
const notesTermsRoutes = require("./routes/settings/notesTermsRoutes.js")
const taxGstRoutes = require("./routes/settings/taxGstRoutes.js")
const SystemSettingsRoutes = require("./routes/systemSettingsRoutes.js")
const companyBankRoutes = require("./routes/settings/companyBankRoutes.js")
const bagRoutes = require("./routes/bagRoutes.js")
const errorRoutes = require("./routes/errorRoutes");
const errorController = require("./controllers/errorController");
const seedSuperAdmin = require("./seeder/userSeeder");
const seedRoles = require("./seeder/roleSeeder");

const http = require("http");
const emailrouter = require("./routes/emailroutes.js");
const { Server } = require("socket.io");


//=================== SaaS Routes ==================================================================
const tenantResolver = require("./middleware/SaaS/tenantResolver.js");
const { globalLimiter, authLimiter } = require("./middleware/SaaS/rateLimiter");

const otpRoutes = require("./routes/SaaS/otp.routes.js");
// const authRoutesSaaS = require("./routes/SaaS/auth.routes.js"); // merged into main authRoutes
const publicRoutesSaaS = require("./routes/SaaS/public.routes.js");
const superAdminRoutesSaaS = require("./routes/SaaS/superAdmin.routes.js");
// const employeeRoutesSaaS = require("./routes/SaaS/employee.routes.js");

//=================== SaaS Routes ==================================================================


// Load env variables
dotenv.config();

// ✅ Start server with async initialization
(async () => {
  try {
    // Connect to SAAS_MASTER_DB (must complete before seeding/starting server)
    const masterConn = await connectDB();
    console.log(`✅ SAAS_MASTER_DB ready`);

    // Seed roles first, then SuperAdmin user using the Master DB connection
    await seedRoles(masterConn);
    await seedSuperAdmin(masterConn);

    const app = express();
    app.set("trust proxy", Number(process.env.TRUST_PROXY || 1));


const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (mobile apps, curl, etc.)
    if (!origin) return callback(null, true);

    // Allow localhost and all subdomains
    if (origin.match(/^https?:\/\/(localhost|.*\.localhost)(:\d+)?$/)) {
      return callback(null, true);
    }

    // Allow specific local network IPs
    if (origin.match(/^https?:\/\/192\.168\.1\.\d+(:\d+)?$/)) {
      return callback(null, true);
    }

    // For production, add your domain
    // if (origin.match(/^https?:\/\/(.*\.)?mymunc\.com(:\d+)?$/)) {
    //   return callback(null, true);
    // }

    return callback(new Error('Not allowed by CORS'));
  },
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "HEAD"],
  credentials: true,
};


app.use(cors(corsOptions));
app.options(/.*/, cors(corsOptions));
app.use(cookieParser());

// Middleware
// app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true }));


// File uploads path (optional)
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Routes
app.use("/api/gst", globalLimiter, tenantResolver, GstRoutes);
// Public health endpoints (MastersIndia diagnostics)
app.use("/api/role", globalLimiter, tenantResolver, roleRoutes);
app.use("/api/user", globalLimiter, tenantResolver, usersRoutes);
app.use("/api/auth", authLimiter, authRoutes);
app.use("/api/forgot", forgotRoutes);
app.use("/api/products", globalLimiter, tenantResolver, productRoutes);
app.use("/api/countries", globalLimiter, tenantResolver, countryRoutes);
app.use("/api/states", globalLimiter, tenantResolver, stateRoutes);
app.use("/api/city", globalLimiter, tenantResolver, cityRoutes);
app.use("/api/category", globalLimiter, tenantResolver, categoryRoutes);
app.use("/api/subcategory", globalLimiter, tenantResolver, subCategoryRoutes);
app.use("/api/brands", globalLimiter, tenantResolver, brandRoutes);
app.use("/api/unit", globalLimiter, tenantResolver, unitsRoutes);
app.use("/api/color", globalLimiter, tenantResolver, colorRoutes);
app.use("/api/size", globalLimiter, tenantResolver, sizeRoutes);
app.use("/api/tax", globalLimiter, tenantResolver, taxRoutes);
app.use("/api/modules", globalLimiter, tenantResolver, moduleRoutes);
app.use("/api/coupons", globalLimiter, tenantResolver, couponRoutes);
app.use("/api/giftcard", globalLimiter, tenantResolver, GiftcardRoutes);
app.use("/api/customers", globalLimiter, tenantResolver, customerRoutes);
app.use("/api/quotations", globalLimiter, tenantResolver, quotationRoutes);
app.use("/api/credit-notes", globalLimiter, tenantResolver, creditNoteRoutes); // Moved before customercreditNotesRoutes to avoid /all matching /:id
app.use("/api/credit-notes", globalLimiter, tenantResolver, customercreditNotesRoutes);
// customer invocie
app.use("/api/invoices", globalLimiter, tenantResolver, customerinvoiceRoutes);
app.use("/api/suppliers", globalLimiter, tenantResolver, supplierRoutes);
app.use("/api/purchase-orders", globalLimiter, tenantResolver, CreatePurchaseOrderRoutes);
app.use("/api/supplier-debit-notes", globalLimiter, tenantResolver, supplierDebitNoteRoutes);

// app.use("/api/conversations", conversations);
// app.use("/api/messages", messages);
app.use("/api/messages", globalLimiter, tenantResolver, messageRoutes); // ✅ Correct
app.use("/api/conversations", globalLimiter, tenantResolver, conversationRoutes); // ✅ Correct
app.use("/api/notifications", globalLimiter, tenantResolver, notificationRoutes);

app.use("/api/purchases", globalLimiter, tenantResolver, purchaseRoutes);
app.use("/api/stock-history", globalLimiter, tenantResolver, stockHistoryRoutes);
app.use("/api/settings", globalLimiter, tenantResolver, purchaseSettingsRoutes);
app.use("/api/hsn", globalLimiter, tenantResolver, hsnRoutes);
app.use("/api/warehouse", globalLimiter, tenantResolver, warehouseRoutes);
app.use("/api/variant-attributes", globalLimiter, tenantResolver, VarientRoutes);
app.use("/api/warranty", globalLimiter, tenantResolver, WarrantyRoutes);
app.use("/api/debit-notes", globalLimiter, tenantResolver, debitNoteRoutes);
app.use("/api/profile", globalLimiter, tenantResolver, userProfileRoutes);

app.use("/api/invoice", globalLimiter, tenantResolver, invoiceRoutes);
app.use("/api/sales", globalLimiter, tenantResolver, salesRoutes);
app.use("/api/pos-sales", globalLimiter, tenantResolver, posSaleRoutes);

// api for mail
app.use("/api/email/mail", globalLimiter, tenantResolver, emailrouter);
// email verify via otp api security
app.use("/api/email", globalLimiter, tenantResolver, emailverifyroute);
// google auth api
app.use("/api/auth", globalLimiter, authrouter);
// mobile verify via sms
app.use("/api/mobile", globalLimiter, tenantResolver, mobileverifyrouter);
// device management api
app.use("/api/devices", globalLimiter, tenantResolver, devicemanagementrouter);
app.use("/uploads", express.static("uploads"));
// company setting
// register companyprofile api
app.use("/api/companyprofile", globalLimiter, tenantResolver, companysettingrouter);
// company  bank 
app.use("/api/company-bank", globalLimiter, tenantResolver, companyBankRoutes);


// 
// Localization api
app.use("/api/localizationsetting", globalLimiter, tenantResolver, localizationrouter);
// cloudnary configuration
app.use("/api/cloudinary-signature", globalLimiter, tenantResolver, require("./routes/file"));
//balancesheet api
app.use("/api/balancesheet", globalLimiter, tenantResolver, balanceSheetRoutes);

app.use("/api/invoice-settings", globalLimiter, tenantResolver, invoiceSettingsRoutes);

// api for printtemplate
app.use("/api/print-templates", globalLimiter, tenantResolver, PrintTemplateRoutes);
app.use("/api/barcode-settings", globalLimiter, tenantResolver, barcodeSettingsRoutes);
// api for notes terms
app.use('/api/notes-terms-settings', globalLimiter, tenantResolver, notesTermsRoutes);

// api for tax gst
app.use('/api/tax-gst-settings', globalLimiter, tenantResolver, taxGstRoutes)
app.use('/api/system-settings', globalLimiter, tenantResolver, SystemSettingsRoutes)

//expenseReport api
app.use("/api/expenses", globalLimiter, tenantResolver, expenseRoutes);
app.use("/api/stock", globalLimiter, tenantResolver, stockRoutes);
app.use("/api/damage-return", globalLimiter, tenantResolver, damageReturnRoutes);
app.use("/api/bags", globalLimiter, tenantResolver, bagRoutes);
// app.use("/api/bags", bagRoutes);

app.use("/category", express.static(path.join(__dirname, "category")));
app.use("/api/reward-systems", globalLimiter, tenantResolver, rewardRoutes);

app.use("/api/audit-logs", globalLimiter, tenantResolver, auditrouter);
app.use("/api/reward-systems", globalLimiter, tenantResolver, rewardRoutes);

app.use("/api/errors", globalLimiter, tenantResolver, errorRoutes);

// Create HTTP server for Socket.IO
const server = http.createServer(app);


//=================== SaaS Routes ==================================================================

// Auth routes (login, refresh) - now merged into main authRoutes
// app.use("/api/auth", authLimiter,authRoutesSaaS);

// Public routes (no tenant needed)
app.use("/api/public",publicRoutesSaaS);

// Super Admin routes
app.use("/api/super", globalLimiter, superAdminRoutesSaaS);

// Tenant-protected routes
// app.use("/api/tenant", globalLimiter, tenantResolver, employeeRoutesSaaS);

// OTP routes (separate)
app.use("/api/otp", otpRoutes );

app.use("/api", errorController.notFound);
app.use(errorController.errorHandler);

//============================== saas ==================================================================

// ✅ Socket.IO setup
const io = new Server(server, {
  cors: {
    origin: "*", // or your frontend origin
    methods: ["GET", "POST"],
  },
});

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
// Start server with Socket.IO
const PORT = Number(process.env.PORT) || 5000;

const gracefulShutdown = (signal, done) => {
  console.log(`⚠️ ${signal} received. Closing server...`);

  server.close(async (serverErr) => {
    if (serverErr) {
      console.error("❌ Error while closing HTTP server:", serverErr.message);
    }

    try {
      await mongoose.connection.close(false);
    } catch (dbErr) {
      console.error("❌ Error while closing MongoDB connection:", dbErr.message);
    }

    if (typeof done === "function") {
      return done();
    }

    process.exit(serverErr ? 1 : 0);
  });

  setTimeout(() => {
    console.warn("⏳ Shutdown timeout reached. Forcing exit.");
    process.exit(1);
  }, 5000).unref();
};

server.on("error", (error) => {
  if (error.code === "EADDRINUSE") {
    console.error(
      `❌ Port ${PORT} is already in use. Stop the old Node process on port ${PORT} and restart the server.`
    );
  } else {
    console.error("❌ Server startup error:", error);
  }
  process.exit(1);
});

    // Start server after initialization
    server.listen(PORT, "0.0.0.0", () =>
      console.log(`🚀 Server running with Socket.IO on port ${PORT}`)
    );
  } catch (err) {
    console.error("❌ Server startup error:", err);
    process.exit(1);
  }
})();
