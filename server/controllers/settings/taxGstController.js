const { getAutoModels } = require("../../utils/SaaS/autoModelInitializer");

// @desc    Get tax & GST settings
// @route   GET /api/tax-gst-settings
// @access  Private
exports.getTaxGstSettings = async (req, res) => {
  try {
    const { TaxGst } = await getAutoModels(req);
    const settings = await TaxGst.getSingleSettings();

    return res.status(200).json({
      success: true,
      data: settings
    });
  } catch (error) {
    console.error("Error fetching tax & GST settings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch tax & GST settings"
    });
  }
};

// @desc    Update tax & GST settings
// @route   PUT /api/tax-gst-settings
// @access  Private
exports.updateTaxGstSettings = async (req, res) => {
  try {
    const { TaxGst } = await getAutoModels(req);
    const {
      enableGSTBilling,
      defaultGSTRate,
      priceIncludeGST,
      autoRoundOff
    } = req.body;

    // Validate default GST rate
    const validGSTRates = ["0", "5", "12", "18", "28", ""];
    if (defaultGSTRate && !validGSTRates.includes(defaultGSTRate)) {
      return res.status(400).json({
        success: false,
        message: "Invalid GST rate"
      });
    }

    // Validate auto round off
    const validRoundOffValues = ["0", "standard", "1", "5", "10"];
    if (autoRoundOff && !validRoundOffValues.includes(autoRoundOff)) {
      return res.status(400).json({
        success: false,
        message: "Invalid auto round off value"
      });
    }

    // Get or create settings
    let settings = await TaxGst.findOne();

    if (!settings) {
      // Create new settings
      settings = await TaxGst.create({
        enableGSTBilling,
        defaultGSTRate,
        priceIncludeGST,
        autoRoundOff
      });
    } else {
      // Update existing settings
      if (enableGSTBilling !== undefined) settings.enableGSTBilling = enableGSTBilling;
      if (defaultGSTRate !== undefined) settings.defaultGSTRate = defaultGSTRate;
      if (priceIncludeGST !== undefined) settings.priceIncludeGST = priceIncludeGST;
      if (autoRoundOff !== undefined) settings.autoRoundOff = autoRoundOff;

      await settings.save();
    }

    res.status(200).json({
      success: true,
      message: "Tax & GST settings updated successfully",
      data: settings
    });
  } catch (error) {
    console.error("Error updating tax & GST settings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update tax & GST settings"
    });
  }
};

// @desc    Reset tax & GST settings to defaults
// @route   POST /api/tax-gst-settings/reset
// @access  Private
exports.resetTaxGstSettings = async (req, res) => {
  try {
    const { TaxGst } = await getAutoModels(req);
    let settings = await TaxGst.findOne();

    if (!settings) {
      // Create default settings if none exist
      settings = await TaxGst.create({});
    } else {
      // Reset to defaults
      settings.enableGSTBilling = true;
      settings.defaultGSTRate = "18";
      settings.priceIncludeGST = true;
      settings.autoRoundOff = "0";

      await settings.save();
    }

    res.status(200).json({
      success: true,
      message: "Tax & GST settings reset to defaults",
      data: settings
    });
  } catch (error) {
    console.error("Error resetting tax & GST settings:", error);
    res.status(500).json({
      success: false,
      message: "Failed to reset tax & GST settings"
    });
  }
};