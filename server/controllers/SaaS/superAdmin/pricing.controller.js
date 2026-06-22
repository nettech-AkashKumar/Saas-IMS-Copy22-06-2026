const connectMasterDB = require("../../../config/SaaS/masterDb");
const PricingModel = require("../../../models/SaaS/master/Pricing");

const DEFAULT_PRICING = [
  {
    name: "Starter",
    title: "Starter",
    price: "123",
    description: "Best for Small Business with upto 10 Products",
    features: [
      { name: "Add Products", included: true },
      { name: "Inventory Management", included: true },
      { name: "Create Invoices", included: true },
      { name: "Create Customers", included: true },
      { name: "Basic Reports", included: true },
      { name: "Email Support", included: true },
      { name: "Dashboard", included: true },
    ],
    recommended: false,
    buttonText: "Get Started",
    displayOrder: 1,
  },
  {
    name: "Professional",
    title: "Professional",
    price: "249",
    description: "Best for Growing Business",
    features: [
      { name: "All Starter Features", included: true },
      { name: "Multi-user Access", included: true },
      { name: "Advanced Reports", included: true },
      { name: "Custom Invoices", included: true },
      { name: "Purchase Orders", included: true },
      { name: "Priority Support", included: true },
      { name: "API Access", included: true },
    ],
    recommended: true,
    buttonText: "Get Started",
    displayOrder: 2,
  },
  {
    name: "Enterprise",
    title: "Enterprise",
    price: "Custom",
    description: "For large scale operations",
    features: [
      { name: "All Professional Features", included: true },
      { name: "Unlimited Users", included: true },
      { name: "Custom Development", included: true },
      { name: "Dedicated Support", included: true },
      { name: "SLA Guarantee", included: true },
      { name: "White Label", included: true },
      { name: "On-Premise Option", included: true },
    ],
    recommended: false,
    buttonText: "Contact Sales",
    displayOrder: 3,
  },
];

const getPricingModel = async () => {
  const masterDB = await connectMasterDB();
  return PricingModel(masterDB);
};

const emitCMSUpdate = (req, section, action, data = null) => {
  const io = req.app.get("io");
  if (!io) return;

  io.to("website").emit("cms-updated", {
    section,
    action,
    data,
    timestamp: new Date(),
  });
};

// ================= GET ALL PRICING =================
exports.getAllPricing = async (req, res, next) => {
  try {
    const Pricing = await getPricingModel();
    let pricing = await Pricing.find({}).sort({ displayOrder: 1 }).lean();

    if (!pricing || pricing.length === 0) {
      // Create default pricing if none exist
      pricing = await Pricing.insertMany(DEFAULT_PRICING);
      pricing = pricing.map((p) => p.toObject ? p.toObject() : p);
    }

    res.json(pricing);
  } catch (error) {
    next(error);
  }
};

// ================= GET ACTIVE PRICING FOR WEBSITE =================
exports.getPublicPricing = async (req, res, next) => {
  try {
    const Pricing = await getPricingModel();
    let pricing = await Pricing.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .lean();

    if (!pricing || pricing.length === 0) {
      // Return default if none active
      res.json(DEFAULT_PRICING);
    } else {
      res.json(pricing);
    }
  } catch (error) {
    next(error);
  }
};

// ================= CREATE PRICING PLAN =================
exports.createPricing = async (req, res, next) => {
  try {
    const Pricing = await getPricingModel();

    if (!req.body.name) {
      return res.status(400).json({ message: "Plan name is required" });
    }

    const pricing = await Pricing.create(req.body);

    res.status(201).json(pricing);

    emitCMSUpdate(req, "pricing", "create", pricing);
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Plan name must be unique" });
    }
    next(error);
  }
};

// ================= UPDATE PRICING PLAN =================
exports.updatePricing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const Pricing = await getPricingModel();

    const updateFields = { ...req.body };

    if (updateFields.features && typeof updateFields.features === "string") {
      try {
        updateFields.features = JSON.parse(updateFields.features);
      } catch {
        updateFields.features = [];
      }
    }

    const pricing = await Pricing.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!pricing) {
      return res.status(404).json({ message: "Pricing plan not found" });
    }

    res.json(pricing);

    emitCMSUpdate(req, "pricing", "update", pricing);
  } catch (error) {
    next(error);
  }
};

// ================= DELETE PRICING PLAN =================
exports.deletePricing = async (req, res, next) => {
  try {
    const { id } = req.params;
    const Pricing = await getPricingModel();

    const pricing = await Pricing.findByIdAndDelete(id).lean();

    if (!pricing) {
      return res.status(404).json({ message: "Pricing plan not found" });
    }

    res.json({ message: "Pricing plan deleted successfully" });

    emitCMSUpdate(req, "pricing", "delete");
  } catch (error) {
    next(error);
  }
};
