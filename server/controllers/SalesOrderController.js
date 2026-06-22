// controllers/SalesOrderController.js
const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");
const mongoose = require("mongoose");
const cloudinary = require("../utils/cloudinary/cloudinary");

const parseFormDataNested = (body) => {
  const parsed = { ...body };

  // Parse additionalDiscount
  if (body["additionalDiscount[pct]"] !== undefined || body["additionalDiscount[amt]"] !== undefined) {
    parsed.additionalDiscount = {
      pct: parseFloat(body["additionalDiscount[pct]"]) || 0,
      amt: parseFloat(body["additionalDiscount[amt]"]) || 0,
    };
    delete parsed["additionalDiscount[pct]"];
    delete parsed["additionalDiscount[amt]"];
  }

  // Parse additionalChargesDetails
  if (
    body["additionalChargesDetails[shipping]"] !== undefined ||
    body["additionalChargesDetails[handling]"] !== undefined ||
    body["additionalChargesDetails[packing]"] !== undefined ||
    body["additionalChargesDetails[service]"] !== undefined ||
    body["additionalChargesDetails[other]"] !== undefined
  ) {
    parsed.additionalChargesDetails = parsed.additionalChargesDetails || {};
    
    if (body["additionalChargesDetails[shipping]"] !== undefined) {
      const shippingValue = body["additionalChargesDetails[shipping]"];
      parsed.additionalChargesDetails.shipping = Array.isArray(shippingValue) ? parseFloat(shippingValue[0]) || 0 : parseFloat(shippingValue) || 0;
    }
    if (body["additionalChargesDetails[handling]"] !== undefined) {
      const handlingValue = body["additionalChargesDetails[handling]"];
      parsed.additionalChargesDetails.handling = Array.isArray(handlingValue) ? parseFloat(handlingValue[0]) || 0 : parseFloat(handlingValue) || 0;
    }
    if (body["additionalChargesDetails[packing]"] !== undefined) {
      const packingValue = body["additionalChargesDetails[packing]"];
      parsed.additionalChargesDetails.packing = Array.isArray(packingValue) ? parseFloat(packingValue[0]) || 0 : parseFloat(packingValue) || 0;
    }
    if (body["additionalChargesDetails[service]"] !== undefined) {
      const serviceValue = body["additionalChargesDetails[service]"];
      parsed.additionalChargesDetails.service = Array.isArray(serviceValue) ? parseFloat(serviceValue[0]) || 0 : parseFloat(serviceValue) || 0;
    }
    if (body["additionalChargesDetails[other]"] !== undefined) {
      const otherValue = body["additionalChargesDetails[other]"];
      parsed.additionalChargesDetails.other = Array.isArray(otherValue) ? parseFloat(otherValue[0]) || 0 : parseFloat(otherValue) || 0;
    }
    
    Object.keys(body).forEach(key => {
      if (key.startsWith("additionalChargesDetails[")) {
        delete parsed[key];
      }
    });
  }

  // Parse tax settings
  if (body["taxSettings[enableGSTBilling]"] !== undefined) {
    parsed.taxSettings = parsed.taxSettings || {};
    parsed.taxSettings.enableGSTBilling = body["taxSettings[enableGSTBilling]"] !== "false";
  }
  if (body["taxSettings[priceIncludeGST]"] !== undefined) {
    parsed.taxSettings = parsed.taxSettings || {};
    parsed.taxSettings.priceIncludeGST = body["taxSettings[priceIncludeGST]"] !== "false";
  }
  if (body["taxSettings[autoRoundOff]"] !== undefined) {
    parsed.taxSettings = parsed.taxSettings || {};
    parsed.taxSettings.autoRoundOff = body["taxSettings[autoRoundOff]"];
  }
  if (body["taxSettings[defaultGSTRate]"] !== undefined) {
    parsed.taxSettings = parsed.taxSettings || {};
    parsed.taxSettings.defaultGSTRate = body["taxSettings[defaultGSTRate]"];
  }

  // Parse items array from FormData bracket notation
  const items = [];
  const itemRegex = /items\[(\d+)\]\[(\w+)\]/;

  Object.keys(body).forEach((key) => {
    const match = key.match(itemRegex);
    if (match) {
      const index = parseInt(match[1]);
      const field = match[2];

      if (!items[index]) {
        items[index] = {};
      }

      const numericFields = ["qty", "unitPrice", "taxRate", "taxAmount", "discountPct", "discountAmt", "amount"];
      if (numericFields.includes(field)) {
        items[index][field] = parseFloat(body[key]) || 0;
      } else if (field === "selectedSerialNos") {
        try {
          const serialNosValue = body[key];
          if (typeof serialNosValue === "string") {
            const trimmed = serialNosValue.trim();
            if (trimmed === "[]" || trimmed === "") {
              items[index][field] = [];
            } else if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
              const parsedSerial = JSON.parse(trimmed);
              items[index][field] = Array.isArray(parsedSerial) ? parsedSerial : [];
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

      delete parsed[key];
    }
  });

  if (items.length > 0) {
    parsed.items = items.filter((item) => item !== undefined);
  }

  return parsed;
};

// Helper: Generate Sales Order Number
const generateSalesOrderNo = async (req) => {
  const { Counter: CounterModel } = await getAutoModels(req);
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const counterKey = `ORD${year}${month}`;
  
  const counter = await CounterModel.findByIdAndUpdate(
    counterKey,
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  
  const sequence = String(counter.seq).padStart(3, "0");
  return `${counterKey}${sequence}`;
};

// Helper: Generate Invoice Number (for conversion)
const generateInvoiceNo = async (req) => {
  const { Counter: CounterModel } = await getAutoModels(req);
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const counterKey = `INV${year}${month}`;
  
  const counter = await CounterModel.findByIdAndUpdate(
    counterKey,
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );
  
  const sequence = String(counter.seq).padStart(3, "0");
  return `${counterKey}${sequence}`;
};

// Create Sales Order
exports.createSalesOrder = async (req, res, next) => {
  try {
    const { SalesOrder: SalesOrderModel, Quotation: QuotationModel, Customer: CustomerModel } = await getAutoModels(req);
    let salesOrderData = req.body;
    if(req.files && req.files.length > 0) {
      salesOrderData = parseFormDataNested(req.body)
    }
    const {
      customerId,
      orderDate,
      expectedDeliveryDate,
      items,
      billingAddress,
      shippingAddress,
      subtotal,
      totalTax,
      totalDiscount,
      additionalDiscount,
      additionalCharges,
      additionalChargesDetails,
      grandTotal,
      paymentTerms,
      notes,
      termsAndConditions,
      sourceQuotationId,
       sourceProformaId,      // ← ADD THIS
      advanceAmount,          // ← ADD THIS
      advancePaid,            // ← ADD THIS
      dueAmount,      
    } = salesOrderData;

    // Validate customer exists
    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found"
      });
    }

    // Validate items
    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one item is required"
      });
    }

        let existingAttachments = [];
    if (salesOrderData.existingAttachments) {
      try {
        existingAttachments = typeof salesOrderData.existingAttachments === 'string'
          ? JSON.parse(salesOrderData.existingAttachments)
          : salesOrderData.existingAttachments;
      } catch (e) {
        existingAttachments = [];
      }
    }

        // Handle file uploads
      const attachments = [...existingAttachments];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "sales_order_attachments",
            resource_type: "auto",
          });
          attachments.push({
            url: result.secure_url,
            public_id: result.public_id,
            filename: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
          });
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
        }
      }
    }

    // Generate Sales Order Number
    const salesOrderNo = await generateSalesOrderNo(req);
    
    const salesOrder = new SalesOrderModel({
      salesOrderNo,
      customerId,
      orderDate: orderDate || new Date(),
      expectedDeliveryDate,
      items,
      billingAddress: billingAddress || customer.address || "",
      shippingAddress: shippingAddress || billingAddress || customer.address || "",
      subtotal,
      totalTax,
      totalDiscount,
      additionalDiscount,
      additionalCharges,
      additionalChargesDetails,
      grandTotal,
      status: "draft",
      paymentTerms,
      notes,
      termsAndConditions,
      sourceQuotationId: sourceQuotationId || null,
      sourceProformaId: sourceProformaId || null,  // ← ADD THIS
      advanceAmount: advanceAmount || 0,            // ← ADD THIS
      advancePaid: advancePaid || 0,                // ← ADD THIS
      dueAmount: dueAmount || 0, 
      attachments: attachments,
      createdBy: req.user?._id
    });
    
    await salesOrder.save();
    
    // Update quotation status if converted
    if (sourceQuotationId && QuotationModel) {
      await QuotationModel.findByIdAndUpdate(sourceQuotationId, {
        $set: { status: "converted_to_sales_order" }
      });
    }
    if (sourceProformaId) {
      const { CustomerProformaInvoice: ProformaModel } = await getAutoModels(req);
      if (ProformaModel) {
        await ProformaModel.findByIdAndUpdate(sourceProformaId, {
          $set: { status: "converted_to_order", convertedToSalesOrderId: salesOrder._id }
        });
      }
    }
    
    res.status(201).json({
      success: true,
      message: "Sales Order created successfully",
      salesOrder
    });
    
  } catch (error) {
    console.error("Create Sales Order error:", error);
    next(error);
  }
};

// Get All Sales Orders
exports.getAllSalesOrders = async (req, res, next) => {
  try {
    const { SalesOrder: SalesOrderModel, Customer: CustomerModel } = await getAutoModels(req);
    const {
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const filter = {};

    // Filter by status
    if (status) {
      filter.status = status;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.orderDate = {};
      if (startDate) {
        const start = new Date(startDate);
        if (!isNaN(start.getTime())) {
          filter.orderDate.$gte = start;
        }
      }
      if (endDate) {
        const end = new Date(endDate);
        if (!isNaN(end.getTime())) {
          filter.orderDate.$lte = end;
        }
      }
    }

    // Search filter
     let customerIds = [];
    if (search) {
       // First, find customers matching the search term
      const matchingCustomers = await CustomerModel.find({
        name: { $regex: search, $options: "i" }
      }).select("_id");
      
      customerIds = matchingCustomers.map(c => c._id);
      filter.$or = [
        { salesOrderNo: { $regex: search, $options: "i" } },
      ];
       if (customerIds.length > 0) {
        filter.$or.push({ customerId: { $in: customerIds } });
      }
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    let query = SalesOrderModel.find(filter)
      .populate("customerId", "name phone email")
      .populate("createdBy", "firstName lastName")
      .populate("sourceQuotationId", "quotationNo")
      .populate("convertedToInvoiceId", "invoiceNo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const salesOrders = await query;
    const total = await SalesOrderModel.countDocuments(filter);

    res.json({
      success: true,
      count: salesOrders.length,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1
      },
      salesOrders
    });
    
  } catch (error) {
    console.error("Get sales orders error:", error);
    next(error);
  }
};

// Get Sales Order By ID
exports.getSalesOrderById = async (req, res, next) => {
  try {
    const { SalesOrder: SalesOrderModel } = await getAutoModels(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid sales order ID format"
      });
    }

    const salesOrder = await SalesOrderModel.findById(id)
      .populate("customerId", "name phone email address city state country pincode gstin")
      .populate("createdBy", "firstName lastName email")
      .populate("sourceQuotationId", "quotationNo")
      .populate("convertedToInvoiceId", "invoiceNo");

    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        error: "Sales Order not found"
      });
    }

    res.json({
      success: true,
      salesOrder
    });
    
  } catch (error) {
    console.error("Get sales order error:", error);
    next(error);
  }
};

// Update Sales Order
// exports.updateSalesOrder = async (req, res, next) => {
//   try {
//     const { SalesOrder: SalesOrderModel } = await getAutoModels(req);
//     const { id } = req.params;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid sales order ID format"
//       });
//     }

//     const salesOrder = await SalesOrderModel.findById(id);
//     if (!salesOrder) {
//       return res.status(404).json({
//         success: false,
//         error: "Sales Order not found"
//       });
//     }

//     // Don't allow update if already converted to invoice
//     if (salesOrder.status === "converted_to_invoice") {
//       return res.status(400).json({
//         success: false,
//         error: "Cannot update sales order that has been converted to invoice"
//       });
//     }

//     const updateData = { ...req.body };
//     delete updateData._id;
//     delete updateData.salesOrderNo;
//     delete updateData.createdAt;
//     delete updateData.updatedAt;

//     const updatedSalesOrder = await SalesOrderModel.findByIdAndUpdate(
//       id,
//       { $set: updateData },
//       { new: true, runValidators: true }
//     );

//     res.json({
//       success: true,
//       message: "Sales Order updated successfully",
//       salesOrder: updatedSalesOrder
//     });
    
//   } catch (error) {
//     console.error("Update sales order error:", error);
//     next(error);
//   }
// };

exports.updateSalesOrder = async (req, res, next) => {
  try {
    const { SalesOrder: SalesOrderModel } = await getAutoModels(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid sales order ID format"
      });
    }

    const salesOrder = await SalesOrderModel.findById(id);
    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        error: "Sales Order not found"
      });
    }

    // Don't allow update if already converted to invoice
    if (salesOrder.status === "converted_to_invoice") {
      return res.status(400).json({
        success: false,
        error: "Cannot update sales order that has been converted to invoice"
      });
    }

    // Parse FormData if needed
    let updateData = req.body;
    if (req.files && req.files.length > 0) {
      updateData = parseFormDataNested(req.body);
    }

    // Handle existing attachments to keep
    let keptAttachments = [...salesOrder.attachments];
    
    if (updateData.existingAttachments !== undefined) {
      try {
        const existingList = typeof updateData.existingAttachments === 'string'
          ? JSON.parse(updateData.existingAttachments)
          : updateData.existingAttachments;

        keptAttachments = salesOrder.attachments.filter(att =>
          existingList.some(existing => existing.public_id === att.public_id)
        );

        // Delete removed attachments from Cloudinary
        const removedAttachments = salesOrder.attachments.filter(att =>
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
        keptAttachments = [...salesOrder.attachments];
      }
    }

    // Upload new files
    const newAttachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "sales_order_attachments",
            resource_type: "auto",
          });
          newAttachments.push({
            url: result.secure_url,
            public_id: result.public_id,
            filename: file.originalname,
            fileType: file.mimetype,
            fileSize: file.size,
          });
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
        }
      }
    }

    // Clean updateData before applying
    delete updateData.attachments;
    delete updateData.attachmentsToDelete;
    delete updateData.existingAttachments;
    delete updateData._id;
    delete updateData.salesOrderNo;
    delete updateData.createdAt;
    delete updateData.updatedAt;

    // Apply updates
    Object.assign(salesOrder, updateData);
    
    // Set final attachments
    salesOrder.attachments = [...keptAttachments, ...newAttachments];

    const updatedSalesOrder = await salesOrder.save();

    res.json({
      success: true,
      message: "Sales Order updated successfully",
      salesOrder: updatedSalesOrder
    });
    
  } catch (error) {
    console.error("Update sales order error:", error);
    next(error);
  }
};

// Delete Sales Order
exports.deleteSalesOrder = async (req, res, next) => {
  try {
    const { SalesOrder: SalesOrderModel } = await getAutoModels(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid sales order ID format"
      });
    }

    const salesOrder = await SalesOrderModel.findById(id);
    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        error: "Sales Order not found"
      });
    }

    // Don't allow delete if already converted to invoice
    if (salesOrder.status === "converted_to_invoice") {
      return res.status(400).json({
        success: false,
        error: "Cannot delete sales order that has been converted to invoice"
      });
    }

    await SalesOrderModel.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Sales Order deleted successfully"
    });
    
  } catch (error) {
    console.error("Delete sales order error:", error);
    next(error);
  }
};

// Convert Sales Order to Invoice
exports.convertToInvoice = async (req, res, next) => {
  try {
    const { SalesOrder: SalesOrderModel, CustomerInvoice: InvoiceModel } = await getAutoModels(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid sales order ID format"
      });
    }

    const salesOrder = await SalesOrderModel.findById(id);
    if (!salesOrder) {
      return res.status(404).json({ 
        success: false, 
        error: "Sales Order not found" 
      });
    }

    // Check if already converted
    if (salesOrder.status === "converted_to_invoice") {
      return res.status(400).json({
        success: false,
        error: "Sales Order has already been converted to Invoice"
      });
    }

    // Generate Invoice Number
    const invoiceNo = await generateInvoiceNo(req);
     // ========== CALCULATE PAYMENT AMOUNTS ==========
    // Get advance paid from sales order (which came from proforma)
    const advancePaid = salesOrder.advancePaid || 0;
    const grandTotal = salesOrder.grandTotal || 0;
    
    // Calculate due amount
    const dueAmount = Math.max(0, grandTotal - advancePaid);
    
    // Determine status based on payment
    let invoiceStatus = "draft";
    if (advancePaid >= grandTotal && grandTotal > 0) {
      invoiceStatus = "paid";
    } else if (advancePaid > 0) {
      invoiceStatus = "partial";
    }
    // ===============================================
    
    // Create Invoice from Sales Order
    const invoice = new InvoiceModel({
      customerId: salesOrder.customerId,
      invoiceNo,
      invoiceDate: new Date(),
      dueDate: new Date(new Date().setDate(new Date().getDate() + 7)),
      items: salesOrder.items,
      billingAddress: salesOrder.billingAddress,
      shippingAddress: salesOrder.shippingAddress,
      subtotal: salesOrder.subtotal,
      totalTax: salesOrder.totalTax,
      totalDiscount: salesOrder.totalDiscount,
      additionalDiscount: salesOrder.additionalDiscount,
      additionalCharges: salesOrder.additionalCharges,
      additionalChargesDetails: salesOrder.additionalChargesDetails,
      grandTotal: grandTotal,
      // ========== ADD THESE LINES ==========
      paidAmount: advancePaid,  // Set paid amount from advance
      dueAmount: dueAmount,      // Set due amount
      advanceAmount: salesOrder.advanceAmount || 0,
      fullyReceived: advancePaid >= grandTotal,
      // ====================================
      status: invoiceStatus,
      type: "invoice",
      notes: `Converted from Sales Order ${salesOrder.salesOrderNo}`,
      createdBy: req.user?._id
    });
    
    await invoice.save();
    
    // Update Sales Order status
    salesOrder.status = "converted_to_invoice";
    salesOrder.convertedToInvoiceId = invoice._id;
    await salesOrder.save();
    
    res.json({
      success: true,
      message: "Successfully converted to Invoice",
      invoice
    });
    
  } catch (error) {
    console.error("Convert to Invoice error:", error);
    next(error);
  }
};

// Update Sales Order Status (for conversion tracking)
exports.updateSalesOrderStatus = async (req, res, next) => {
  try {
    const { SalesOrder: SalesOrderModel } = await getAutoModels(req);
    const { id } = req.params;
    const { status } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid sales order ID format"
      });
    }

    const salesOrder = await SalesOrderModel.findById(id);
    if (!salesOrder) {
      return res.status(404).json({
        success: false,
        error: "Sales Order not found"
      });
    }

    salesOrder.status = status;
    await salesOrder.save();

    res.json({
      success: true,
      message: "Sales Order status updated successfully",
      salesOrder
    });
  } catch (error) {
    console.error("Update sales order status error:", error);
    next(error);
  }
};