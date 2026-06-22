const CompanyBank = require("../../models/settings/companyBankModel");
const CompanySetting = require("../../models/settings/companysettingmodal");
const cloudinary = require("../../utils/cloudinary/cloudinary");

// Helper function to upload file to Cloudinary
const uploadToCloudinary = async (file) => {
  if (!file) return null;
  
  try {
    // If file is already a Cloudinary URL (string), return it
    if (typeof file === 'string' && file.startsWith('http')) {
      return file;
    }
    
    // Upload buffer to Cloudinary
    const result = await cloudinary.uploader.upload(file.path, {
      folder: "bank_qr_codes",
      resource_type: "auto",
    });
    return result.secure_url;
  } catch (error) {
    console.error("Cloudinary upload error:", error);
    return null;
  }
};

// Add or Update bank
exports.addCompanyBank = async (req, res, next) => {
  try {
    // ✅ Use tenant database context
    const CompanyBankModel = CompanyBank.forTenant(req.db);
    const CompanySettingModel = CompanySetting.forTenant(req.db);
    
    const company = await CompanySettingModel.findOne();
    if (!company) {
      return res
        .status(400)
        .json({ success: false, message: "Company not found" });
    }

    const {
      bankName,
      accountHolderName,
      accountNumber,
      ifsc,
      branch,
      upiId,
      isDefault,
      bankId // Add this to check if we're updating
    } = req.body;

    let qrCodeUrl = null;
    
    // Upload QR code if file exists
    if (req.file) {
      qrCodeUrl = await uploadToCloudinary(req.file);
    }

    let bank;
    
    // If bankId is provided, update existing bank
    if (bankId) {
      // If setting default → unset previous default
      if (isDefault === 'true' || isDefault === true) {
        await CompanyBankModel.updateMany(
          { companyId: company._id, _id: { $ne: bankId } },
          { $set: { isDefault: false } }
        );
      }

      const updateData = {
        bankName,
        accountHolderName,
        accountNumber,
        ifsc,
        branch,
        upiId,
        isDefault: isDefault === 'true' || isDefault === true,
      };

      // Add QR code if uploaded
      if (qrCodeUrl) {
        updateData.qrCode = qrCodeUrl;
      }

      bank = await CompanyBankModel.findByIdAndUpdate(
        bankId,
        updateData,
        { new: true }
      );

      if (!bank) {
        return res.status(404).json({ 
          success: false, 
          message: "Bank not found" 
        });
      }

    } else {
      // CREATE new bank
      // If setting default → unset previous default
      if (isDefault === 'true' || isDefault === true) {
        await CompanyBankModel.updateMany(
          { companyId: company._id },
          { $set: { isDefault: false } }
        );
      }

      bank = await CompanyBankModel.create({
        companyId: company._id,
        bankName,
        accountHolderName,
        accountNumber,
        ifsc,
        branch,
        upiId,
        isDefault: isDefault === 'true' || isDefault === true,
        qrCode: qrCodeUrl || "",
      });
    }

    return res.status(201).json({
      success: true,
      message: bankId ? "Bank updated successfully" : "Bank added successfully",
      data: bank,
    });
  } catch (err) {
    console.error("Error in addCompanyBank:", err);
    return next(err); // Pass error to global error handler - this sends the response
  }
};

// Update bank endpoint
exports.updateCompanyBank = async (req, res, next) => {
  try {
    const { id } = req.params;
    const {
      bankName,
      accountHolderName,
      accountNumber,
      ifsc,
      branch,
      upiId,
      isDefault,
    } = req.body;

    // ✅ Use tenant database context
    const CompanyBankModel = CompanyBank.forTenant(req.db);
    const CompanySettingModel = CompanySetting.forTenant(req.db);

    const company = await CompanySettingModel.findOne();
    if (!company) {
      return res
        .status(400)
        .json({ success: false, message: "Company not found" });
    }

    let qrCodeUrl = null;
    
    // Upload QR code if file exists
    if (req.file) {
      qrCodeUrl = await uploadToCloudinary(req.file);
    }

    // If setting default → unset previous default
    if (isDefault === 'true' || isDefault === true) {
      await CompanyBankModel.updateMany(
        { companyId: company._id, _id: { $ne: id } },
        { $set: { isDefault: false } }
      );
    }

    const updateData = {
      bankName,
      accountHolderName,
      accountNumber,
      ifsc,
      branch,
      upiId,
      isDefault: isDefault === 'true' || isDefault === true,
    };

    // Add QR code if uploaded
    if (qrCodeUrl) {
      updateData.qrCode = qrCodeUrl;
    }

    const bank = await CompanyBankModel.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!bank) {
      return res.status(404).json({ 
        success: false, 
        message: "Bank not found" 
      });
    }

    return res.status(200).json({
      success: true,
      message: "Bank updated successfully",
      data: bank,
    });
  } catch (err) {
    console.error("Error in updateCompanyBank:", err);
    return next(err); // Pass error to global error handler - this sends the response
  }
};

// Get banks
exports.getCompanyBanks = async (req, res, next) => {
  try {
    // ✅ Use tenant database context
    const CompanyBankModel = CompanyBank.forTenant(req.db);
    const banks = await CompanyBankModel.find().sort({ isDefault: -1 });
    
    return res.json({ success: true, data: banks });
  } catch (err) {
    console.error("Error in getCompanyBanks:", err);
    return next(err); // Pass error to global error handler - this sends the response
  }
};

// Get default bank
exports.getDefaultBank = async (req, res, next) => {
  try {
    // ✅ Use tenant database context
    const CompanyBankModel = CompanyBank.forTenant(req.db);
    const bank = await CompanyBankModel.findOne({ isDefault: true });
    
    return res.json({ success: true, data: bank });
  } catch (err) {
    console.error("Error in getDefaultBank:", err);
    return next(err); // Pass error to global error handler - this sends the response
  }
};
