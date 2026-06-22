const BarcodeSettings = require('../../models/settings/barcodeSettingsModel');
const CompanySetting = require('../../models/settings/companysettingmodal');

// Get barcode settings
exports.getBarcodeSettings = async (req, res) => {
  try {
    const { includeCompany = 'false' } = req.query;
    
    // Get proper database connection
    const BarcodeSettingsModel = BarcodeSettings.forTenant(req.db);
    
    // Get barcode settings
    let settings = await BarcodeSettingsModel.findOne();
    
    if (!settings) {
      // Create default settings if none exists
      settings = await createDefaultBarcodeSettings(BarcodeSettingsModel);
    }
    
    const response = { settings };
    
    // If requested, fetch company data
    if (includeCompany === 'true') {
      // Get proper database connection
      const CompanySettingModel = CompanySetting.forTenant(req.db);
      const companyData = await CompanySettingModel.findOne();
      response.company = companyData;
    }
    
    res.status(200).json({
      success: true,
      data: response
    });
  } catch (error) {
    console.error('Error fetching barcode settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching barcode settings',
      error: error.message
    });
  }
};

// Update barcode settings
exports.updateBarcodeSettings = async (req, res) => {
  try {
    const updateData = req.body;
    
    // Get proper database connection
    const BarcodeSettingsModel = BarcodeSettings.forTenant(req.db);
    
    let settings = await BarcodeSettingsModel.findOne();
    
    if (!settings) {
      settings = new BarcodeSettingsModel();
    }
    
    // Update fields
    const fields = [
      'useSamePrefixForAll',
      'definePerDocumentType',
      'showBarcodeLabel',
      'barcodeHeight',
      'barcodeFontSize',
      'documentTypes'
    ];
    
    fields.forEach(field => {
      if (updateData[field] !== undefined) {
        settings[field] = updateData[field];
      }
    });
    
    // Update company reference if provided
    if (updateData.companyId) {
      settings.companyId = updateData.companyId;
    }
    
    await settings.save();
    
    res.status(200).json({
      success: true,
      message: 'Barcode settings updated successfully',
      data: settings
    });
  } catch (error) {
    console.error('Error updating barcode settings:', error);
    
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: 'Validation Error',
        errors: messages
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Error updating barcode settings',
      error: error.message
    });
  }
};

// Reset barcode settings to defaults
exports.resetBarcodeSettings = async (req, res) => {
  try {
    // Get proper database connection
    const BarcodeSettingsModel = BarcodeSettings.forTenant(req.db);
    
    await BarcodeSettingsModel.deleteMany({});
    
    const defaultSettings = await createDefaultBarcodeSettings(BarcodeSettingsModel);
    
    res.status(200).json({
      success: true,
      message: 'Barcode settings reset to defaults',
      data: defaultSettings
    });
  } catch (error) {
    console.error('Error resetting barcode settings:', error);
    res.status(500).json({
      success: false,
      message: 'Error resetting barcode settings',
      error: error.message
    });
  }
};

// Get barcode settings with company data
exports.getBarcodeSettingsWithCompany = async (req, res) => {
  try {
    // Get proper database connection
    const BarcodeSettingsModel = BarcodeSettings.forTenant(req.db);
    
    let settings = await BarcodeSettingsModel.findOne();
    
    if (!settings) {
      settings = await createDefaultBarcodeSettings(BarcodeSettingsModel);
    }
    
    // Get proper database connection
    const CompanySettingModel = CompanySetting.forTenant(req.db);
    const companyData = await CompanySettingModel.findOne();
    
    res.status(200).json({
      success: true,
      data: {
        settings: settings,
        company: companyData
      }
    });
  } catch (error) {
    console.error('Error fetching barcode settings with company:', error);
    res.status(500).json({
      success: false,
      message: 'Error fetching barcode settings',
      error: error.message
    });
  }
};

// Create default barcode settings
async function createDefaultBarcodeSettings(BarcodeSettingsModel) {
  const defaultSettings = new BarcodeSettingsModel({
    documentTypes: [
      {
        documentType: "Invoice",
        format: "INV-",
        prefix: "INV-",
        suffix: "-12",
        example: "INV-12",
        isActive: true
      },
      {
        documentType: "Purchase Order",
        format: "PO-",
        prefix: "PO-",
        suffix: "-12",
        example: "PO-12",
        isActive: true
      },
      {
        documentType: "Quotation",
        format: "QT-",
        prefix: "QT-",
        suffix: "-12",
        example: "QT-12",
        isActive: true
      },
      {
        documentType: "Debit Note",
        format: "DN-",
        prefix: "DN-",
        suffix: "-12",
        example: "DN-12",
        isActive: true
      },
      {
        documentType: "Credit Notes",
        format: "CN-",
        prefix: "CN-",
        suffix: "-12",
        example: "CN-12",
        isActive: true
      }
    ]
  });
  
  return await defaultSettings.save();
}