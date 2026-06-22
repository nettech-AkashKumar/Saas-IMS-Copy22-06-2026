const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");
const cloudinary = require("../utils/cloudinary/cloudinary");
const mongoose = require("mongoose");

// Helper: Generate unique purchase order number
const generatePurchaseNo = async (req) => {
  try {
    const { Counter: CounterModel } = await getAutoModels(req);
    
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");
    
    // Use prefix matching your existing format: PO20260620001
    const counterKey = `PO${year}${month}${day}`;

    // Atomic increment - this prevents race conditions
    const counter = await CounterModel.findByIdAndUpdate(
      counterKey,
      { $inc: { seq: 1 } },
      { upsert: true, new: true }
    );

    // Generate 3-digit sequence
    const sequence = String(counter.seq).padStart(3, "0");
    return `${counterKey}${sequence}`;
  } catch (error) {
    console.error("Error generating purchase number:", error);
    // Fallback: use timestamp
    return `PO${Date.now()}`;
  }
};

// Helper: Parse FormData nested objects
const parseFormDataNested = (body) => {
  const parsed = { ...body };

  // Parse additionalDiscount
  if (body["additionalDiscount[pct]"] !== undefined || body["additionalDiscount[amt]"] !== undefined) {
    parsed.additionalDiscount = {
      pct: parseFloat(body["additionalDiscount[pct]"]) || 0,
      amt: parseFloat(body["additionalDiscount[amt]"]) || 0,
    };
  }

  // Parse additionalChargesDetails - FIX: Handle nested object properly
  const chargeFields = ["shipping", "handling", "packing", "service", "other"];
  parsed.additionalChargesDetails = {};
  
  // Check if additionalChargesDetails is sent as a JSON string
  if (body.additionalChargesDetails && typeof body.additionalChargesDetails === 'string') {
    try {
      const parsedDetails = JSON.parse(body.additionalChargesDetails);
      chargeFields.forEach(field => {
        parsed.additionalChargesDetails[field] = parseFloat(parsedDetails[field]) || 0;
      });
    } catch (e) {
      // If JSON parsing fails, try to get individual fields
      chargeFields.forEach(field => {
        const key = `additionalChargesDetails[${field}]`;
        parsed.additionalChargesDetails[field] = parseFloat(body[key]) || 0;
      });
    }
  } else if (body.additionalChargesDetails && typeof body.additionalChargesDetails === 'object') {
    // If it's already an object
    chargeFields.forEach(field => {
      parsed.additionalChargesDetails[field] = parseFloat(body.additionalChargesDetails[field]) || 0;
    });
  } else {
    // Try to get individual fields from FormData
    chargeFields.forEach(field => {
      const key = `additionalChargesDetails[${field}]`;
      parsed.additionalChargesDetails[field] = parseFloat(body[key]) || 0;
    });
  }

  // Parse additionalCharges directly
  parsed.additionalCharges = parseFloat(body.additionalCharges) || 0;

  // Parse paidAmount
  parsed.paidAmount = parseFloat(body.paidAmount) || 0;

  // Parse fullyReceived
  parsed.fullyReceived = body.fullyReceived === "true" || body.fullyReceived === true;

  // Parse items
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
        try {
          items[index][field] = JSON.parse(body[key]);
        } catch {
          items[index][field] = body[key].split(",").map(s => s.trim()).filter(s => s);
        }
      } else {
        items[index][field] = body[key];
      }
    }
  });

  if (items.length > 0) {
    parsed.items = items.filter(item => item !== undefined);
  }
  
  return parsed;
};

// Create Purchase Order
exports.createPurchaseOrder = async (req, res, next) => {
  try {
    const { PurchaseOrder: PurchaseOrderModel, Supplier: SupplierModel, Product: ProductModel, Counter: CounterModel } = await getAutoModels(req);

    const parsedBody = parseFormDataNested(req.body);

    let {
      supplierId,
      purchaseDate,
      referenceNo,
      receiptDate,
      items = [],
      billingAddress,
      shippingAddress,
      subtotal,
      totalTax,
      totalDiscount,
      additionalDiscount = { pct: 0, amt: 0 },
      additionalChargesDetails = { shipping: 0, handling: 0, packing: 0, service: 0, other: 0 },
       additionalCharges = 0,
      autoRoundOff = false,
      grandTotal,
      paidAmount = 0,
      fullyReceived = false,
      notes = "",
      termsAndConditions = "",
    } = parsedBody;

    // Validation
    if (!supplierId) {
      return res.status(400).json({ success: false, error: "Supplier ID is required" });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: "At least one item is required" });
    }

    // Validate supplier
    const supplier = await SupplierModel.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({ success: false, error: "Supplier not found" });
    }

    // Validate products
    const validatedItems = [];
    for (const item of items) {
      if (!item.productId) {
        return res.status(400).json({ success: false, error: "Product ID is required for all items" });
      }

      const product = await ProductModel.findById(item.productId);
      if (!product) {
        return res.status(404).json({ success: false, error: `Product not found: ${item.productId}` });
      }

      validatedItems.push({
        productId: item.productId,
        itemName: item.itemName || product.productName,
        hsnCode: item.hsnCode || product.hsnCode || "",
        description: item.description || product.description || "",
        lotNumber: item.lotNumber || "",
        selectedSerialNos: item.selectedSerialNos || [],
        selectedColor: item.selectedColor || "",
        selectedSize: item.selectedSize || "",
        qty: parseFloat(item.qty) || 1,
        unit: item.unit || product.unit || "Piece",
        unitPrice: parseFloat(item.unitPrice) || product.purchasePrice || 0,
        taxType: item.taxType || product.tax || "GST 0%",
        taxRate: parseFloat(item.taxRate) || 0,
        taxAmount: parseFloat(item.taxAmount) || 0,
        discountPct: parseFloat(item.discountPct) || 0,
        discountAmt: parseFloat(item.discountAmt) || 0,
        amount: parseFloat(item.amount) || 0,
        previousReceivedQty: 0,
      });
    }

    // Generate purchase number
    const purchaseNo = await generatePurchaseNo(req);

    // Handle attachments
    const attachments = [];
    if (req.body.existingAttachments) {
      try {
        const existingAtts = JSON.parse(req.body.existingAttachments);
        attachments.push(...existingAtts);
      } catch (e) { }
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "purchase_order_attachments",
            resource_type: "auto",
          });
          attachments.push({
            url: result.secure_url,
            public_id: result.public_id,
            filename: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
            uploadedAt: new Date(),
          });
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
        }
      }
    }

    // Calculate additional charges total
    const additionalChargesTotal = additionalCharges || Object.values(additionalChargesDetails).reduce((sum, v) => sum + (v || 0), 0);
    // Create purchase order
    const purchaseOrder = new PurchaseOrderModel({
      purchaseNo,
      supplierId,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
      referenceNo: referenceNo || "",
      receiptDate: receiptDate ? new Date(receiptDate) : null,
      items: validatedItems,
      billingAddress: billingAddress || supplier.address || "",
      shippingAddress: shippingAddress || billingAddress || supplier.address || "",
      subtotal: parseFloat(subtotal) || 0,
      totalTax: parseFloat(totalTax) || 0,
      totalDiscount: parseFloat(totalDiscount) || 0,
      additionalDiscount: additionalDiscount,
      additionalCharges: additionalChargesTotal,
      additionalChargesDetails: additionalChargesDetails,
      autoRoundOff: autoRoundOff === true || autoRoundOff === "true",
      grandTotal: parseFloat(grandTotal) || 0,
      paidAmount: parseFloat(paidAmount) || 0,  // USE THIS
      fullyReceived: fullyReceived === true || fullyReceived === "true",
      status: "pending",
      notes,
      termsAndConditions,
      attachments,
      createdBy: req.user?._id,
    });

    await purchaseOrder.save();

    // Populate and return
    const populatedOrder = await PurchaseOrderModel.findById(purchaseOrder._id)
      .populate("supplierId", "supplierName phone email address gstin")
      .populate("items.productId", "productName hsnCode unit purchasePrice tax images");

    res.status(201).json({
      success: true,
      message: "Purchase order created successfully",
      purchaseOrder: populatedOrder,
    });

  } catch (err) {
    console.error("Create purchase order error:", err);
    if (err.code === 11000) {
      return res.status(400).json({ success: false, error: "Purchase number already exists" });
    }
    next(err);
  }
};

// Get all purchase orders
exports.getAllPurchaseOrders = async (req, res, next) => {
  try {
    const { PurchaseOrder: PurchaseOrderModel, Supplier: SupplierModel } = await getAutoModels(req);

    const { status, search, page = 1, limit = 20,  startDate, endDate  } = req.query;

    const filter = { isDeleted: false };
    if (status && status !== "all") filter.status = status;

     if (startDate || endDate) {
      filter.purchaseDate = {};
      
      if (startDate) {
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        filter.purchaseDate.$gte = start;
      }
      
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.purchaseDate.$lte = end;
      }
    }
    
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    let query = PurchaseOrderModel.find(filter)
      .populate("supplierId", "supplierName phone email")
      .populate("items.productId", "productName unit")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    if (search) {
      const supplierIds = await SupplierModel.find({
        supplierName: { $regex: search, $options: "i" }
      }).distinct("_id");

      query = PurchaseOrderModel.find({
        ...filter,
        $or: [
          { purchaseNo: { $regex: search, $options: "i" } },
          { supplierId: { $in: supplierIds } },
        ],
      })
        .populate("supplierId", "supplierName phone email")
        .populate("items.productId", "productName unit")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
    }

    const purchaseOrders = await query;
    const total = await PurchaseOrderModel.countDocuments(filter);

    res.json({
      success: true,
      purchaseOrders,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (err) {
    next(err);
  }
};

// Get single purchase order
exports.getPurchaseOrderById = async (req, res, next) => {
  try {
    const { PurchaseOrder: PurchaseOrderModel } = await getAutoModels(req);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid purchase order ID format" });
    }

    const purchaseOrder = await PurchaseOrderModel.findById(req.params.id)
      .populate("supplierId", "supplierName phone email address city state country pincode gstin")
      .populate("items.productId", "productName images hsnCode unit purchasePrice tax");

    if (!purchaseOrder || purchaseOrder.isDeleted) {
      return res.status(404).json({ success: false, error: "Purchase order not found" });
    }

    res.json({ success: true, purchaseOrder });
  } catch (err) {
    next(err);
  }
};

// Update purchase order
exports.updatePurchaseOrder = async (req, res, next) => {
  try {
    const { PurchaseOrder: PurchaseOrderModel } = await getAutoModels(req);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid purchase order ID format" });
    }

    const purchaseOrder = await PurchaseOrderModel.findById(req.params.id);
    if (!purchaseOrder || purchaseOrder.isDeleted) {
      return res.status(404).json({ success: false, error: "Purchase order not found" });
    }

    // Prevent editing of approved/cancelled orders
    if (purchaseOrder.status === "approved" || purchaseOrder.status === "cancelled") {
      return res.status(400).json({ success: false, error: "Cannot edit approved or cancelled purchase orders" });
    }

    const parsedBody = parseFormDataNested(req.body);

    // Update fields
    const updatableFields = ["referenceNo", "receiptDate", "billingAddress", "shippingAddress", "notes", "termsAndConditions"];
    updatableFields.forEach(field => {
      if (parsedBody[field] !== undefined) {
        purchaseOrder[field] = parsedBody[field];
      }
    });

    // Update items if provided
    if (parsedBody.items && parsedBody.items.length > 0) {
      purchaseOrder.items = parsedBody.items.map(item => ({
        ...item,
        qty: parseFloat(item.qty),
        unitPrice: parseFloat(item.unitPrice),
        taxRate: parseFloat(item.taxRate),
        taxAmount: parseFloat(item.taxAmount),
        discountPct: parseFloat(item.discountPct),
        discountAmt: parseFloat(item.discountAmt),
        amount: parseFloat(item.amount),
      }));

      // Recalculate totals
      purchaseOrder.subtotal = purchaseOrder.items.reduce((sum, i) => sum + (i.qty * i.unitPrice), 0);
      purchaseOrder.totalTax = purchaseOrder.items.reduce((sum, i) => sum + (i.taxAmount || 0), 0);
      purchaseOrder.totalDiscount = purchaseOrder.items.reduce((sum, i) => sum + (i.discountAmt || 0), 0);

      const additionalChargesTotal = Object.values(purchaseOrder.additionalChargesDetails).reduce((sum, v) => sum + (v || 0), 0);
      const additionalDiscountValue = (purchaseOrder.additionalDiscount?.amt || 0) + ((purchaseOrder.subtotal * (purchaseOrder.additionalDiscount?.pct || 0)) / 100);

      let grandTotal = purchaseOrder.subtotal + purchaseOrder.totalTax + additionalChargesTotal - (purchaseOrder.totalDiscount + additionalDiscountValue);
      purchaseOrder.grandTotal = Math.max(0, grandTotal);
    }

    // Handle attachments
    if (req.body.existingAttachments) {
      try {
        const existingList = JSON.parse(req.body.existingAttachments);
        purchaseOrder.attachments = purchaseOrder.attachments.filter(att =>
          existingList.some(existing => existing.public_id === att.public_id)
        );
      } catch (e) { }
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "purchase_order_attachments",
          });
          purchaseOrder.attachments.push({
            url: result.secure_url,
            public_id: result.public_id,
            filename: file.originalname,
            fileType: file.mimetype,
            uploadedAt: new Date(),
          });
        } catch (err) {
          console.error("Upload error:", err);
        }
      }
    }

    await purchaseOrder.save();

    res.json({ success: true, message: "Purchase order updated successfully", purchaseOrder });
  } catch (err) {
    next(err);
  }
};

// Cancel purchase order
exports.cancelPurchaseOrder = async (req, res, next) => {
  try {
    const { PurchaseOrder: PurchaseOrderModel } = await getAutoModels(req);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid purchase order ID format" });
    }

    const purchaseOrder = await PurchaseOrderModel.findById(req.params.id);
    if (!purchaseOrder || purchaseOrder.isDeleted) {
      return res.status(404).json({ success: false, error: "Purchase order not found" });
    }

    if (purchaseOrder.status === "approved") {
      return res.status(400).json({ success: false, error: "Cannot cancel an approved purchase order" });
    }

    purchaseOrder.status = "cancelled";
    await purchaseOrder.save();

    res.json({ success: true, message: "Purchase order cancelled successfully" });
  } catch (err) {
    next(err);
  }
};

// Delete purchase order (soft delete)
exports.deletePurchaseOrder = async (req, res, next) => {
  try {
    const { PurchaseOrder: PurchaseOrderModel } = await getAutoModels(req);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid purchase order ID format" });
    }

    const purchaseOrder = await PurchaseOrderModel.findById(req.params.id);
    if (!purchaseOrder) {
      return res.status(404).json({ success: false, error: "Purchase order not found" });
    }

    purchaseOrder.isDeleted = true;
    await purchaseOrder.save();

    res.json({ success: true, message: "Purchase order deleted successfully" });
  } catch (err) {
    next(err);
  }
};

// Get purchase order counts by status

exports.getPurchaseOrderCounts = async (req, res, next) => {
  try {
    const { PurchaseOrder: PurchaseOrderModel } = await getAutoModels(req);

    // Check if model exists
    if (!PurchaseOrderModel) {
      console.warn("PurchaseOrderModel not found");
      return res.status(200).json({ 
        success: true, 
        counts: { all: 0, pending: 0, approved: 0, cancelled: 0, partial_received: 0 } 
      });
    }

    // Try to get counts - use a simpler approach that won't fail
    try {
      const counts = await PurchaseOrderModel.aggregate([
        { $match: { isDeleted: { $ne: true } } },
        { $group: { _id: "$status", count: { $sum: 1 } } }
      ]);

      const statusCounts = { 
        all: 0, 
        pending: 0, 
        approved: 0, 
        cancelled: 0, 
        partial_received: 0 
      };
      
      counts.forEach(item => {
        const status = item._id || "unknown";
        statusCounts.all += item.count;
        
        if (status === "pending") {
          statusCounts.pending = item.count;
        } else if (status === "approved") {
          statusCounts.approved = item.count;
        } else if (status === "cancelled") {
          statusCounts.cancelled = item.count;
        } else if (status === "partial_received") {
          statusCounts.partial_received = item.count;
        }
      });

      return res.json({ 
        success: true, 
        counts: statusCounts 
      });
    } catch (aggError) {
      console.error("Aggregation error:", aggError);
      // Fallback: get counts using separate queries
      const total = await PurchaseOrderModel.countDocuments({ isDeleted: { $ne: true } });
      const pending = await PurchaseOrderModel.countDocuments({ status: "pending", isDeleted: { $ne: true } });
      const approved = await PurchaseOrderModel.countDocuments({ status: "approved", isDeleted: { $ne: true } });
      const cancelled = await PurchaseOrderModel.countDocuments({ status: "cancelled", isDeleted: { $ne: true } });
      const partialReceived = await PurchaseOrderModel.countDocuments({ status: "partial_received", isDeleted: { $ne: true } });
      
      return res.json({
        success: true,
        counts: {
          all: total,
          pending: pending,
          approved: approved,
          cancelled: cancelled,
          partial_received: partialReceived
        }
      });
    }
  } catch (err) {
    console.error("Get purchase order counts error:", err);
    // Return default counts instead of error
    return res.status(200).json({ 
      success: true, 
      counts: { all: 0, pending: 0, approved: 0, cancelled: 0, partial_received: 0 },
      message: "Returned default counts due to error"
    });
  }
};

// Generate purchase number (for frontend)
exports.generatePurchaseNumber = async (req, res, next) => {
  try {
    const { PurchaseOrder: PurchaseOrderModel } = await getAutoModels(req);
    const purchaseNo = await generatePurchaseNo(req);
    res.json({ success: true, purchaseNo });
  } catch (err) {
    next(err);
  }
};