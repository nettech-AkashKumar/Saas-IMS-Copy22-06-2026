/**
 * ⚡ DYNAMIC PLANS CONFIG
 * Fetches plan data from Pricing model in master database
 * Uses the selected plan name directly from database
 */

const parseMonthlyPrice = (priceValue) => {
  const priceStr = String(priceValue || "").replace(/[^0-9]/g, "");
  return parseInt(priceStr, 10) || 0;
};

const applyOffer = (basePrice, offerType = "none", offerValue = 0) => {
  if (offerType === "fixed" && offerValue > 0) {
    return Math.max(0, basePrice - offerValue);
  }
  if (offerType === "percentage" && offerValue > 0) {
    return Math.round(basePrice * (1 - offerValue / 100));
  }
  return basePrice;
};

const calculatePlanPrice = (
  priceValue,
  offerType = "none",
  offerValue = 0,
  cycle = "monthly",
) => {
  const monthlyBase = parseMonthlyPrice(priceValue);
  const monthlyAfterOffer = applyOffer(monthlyBase, offerType, offerValue);
  if (cycle === "annually") {
    return Math.round(monthlyAfterOffer * 12 * 0.85);
  }
  return monthlyAfterOffer;
};

const extractMaxEmployees = (features = []) => {
  if (!Array.isArray(features)) return null;
  const match = features.find((feature) => {
    if (!feature || typeof feature.name !== "string") return false;
    const name = feature.name.toLowerCase();
    return name.includes("user") || name.includes("employee");
  });

  if (!match) return null;
  if (typeof match.included === "number") {
    return match.included;
  }

  const numericInName = match.name.match(/(\d+)/);
  if (numericInName) {
    return parseInt(numericInName[0], 10);
  }

  return null;
};

const normalizePricingRecord = (record) => {
  const planName = (record.title || record.name || "").toLowerCase().trim();
  if (!planName) return null;

  const monthlyPrice = parseMonthlyPrice(record.price);
  const monthly = applyOffer(monthlyPrice, record.offerType, record.offerValue);
  const maxEmployees = record.maxEmployees || extractMaxEmployees(record.features) || null;

  return {
    planKey: planName,
    displayName: record.title || record.name,

    price: {
      monthly,
      annually: Math.round(monthly * 12 * 0.85),
    },
    modulePermissions: record.modulePermissions || {},
    maxEmployees,
    features: record.features || [],
    description: record.description || "",
    offerType: record.offerType || "none",
    offerValue: record.offerValue || 0,
    currencySymbol: record.currencySymbol || "₹",
    buttonText: record.buttonText || "Get Started",
    buttonUrl: record.buttonUrl || "#",
    isActive: record.isActive !== false,
    displayOrder: record.displayOrder || 0,
  };
};

/**
 * Fetch plans from Pricing model
 * @param {Object} PricingModel - Pricing model instance (mongoose)
 * @returns {Promise<Object>} Dynamic plans config keyed by plan names from DB
 */
const loadPlansFromDatabase = async (PricingModel) => {
  if (!PricingModel) {
    throw new Error("PricingModel is required for loading plans from database");
  }

  const pricingRecords = await PricingModel.find({ isActive: true }).sort({ displayOrder: 1 }).lean();
  if (!pricingRecords || pricingRecords.length === 0) {
    return {};
  }

  return pricingRecords.reduce((acc, record) => {
    const normalized = normalizePricingRecord(record);
    if (normalized && normalized.planKey) {
      acc[normalized.planKey] = normalized;
    }
    return acc;
  }, {});
};

module.exports = {
  loadPlansFromDatabase,
};
