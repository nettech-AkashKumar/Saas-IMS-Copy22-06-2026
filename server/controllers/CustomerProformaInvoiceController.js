const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");
const cloudinary = require("../utils/cloudinary/cloudinary");
const mongoose = require("mongoose");

const generateSalesOrderNo = async (req) => {
  const { Counter: CounterModel } = await getAutoModels(req);
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const counterKey = `SO${year}${month}`;
  
  const counter = await CounterModel.findByIdAndUpdate(
    counterKey,
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  
  const sequence = String(counter.seq).padStart(3, "0");
  return `${counterKey}${sequence}`;
};

// Helper: Parse FormData nested objects (same as invoice)
const parseFormDataNested = (body) => {
  const parsed = { ...body };

  // Handle autoRoundOff array
  if (Array.isArray(body.autoRoundOff)) {
    if (body.autoRoundOff.length === 2) {
      if (body.autoRoundOff[0] === "false" && !isNaN(parseInt(body.autoRoundOff[1]))) {
        parsed.autoRoundOff = body.autoRoundOff[1];
      } else {
        const validValue = body.autoRoundOff.find((val) => ["0", "1", "5", "10"].includes(val));
        parsed.autoRoundOff = validValue || "0";
      }
    } else if (body.autoRoundOff.length === 1) {
      parsed.autoRoundOff = body.autoRoundOff[0];
    }
  }

  // Parse tax settings
  if (body["taxSettings[autoRoundOff]"] !== undefined) {
    parsed.taxSettings = parsed.taxSettings || {};
    parsed.taxSettings.autoRoundOff = body["taxSettings[autoRoundOff]"];
  }
  if (body["taxSettings[enableGSTBilling]"] !== undefined) {
    parsed.taxSettings = parsed.taxSettings || {};
    parsed.taxSettings.enableGSTBilling = body["taxSettings[enableGSTBilling]"] !== "false";
  }
  if (body["taxSettings[priceIncludeGST]"] !== undefined) {
    parsed.taxSettings = parsed.taxSettings || {};
    parsed.taxSettings.priceIncludeGST = body["taxSettings[priceIncludeGST]"] !== "false";
  }
  if (body["taxSettings[defaultGSTRate]"] !== undefined) {
    parsed.taxSettings = parsed.taxSettings || {};
    parsed.taxSettings.defaultGSTRate = body["taxSettings[defaultGSTRate]"];
  }

  // Parse additionalDiscount
  if (body["additionalDiscount[pct]"] !== undefined || body["additionalDiscount[amt]"] !== undefined) {
    parsed.additionalDiscount = {
      pct: parseFloat(body["additionalDiscount[pct]"]) || 0,
      amt: parseFloat(body["additionalDiscount[amt]"]) || 0,
    };
  }

  // Parse additionalChargesDetails
  if (body["additionalChargesDetails[shipping]"] !== undefined) {
    parsed.additionalChargesDetails = parsed.additionalChargesDetails || {};
    const shippingValue = body["additionalChargesDetails[shipping]"];
    parsed.additionalChargesDetails.shipping = Array.isArray(shippingValue) ? parseFloat(shippingValue[0]) || 0 : parseFloat(shippingValue) || 0;
  }
  if (body["additionalChargesDetails[handling]"] !== undefined) {
    parsed.additionalChargesDetails = parsed.additionalChargesDetails || {};
    const handlingValue = body["additionalChargesDetails[handling]"];
    parsed.additionalChargesDetails.handling = Array.isArray(handlingValue) ? parseFloat(handlingValue[0]) || 0 : parseFloat(handlingValue) || 0;
  }
  if (body["additionalChargesDetails[packing]"] !== undefined) {
    parsed.additionalChargesDetails = parsed.additionalChargesDetails || {};
    const packingValue = body["additionalChargesDetails[packing]"];
    parsed.additionalChargesDetails.packing = Array.isArray(packingValue) ? parseFloat(packingValue[0]) || 0 : parseFloat(packingValue) || 0;
  }
  if (body["additionalChargesDetails[service]"] !== undefined) {
    parsed.additionalChargesDetails = parsed.additionalChargesDetails || {};
    const serviceValue = body["additionalChargesDetails[service]"];
    parsed.additionalChargesDetails.service = Array.isArray(serviceValue) ? parseFloat(serviceValue[0]) || 0 : parseFloat(serviceValue) || 0;
  }
  if (body["additionalChargesDetails[other]"] !== undefined) {
    parsed.additionalChargesDetails = parsed.additionalChargesDetails || {};
    const otherValue = body["additionalChargesDetails[other]"];
    parsed.additionalChargesDetails.other = Array.isArray(otherValue) ? parseFloat(otherValue[0]) || 0 : parseFloat(otherValue) || 0;
  }

  // Parse items array
  const items = [];
  const itemRegex = /items\[(\d+)\]\[(\w+)\]/;

  Object.keys(body).forEach((key) => {
    const match = key.match(itemRegex);
    if (match) {
      const index = parseInt(match[1]);
      const field = match[2];

      if (!items[index]) items[index] = {};

      const numericFields = ["qty", "unitPrice", "taxRate", "taxAmount", "discountPct", "discountAmt", "amount"];
      if (numericFields.includes(field)) {
        items[index][field] = parseFloat(body[key]) || 0;
      } else if (field === "selectedSerialNos") {
        const val = body[key];
  if (!val || val === "" || val === "[]") {
    items[index][field] = [];
  } else if (Array.isArray(val)) {
    items[index][field] = val.filter(Boolean);
  } else {
    // Plain comma-separated string: "SN001,SN002"
    items[index][field] = val.split(",").map(s => s.trim()).filter(Boolean);
  }
  try {
    const serialNosValue = body[key];
    if (typeof serialNosValue === "string") {
      const trimmed = serialNosValue.trim();
      if (trimmed === "[]" || trimmed === "") {
        // ← ADD THIS: handle the literal string "[]"
        items[index][field] = [];
      } else if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        const parsed = JSON.parse(trimmed);
        items[index][field] = Array.isArray(parsed) ? parsed : [];
      } else {
        items[index][field] = trimmed.split(",").map(s => s.trim()).filter(s => s);
      }
    } else if (Array.isArray(serialNosValue)) {
      items[index][field] = serialNosValue;
    } else {
      items[index][field] = [];
    }
  } catch {
    items[index][field] = [];
  }
} else {
        const value = body[key];
        if (Array.isArray(value)) {
          items[index][field] = value[0] !== undefined ? String(value[0]) : "";
        } else {
          items[index][field] = body[key];
        }
      }
    }
  });

  if (items.length > 0) {
    parsed.items = items.filter(item => item !== undefined);
  }

  return parsed;
};

// Generate proforma number
const generateProformaNo = async (ProformaModel) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const prefix = `PI${year}${month}`;
  const count = await ProformaModel.countDocuments({ proformaNo: { $regex: `^${prefix}` } });
  const sequence = String(count + 1).padStart(3, "0");
  return `${prefix}${sequence}`;
};

// Create Proforma Invoice
exports.createProformaInvoice = async (req, res, next) => {
  try {
    // console.log("=== createProformaInvoice START ===");
    
    const { 
      CustomerProformaInvoice: ProformaModel,
      Quotation: QuotationModel,
      CompanyBank: CompanyBankModel
    } = await getAutoModels(req);
    
    // Parse FormData
    const parsedBody = parseFormDataNested(req.body);
    // console.log("Parsed body keys:", Object.keys(parsedBody));
    
    let { quotationId, ...proformaData } = parsedBody;
    
    // If coming from quotation
    if (quotationId) {
      const quotation = await QuotationModel.findById(quotationId);
      if (!quotation) {
        return res.status(404).json({ success: false, error: "Quotation not found" });
      }
      proformaData = {
        ...proformaData,
        customerId: quotation.customerId,
        items: quotation.items,
        billingAddress: quotation.billingAddress,
        shippingAddress: quotation.shippingAddress,
        subtotal: quotation.subtotal,
        totalTax: quotation.totalTax,
        totalDiscount: quotation.totalDiscount,
        additionalDiscount: quotation.additionalDiscount,
        additionalCharges: quotation.additionalCharges,
        additionalChargesDetails: quotation.additionalChargesDetails,
        grandTotal: quotation.grandTotal,
        taxSettings: quotation.taxSettings,
      };
    }
    
    // Validate required fields
    if (!proformaData.customerId) {
      return res.status(400).json({ success: false, error: "Customer ID is required" });
    }
    
    if (!proformaData.items || proformaData.items.length === 0) {
      return res.status(400).json({ success: false, error: "At least one product is required" });
    }
    
    // Generate proforma number
    const proformaNo = await generateProformaNo(ProformaModel);
    // console.log("Generated proformaNo:", proformaNo);
    
    // Handle file uploads if any (Cloudinary)
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "proforma_attachments",
            resource_type: "auto",
          });
          attachments.push({
            url: result.secure_url,
            public_id: result.public_id,
            filename: file.originalname,
          });
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
        }
      }
    }
    
    // Get default bank
    const defaultBank = await CompanyBankModel.findOne({ isDefault: true });
    
    // Create proforma
    const proforma = new ProformaModel({
      ...proformaData,
      proformaNo,
      proformaDate: new Date(),
      validUntil: proformaData.validUntil ? new Date(proformaData.validUntil) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      bankDetails: defaultBank ? {
        bankName: defaultBank.bankName,
        accountHolderName: defaultBank.accountHolderName,
        accountNumber: defaultBank.accountNumber,
        ifsc: defaultBank.ifsc,
        branch: defaultBank.branch,
        upiId: defaultBank.upiId,
        qrCode: defaultBank.qrCode,
      } : {},
      attachments: attachments,
      quotationId: quotationId || null,
      createdBy: req.user?._id,
    });
    // ✅ Calculate advance payment status and due amount BEFORE saving
    const advanceAmt = parseFloat(proforma.advanceAmount) || 0;
    const paidAmt = parseFloat(proforma.advancePaid) || 0;
    const grandTotalAmt = parseFloat(proforma.grandTotal) || 0;

  // Set advance payment status
    if (advanceAmt > 0) {
      if (paidAmt >= advanceAmt) {
        proforma.advancePaymentStatus = "paid";
        if (paidAmt >= grandTotalAmt && grandTotalAmt > 0) {
          proforma.status = "fully_paid";
        } else {
          proforma.status = "advance_paid";
        }
      } else if (paidAmt > 0) {
        proforma.advancePaymentStatus = "partial";
        proforma.status = "advance_paid";
      } else {
        proforma.advancePaymentStatus = "pending";
      }
    }

// Calculate due amount
proforma.dueAmount = proforma.grandTotal - paidAmt;
    
    // Calculate totals
    proforma.calculateTotals();
    
    // Save
    await proforma.save();
    // console.log("Proforma saved successfully!");
    
       // Populate customer for response
    const populatedProforma = await ProformaModel.findById(proforma._id)
      .populate("customerId", "name phone email");
    
    res.status(201).json({ success: true, message: "Proforma Invoice created", proforma: populatedProforma  });
  } catch (err) {
    console.error("Error in createProformaInvoice:", err);
    res.status(500).json({ success: false, error: err.message });
  }
};

// Update Proforma Invoice
exports.updateProformaInvoice = async (req, res, next) => {
  try {
    const { CustomerProformaInvoice: ProformaModel } = await getAutoModels(req);
    
    const proforma = await ProformaModel.findById(req.params.id);
    if (!proforma) {
      return res.status(404).json({ success: false, error: "Proforma Invoice not found" });
    }
    
    // Don't allow updates if already converted
    if (proforma.status === "converted_to_invoice" || proforma.status === "converted_to_order") {
      return res.status(400).json({ success: false, error: "Cannot update converted proforma" });
    }
    
    const parsedBody = parseFormDataNested(req.body);
    // Handle existing attachments to keep
let keptAttachments = [];

if (parsedBody.existingAttachments !== undefined) {
  try {
    const existingList = typeof parsedBody.existingAttachments === 'string'
      ? JSON.parse(parsedBody.existingAttachments)
      : parsedBody.existingAttachments;

    keptAttachments = proforma.attachments.filter(att =>
      existingList.some(existing => existing.public_id === att.public_id)
    );

    const removedAttachments = proforma.attachments.filter(att =>
      !existingList.some(existing => existing.public_id === att.public_id)
    );
    for (const att of removedAttachments) {
      if (att.public_id) {
        try {
          await cloudinary.uploader.destroy(att.public_id);
        } catch (err) {
          console.error("Failed to delete from Cloudinary:", err);
        }
      }
    }
  } catch (e) {
    keptAttachments = [...proforma.attachments];
  }
} else {
  keptAttachments = [...proforma.attachments];
}

// ✅ Upload new files
const newAttachments = [];
if (req.files && req.files.length > 0) {
  for (const file of req.files) {
    try {
      const result = await cloudinary.uploader.upload(file.path, {
        folder: "proforma_attachments",
        resource_type: "auto",
      });
      newAttachments.push({
        url: result.secure_url,
        public_id: result.public_id,
        filename: file.originalname,
      });
    } catch (uploadError) {
      console.error("Cloudinary upload error:", uploadError);
    }
  }
}

// ✅ Clean parsedBody before Object.assign
delete parsedBody.attachments;
delete parsedBody.attachmentsToDelete;
delete parsedBody.existingAttachments;

// ✅ Apply updates
Object.assign(proforma, parsedBody);

// ✅ Set final attachments (kept + new)
proforma.attachments = [...keptAttachments, ...newAttachments];
     // ✅ Recalculate due amount and advance status after update
    const paidAmt = parseFloat(proforma.advancePaid) || 0;
    const advanceAmt = parseFloat(proforma.advanceAmount) || 0;
    const grandTotalAmt = parseFloat(proforma.grandTotal) || 0;
    
    // Update due amount
    proforma.dueAmount = grandTotalAmt - paidAmt;
     
    // Update advance payment status
    if (advanceAmt > 0) {
      if (paidAmt >= advanceAmt) {
        proforma.advancePaymentStatus = "paid";
      } else if (paidAmt > 0) {
        proforma.advancePaymentStatus = "partial";
      } else {
        proforma.advancePaymentStatus = "pending";
      }
    }
    proforma.calculateTotals();
    await proforma.save();
    
    res.json({ success: true, message: "Proforma Invoice updated", proforma });
  } catch (err) {
    next(err);
  }
};

// Get all Proforma Invoices
exports.getAllProformaInvoices = async (req, res, next) => {
  try {
    const { CustomerProformaInvoice: ProformaModel } = await getAutoModels(req);
    
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    let query = {};
    
    if (req.query.search) {
      const { Customer: CustomerModel } = await getAutoModels(req);
      const matchingCustomers = await CustomerModel.find(
        { name: { $regex: req.query.search, $options: 'i' } },
        { _id: 1 }
      );
      
      const customerIds = matchingCustomers.map(c => c._id);
      query.$or = [
        { proformaNo: { $regex: req.query.search, $options: 'i' } },
        { customerId: { $in: customerIds } }
      ];
    }
    
    if (req.query.customerId) {
      query.customerId = req.query.customerId;
    }

      // ✅ Fix: Handle "fully_paid" status correctly
    if (req.query.status === 'fully_paid') {
      query.dueAmount = 0;
      // Also exclude converted ones
      query.status = { $nin: ["converted_to_order", "converted_to_invoice"] };
    } 
    else if (req.query.status) {
      query.status = req.query.status;
    }
    
    // FIX: Add hasDue filter for Due tab
    if (req.query.hasDue === 'true') {
      query.dueAmount = { $gt: 0 };
    }
    
    if (req.query.startDate && req.query.endDate) {
      query.proformaDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }
    
    const total = await ProformaModel.countDocuments(query);
    const proformas = await ProformaModel.find(query)
    .select('proformaNo customerId items grandTotal dueAmount advancePaid status proformaDate') 
      .populate("customerId", "name phone email")
      .populate("quotationId", "quotationNo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
        // ✅ Transform data to include paidAmount calculation
    const transformedProformas = proformas.map(proforma => {
      const proformaObj = proforma.toObject();
      return {
        ...proformaObj,
        paidAmount: proformaObj.advancePaid || 0  // Add paidAmount field
      };
    });
    
    res.json({ success: true, data: transformedProformas, total, page, limit });
  } catch (err) {
    next(err);
  }
};

// Get Proforma by ID
exports.getProformaById = async (req, res, next) => {
  try {
    const { CustomerProformaInvoice: ProformaModel } = await getAutoModels(req);
    const proforma = await ProformaModel.findById(req.params.id)
      .populate("customerId", "name phone email address gstin")
      .populate("quotationId");
    
    if (!proforma) {
      return res.status(404).json({ success: false, error: "Proforma Invoice not found" });
    }
      // ✅ Transform to include paidAmount
    const proformaObj = proforma.toObject();
    const responseData = {
      ...proformaObj,
      paidAmount: proformaObj.advancePaid || 0
    };
    
    res.json({ success: true, data: responseData });
  } catch (err) {
    next(err);
  }
};

// Delete Proforma Invoice
exports.deleteProformaInvoice = async (req, res, next) => {
  try {
    const { CustomerProformaInvoice: ProformaModel } = await getAutoModels(req);
    
    const proforma = await ProformaModel.findById(req.params.id);
    if (!proforma) {
      return res.status(404).json({ success: false, error: "Proforma Invoice not found" });
    }
    
    if (proforma.status === "converted_to_invoice" || proforma.status === "converted_to_order") {
      return res.status(400).json({ success: false, error: "Cannot delete converted proforma" });
    }
    
    // Delete attachments from Cloudinary
    if (proforma.attachments && proforma.attachments.length > 0) {
      for (const attachment of proforma.attachments) {
        if (attachment.public_id) {
          try {
            await cloudinary.uploader.destroy(attachment.public_id);
          } catch (err) {
            console.error("Failed to delete Cloudinary file:", err);
          }
        }
      }
    }
    
    await ProformaModel.findByIdAndDelete(req.params.id);
    res.json({ success: true, message: "Proforma Invoice deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// Bulk Delete Proforma Invoices
exports.bulkDeleteProformaInvoices = async (req, res, next) => {
  try {
    const { CustomerProformaInvoice: ProformaModel } = await getAutoModels(req);
    const { ids } = req.body;
    
    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, error: "No IDs provided" });
    }
    
    const convertibleProformas = await ProformaModel.find({
      _id: { $in: ids },
      status: { $in: ["converted_to_invoice", "converted_to_order"] }
    });
    
    if (convertibleProformas.length > 0) {
      return res.status(400).json({ 
        success: false, 
        error: "Cannot delete proforma invoices that are already converted" 
      });
    }
    
    const result = await ProformaModel.deleteMany({ _id: { $in: ids } });
    res.json({ success: true, message: `${result.deletedCount} proforma invoice(s) deleted successfully` });
  } catch (err) {
    next(err);
  }
};

// Record Advance Payment for Proforma
exports.recordAdvancePayment = async (req, res, next) => {
  try {
    const { CustomerProformaInvoice: ProformaModel } = await getAutoModels(req);
    const { amount, paymentMethod, referenceNumber, notes } = req.body;
    
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({ success: false, error: "Valid payment amount required" });
    }
    
    const paymentAmount = parseFloat(amount);
    const proforma = await ProformaModel.findById(req.params.id);
    
    if (!proforma) {
      return res.status(404).json({ success: false, error: "Proforma Invoice not found" });
    }
    
    // Check if already fully paid
    if (proforma.dueAmount <= 0 && proforma.advancePaymentStatus === "paid") {
      return res.status(400).json({ success: false, error: "Proforma already fully paid" });
    }
    
    // Check if payment exceeds due amount
    const remainingDue = proforma.grandTotal - proforma.advancePaid;
    if (paymentAmount > remainingDue) {
      return res.status(400).json({ 
        success: false, 
        error: `Payment amount exceeds due amount. Due: ₹${remainingDue.toFixed(2)}` 
      });
    }
    
    // Update advance paid
    proforma.advancePaid = (proforma.advancePaid || 0) + paymentAmount;
    proforma.dueAmount = proforma.grandTotal - proforma.advancePaid;
    
    // Update payment status
    const advanceAmt = parseFloat(proforma.advanceAmount) || 0;
    if (advanceAmt > 0) {
      if (proforma.advancePaid >= advanceAmt) {
        proforma.advancePaymentStatus = "paid";
      } else if (proforma.advancePaid > 0) {
        proforma.advancePaymentStatus = "partial";
      }
    }
    
    // Update status based on payment
    if (proforma.advancePaid >= proforma.grandTotal) {
      proforma.status = "fully_paid";
    } else if (proforma.advancePaid > 0) {
      proforma.status = "advance_paid";
    }
    
    // Add payment to history if you have a paymentHistory array
    if (!proforma.paymentHistory) {
      proforma.paymentHistory = [];
    }
    
    proforma.paymentHistory.push({
      date: new Date(),
      amount: paymentAmount,
      method: paymentMethod || "cash",
      reference: referenceNumber || "",
      notes: notes || "",
      addedBy: req.user?._id,
    });
    
    await proforma.save();
    
    res.json({ 
      success: true, 
      message: "Advance payment recorded", 
      proforma: {
        _id: proforma._id,
        proformaNo: proforma.proformaNo,
        advancePaid: proforma.advancePaid,
        dueAmount: proforma.dueAmount,
        advancePaymentStatus: proforma.advancePaymentStatus,
        status: proforma.status
      }
    });
  } catch (err) {
    next(err);
  }
};

// Convert to Sales Order
// Convert Proforma to Sales Order
exports.convertToSalesOrder = async (req, res, next) => {
  try {
    const { 
      CustomerProformaInvoice: ProformaModel,
      SalesOrder: SalesOrderModel
    } = await getAutoModels(req);
    
    const proforma = await ProformaModel.findById(req.params.id);
    if (!proforma) {
      return res.status(404).json({ success: false, error: "Proforma Invoice not found" });
    }
    
    if (proforma.status === "converted_to_order") {
      return res.status(400).json({ success: false, error: "Already converted to Sales Order" });
    }
    
    // ✅ Generate proper sales order number using your helper
    // You need to import or copy the generateSalesOrderNo function
    const salesOrderNo = await generateSalesOrderNo(req);
    
    const salesOrder = new SalesOrderModel({
      sourceProformaId: proforma._id,
      customerId: proforma.customerId,
      salesOrderNo: salesOrderNo,  // ✅ Use correct field name
      orderDate: new Date(),
      expectedDeliveryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days from now
      items: proforma.items.map(item => {
        // Convert to plain object and remove any mongoose-specific fields
        const itemObj = item.toObject ? item.toObject() : { ...item };
        return {
          productId: itemObj.productId,
          itemName: itemObj.itemName,
          hsnCode: itemObj.hsnCode || "",
          description: itemObj.description || "",
          lotNumber: itemObj.lotNumber || "",
          selectedSerialNos: itemObj.selectedSerialNos || [],
          selectedColor: itemObj.selectedColor || "",
          selectedSize: itemObj.selectedSize || "",
          qty: itemObj.qty,
          unit: itemObj.unit,
          unitPrice: itemObj.unitPrice,
          taxType: itemObj.taxType,
          taxRate: itemObj.taxRate,
          taxAmount: itemObj.taxAmount || 0,
          discountPct: itemObj.discountPct || 0,
          discountAmt: itemObj.discountAmt || 0,
          amount: itemObj.amount
        };
      }),
      billingAddress: proforma.billingAddress,
      shippingAddress: proforma.shippingAddress,
      subtotal: proforma.subtotal,
      totalTax: proforma.totalTax,
      totalDiscount: proforma.totalDiscount,
      additionalDiscount: proforma.additionalDiscount || { pct: 0, amt: 0 },
      additionalCharges: proforma.additionalCharges || 0,
      additionalChargesDetails: proforma.additionalChargesDetails || {
        shipping: 0, handling: 0, packing: 0, service: 0, other: 0
      },
      grandTotal: proforma.grandTotal,
      advanceAmount: proforma.advanceAmount || 0,
      advancePaid: proforma.advancePaid || 0,
      dueAmount: proforma.dueAmount || (proforma.grandTotal - (proforma.advancePaid || 0)),
      advancePaymentStatus: proforma.advancePaymentStatus || "pending",
      status: "draft",
      createdBy: req.user?._id,
    });
    
    await salesOrder.save();
    
    // Update proforma status
    proforma.status = "converted_to_order";
    proforma.convertedToSalesOrderId = salesOrder._id;
    await proforma.save();
    
    res.json({ 
      success: true, 
      message: "Successfully converted to Sales Order", 
      salesOrder 
    });
  } catch (err) {
    console.error("Convert to Sales Order error:", err);
    next(err);
  }
};

// Convert to Sales Invoice
exports.convertToSalesInvoice = async (req, res, next) => {
  try {
    const { 
      CustomerProformaInvoice: ProformaModel,
      CustomerInvoice: InvoiceModel,
      Product: ProductModel
    } = await getAutoModels(req);
    
    const proforma = await ProformaModel.findById(req.params.id);
    if (!proforma) {
      return res.status(404).json({ success: false, error: "Proforma Invoice not found" });
    }
    
    if (proforma.status === "converted_to_invoice") {
      return res.status(400).json({ success: false, error: "Already converted to Invoice" });
    }
    
    const date = new Date();
    const prefix = `INV${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
    const count = await InvoiceModel.countDocuments({ invoiceNo: { $regex: `^${prefix}` } });
    const invoiceNo = `${prefix}${String(count + 1).padStart(3, "0")}`;
    
    const invoice = new InvoiceModel({
      proformaInvoiceId: proforma._id,
      customerId: proforma.customerId,
      invoiceNo,
      invoiceDate: new Date(),
      dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      items: proforma.items.map(item => ({ ...item.toObject() })),
      billingAddress: proforma.billingAddress,
      shippingAddress: proforma.shippingAddress,
      bankDetails: proforma.bankDetails,
      subtotal: proforma.subtotal,
      totalTax: proforma.totalTax,
      totalDiscount: proforma.totalDiscount,
      additionalDiscount: proforma.additionalDiscount,
      additionalCharges: proforma.additionalCharges,
      additionalChargesDetails: proforma.additionalChargesDetails,
      grandTotal: proforma.grandTotal,
      paidAmount: proforma.advancePaid,
      dueAmount: proforma.grandTotal - proforma.advancePaid,
      taxSettings: proforma.taxSettings,
      status: proforma.advancePaid > 0 ? "partial" : "draft",
      createdBy: req.user?._id,
    });
    
    // Deduct stock
    for (const item of invoice.items) {
      if (item.productId) {
        await ProductModel.findByIdAndUpdate(item.productId, {
          $inc: { stockQuantity: -item.qty }
        });
      }
    }
    
    await invoice.save();
    
    proforma.status = "converted_to_invoice";
    proforma.convertedToInvoiceId = invoice._id;
    await proforma.save();
    
    res.json({ success: true, message: "Converted to Invoice", invoice });
  } catch (err) {
    next(err);
  }
};


// Update Proforma Status (for conversion from frontend)
exports.updateProformaStatus = async (req, res, next) => {
  try {
    const { CustomerProformaInvoice: ProformaModel } = await getAutoModels(req);
    const { status, convertedToInvoiceId } = req.body;
    
    const proforma = await ProformaModel.findById(req.params.id);
    if (!proforma) {
      return res.status(404).json({ success: false, error: "Proforma Invoice not found" });
    }
    
    // Don't allow status change if already converted
    if (proforma.status === "converted_to_invoice" || proforma.status === "converted_to_order") {
      return res.status(400).json({ success: false, error: "Proforma already converted" });
    }
    
    proforma.status = status;
    if (convertedToInvoiceId) {
      proforma.convertedToInvoiceId = convertedToInvoiceId;
    }
    
    await proforma.save();
    
    res.json({ success: true, message: "Proforma status updated", proforma });
  } catch (err) {
    next(err);
  }
};