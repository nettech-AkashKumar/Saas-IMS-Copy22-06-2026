const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");
const mongoose = require("mongoose");

// Get all debit notes
// Get all debit notes - FIXED VERSION
exports.getAllDebitNotes = async (req, res, next) => {
  try {
    const { SupplierDebitNote: SupplierDebitNoteModel } = await getAutoModels(req);
    // Parse pagination parameters correctly
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    
    const {
      sortBy = "createdAt",
      sortOrder = "desc",
      status,
      supplierId, 
      startDate,
      endDate,
      search
    } = req.query;

    let query = {};
   if (status === "processing") {
      query.status = "issued";
    } else if (status && status !== "all") {
      query.status = status;
    }
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }

    if (supplierId) query.supplierId = supplierId;
    
    
    // Add search functionality
    if (search) {
      query.$or = [
        { debitNoteNumber: { $regex: search, $options: 'i' } },
        { supplierName: { $regex: search, $options: 'i' } }
      ];
    }

    // Get total count for pagination
    const totalCount = await SupplierDebitNoteModel.countDocuments(query);
    
    // Get paginated results
    const debitNotes = await SupplierDebitNoteModel.find(query)
      .populate("supplierId", "name company phone email gstin")
      .populate("invoiceId", "invoiceNumber")
      .populate("items.productId", "productName sku hsnCode")
      .populate({
        path: "createdBy",
        select: "firstName lastName email username role",
        populate: {
          path: "role",
          select: "roleName",
        }
      })
      .sort({ [sortBy]: sortOrder === "desc" ? -1 : 1})
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      debitNotes,
      pagination: {
        page: page,
        limit: limit,
        totalCount: totalCount,
        totalPages: Math.ceil(totalCount / limit),
        hasNextPage: page < Math.ceil(totalCount / limit),
        hasPrevPage: page > 1
      },
    });
  } catch (error) {
    console.error("Get all debit notes error:", error);
    next(error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch debit notes",
    });
  }
};

// Get debit note by ID
exports.getDebitNoteById = async (req, res, next) => {
  try {
    const { SupplierDebitNote: SupplierDebitNoteModel } = await getAutoModels(req);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid debit note ID format",
      });
    }

    const debitNote = await SupplierDebitNoteModel.findById(req.params.id)
      .populate("supplierId")
      .populate("invoiceId")
      .populate("items.productId", "productName sku hsnCode unit")
      .populate("createdBy", "firstName lastName email role");

    if (!debitNote) {
      return res.status(404).json({
        success: false,
        error: "Debit note not found",
      });
    }

    res.json({
      success: true,
      debitNote,
    });
  } catch (error) {
    // console.error("Get debit note by ID error:", error);
    next(error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch debit note",
    });
  }
};

// Create new debit note
exports.createDebitNote = async (req, res, next) => {
  try {
    const { SupplierDebitNote: SupplierDebitNoteModel, Supplier: SupplierModel, CreatePurchase: PurchaseOrderModel } = await getAutoModels(req);
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: "Unauthorized: No user information found",
      });
    }

      // ✅ FIX: Fetch purchase order to get the invoice number
    let purchaseOrderNumber = "";
    let purchaseOrderDate = null;
    
       if (req.body.invoiceId) {
      const purchaseOrder = await PurchaseOrderModel.findById(req.body.invoiceId);
      if (purchaseOrder) {
        purchaseOrderNumber = purchaseOrder.purchaseNo || purchaseOrder.invoiceNo || "";
        purchaseOrderDate = purchaseOrder.purchaseDate;
      }
    }
        // ✅ VALIDATION: Check total debit amount against purchase order
    const { invoiceId, totalAmount } = req.body;
    
    if (invoiceId) {
      // Get the purchase order
      const purchaseOrder = await PurchaseOrderModel.findById(invoiceId);
      
      if (!purchaseOrder) {
        return res.status(404).json({
          success: false,
          error: "Purchase order not found",
        });
      }

      // Calculate total debit amount already created for this PO
      const existingDebitNotes = await SupplierDebitNoteModel.find({
        invoiceId: invoiceId,
        status: { $ne: "cancelled" } // Don't include cancelled debit notes
      });

      const totalDebitedSoFar = existingDebitNotes.reduce(
        (sum, note) => sum + (note.totalAmount || 0), 
        0
      );

      // Get purchase order total value
      const poTotalValue = purchaseOrder.grandTotal || 
                           purchaseOrder.totalAmount || 
                           purchaseOrder.subtotal || 0;

      // Check remaining balance
      const remainingBalance = poTotalValue - totalDebitedSoFar;

      // Validate current debit amount doesn't exceed remaining balance
      if (totalAmount > remainingBalance) {
        return res.status(400).json({
          success: false,
          error: `Debit amount (₹${totalAmount.toLocaleString('en-IN')}) exceeds remaining purchase order balance. Remaining balance: ₹${remainingBalance.toLocaleString('en-IN')}`,
          details: {
            poTotal: poTotalValue,
            totalDebited: totalDebitedSoFar,
            remainingBalance: remainingBalance,
            currentDebitAmount: totalAmount
          }
        });
      }

      // Optional: Check if trying to debit more than available for individual items
      if (req.body.items && req.body.items.length > 0) {
        for (const newItem of req.body.items) {
          // Calculate total quantity already debited for this product
          const totalDebitedQuantity = existingDebitNotes.reduce((sum, note) => {
            const existingItem = note.items.find(
              item => item.productId?.toString() === newItem.productId?.toString()
            );
            return sum + (existingItem?.quantity || 0);
          }, 0);

          const originalItem = purchaseOrder.items?.find(
            item => item.productId?.toString() === newItem.productId?.toString()
          );

          if (originalItem) {
            const originalQuantity = originalItem.qty || originalItem.quantity || 0;
            const remainingQuantity = originalQuantity - totalDebitedQuantity;
            
            if (newItem.quantity > remainingQuantity) {
              return res.status(400).json({
                success: false,
                error: `Quantity for product "${newItem.name}" exceeds remaining balance. Available: ${remainingQuantity}, Requested: ${newItem.quantity}`,
              });
            }
          }
        }
      }
    }
    const debitNoteNumber = await SupplierDebitNoteModel.generateDebitNoteNumber();

    // Get supplier details
    const supplier = await SupplierModel.findById(req.body.supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: "Supplier not found",
      });
    }

    const debitNoteData = {
      ...req.body,
      debitNoteNumber,
      supplierName: supplier.supplierName || supplier.name || supplier.company,
      phone: req.body.phone || supplier.phone,
      email: req.body.email || supplier.email,
      address: req.body.address || supplier.address,
      createdBy: req.user._id,
       purchaseOrderNo: purchaseOrderNumber,  // Store the purchase order number
      originalPurchaseDate: purchaseOrderDate,
    };
    const debitNote = new SupplierDebitNoteModel(debitNoteData);
    const savedDebitNote = await debitNote.save();
    // console.log("Debit note save successful:", savedDebitNote._id);

    // Update supplier's payable amount if debit note is issued
    if (req.body.status === "issued" && req.body.supplierId) {
      await SupplierModel.findByIdAndUpdate(req.body.supplierId, {
        $inc: {
          totalPayable: req.body.totalAmount, // Increases payable amount
          creditBalance: req.body.totalAmount, // Credit balance increases
        },
        $push: {
          debitNotes: {
            debitNoteId: savedDebitNote._id,
            amount: req.body.totalAmount,
            date: new Date(),
          },
        },
      });
    }

    res.status(201).json({
      success: true,
      message: "Debit note created successfully",
      debitNote: savedDebitNote,
    });
  } catch (error) {
    next(error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
    }

    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Duplicate debit note number",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to create debit note",
    });
  }
};

// Update debit note
exports.updateDebitNote = async (req, res, next) => {
  try {
    const { SupplierDebitNote: SupplierDebitNoteModel, Supplier: SupplierModel, CreatePurchase: PurchaseOrderModel } = await getAutoModels(req);
    const debitNote = await SupplierDebitNoteModel.findById(req.params.id);

    if (!debitNote) {
      return res.status(404).json({
        success: false,
        error: "Debit note not found",
      });
    }

    // Check if debit note can be updated
    if (debitNote.status === "settled") {
      return res.status(400).json({
        success: false,
        error: "Cannot update a settled debit note",
      });
    }

    if (debitNote.status === "cancelled") {
      return res.status(400).json({
        success: false,
        error: "Cannot update a cancelled debit note",
      });
    }
      // ✅ VALIDATION: Check total debit amount against purchase order (excluding current debit note)
    const { invoiceId, totalAmount } = req.body;
    
    if (invoiceId && totalAmount !== undefined) {
      const purchaseOrder = await PurchaseOrderModel.findById(invoiceId);
      
      if (purchaseOrder) {
        // Calculate total debit amount from ALL debit notes for this PO (excluding current)
        const existingDebitNotes = await SupplierDebitNoteModel.find({
          invoiceId: invoiceId,
          status: { $ne: "cancelled" },
          _id: { $ne: debitNote._id } // Exclude current debit note
        });

        const totalDebitedSoFar = existingDebitNotes.reduce(
          (sum, note) => sum + (note.totalAmount || 0), 
          0
        );

        const poTotalValue = purchaseOrder.grandTotal || 
                             purchaseOrder.totalAmount || 
                             purchaseOrder.subtotal || 0;

        const remainingBalance = poTotalValue - totalDebitedSoFar;

        if (totalAmount > remainingBalance) {
          return res.status(400).json({
            success: false,
            error: `Updated debit amount exceeds remaining balance. Available: ₹${remainingBalance.toLocaleString('en-IN')}, Requested: ₹${totalAmount.toLocaleString('en-IN')}`,
          });
        }
      }
    }

    // Store old amount for supplier balance calculation
    const oldAmount = debitNote.totalAmount;
    const oldStatus = debitNote.status;

    // Calculate new totals if items are being updated
    if (req.body.items) {
      // Calculate new subtotal, discount, and total
      let newSubtotal = 0;
      let newTotalDiscount = 0;
      let newTotalTax = 0;

      req.body.items.forEach((item) => {
        const itemSubtotal = (item.quantity || 0) * (item.unitPrice || 0);
        newSubtotal += itemSubtotal;

        let discountAmount = item.discountAmount || 0;
        if (item.discountPercent > 0) {
          discountAmount = itemSubtotal * (item.discountPercent / 100);
        }
        newTotalDiscount += discountAmount;

        const taxableAmount = Math.max(0, itemSubtotal - discountAmount);
        const taxAmount = taxableAmount * ((item.taxRate || 0) / 100);
        newTotalTax += taxAmount;
      });

      // Add calculated totals to request body
      req.body.subtotal = parseFloat(newSubtotal.toFixed(2));
      req.body.totalDiscount = parseFloat(newTotalDiscount.toFixed(2));
      req.body.totalTax = parseFloat(newTotalTax.toFixed(2));
      req.body.totalAmount = parseFloat(
        (
          newSubtotal +
          newTotalTax -
          newTotalDiscount +
          (req.body.additionalCharges || 0) +
          (req.body.roundOff || 0)
        ).toFixed(2),
      );
    }

    const newAmount = req.body.totalAmount || oldAmount;
    const amountDifference = newAmount - oldAmount;
    const newStatus = req.body.status || oldStatus;

    // Handle supplier balance adjustments
    // Only adjust if status changes between issued and non-issued
    if (oldStatus !== newStatus) {
      if (oldStatus === "issued" && newStatus !== "issued") {
        // Removing issued debit note
        await SupplierModel.findByIdAndUpdate(debitNote.supplierId, {
          $inc: {
            totalPayable: -oldAmount,
            creditBalance: -oldAmount,
          },
        });
      } else if (newStatus === "issued" && oldStatus !== "issued") {
        // Adding new issued debit note
        await SupplierModel.findByIdAndUpdate(debitNote.supplierId, {
          $inc: {
            totalPayable: newAmount,
            creditBalance: newAmount,
          },
        });
      }
    } else if (oldStatus === "issued" && amountDifference !== 0) {
      // Amount changed for issued debit note
      await SupplierModel.findByIdAndUpdate(debitNote.supplierId, {
        $inc: {
          totalPayable: amountDifference,
          creditBalance: amountDifference,
        },
      });
    }

    const updatedDebitNote = await SupplierDebitNoteModel.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true },
    )
      .populate("supplierId", "name company phone email gstin")
      .populate("invoiceId", "invoiceNumber")
      .populate("items.productId", "productName sku hsnCode");

    res.json({
      success: true,
      message: "Debit note updated successfully",
      debitNote: updatedDebitNote,
    });
  } catch (error) {
    next(error);

    if (error.name === "ValidationError") {
      const errors = Object.values(error.errors).map((err) => err.message);
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: errors,
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update debit note",
    });
  }
};

// Delete debit note
exports.deleteDebitNote = async (req, res, next) => {
  try {
    const { SupplierDebitNote: SupplierDebitNoteModel, Supplier: SupplierModel } = await getAutoModels(req);
    const debitNote = await SupplierDebitNoteModel.findById(req.params.id);

    if (!debitNote) {
      return res.status(404).json({
        success: false,
        error: "Debit note not found",
      });
    }

    if (debitNote.status === "settled") {
      return res.status(400).json({
        success: false,
        error: "Cannot delete a settled debit note",
      });
    }

    // Revert supplier payable amount if debit note was issued
    if (debitNote.status === "issued" && debitNote.supplierId) {
      await SupplierModel.findByIdAndUpdate(debitNote.supplierId, {
        $inc: {
          totalPayable: -debitNote.totalAmount,
          creditBalance: -debitNote.totalAmount,
        },
      });
    }

    await debitNote.deleteOne();

    res.json({
      success: true,
      message: "Debit note deleted successfully",
    });
  } catch (error) {
    next(error);
    res.status(500).json({
      success: false,
      error: "Failed to delete debit note",
    });
  }
};

// Get debit notes by supplier
exports.getDebitNotesBySupplier = async (req, res, next) => {
  try {
    const { SupplierDebitNote: SupplierDebitNoteModel } = await getAutoModels(req);
    const debitNotes = await SupplierDebitNoteModel.find({
      supplierId: req.params.supplierId,
    })
      .populate("invoiceId", "invoiceNumber date")
      .sort({ date: -1 });

    // Calculate summary
    const summary = {
      totalAmount: 0,
      issuedAmount: 0,
      settledAmount: 0,
      draftAmount: 0,
    };

    debitNotes.forEach((dn) => {
      summary.totalAmount += dn.totalAmount;
      if (dn.status === "issued") summary.issuedAmount += dn.totalAmount;
      if (dn.status === "settled") summary.settledAmount += dn.totalAmount;
      if (dn.status === "draft") summary.draftAmount += dn.totalAmount;
    });

    res.json({
      success: true,
      debitNotes,
      summary,
    });
  } catch (error) {
    next(error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch debit notes",
    });
  }
};

// Get debit notes by status
exports.getDebitNotesByStatus = async (req, res, next) => {
  try {
    const { SupplierDebitNote: SupplierDebitNoteModel } = await getAutoModels(req);
    const { status } = req.params;
    const validStatuses = ["draft", "issued", "settled", "cancelled"];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: "Invalid status",
      });
    }

    const debitNotes = await SupplierDebitNoteModel.find({ status })
      .populate("supplierId", "name company")
      .sort({ date: -1 });

    res.json({
      success: true,
      debitNotes,
    });
  } catch (error) {
    next(error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch debit notes",
    });
  }
};

// Search debit notes
exports.searchDebitNotes = async (req, res, next) => {
  try {
    const { SupplierDebitNote: SupplierDebitNoteModel } = await getAutoModels(req);
    const {
      query,
      startDate,
      endDate,
      status,
      supplierId,
      reason,
      minAmount,
      maxAmount,
    } = req.query;

    let searchCriteria = {};

    // Text search
    if (query) {
      searchCriteria.$or = [
        { debitNoteNumber: { $regex: query, $options: "i" } },
        { supplierName: { $regex: query, $options: "i" } },
        { purchaseOrderNo: { $regex: query, $options: "i" } },
        { grnNo: { $regex: query, $options: "i" } },
      ];
    }

    // Date range filter
    if (startDate || endDate) {
      searchCriteria.date = {};
      if (startDate) searchCriteria.date.$gte = new Date(startDate);
      if (endDate) searchCriteria.date.$lte = new Date(endDate);
    }

    // Status filter
    if (status && status !== "all") {
      searchCriteria.status = status;
    }

    // Supplier filter
    if (supplierId) {
      searchCriteria.supplierId = supplierId;
    }

    // Reason filter
    if (reason && reason !== "all") {
      searchCriteria.reason = reason;
    }

    // Amount range filter
    if (minAmount || maxAmount) {
      searchCriteria.totalAmount = {};
      if (minAmount) searchCriteria.totalAmount.$gte = parseFloat(minAmount);
      if (maxAmount) searchCriteria.totalAmount.$lte = parseFloat(maxAmount);
    }

    const debitNotes = await SupplierDebitNoteModel.find(searchCriteria)
      .populate("supplierId", "name email phone company")
      .sort({ date: -1 });

    res.json({
      success: true,
      debitNotes,
      count: debitNotes.length,
    });
  } catch (error) {
    next(error);
    res.status(500).json({
      success: false,
      error: "Failed to search debit notes",
    });
  }
};

// Cancel debit note
exports.cancelDebitNote = async (req, res, next) => {
  try {
    const { SupplierDebitNote: SupplierDebitNoteModel, Supplier: SupplierModel } = await getAutoModels(req);
    const debitNote = await SupplierDebitNoteModel.findById(req.params.id);

    if (!debitNote) {
      return res.status(404).json({
        success: false,
        error: "Debit note not found",
      });
    }

    if (debitNote.status === "settled") {
      return res.status(400).json({
        success: false,
        error: "Cannot cancel a settled debit note",
      });
    }

    if (debitNote.status === "cancelled") {
      return res.status(400).json({
        success: false,
        error: "Debit note is already cancelled",
      });
    }

    // Revert supplier payable amount if debit note was issued
    if (debitNote.status === "issued" && debitNote.supplierId) {
      await SupplierModel.findByIdAndUpdate(debitNote.supplierId, {
        $inc: {
          totalPayable: -debitNote.totalAmount,
          creditBalance: -debitNote.totalAmount,
        },
      });
    }

    debitNote.status = "cancelled";
    await debitNote.save();

    res.json({
      success: true,
      message: "Debit note cancelled successfully",
      debitNote,
    });
  } catch (error) {
    // console.error("Cancel debit note error:", error);
    next(error);
    res.status(500).json({
      success: false,
      error: "Failed to cancel debit note",
    });
  }
};

// Mark debit note as settled
exports.markAsSettled = async (req, res, next) => {
  try {
    const { SupplierDebitNote: SupplierDebitNoteModel, Supplier: SupplierModel, Product: ProductModel } = await getAutoModels(req);
    const debitNote = await SupplierDebitNoteModel.findById(req.params.id);

    if (!debitNote) {
      return res.status(404).json({
        success: false,
        error: "Debit note not found",
      });
    }

    if (debitNote.status !== "issued") {
      return res.status(400).json({
        success: false,
        error: "Only issued debit notes can be marked as settled",
      });
    }
        // ✅ Deduct stock for each returned product
    for (const item of debitNote.items) {
      if (item.productId) {
        const product = await ProductModel.findById(item.productId);
        
        if (product) {
          if (product.variants && product.variants.length > 0) {
            const variant = product.variants.find(v => 
              (!item.selectedColor || v.color === item.selectedColor) &&
              (!item.selectedSize || v.size === item.selectedSize)
            );
            
            if (variant) {
              variant.stockQuantity = Math.max(0, (variant.stockQuantity || 0) - item.quantity);
              await product.save();
            } else {
              await ProductModel.findByIdAndUpdate(item.productId, {
                $inc: { stockQuantity: -item.quantity }
              });
            }
          } else {
            await ProductModel.findByIdAndUpdate(item.productId, {
              $inc: { stockQuantity: -item.quantity }
            });
          }
        }
      }
    }

    // Update supplier's payable amount
    await SupplierModel.findByIdAndUpdate(debitNote.supplierId, {
      $inc: {
        totalPayable: -debitNote.totalAmount,
        creditBalance: -debitNote.totalAmount,
      },
    });

    debitNote.status = "settled";
    debitNote.settledDate = new Date();
    await debitNote.save();

    res.json({
      success: true,
      message: "Debit note marked as settled successfully and stock updated",
      debitNote,
    });
  } catch (error) {
    next(error);
    res.status(500).json({
      success: false,
      error: "Failed to mark debit note as settled",
    });
  }
};

// Get recent debit notes
exports.getRecentDebitNotes = async (req, res, next) => {
  try {
    const { SupplierDebitNote: SupplierDebitNoteModel } = await getAutoModels(req);
    const limit = parseInt(req.query.limit) || 10;

    const debitNotes = await SupplierDebitNoteModel.find()
      .populate("supplierId", "name company")
      .sort({ createdAt: -1 })
      .limit(limit);

    res.json({
      success: true,
      debitNotes,
    });
  } catch (error) {
    // console.error("Get recent debit notes error:", error);
    next(error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch recent debit notes",
    });
  }
};

// Get debit notes summary
exports.getDebitNotesSummary = async (req, res, next) => {
  try {
    const { SupplierDebitNote: SupplierDebitNoteModel } = await getAutoModels(req);
    const { startDate, endDate, supplierId } = req.query;

    const matchStage = {};

    if (startDate || endDate) {
      matchStage.date = {};
      if (startDate) matchStage.date.$gte = new Date(startDate);
      if (endDate) matchStage.date.$lte = new Date(endDate);
    }

    if (supplierId) {
      matchStage.supplierId = new mongoose.Types.ObjectId(supplierId);
    }

    const summary = await SupplierDebitNoteModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    const totalStats = {
      totalCount: summary.reduce((sum, item) => sum + item.count, 0),
      totalAmount: summary.reduce((sum, item) => sum + item.totalAmount, 0),
      byStatus: summary.reduce((acc, item) => {
        acc[item._id] = { count: item.count, amount: item.totalAmount };
        return acc;
      }, {}),
    };

    res.json({
      success: true,
      summary: totalStats,
    });
  } catch (error) {
    // console.error("Get debit notes summary error:", error);
    next(error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch debit notes summary",
    });
  }
};

// Get debit notes by purchase order
exports.getDebitNotesByPurchaseOrder = async (req, res, next) => {
  try {
    const { SupplierDebitNote: SupplierDebitNoteModel } = await getAutoModels(req);
    const debitNotes = await SupplierDebitNoteModel.find({
      purchaseOrderNo: req.params.poNumber,
    })
      .populate("supplierId", "name company")
      .sort({ date: -1 });

    res.json({
      success: true,
      debitNotes,
    });
  } catch (error) {
    // console.error("Get debit notes by purchase order error:", error);
    next(error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch debit notes",
    });
  }
};

// Add this function at the end of the file, before the last closing brace
exports.updateDebitNoteStatus = async (req, res, next) => {
  try {
    const { SupplierDebitNote: SupplierDebitNoteModel, Supplier: SupplierModel, Product: ProductModel } = await getAutoModels(req);
    const { status } = req.body;
    const debitNote = await SupplierDebitNoteModel.findById(req.params.id);

    if (!debitNote) {
      return res.status(404).json({
        success: false,
        error: "Debit note not found",
      });
    }

    const currentStatus = debitNote.status;

    // Check if can be updated (only "issued" can be changed)
    if (currentStatus !== "issued") {
      return res.status(400).json({
        success: false,
        error: `Only debit notes with "issued" status can be updated. Current status: ${currentStatus}`,
        allowedStatus: "issued",
      });
    }

    // Only allow to "settled" or "cancelled"
    if (!["settled", "cancelled"].includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Can only update to "settled" or "cancelled"`,
        allowedTransitions: ["settled", "cancelled"],
      });
    }
      // ✅ NEW: Handle inventory updates when approving (settled)
    if (status === "settled") {
      // Deduct stock for each returned product
      for (const item of debitNote.items) {
        if (item.productId) {
          const product = await ProductModel.findById(item.productId);
          
          if (product) {
            // Check if product has variants (if your system supports variants)
            if (product.variants && product.variants.length > 0) {
              // Handle variant stock deduction
              const variant = product.variants.find(v => 
                (!item.selectedColor || v.color === item.selectedColor) &&
                (!item.selectedSize || v.size === item.selectedSize)
              );
              
              if (variant) {
                // Deduct from variant stock
                variant.stockQuantity = Math.max(0, (variant.stockQuantity || 0) - item.quantity);
                if (variant.openingQuantity !== undefined) {
                  variant.openingQuantity = Math.max(0, (variant.openingQuantity || 0) - item.quantity);
                }
                await product.save();
              } else {
                // Fallback to product-level stock
                await ProductModel.findByIdAndUpdate(item.productId, {
                  $inc: { stockQuantity: -item.quantity }
                });
              }
            } else {
              // Simple product - deduct from main stock
              await ProductModel.findByIdAndUpdate(item.productId, {
                $inc: { stockQuantity: -item.quantity }
              });
            }
            
            console.log(`✅ Stock deducted for ${item.name}: ${item.quantity} units`);
          } else {
            console.warn(`Product not found for ID: ${item.productId}`);
          }
        }
      }
    }

    // Store old amount
    const oldAmount = debitNote.totalAmount;

    // Revert supplier balance (since it was added when issued)
    await SupplierModel.findByIdAndUpdate(debitNote.supplierId, {
      $inc: {
        totalPayable: -oldAmount,
        creditBalance: -oldAmount,
      },
    });

    // Update status
    debitNote.status = status;

    // Set settled date if approved
    if (status === "settled") {
      debitNote.settledDate = new Date();
    }

    await debitNote.save();

    res.json({
      success: true,
      message: `Debit note ${status === "settled" ? "approved" : "rejected"} successfully`,
      debitNote,
    });
  } catch (error) {
    // console.error("Update debit note status error:", error);
    next(error);
    res.status(500).json({
      success: false,
      error: "Failed to update debit note status",
    });
  }
};


// Get remaining balance for a purchase order
exports.getRemainingBalance = async (req, res, next) => {
  try {
    const { SupplierDebitNote: SupplierDebitNoteModel, CreatePurchase: PurchaseOrderModel } = await getAutoModels(req);
    const { poId } = req.params;

    const purchaseOrder = await PurchaseOrderModel.findById(poId);
    
    if (!purchaseOrder) {
      return res.status(404).json({
        success: false,
        error: "Purchase order not found",
      });
    }

    const existingDebitNotes = await SupplierDebitNoteModel.find({
      invoiceId: poId,
      status: { $ne: "cancelled" }
    });

    const totalDebited = existingDebitNotes.reduce(
      (sum, note) => sum + (note.totalAmount || 0), 
      0
    );

    const poTotal = purchaseOrder.grandTotal || 
                    purchaseOrder.totalAmount || 
                    purchaseOrder.subtotal || 0;

    res.json({
      success: true,
      data: {
        poTotal: poTotal,
        totalDebited: totalDebited,
        remainingBalance: poTotal - totalDebited,
        debitNotesCount: existingDebitNotes.length
      }
    });
  } catch (error) {
    next(error);
    res.status(500).json({
      success: false,
      error: "Failed to get remaining balance",
    });
  }
};