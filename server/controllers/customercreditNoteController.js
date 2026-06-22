const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");
const mongoose = require("mongoose");

// Helper: Parse FormData (for consistency with invoice)
const parseFormDataNested = (body) => {
  const parsed = { ...body };
  if (body['taxSettings[autoRoundOff]'] !== undefined) {
    parsed.taxSettings = parsed.taxSettings || {};
    parsed.taxSettings.autoRoundOff = body['taxSettings[autoRoundOff]'];
  }
  if (body['taxSettings[enableGSTBilling]'] !== undefined) {
    parsed.taxSettings = parsed.taxSettings || {};
    parsed.taxSettings.enableGSTBilling = body['taxSettings[enableGSTBilling]'] !== "false";
  }
  if (body['taxSettings[priceIncludeGST]'] !== undefined) {
    parsed.taxSettings = parsed.taxSettings || {};
    parsed.taxSettings.priceIncludeGST = body['taxSettings[priceIncludeGST]'] !== "false";
  }
  if (body['taxSettings[defaultGSTRate]'] !== undefined) {
    parsed.taxSettings = parsed.taxSettings || {};
    parsed.taxSettings.defaultGSTRate = body['taxSettings[defaultGSTRate]'];
  }
  return parsed;
};

const generateCreditNoteNumber = async (CreditNoteModel) => {
  try {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const prefix = `CN${year}${month}`;
    const count = await CreditNoteModel.countDocuments({
      creditNoteNumber: { $regex: `^${prefix}` }
    });
    const sequence = String(count + 1).padStart(3, "0");
    return `${prefix}${sequence}`;
  } catch (error) {
    console.error("Error generating credit note number:", error);
    const year = new Date().getFullYear().toString().slice(-2);
    return `CN-${year}-${Date.now().toString().slice(-6)}`;
  }
};

// Create new credit note - UPDATED
exports.createCreditNote = async (req, res, next) => {
  try {
    const {Customer: CustomerModel, CustomerCreditNote: CreditNoteModel, CustomerInvoice: InvoiceModel, Product: ProductModel} = await getAutoModels(req);
    let creditNoteData = req.body;
    if (req.headers['content-type']?.includes('multipart/form-data') || 
        Object.keys(req.body).some(key => key.includes('['))) {
      creditNoteData = parseFormDataNested(req.body);
    }
    const creditNoteNumber = await generateCreditNoteNumber(CreditNoteModel);
    const taxSettings = creditNoteData.taxSettings || {
      enableGSTBilling: true,
      priceIncludeGST: true,
      autoRoundOff: "0", // MUST ADD THIS
      defaultGSTRate: "18"
    };
    if (!creditNoteData.customerId) {
      return res.status(400).json({
        success: false,
        error: "Customer ID is required"
      });
    }

    if (!creditNoteData.items || creditNoteData.items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one item is required"
      });
    }

    const customer = await CustomerModel.findById(creditNoteData.customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found"
      });
    }

    const creditNote = new CreditNoteModel({
      ...creditNoteData,
      creditNoteNumber,
      taxSettings, // Include tax settings
      status: "pending",
      createdBy: req.user?._id || req.user._id,
    });

    creditNote.calculateTotals();
    if (creditNoteData.invoiceId) {
       console.log("=== CREATE CREDIT NOTE VALIDATION ===");
  console.log("Invoice ID:", creditNoteData.invoiceId);
  console.log("Requested amount:", creditNoteData.totalAmount);
      // Calculate total credited amount for this invoice
      const existingCreditNotes = await CreditNoteModel.find({
        invoiceId: creditNoteData.invoiceId,
        status: { $in: ["approved"] } // Only approved credit notes
      });

      const totalCreditedSoFar = existingCreditNotes.reduce(
        (sum, note) => sum + (note.totalAmount || 0), 
        0
      );
       console.log("Total credited so far:", totalCreditedSoFar);


      // Get invoice total
      const invoice = await InvoiceModel.findById(creditNoteData.invoiceId);
      console.log("Invoice found:", invoice ? "YES" : "NO");
      const invoiceTotal = invoice?.totalAmount || invoice?.grandTotal || 0;
       console.log("Invoice total:", invoiceTotal);
      const remainingBalance = invoiceTotal - totalCreditedSoFar;
      console.log("Remaining balance:", remainingBalance);

      // Check if current credit amount exceeds remaining balance
      if (creditNoteData.totalAmount > remainingBalance) {
        console.log("❌ VALIDATION FAILED!");
        return res.status(400).json({
          success: false,
          error: `Credit amount (₹${creditNoteData.totalAmount.toLocaleString('en-IN')}) exceeds remaining invoice balance. Remaining balance: ₹${remainingBalance.toLocaleString('en-IN')}`,
          details: {
            invoiceTotal: invoiceTotal,
            totalCredited: totalCreditedSoFar,
            remainingBalance: remainingBalance,
            currentCreditAmount: creditNoteData.totalAmount
          }
        });
      }
    }

    const savedCreditNote = await creditNote.save();

    // Populate for response
    const populatedCreditNote = await CreditNoteModel.findById(savedCreditNote._id)
      .populate("customerId", "name email phone")
      .populate("invoiceId", "invoiceNo invoiceDate")
      .populate("createdBy", "firstName lastName");
    res.status(201).json({
      success: true,
     message: "Credit note created successfully and is pending approval",
      creditNote: populatedCreditNote
    });

  } catch (error) {
    next(error); // Pass error to centralized error handler
    
    if (error.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: Object.values(error.errors).map((e) => e.message)
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Credit note number already exists"
      });
    }

    res.status(500).json({
      success: false,
      error: "Server error",
      message: error.message
    });
  }
};

exports.approveCreditNote = async (req, res, next) => {
  try {
    const {Customer: CustomerModel, CustomerCreditNote: CreditNoteModel, CustomerInvoice: InvoiceModel, Product: ProductModel} = await getAutoModels(req);
    const { id } = req.params;
    
    const creditNote = await CreditNoteModel.findById(id);
      console.log("=== APPROVE CREDIT NOTE DEBUG ===");
    console.log("Credit Note ID:", id);
    console.log("Credit Note Status:", creditNote?.status);
    console.log("Items:", JSON.stringify(creditNote?.items, null, 2));
    
    if (!creditNote) {
      return res.status(404).json({
        success: false,
        error: "Credit note not found"
      });
    }
    
    // ✅ Check if can be approved (only pending)
    if (creditNote.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: `Cannot approve credit note with status: ${creditNote.status}. Only pending credit notes can be approved.`
      });
    }
    
    // ✅ 1. INCREASE STOCK for each product (returning goods increases stock)
    for (const item of creditNote.items) {
      if (item.productId) {
         console.log(`Processing product: ${item.productId}, Quantity: ${item.quantity}`);
        const product = await ProductModel.findById(item.productId);
        console.log(`Stock BEFORE: ${product?.stockQuantity}`);
        
        if (product) {
          // Handle variants if they exist
          if (product.variants && product.variants.length > 0) {
            const variant = product.variants.find(v => 
              (!item.selectedColor || v.color === item.selectedColor) &&
              (!item.selectedSize || v.size === item.selectedSize)
            );
            
            if (variant) {
              variant.stockQuantity = (variant.stockQuantity || 0) + item.quantity;
              await product.save();
            } else {
              await ProductModel.findByIdAndUpdate(item.productId, {
                $inc: { stockQuantity: item.quantity }
              });
            }
          } else {
            await ProductModel.findByIdAndUpdate(item.productId, {
              $inc: { stockQuantity: item.quantity }
            });
          }
        }
      }
    }
    
    // ✅ 2. UPDATE CUSTOMER due amount (reduce because credit note reduces what customer owes)
    await CustomerModel.findByIdAndUpdate(creditNote.customerId, {
      $inc: { 
        totalDueAmount: -creditNote.totalAmount,
        totalCreditNotes: 1,
        totalCreditAmount: creditNote.totalAmount
      }
    });
    
    // ✅ 3. UPDATE INVOICE with credit note reference
    if (creditNote.invoiceId) {
      const invoice = await InvoiceModel.findById(creditNote.invoiceId);
      if (invoice) {
        invoice.creditNotes = invoice.creditNotes || [];
        invoice.creditNotes.push({
          creditNoteId: creditNote._id,
          amount: creditNote.totalAmount,
          date: new Date(),
          approvedBy: req.user?._id
        });
        invoice.calculateTotals();
        await invoice.save();
      }
    }
    
    // ✅ 4. UPDATE CREDIT NOTE STATUS
    creditNote.status = "approved";
    creditNote.approvedBy = req.user?._id;
    creditNote.approvedDate = new Date();
    await creditNote.save();
    
    const populatedCreditNote = await CreditNoteModel.findById(creditNote._id)
      .populate("customerId", "name email phone")
      .populate("invoiceId", "invoiceNo invoiceDate")
      .populate("approvedBy", "firstName lastName");
    
    res.json({
      success: true,
      message: "Credit note approved successfully. Stock has been updated.",
      creditNote: populatedCreditNote
    });
    
  } catch (error) {
    next(error);
    res.status(500).json({
      success: false,
      error: "Failed to approve credit note",
      message: error.message
    });
  }
};
exports.rejectCreditNote = async (req, res, next) => {
  try {
    const {Customer: CustomerModel, CustomerCreditNote: CreditNoteModel, CustomerInvoice: InvoiceModel} = await getAutoModels(req);
    const { id } = req.params;
    const { rejectionReason } = req.body;
    
    const creditNote = await CreditNoteModel.findById(id);
    
    if (!creditNote) {
      return res.status(404).json({
        success: false,
        error: "Credit note not found"
      });
    }
    
    // ✅ Check if can be rejected (only pending)
    if (creditNote.status !== "pending") {
      return res.status(400).json({
        success: false,
        error: `Cannot reject credit note with status: ${creditNote.status}. Only pending credit notes can be rejected.`
      });
    }
    
    // ✅ NO STOCK CHANGES, NO CUSTOMER BALANCE CHANGES, NO INVOICE UPDATES
    // Just update status to rejected
    
    creditNote.status = "rejected";
    creditNote.rejectedBy = req.user?._id;
    creditNote.rejectedDate = new Date();
    creditNote.rejectionReason = rejectionReason || "No reason provided";
    await creditNote.save();
    
    res.json({
      success: true,
      message: "Credit note rejected successfully. No changes were made to stock or customer balance.",
      creditNote
    });
    
  } catch (error) {
    next(error);
    res.status(500).json({
      success: false,
      error: "Failed to reject credit note",
      message: error.message
    });
  }
};

// Get all credit notes

// Get all credit notes - UPDATED with better response format

exports.getAllCreditNotes = async (req, res, next) => {
  try {
    const {Customer: CustomerModel, CustomerCreditNote: CreditNoteModel, CustomerInvoice: InvoiceModel} = await getAutoModels(req);
    const {
      customerId,
      status,
      startDate,
      endDate,
      search,
    } = req.query;

    const filter = {};

    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
      filter.customerId = customerId;
    }

    if (status && status !== "all") {
      const validStatuses = ["pending", "approved", "rejected"];
      if (validStatuses.includes(status)) {
        filter.status = status;
      }else if (status === "processing") {
        // Map "processing" to "pending" for frontend consistency
        filter.status = "pending";
      }
    }

    if (startDate || endDate) {
      filter.date = {};
      if (startDate) filter.date.$gte = new Date(startDate);
      if (endDate) filter.date.$lte = new Date(endDate);
    }

    if (search) {
      filter.$or = [
        { creditNoteNumber: { $regex: search, $options: "i" } },
        { customerName: { $regex: search, $options: "i" } },
        { invoiceNumber: { $regex: search, $options: "i" } }
      ];
    }
    const creditNotes = await CreditNoteModel.find(filter)
      .populate("customerId", "name email phone")
      .populate("invoiceId", "invoiceNo invoiceDate")
      .populate({
        path: "createdBy",
        select: "firstName lastName email username role",
        populate: {
          path: "role",
          select: "roleName",
        }
      })
      .sort({ createdAt: -1 })
    const total = await CreditNoteModel.countDocuments(filter);

    res.json({
      success: true,
      count: creditNotes.length,
      total,
      data: creditNotes,
      creditNotes // Keep for backward compatibility if needed
    });

  } catch (error) {
    next(error); // Pass error to centralized error handler
    res.status(500).json({
      success: false,
      error: "Failed to fetch credit notes"
    });
  }
};

// Get credit note by ID

exports.getCreditNoteById = async (req, res, next) => {
  try {
    const {Customer: CustomerModel, CustomerCreditNote: CreditNoteModel, CustomerInvoice: InvoiceModel} = await getAutoModels(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid credit note ID"
      });
    }

    const creditNote = await CreditNoteModel.findById(id)
      .populate("customerId", "name email phone address gstin")
      .populate("invoiceId", "invoiceNo invoiceDate grandTotal")
      .populate("createdBy", "firstName lastName")
      .populate("items.productId", "productName hsnCode unit");

    if (!creditNote) {
      return res.status(404).json({
        success: false,
        error: "Credit note not found"
      });
    }

    res.json({ success: true, creditNote });

  } catch (error) {
    next(error); // Pass error to centralized error handler
    res.status(500).json({
      success: false,
      error: "Failed to fetch credit note"
    });
  }
};

exports.updateCreditNote = async (req, res, next) => {
  try {
    const {Customer: CustomerModel, CustomerCreditNote: CreditNoteModel, CustomerInvoice: InvoiceModel} = await getAutoModels(req);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid credit note ID"
      });
    }

    const creditNote = await CreditNoteModel.findById(req.params.id);
    if (!creditNote) {
      return res.status(404).json({
        success: false,
        error: "Credit note not found"
      });
    }
    if (
  creditNote.status === "approved" ||
  creditNote.status === "rejected"
) {
  return res.status(400).json({
    success: false,
    error: "Cannot edit approved or rejected credit notes",
  });
}

    let updateData = req.body;
    if (Object.keys(req.body).some(key => key.includes('['))) {
      updateData = parseFormDataNested(req.body);
    }

    const updatableFields = [
      "items",
      "additionalCharges",
      "additionalChargesDetails",
      "shoppingPointsUsed",
      "notes",
    ];

    updatableFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        creditNote[field] = updateData[field];
      }
    });

    if (updateData.taxSettings) {
      creditNote.taxSettings = {
        enableGSTBilling: updateData.taxSettings.enableGSTBilling !== false,
        priceIncludeGST: updateData.taxSettings.priceIncludeGST !== false,
        autoRoundOff: updateData.taxSettings.autoRoundOff || "0", // IMPORTANT
        defaultGSTRate: updateData.taxSettings.defaultGSTRate || "18"
      };
    }

    creditNote.calculateTotals();
    await creditNote.save();

    const populatedCreditNote = await CreditNoteModel.findById(creditNote._id)
      .populate("customerId", "name phone email")
      .populate("invoiceId", "invoiceNo");

    res.json({
      success: true,
      message: "Credit note updated successfully",
      creditNote: populatedCreditNote
    });

  } catch (error) {
    next(error); // Pass error to centralized error handler
    res.status(500).json({
      success: false,
      error: "Failed to update credit note",
      message: error.message
    });
  }
};

// Delete credit note

exports.deleteCreditNote = async (req, res, next) => {
  try {
    const {Customer: CustomerModel, CustomerCreditNote: CreditNoteModel, CustomerInvoice: InvoiceModel} = await getAutoModels(req);
    const creditNote = await CreditNoteModel.findById(req.params.id);

    if (!creditNote) {
      return res.status(404).json({
        success: false,
        error: "Credit note not found"
      });
    }

    if (creditNote.status === "approved") {
      return res.status(400).json({
        success: false,
        error: "Cannot delete approved credit note."
      });
    }

    await creditNote.deleteOne();

    res.json({
      success: true,
      message: "Credit note deleted successfully",
      deletedId: req.params.id
    });
  } catch (error) {
    next(error); // Pass error to centralized error handler
    res.status(500).json({
      success: false,
      error: "Failed to delete credit note",
      message: error.message
    });
  }
};

// Get credit notes by customer
exports.getCreditNotesByCustomer = async (req, res, next) => {
  try {
    const {Customer: CustomerModel, CustomerCreditNote: CreditNoteModel, CustomerInvoice: InvoiceModel} = await getAutoModels(req);
    const creditNotes = await CreditNoteModel.find({
      customerId: req.params.customerId,
    }).sort({ date: -1 });
    res.json({
      success:true,
      count:creditNotes.length,
      creditNotes,
    });
  } catch (error) {
    next(error); // Pass error to centralized error handler
    res.status(500).json({success:false,  message: error.message });
  }
};

// Get credit notes by status
exports.getCreditNotesByStatus = async (req, res, next) => {
  try {
    const {Customer: CustomerModel, CustomerCreditNote: CreditNoteModel, CustomerInvoice: InvoiceModel} = await getAutoModels(req);
    const { status } = req.params;
    const validStatuses = ["pending", "approved", "rejected"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ message: "Invalid status" });
    }

    const creditNotes = await CreditNoteModel.find({ status })
      .populate("customerId", "name")
      .sort({ date: -1 });

    res.json(creditNotes);
  } catch (error) {
    next(error); // Pass error to centralized error handler
    res.status(500).json({ message: error.message });
  }
};

// Get credit notes summary (for dashboard)
exports.getCreditNotesSummary = async (req, res, next) => {
  try {
    const {Customer: CustomerModel, CustomerCreditNote: CreditNoteModel, CustomerInvoice: InvoiceModel} = await getAutoModels(req);
    const [totalCount, pendingCount, approvedCount, rejectedCount, totalAmount] =
      await Promise.all
      ([
      CreditNoteModel.countDocuments(),
      CreditNoteModel.countDocuments({ status: "pending" }),
      CreditNoteModel.countDocuments({ status: "approved" }),
      CreditNoteModel.countDocuments({ status: "rejected" }),
      CreditNoteModel.aggregate([
        { $match: { status: "approved" } },
        { $group: { _id: null, total: { $sum: "$totalAmount" } } },
      ]),
    ]);

    res.json({
      totalCount,
      pendingCount,
      approvedCount,
     rejectedCount,
      totalAmount: totalAmount[0]?.total || 0,
    });
  } catch (error) {
    next(error); // Pass error to centralized error handler
    res.status(500).json({ message: error.message });
  }
};

// Search credit notes
exports.searchCreditNotes = async (req, res, next) => {
  try {
    const {Customer: CustomerModel, CustomerCreditNote: CreditNoteModel, CustomerInvoice: InvoiceModel} = await getAutoModels(req);
    const { query, startDate, endDate, status } = req.query;

    let searchCriteria = {};

    if (query) {
      searchCriteria.$or = [
        { creditNoteNumber: { $regex: query, $options: "i" } },
        { customerName: { $regex: query, $options: "i" } },
        { "customerId.name": { $regex: query, $options: "i" } },
      ];
    }

    if (startDate || endDate) {
      searchCriteria.date = {};
      if (startDate) searchCriteria.date.$gte = new Date(startDate);
      if (endDate) searchCriteria.date.$lte = new Date(endDate);
    }

    if (status && status !== "all") {
      searchCriteria.status = status;
    }

    const creditNotes = await CreditNoteModel.find(searchCriteria)
      .populate("customerId", "name email phone")
      .sort({ date: -1 });

    res.json(creditNotes);
  } catch (error) {
    next(error); // Pass error to centralized error handler
    res.status(500).json({ message: error.message });
  }
};

// Get recent credit notes
exports.getRecentCreditNotes = async (req, res, next) => {
  try {
    const {Customer: CustomerModel, CustomerCreditNote: CreditNoteModel, CustomerInvoice: InvoiceModel} = await getAutoModels(req);
    const limit = parseInt(req.query.limit) || 10;

    const creditNotes = await CreditNoteModel.find()
      .populate("customerId", "name")
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json(creditNotes);
  } catch (error) {
    next(error); // Pass error to centralized error handler
    res.status(500).json({ message: error.message });
  }
};

exports.updateCreditNoteStatus = async (req, res, next) => {
  try {
    const {Customer: CustomerModel, CustomerCreditNote: CreditNoteModel, CustomerInvoice: InvoiceModel, Product: ProductModel} = await getAutoModels(req);
    const { status } = req.body;
    const creditNote = await CreditNoteModel.findById(req.params.id);

    if (!creditNote) {
      return res.status(404).json({
        success: false,
        error: "Credit note not found",
      });
    }

    const currentStatus = creditNote.status;

    if (currentStatus !== "pending") {
      return res.status(400).json({
        success: false,
        error: `Only credit notes with "pending" status can be updated. Current status: ${currentStatus}`,
        allowedStatus: "pending",
      });
    }

    if (!["approved", "rejected"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Can only update to "approved" or "rejected"`,
        allowedTransitions: ["approved", "rejected"],
      });
    }

      if (status === "approved") {
         // ✅ Check remaining balance before approving
  const existingCreditNotes = await CreditNoteModel.find({
    invoiceId: creditNote.invoiceId,
    status: { $in: ["approved"] },
    _id: { $ne: creditNote._id } // Exclude current credit note
  });

  const totalCreditedSoFar = existingCreditNotes.reduce(
    (sum, note) => sum + (note.totalAmount || 0), 
    0
  );

  const invoice = await InvoiceModel.findById(creditNote.invoiceId);
  const invoiceTotal = invoice?.totalAmount || invoice?.grandTotal || 0;
  const remainingBalance = invoiceTotal - totalCreditedSoFar;

  if (creditNote.totalAmount > remainingBalance) {
    return res.status(400).json({
      success: false,
      error: `Cannot approve. Credit amount exceeds remaining balance. Available: ₹${remainingBalance.toLocaleString('en-IN')}`
    });
  }
      
      for (const item of creditNote.items) {
        if (!item.productId) {
          console.warn(`No productId for item: ${item.name}`);
          continue;
        }

        const product = await ProductModel.findById(item.productId);
        
        if (product) {
          console.log(`Processing product: ${item.name}, Quantity to add: ${item.quantity}`);
          
          if (product.variants && product.variants.length > 0) {
            // Find matching variant
            const variant = product.variants.find(v => 
              (!item.selectedColor || v.color === item.selectedColor) &&
              (!item.selectedSize || v.size === item.selectedSize)
            );
            
            if (variant) {
              console.log(`Variant stock BEFORE: ${variant.stockQuantity || 0}`);
              variant.stockQuantity = (variant.stockQuantity || 0) + item.quantity;
              await product.save();
              console.log(`Variant stock AFTER: ${variant.stockQuantity}`);
            } else {
              // Update first variant as fallback
              if (product.variants.length > 0) {
                product.variants[0].stockQuantity = (product.variants[0].stockQuantity || 0) + item.quantity;
                await product.save();
                console.log(`Updated first variant stock to: ${product.variants[0].stockQuantity}`);
              }
            }
          } else {
            // No variants - create one
            console.log("No variants found, creating default variant");
            product.variants = [{
              stockQuantity: item.quantity,
              openingQuantity: item.quantity,
              sellingPrice: item.unitPrice || 0,
              unit: item.unit || "pcs"
            }];
            await product.save();
            console.log(`Created variant with stock: ${item.quantity}`);
          }
        } else {
          console.warn(`Product not found: ${item.productId}`);
        }
      }
      // Update customer due amount
      await CustomerModel.findByIdAndUpdate(
        creditNote.customerId,
        { $inc: { totalDueAmount: -creditNote.totalAmount } }
      );
      
      creditNote.approvedDate = new Date();
      creditNote.approvedBy = req.user?._id;
    }

    if (status === "rejected") {
      console.log("=== PROCESSING REJECTION (no stock changes) ===");
      creditNote.rejectedDate = new Date();
      creditNote.rejectedBy = req.user?._id;
      creditNote.rejectionReason = req.body.rejectionReason || "No reason provided";
    }

    creditNote.status = status;
    await creditNote.save();
     console.log(`Credit note status updated to: ${status}`);

    res.json({
      success: true,
      message: `Credit note ${status === "approved" ? "approved" : "rejected"} successfully`,
      creditNote,
    });
  } catch (error) {
    console.error("Error in updateCreditNoteStatus:", error);
    next(error); // Pass error to centralized error handler
    res.status(500).json({
      success: false,
      error: "Failed to update credit note status",
    });
  }
};

// Create credit note directly from invoice
exports.createCreditNoteFromInvoice = async (req, res, next) => {
  try {
    const { Customer: CustomerModel, CustomerCreditNote: CreditNoteModel, CustomerInvoice: InvoiceModel } = await getAutoModels(req);
    const { invoiceId, items, reason, notes, date, totalAmount } = req.body;

    if (!invoiceId) {
      return res.status(400).json({
        success: false,
        error: "Invoice ID is required"
      });
    }

    // Fetch the invoice with populated customer
    const invoice = await InvoiceModel.findById(invoiceId)
      .populate("customerId");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found"
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one item is required for credit note"
      });
    }

    // Generate credit note number
    const creditNoteNumber = await generateCreditNoteNumber(CreditNoteModel);

    // Prepare credit note items
    const creditNoteItems = items.map(item => ({
      productId: item.productId,
      name: item.name,
      description: item.description || "",
      quantity: item.returnQuantity || item.quantity,
      unit: item.unit || "pcs",
      unitPrice: item.unitPrice,
      taxType: `GST ${item.taxRate}%`,
      taxRate: item.taxRate || 0,
      taxAmount: item.taxAmount || 0,
      discountPercent: item.discountPercent || 0,
      discountAmount: item.discountAmount || 0,
      total: item.amount || (item.returnQuantity * item.unitPrice)
    }));

    // Calculate totals
    const subtotal = creditNoteItems.reduce((sum, item) => sum + (item.quantity * item.unitPrice), 0);
    const totalTax = creditNoteItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    const totalDiscount = creditNoteItems.reduce((sum, item) => sum + (item.discountAmount || 0), 0);
    
    // Final total (with tax but without discount)
    const calculatedTotal = subtotal + totalTax - totalDiscount;

    // Create credit note
    const creditNote = new CreditNoteModel({
      creditNoteNumber,
      invoiceId: invoice._id,
      invoiceNumber: invoice.invoiceNo,
      customerId: invoice.customerId._id,
      customerName: invoice.customerId.name,
      phone: invoice.customerId.phone || "",
      email: invoice.customerId.email || "",
      address: invoice.customerId.address || "",
      date: date || new Date(),
      items: creditNoteItems,
      subtotal: subtotal,
      totalTax: totalTax,
      totalDiscount: totalDiscount,
      totalAmount: totalAmount || calculatedTotal,
      reason: reason || "returned_goods",
      notes: notes || `Credit note created from invoice ${invoice.invoiceNo}`,
      taxSettings: invoice.taxSettings || {
        enableGSTBilling: true,
        priceIncludeGST: true,
        defaultGSTRate: "18",
        autoRoundOff: "0"
      },
      status: "pending",
      createdBy: req.user?._id,
    });

    const savedCreditNote = await creditNote.save();

    // Update customer's due amount
    await CustomerModel.findByIdAndUpdate(invoice.customerId._id, {
      // $inc: { totalDueAmount: -savedCreditNote.totalAmount }
    });

    // Add credit note reference to invoice
    invoice.creditNotes = invoice.creditNotes || [];
    invoice.creditNotes.push({
      creditNoteId: savedCreditNote._id,
      amount: savedCreditNote.totalAmount,
      date: new Date(),
    });
    await invoice.save();

    res.status(201).json({
      success: true,
      message: "Credit note created successfully from invoice and is pending approval",
      creditNote: savedCreditNote
    });

  } catch (error) {
    console.error("Error creating credit note from invoice:", error);
    next(error);
  }
};

// Get remaining balance for an invoice (how much credit is still available)
// exports.getRemainingBalance = async (req, res, next) => {
//   try {
//     const { CustomerCreditNote: CreditNoteModel, Invoice: InvoiceModel } = await getAutoModels(req);
//     const { invoiceId } = req.params;
//      console.log("=== getRemainingBalance DEBUG ===");
//     console.log("Invoice ID received:", invoiceId);
//     console.log("Is valid ObjectId:", mongoose.Types.ObjectId.isValid(invoiceId));


//     if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid invoice ID"
//       });
//     }

//     // Get the invoice
//     const invoice = await InvoiceModel.findById(invoiceId);
//     console.log("Invoice found:", invoice ? "YES" : "NO");
//     if (invoice) {
//      console.log("Invoice fields:");
//       console.log("  - grandTotal:", invoice.grandTotal);
//       console.log("  - totalAmount:", invoice.totalAmount);
//       console.log("  - subtotal:", invoice.subtotal);
//       console.log("  - invoiceNo:", invoice.invoiceNo);
//     }
    
//     if (!invoice) {
//       return res.status(404).json({
//         success: false,
//         error: "Invoice not found"
//       });
//     }

//     // Calculate total credited amount for this invoice (approved credit notes only)
//     const creditNotes = await CreditNoteModel.find({
//       invoiceId: invoiceId,
//       status: { $in: ["approved"] } // Only approved credit notes count
//     });
//     console.log("Approved credit notes found:", creditNotes.length);
//     creditNotes.forEach((cn, i) => {
//       console.log(`  ${i+1}. Credit Note: ${cn.creditNoteNumber}, Amount: ${cn.totalAmount}, Status: ${cn.status}`);
//     });

//     const totalCredited = creditNotes.reduce((sum, note) => sum + (note.totalAmount || 0), 0);
    
//     // Get invoice total
//     const invoiceTotal = invoice.grandTotal || invoice.totalAmount || invoice.grandTotal || invoice.subtotal || 0;
    
//     // Calculate remaining balance
//     const remainingBalance = invoiceTotal - totalCredited;
//     console.log("Calculations:");
//     console.log("  - Invoice Total:", invoiceTotal);
//     console.log("  - Total Credited:", totalCredited);
//     console.log("  - Remaining Balance:", remainingBalance);


//     res.json({
//       success: true,
//       data: {
//         invoiceTotal: invoiceTotal,
//         totalCredited: totalCredited,
//         remainingBalance: Math.max(0, remainingBalance),
//         creditNotesCount: creditNotes.length
//       }
//     });

//   } catch (error) {
//     console.error("Error getting remaining balance:", error);
//     next(error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to get remaining balance",
//       message: error.message
//     });
//   }
// };
exports.getRemainingBalance = async (req, res, next) => {
  try {
    const { CustomerCreditNote: CreditNoteModel, CustomerInvoice: InvoiceModel } = await getAutoModels(req);
    const { invoiceId } = req.params;

    console.log("=== getRemainingBalance DEBUG ===");
    console.log("Invoice ID received:", invoiceId);
    console.log("Is valid ObjectId:", mongoose.Types.ObjectId.isValid(invoiceId));

    if (!mongoose.Types.ObjectId.isValid(invoiceId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid invoice ID"
      });
    }

    // Try to find invoice in CustomerInvoice model
    const invoice = await InvoiceModel.findById(invoiceId);
    
    console.log("Invoice model name:", InvoiceModel.modelName);
    console.log("Invoice found:", invoice ? "YES" : "NO");
    
    if (invoice) {
      console.log("Invoice details:");
      console.log("  - _id:", invoice._id);
      console.log("  - invoiceNo:", invoice.invoiceNo);
      console.log("  - grandTotal:", invoice.grandTotal);
      console.log("  - totalAmount:", invoice.totalAmount);
      console.log("  - subtotal:", invoice.subtotal);
    } else {
      console.log("Invoice NOT found in CustomerInvoice collection");
      
      // Try alternative model
      const { Invoice: AltInvoiceModel } = await getAutoModels(req);
      const altInvoice = await AltInvoiceModel.findById(invoiceId);
      console.log("Alternative Invoice model found:", altInvoice ? "YES" : "NO");
      
      if (altInvoice) {
        console.log("Found in alternative model!");
      }
    }

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
        debug: {
          invoiceId: invoiceId,
          modelUsed: InvoiceModel.modelName
        }
      });
    }

    // Find approved credit notes
    const creditNotes = await CreditNoteModel.find({
      invoiceId: invoiceId,
      status: { $in: ["approved"] }
    });

    console.log("Approved Credit Notes found:", creditNotes.length);
    
    const totalCredited = creditNotes.reduce((sum, note) => sum + (note.totalAmount || 0), 0);
    const invoiceTotal = invoice.grandTotal || invoice.totalAmount || invoice.subtotal || 0;
    const remainingBalance = invoiceTotal - totalCredited;

    console.log("Calculations:");
    console.log("  - Invoice Total:", invoiceTotal);
    console.log("  - Total Credited:", totalCredited);
    console.log("  - Remaining Balance:", remainingBalance);

    res.json({
      success: true,
      data: {
        invoiceTotal: invoiceTotal,
        totalCredited: totalCredited,
        remainingBalance: Math.max(0, remainingBalance),
        creditNotesCount: creditNotes.length
      }
    });

  } catch (error) {
    console.error("Error getting remaining balance:", error);
    next(error);
    res.status(500).json({
      success: false,
      error: "Failed to get remaining balance",
      message: error.message
    });
  }
};

