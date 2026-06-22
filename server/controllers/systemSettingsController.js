const SystemSettings = require("../models/systemSettingsModels.js");

// Get System Settings
exports.getSystemSettings = async (req, res, next) => {
  try {
    const SettingsModel = SystemSettings.forTenant(req.db);
    const settings = await SettingsModel.findOne();
    if (!settings) {
      // Return default structure if no settings found
      return res.status(200).json({
        success: true,
        data: {
          category: false,
          subcategory: false,
          brand: false,
          description: false,
          itembarcode: false,
          hsn: false,
          units: false,
          lotno: false,
          pricing: false,
          serialno: false,
        },
      });
    }
    res.status(200).json({ success: true, data: settings });
  } catch (error) {
    next(error);
    // console.error("Error fetching system settings:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};

// Create or Update System Settings
exports.createSystemSettings = async (req, res, next) => {
  try {
    const {
      category,
      subcategory,
      brand,
      description,
      itembarcode,
      hsn,
      units,
      lotno,
      pricing,
      serialno,
    } = req.body;

    const SettingsModel = SystemSettings.forTenant(req.db);
    let settings = await SettingsModel.findOne();

    if (settings) {
      // Update existing settings
      if (typeof category === "boolean") settings.category = category;
      if (typeof subcategory === "boolean") settings.subcategory = subcategory;
      if (typeof brand === "boolean") settings.brand = brand;
      if (typeof description === "boolean") settings.description = description;
      if (typeof itembarcode === "boolean") settings.itembarcode = itembarcode;
      if (typeof hsn === "boolean") settings.hsn = hsn;
      if (typeof units === "boolean") settings.units = units;
      if (typeof lotno === "boolean") settings.lotno = lotno;
      if (typeof pricing === "boolean") settings.pricing = pricing;
      if (typeof serialno === "boolean") settings.serialno = serialno;

      // Mutual exclusivity logic on server-side as well
      if (lotno === true) settings.pricing = false;
      if (pricing === true) settings.lotno = false;

      await settings.save();
    } else {
      // Create new settings
      let finalLotno = lotno || false;
      let finalPricing = pricing || false;

      if (finalLotno) finalPricing = false;
      else if (finalPricing) finalLotno = false;

      settings = await SettingsModel.create({
        category: category || false,
        subcategory: subcategory || false,
        brand: brand || false,
        description: description || false,
        itembarcode: itembarcode || false,
        hsn: hsn || false,
        units: units || false,
        lotno: finalLotno,
        pricing: finalPricing,
        serialno: serialno || false,
      });
    }

    res.status(200).json({
      success: true,
      message: "System settings updated successfully",
      data: settings,
    });
  } catch (error) {
    next(error);
    // console.error("Error updating system settings:", error);
    res.status(500).json({ success: false, message: "Server Error" });
  }
};
