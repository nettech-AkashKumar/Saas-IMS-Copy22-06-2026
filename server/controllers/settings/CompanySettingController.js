const companysettingModal = require("../../models/settings/companysettingmodal");

const sendCompanyProfile = async (req, res, next) => {
  try {
    const {
      companyName,
      companyTitle,
      companyemail,
      companyphone,
      companyfax,
      website,
      companyaddress,
      companycountry,
      companystate,
      companycity,
      companypostalcode,
      gstin,
      cin,
      companydescription,
      // New fields
      businessType,
      alternativePhone,
      panNo,
      country,
      state,
      district,
      pincode,
      billingAddress,
      shippingAddress
    } = req.body;

    // Validate GSTIN if provided
    if (gstin) {
      const gstinRegex = /^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[A-Z0-9]{1}Z[A-Z0-9]{1}$/;
      if (!gstinRegex.test(gstin)) {
        return res.status(400).json({ success: false, message: "Invalid GSTIN format" });
      }
    }

    // Validate PAN if provided
    if (panNo) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(panNo)) {
        return res.status(400).json({ success: false, message: "Invalid PAN format (e.g., ABCDE1234F)" });
      }
    }
  

    // Validate CIN if provided (for backward compatibility)
    if (cin) {
      const cinRegex = /^[A-Z]{1}[0-9]{5}[A-Z]{2}[0-9]{4}[A-Z]{3}[0-9]{6}$/;
      if (!cinRegex.test(cin)) {
        return res.status(400).json({ success: false, message: "Invalid CIN format" });
      }
    }

    // Validate phone numbers
    if (companyphone && !/^[0-9]{10}$/.test(companyphone)) {
      return res.status(400).json({ success: false, message: "Invalid company phone number (should be 10 digits)" });
    }

    if (alternativePhone && !/^[0-9]{10}$/.test(alternativePhone)) {
      return res.status(400).json({ success: false, message: "Invalid alternative phone number (should be 10 digits)" });
    }

    // Get tenant connection from middleware (req.db)
    const connection = req.db;
    const CompanySettingModel = connection 
      ? companysettingModal.forTenant(connection)
      : companysettingModal;

    const existingProfile = await CompanySettingModel.findOne();

    // Map old field names for backward compatibility
    const updatedData = {
      // Basic Information
      companyName,
      companyTitle: req.body.companyTitle || "",
      companyemail,
      companyphone,
      website: website || req.body.companywebsite, // Support both field names
      
      // Business Information
      gstin: gstin || "",
      panNo: panNo || "",
      country: country || "",
      state: state || "",
      district: district || "",
      pincode: pincode || "",
      businessType: businessType || companydescription || "", // Map companydescription to businessType
      
      // Contact Information
      alternativePhone: alternativePhone || "",
      companyfax: companyfax || alternativePhone || "", // Map alternativePhone to companyfax for backward compatibility
      
      // Address Information
      companyaddress: companyaddress || "",
      billingAddress: billingAddress || companyaddress || "",
      shippingAddress: shippingAddress || companyaddress || "",
      
      // Location (optional, for backward compatibility)
      companycountry: companycountry || "India",
      companystate: companystate || "",
      companycity: companycity || "",
      companypostalcode: companypostalcode || "",
      
      // Old fields (for backward compatibility)
      cin: cin || "",
      companydescription: companydescription || businessType || "",
      
      // Branding Images - handle file uploads
      companyIcon: req.files?.companyIcon?.[0]?.path || existingProfile?.companyIcon || "",
      companyFavicon: req.files?.companyFavicon?.[0]?.path || existingProfile?.companyFavicon || "",
      companyLogo: req.files?.companyLogo?.[0]?.path || existingProfile?.companyLogo || "",
      companyDarkLogo: req.files?.companyDarkLogo?.[0]?.path || existingProfile?.companyDarkLogo || "",
    };

    let savedCompanyProfile;
    if (existingProfile) {
      // Update existing profile
      savedCompanyProfile = await CompanySettingModel.findByIdAndUpdate(
        existingProfile._id,
        { $set: updatedData },
        { new: true, runValidators: true }
      );
    } else {
      // Create new profile
      const companyprofile = new CompanySettingModel(updatedData);
      savedCompanyProfile = await companyprofile.save();
    }

    res.status(201).json({
      success: true,
      message: existingProfile ? "Company Profile updated" : "Company Profile created",
      data: savedCompanyProfile,
    });
  } catch (error) {
    console.error("Error in sending company profile", error);
    
    // Handle validation errors
    if (error.name === 'ValidationError') {
      const messages = Object.values(error.errors).map(err => err.message);
      return res.status(400).json({
        success: false,
        message: "Please fill all  mandatory field",
        errors: messages
      });
    }
    
    next(error); // Pass error to global error handler
    return res.status(500).json({
      success: false,
      message: "Failed to save company profile",
      error: error.message,
    });
  }
};
// Get logic
const getCompanyProfile = async (req, res, next) => {
  try {
    // Get tenant connection from middleware (req.db)
    // Fallback to default if no connection available
    const connection = req.db;
    const CompanySettingModel = connection 
      ? companysettingModal.forTenant(connection)
      : companysettingModal;

    const companyProfile = await CompanySettingModel
      .findOne()
      .sort({ createdAt: -1 });
    
    if (!companyProfile) {
      return res.status(200).json({ 
        success: true, 
        data: null,
        message: "No company profile found" 
      });
    }
    
    // Format response for frontend
    const formattedProfile = {
      // Basic Information
      companyName: companyProfile.companyName,
       companyTitle: companyProfile.companyTitle,
      companyemail: companyProfile.companyemail,
      companyphone: companyProfile.companyphone,
      website: companyProfile.website,
      
      // Business Information
      gstin: companyProfile.gstin,
      panNo: companyProfile.panNo,
      country: companyProfile.country,
      state: companyProfile.state,
      district: companyProfile.district,
      pincode: companyProfile.pincode,
      businessType: companyProfile.businessType || companyProfile.companydescription,
      
      // Contact Information
      alternativePhone: companyProfile.alternativePhone || companyProfile.companyfax,
      companyfax: companyProfile.companyfax,
      
      // Address Information
      companyaddress: companyProfile.companyaddress,
      billingAddress: companyProfile.billingAddress || companyProfile.companyaddress,
      shippingAddress: companyProfile.shippingAddress || companyProfile.companyaddress,
      
      // Location Information
      companycountry: companyProfile.companycountry,
      companystate: companyProfile.companystate,
      companycity: companyProfile.companycity,
      companypostalcode: companyProfile.companypostalcode,
      
      // Old fields (for backward compatibility)
      cin: companyProfile.cin,
      companydescription: companyProfile.companydescription,
      
      // Branding Images
      companyIcon: companyProfile.companyIcon,
      companyFavicon: companyProfile.companyFavicon,
      companyLogo: companyProfile.companyLogo,
      companyDarkLogo: companyProfile.companyDarkLogo,
      
      // Timestamps
      createdAt: companyProfile.createdAt,
      updatedAt: companyProfile.updatedAt,
    };
    
    res.status(200).json({ 
      success: true, 
      data: formattedProfile 
    });
  } catch (error) {
    next(error); // Pass error to global error handler
    console.error("Error fetching company profile:", error);
    res.status(500).json({ 
      success: false, 
      message: "Error fetching company profile",
      error: error.message 
    });
  }
};

module.exports = { sendCompanyProfile, getCompanyProfile };
