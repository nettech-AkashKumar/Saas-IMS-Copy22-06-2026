const PrintTemplate = require("../../models/settings/printTemplateModel");
const CompanySetting = require("../../models/settings/companysettingmodal");
const Product = require("../../models/productModels");
const Customer = require("../../models/customerModel");
const cloudinary = require("../../utils/cloudinary/cloudinary");
const upload = require("../../config/upload.js");

// Get print template with all referenced data
exports.getPrintTemplate = async (req, res) => {
  try {
    const { type = "normal" } = req.query;
    const { includeData = "true" } = req.query;

    // Get proper database connection
    const PrintTemplateModel = PrintTemplate.forTenant(req.db);

    // Get active template
    let template = await PrintTemplateModel.findOne({
      templateType: type,
      isActive: true,
    });

    if (!template) {
      // Create default template if none exists
      template = await createDefaultTemplate(type, PrintTemplateModel);
    }

    const response = {
      success: true,
      data: {
        template: template,
      },
    };

    // If requested, fetch all related data
    if (includeData === "true") {
      // Get proper database connection
      const CompanySettingModel = CompanySetting.forTenant(req.db);
      const ProductModel = Product.forTenant(req.db);
      const CustomerModel = Customer.forTenant(req.db);

      // Fetch company data
      const company = await CompanySettingModel.findOne();

      // Fetch sample products for preview
      const sampleProducts = await ProductModel.find({ isDelete: false })
        .limit(5)
        .populate("category", "categoryName")
        .populate("subcategory", "subCategoryName")
        .populate("hsn", "hsnCode");

      // Fetch sample customer for preview
      const sampleCustomer = await CustomerModel.findOne();

      response.data.company = company;
      response.data.sampleProducts = sampleProducts;
      response.data.sampleCustomer = sampleCustomer;
    }

    res.status(200).json(response);
  } catch (error) {
    console.error("Error fetching print template:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching print template settings",
      error: error.message,
    });
  }
};

// Update print template (only template-specific settings)
exports.updatePrintTemplate = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const { templateType = "normal" } = updateData;

    // Get proper database connection
    const PrintTemplateModel = PrintTemplate.forTenant(req.db);

    let template;

    // 1. Try to find by ID if provided
    if (id && id !== "undefined") {
      template = await PrintTemplateModel.findById(id);
    }

    // 2. If not found by ID or ID not provided, try to find an existing one by type
    if (!template) {
      template = await PrintTemplateModel.findOne({ templateType });
    }

    // 3. If still not found, create a new one
    if (!template) {
      template = new PrintTemplateModel({ templateType });
    }

    // Only update template-specific fields
    const templateFields = [
      "templateName",
      "selectedTemplate",
      "layoutConfig",
      "fieldVisibility",
      "isActive",
      "isDefault",
      "signatureUrl",
    ];

    templateFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        template[field] = updateData[field];
      }
    });

    // Update company reference if provided
    if (updateData.companyId) {
      template.companyId = updateData.companyId;
    }

    await template.save();

    res.status(200).json({
      success: true,
      message: "Print template saved successfully",
      data: template,
    });
  } catch (error) {
    console.error("Error saving print template:", error);

    if (error.name === "ValidationError") {
      const messages = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        message: "Validation Error",
        errors: messages,
      });
    }

    res.status(500).json({
      success: false,
      message: "Error saving print template",
      error: error.message,
    });
  }
};

// Upload signature image
exports.uploadSignature = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: "invoice-signatures",
      resource_type: "image",
      transformation: [
        { width: 500, height: 200, crop: "limit" },
        { quality: "auto:good" },
      ],
    });

    // Delete the temporary file
    const fs = require("fs");
    if (fs.existsSync(req.file.path)) {
      fs.unlinkSync(req.file.path);
    }

    res.status(200).json({
      success: true,
      message: "Signature uploaded successfully",
      data: {
        url: result.secure_url,
        public_id: result.public_id,
        width: result.width,
        height: result.height,
      },
    });
  } catch (error) {
    console.error("Error uploading signature:", error);
    res.status(500).json({
      success: false,
      message: "Error uploading signature",
      error: error.message,
    });
  }
};

// Delete signature
exports.deleteSignature = async (req, res) => {
  try {
    const { publicId } = req.body;

    if (!publicId) {
      return res.status(400).json({
        success: false,
        message: "Public ID is required",
      });
    }

    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === "ok") {
      res.status(200).json({
        success: true,
        message: "Signature deleted successfully",
      });
    } else {
      res.status(400).json({
        success: false,
        message: "Failed to delete signature",
      });
    }
  } catch (error) {
    console.error("Error deleting signature:", error);
    res.status(500).json({
      success: false,
      message: "Error deleting signature",
      error: error.message,
    });
  }
};

// Generate invoice preview with dynamic data
exports.generatePreview = async (req, res) => {
  try {
    const { templateId, invoiceData } = req.body;

    // Get proper database connections
    const PrintTemplateModel = PrintTemplate.forTenant(req.db);
    const CompanySettingModel = CompanySetting.forTenant(req.db);
    const CustomerModel = Customer.forTenant(req.db);
    const ProductModel = Product.forTenant(req.db);

    // Get template
    const template = await PrintTemplateModel.findById(templateId);
    if (!template) {
      return res.status(404).json({
        success: false,
        message: "Template not found",
      });
    }

    // Fetch all required data
    const [company, customer, products] = await Promise.all([
      // Get company data (either from template reference or default)
      template.companyId
        ? CompanySettingModel.findById(template.companyId)
        : CompanySettingModel.findOne(),

      // Get customer data
      invoiceData?.customerId
        ? CustomerModel.findById(invoiceData.customerId)
        : CustomerModel.findOne(),

      // Get product data
      invoiceData?.productIds?.length > 0
        ? ProductModel.find({
            _id: { $in: invoiceData.productIds },
            isDelete: false,
          })
            .populate("category", "categoryName")
            .populate("subcategory", "subCategoryName")
            .populate("hsn", "hsnCode")
        : ProductModel.find({ isDelete: false })
            .limit(3)
            .populate("category", "categoryName")
            .populate("subcategory", "subCategoryName")
            .populate("hsn", "hsnCode"),
    ]);

    // Generate preview data structure
    const previewData = {
      template: template,
      company: company,
      customer: customer,
      products: products,
      invoice: {
        number: invoiceData?.invoiceNumber || "INV-001",
        date: invoiceData?.date || new Date().toISOString().split("T")[0],
        time: invoiceData?.time || new Date().toLocaleTimeString(),
        subtotal: 0,
        tax: 0,
        discount: 0,
        total: 0,
      },
    };

    // Calculate totals
    if (products && products.length > 0) {
      previewData.invoice.subtotal = products.reduce(
        (sum, product) => sum + (product.sellingPrice || 0),
        0
      );

      // Add sample tax (18%)
      previewData.invoice.tax = previewData.invoice.subtotal * 0.18;
      previewData.invoice.total =
        previewData.invoice.subtotal + previewData.invoice.tax;
    }

    res.status(200).json({
      success: true,
      data: previewData,
    });
  } catch (error) {
    console.error("Error generating preview:", error);
    res.status(500).json({
      success: false,
      message: "Error generating preview",
      error: error.message,
    });
  }
};

// Get all templates
exports.getAllTemplates = async (req, res) => {
  try {
    const { type } = req.query;
    const query = { isActive: true };

    if (type) {
      query.templateType = type;
    }

    // Get proper database connection
    const PrintTemplateModel = PrintTemplate.forTenant(req.db);

    const templates = await PrintTemplateModel.find(query)
      .sort({ isDefault: -1, updatedAt: -1 })
      .populate("companyId", "companyName companyLogo");

    res.status(200).json({
      success: true,
      data: templates,
      count: templates.length,
    });
  } catch (error) {
    console.error("Error fetching templates:", error);
    res.status(500).json({
      success: false,
      message: "Error fetching templates",
      error: error.message,
    });
  }
};

// Create default template
async function createDefaultTemplate(type, PrintTemplateModel) {
  const defaultTemplate = new PrintTemplateModel({
    templateType: type,
    templateName: `Default ${
      type === "normal" ? "Normal" : "Thermal"
    } Template`,
    selectedTemplate: "template1",
    fieldVisibility: {
      showHSN: true,
      showRate: true,
      showTax: true,
      showDate: true,
      showTime: true,
      showTotalsInWords: type === "normal",
      showBankDetails: type === "normal",
      showTermsConditions: type === "normal",
      showPaymentMode: type === "thermal",
      showDueAmount: type === "thermal",
      showRewardEarned: type === "thermal",
      showGreetings: type === "thermal",
    },
    layoutConfig: {
      headerPosition: "center",
      footerPosition: "center",
      fontSize: type === "thermal" ? 10 : 12,
      margin: {
        top: 10,
        bottom: 10,
        left: 10,
        right: 10,
      },
    },
    isDefault: true,
  });

  return await defaultTemplate.save();
}
