const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const connectMasterDB = require("../../../config/SaaS/masterDb");
const getTenantDB = require("../../../config/SaaS/tenantDb");
const cloudinary = require("../../../utils/cloudinary/cloudinary");
const { createAuditLog } = require("../../../utils/auditLogger");

// Models
const CompanyModelFactory = require("../../../models/SaaS/master/Company.model");
const User = require("../../../models/usersModels");

exports.loginTenant = async (req, res) => {
  try {
    const { email, password, subdomain } = req.body;

    if (!email || !password || !subdomain) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // 1️⃣ Connect master DB
    const masterConn = await connectMasterDB();
    const Company = CompanyModelFactory(masterConn);

    // 2️⃣ Find company by subdomain
    const company = await Company.findOne({ subdomain: subdomain.toLowerCase() });
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // 3️⃣ Connect tenant DB
    const tenantConn = await getTenantDB(company.dbName);

    // 4️⃣ Find user
    const Employee = User.forTenant(tenantConn);
    const user = await Employee.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

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
  } catch (err) {
    console.error("Tenant login error:", err);
    res.status(500).json({ message: "Server error" });
  }
};


exports.createEmployee = async (req, res) => {
  try {
    const {
      name,
      email,
      phone,
      password,
      role,
      username,
      subdomain,
    } = req.body;

    // Validate required fields
    if (!name || !email || !phone || !password || !subdomain) {
      return res.status(400).json({ message: "All required fields must be filled" });
    }

    const cleanPhone = phone.replace(/\D/g, '');

    // Connect master DB
    const masterConn = await connectMasterDB();
    const Company = CompanyModelFactory(masterConn);

    // Find company by subdomain
    const company = await Company.findOne({ subdomain: subdomain.toLowerCase() });
    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    // Connect tenant DB
    const tenantConn = await getTenantDB(company.dbName);
    const Employee = User.forTenant(tenantConn);

    // Check if email already exists
    const existingUser = await Employee.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ message: "Email already in use" });
    }

    const existingPhone = await Employee.findOne({ phone: cleanPhone });
    if (existingPhone) {
      return res.status(400).json({ displayMessage: "Phone number already exists in the system", message: "Phone number already in use" });
    }

    // Check if username already exists
    if (username) {
      const existingUsername = await Employee.findOne({ username });
      if (existingUsername) {
        return res.status(400).json({ message: "Username already in use" });
      }
    }

    let profileImage = null;
    if (req.file) {
      const uploadedImage = await cloudinary.uploader.upload(req.file.path, {
        folder: "profile_images",
      });
      profileImage = {
        url: uploadedImage.secure_url,
        public_id: uploadedImage.public_id,
      };
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newEmployee = new Employee({
      name,
      username: username || email.split("@")[0],
      email: email.toLowerCase(),
      phone: cleanPhone,
      password: hashedPassword,
      plainPassword: password,
      passwordChangedAt: new Date(),
      profileImage,
      role,
      status: "Active",
    });

    await newEmployee.save();

    // Audit log (optional for tenant)
    // await createAuditLog({
    //   user: req.user,
    //   module: "EMPLOYEE",
    //   action: "CREATE",
    //   description: `Created Employee: ${newEmployee.name}`,
    //   newData: newEmployee,
    //   req,
    // });

    res.status(201).json({ message: "Employee created successfully", employee: newEmployee });
  } catch (err) {
    console.error("Create employee error:", err);
    res.status(500).json({ message: "Server error" });
  }
};