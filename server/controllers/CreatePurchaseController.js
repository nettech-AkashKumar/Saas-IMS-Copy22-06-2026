const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");
const cloudinary = require("../utils/cloudinary/cloudinary");
const mongoose = require("mongoose");


// Helper: Generate unique purchase number - MATCHING FRONTEND FORMAT
const generatePurchaseNo = async (req) => {
  const { Counter: CounterModel } = await getAutoModels(req);
  
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  
  // Use a more specific prefix with day for better uniqueness
  const counterKey = `PUR${year}${month}${day}`;

  // Atomic increment of sequence
  const counter = await CounterModel.findByIdAndUpdate(
    counterKey,
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );

  // Generate 3-digit sequence
  const sequence = String(counter.seq).padStart(3, "0");
  return `${counterKey}${sequence}`;
};

// Helper: Parse FormData nested objects (same as customer)
const parseFormDataNested = (body) => {
  const parsed = { ...body };

  // Parse additionalDiscount
  if (
    body["additionalDiscount[pct]"] !== undefined ||
    body["additionalDiscount[amt]"] !== undefined
  ) {
    parsed.additionalDiscount = {
      pct: parseFloat(body["additionalDiscount[pct]"]) || 0,
      amt: parseFloat(body["additionalDiscount[amt]"]) || 0,
    };
  }

  const chargeFields = ["shipping", "handling", "packing", "service", "other"];
  parsed.additionalChargesDetails = {};

  chargeFields.forEach(field => {
    const key = `additionalChargesDetails[${field}]`;
    if (body[key] !== undefined) {
      parsed.additionalChargesDetails[field] = parseFloat(body[key]) || 0;
    } else {
      parsed.additionalChargesDetails[field] = 0;
    }
  });

  // Also check if there's a direct additionalChargesDetails object
  if (body.additionalChargesDetails && typeof body.additionalChargesDetails === 'object') {
    parsed.additionalChargesDetails = {
      ...parsed.additionalChargesDetails,
      ...body.additionalChargesDetails
    };
  }

  // Parse additionalChargesDetails
  // parsed.additionalChargesDetails = {
  //   shipping: parseFloat(body["additionalChargesDetails[shipping]"]) || 0,
  //   handling: parseFloat(body["additionalChargesDetails[handling]"]) || 0,
  //   packing: parseFloat(body["additionalChargesDetails[packing]"]) || 0,
  //   service: parseFloat(body["additionalChargesDetails[service]"]) || 0,
  //   other: parseFloat(body["additionalChargesDetails[other]"]) || 0,
  // };

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

      // Parse numeric fields
      const numericFields = [
        "qty",
        "unitPrice",
        "taxRate",
        "taxAmount",
        "discountPct",
        "discountAmt",
        "amount",
      ];
      if (numericFields.includes(field)) {
        items[index][field] = parseFloat(body[key]) || 0;
      }
      else if (field === "selectedSerialNos") {
        try {
          const serialNosValue = body[key];
          
          // If value is undefined or null, set to empty array
          if (serialNosValue === undefined || serialNosValue === null) {
            items[index][field] = [];
          }
          // If it's a string, try to parse it
          else if (typeof serialNosValue === "string") {
            // Check if it's a JSON string
            if (serialNosValue.startsWith("[") && serialNosValue.endsWith("]")) {
              const parsedArray = JSON.parse(serialNosValue);
              // ✅ If parsed array is empty or contains "[]", set to empty array
              if (Array.isArray(parsedArray)) {
                // Filter out empty string items and "[]" strings
                items[index][field] = parsedArray.filter(item => 
                  item !== "" && item !== "[]" && item !== null && item !== undefined
                );
              } else {
                items[index][field] = [];
              }
            } 
            // If it's a comma-separated string
            else if (serialNosValue.includes(",")) {
              const serialArray = serialNosValue.split(",")
                .map(s => s.trim())
                .filter(s => s !== "" && s !== "[]" && s !== null && s !== undefined);
              items[index][field] = serialArray;
            }
            // Single serial number
            else if (serialNosValue.trim() !== "" && serialNosValue !== "[]") {
              items[index][field] = [serialNosValue.trim()];
            } else {
              items[index][field] = [];
            }
          } 
          // If it's already an array
          else if (Array.isArray(serialNosValue)) {
            // Filter out empty items
            items[index][field] = serialNosValue.filter(item => 
              item !== "" && item !== "[]" && item !== null && item !== undefined
            );
          } 
          // Anything else
          else {
            items[index][field] = [];
          }
        } catch (e) {
          // If parsing fails, set to empty array
          console.warn("Failed to parse selectedSerialNos:", body[key]);
          items[index][field] = [];
        }
      }
      // ADD THESE LINES for variant fields
      else if (field === "selectedColor") {
        items[index][field] = body[key] || "";
      }
      else if (field === "selectedSize") {
        items[index][field] = body[key] || "";
      }
      else {
        items[index][field] = body[key];
      }
    }
  });

  if (items.length > 0) {
    parsed.items = items.filter((item) => item !== undefined);
  }
  return parsed;
};

// Create supplier purchase
exports.createPurchase = async (req, res, next) => {
  try {
    const {
      CreatePurchase: PurchaseModel,
      Supplier: SupplierModel,
      Product: ProductModel,
      GRN: GRNModel,
      Counter: CounterModel,
    } = await getAutoModels(req);

    // Parse FormData first
    const parsedBody = parseFormDataNested(req.body);

    // Extract fields
    let {
      supplierId,
      purchaseDate,
      dueDate,
      referenceNo,
      receiptDate,
      items = [],
      billingAddress,
      shippingAddress,
      subtotal,
      totalTax,
      totalDiscount,
      additionalDiscount = { pct: 0, amt: 0 },
      additionalCharges,
      additionalChargesDetails = {
        shipping: 0,
        handling: 0,
        packing: 0,
        service: 0,
        other: 0,
      },
      autoRoundOff = false,
      grandTotal,
      paidAmount = 0,
      fullyReceived = false,
      paymentMethod = "cash",
      notes = "",
      termsAndConditions = "",
    } = parsedBody;

    // Validate required fields
    if (!supplierId) {
      return res.status(400).json({
        success: false,
        error: "Supplier ID is required",
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one item is required",
      });
    }

    // Validate supplier exists
    const supplier = await SupplierModel.findById(supplierId);
    if (!supplier) {
      return res.status(404).json({
        success: false,
        error: "Supplier not found",
      });
    }

    // Validate products and update stock
    const validatedItems = [];
    for (const item of items) {
      if (!item.productId) {
        return res.status(400).json({
          success: false,
          error: "Product ID is required for all items",
        });
      }

      const product = await ProductModel.findById(item.productId);
      if (!product) {
        return res.status(404).json({
          success: false,
          error: `Product not found: ${item.productId}`,
        });
      }

      // Use item data from frontend
      const validatedItem = {
        productId: item.productId,
        itemBarcode: item.itemBarcode || product.itemBarcode || "",
        itemName: item.itemName || product.productName,
        hsn: item.hsnCode || product.hsnCode || "",
        description: item.description || product.description || "",
        lotNumber: item.lotNumber || product.lotNumber || "",
        selectedSerialNos: item.selectedSerialNos || [], // Array of selected serials
        selectedColor: item.selectedColor || "",  // ADD THIS
        selectedSize: item.selectedSize || "",    // ADD THIS
        qty: parseFloat(item.qty) || 1,
        unit: item.unit || product.unit || "Piece",
        unitPrice: parseFloat(item.unitPrice) || product.purchasePrice || 0, // Use purchase price for supplier
        taxType: item.taxType || product.tax || "GST 0%",
        taxRate:
          parseFloat(item.taxRate) ||
          parseFloat(product.tax?.match(/\d+/)?.[0]) ||
          0,
        taxAmount: parseFloat(item.taxAmount) || 0,
        discountPct: parseFloat(item.discountPct) || 0,
        discountAmt: parseFloat(item.discountAmt) || 0,
        amount: parseFloat(item.amount) || 0,
      };

      validatedItems.push(validatedItem);
    }

    // Generate purchase number
    const purchaseNo = await generatePurchaseNo(req);

    // Handle file uploads if any
    // const attachments = [];
    // if (req.files && req.files.length > 0) {
    //   for (const file of req.files) {
    //     try {
    //       const result = await cloudinary.uploader.upload(file.path, {
    //         folder: "supplier_invoice_attachments",
    //         resource_type: "auto",
    //       });

    //       attachments.push({
    //         url: result.secure_url,
    //         public_id: result.public_id,
    //         filename: file.originalname,
    //       });
    //     } catch (uploadError) {
    //       // console.error("Cloudinary upload error:", uploadError);
    //       next(uploadError);
    //     }
    //   }
    // }
    const attachments = [];
// Handle existing attachments from edit mode
if (req.body.existingAttachments) {
  try {
    const existingAtts = JSON.parse(req.body.existingAttachments);
    attachments.push(...existingAtts);
  } catch (e) {
    // Not JSON, ignore
  }
}

// Handle new file uploads
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

    // IMPORTANT: Convert values to numbers
    const calculatedGrandTotal = parseFloat(grandTotal) || 0;
    const calculatedPaidAmount = parseFloat(paidAmount) || 0;

let finalPaidAmount = calculatedPaidAmount;
let finalDueAmount = Math.max(0, calculatedGrandTotal - calculatedPaidAmount);
let finalAdvanceAmount = Math.max(0, calculatedPaidAmount - calculatedGrandTotal);

if (fullyReceived === true || fullyReceived === "true") {
  finalPaidAmount = calculatedGrandTotal;
  finalDueAmount = 0;
  finalAdvanceAmount = 0;
}

let finalStatus = "converted";

    // if (finalPaidAmount >= calculatedGrandTotal && calculatedGrandTotal > 0) {
    //   finalStatus = "received";
    // }  this is where auto approving when total amount is paid

    // if (finalPaidAmount >= calculatedGrandTotal) {
    //   finalStatus = "received";
    //   finalDueAmount = 0; // Ensure due amount is 0 when fully paid
    //   finalAdvanceAmount = Math.max(0, finalPaidAmount - calculatedGrandTotal);
    // } else if (finalPaidAmount > 0) {
    //   finalStatus = "partial";
    // }
    // If paidAmount is 0 and not fullyReceived, keep as draft

    // Create invoice
    // Create invoice - WITH CORRECT VALUES
 const purchase = new PurchaseModel({
  supplierId,
  purchaseNo,
  purchaseDate: purchaseDate ? new Date(purchaseDate) : new Date(),
  dueDate: dueDate ? new Date(dueDate) : new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
  referenceNo: referenceNo || "",
  receiptDate: receiptDate ? new Date(receiptDate) : null,
  items: validatedItems,
  billingAddress: billingAddress || supplier.address || "",
  shippingAddress: shippingAddress || billingAddress || supplier.address || "",
  subtotal: parseFloat(subtotal) || 0,
  totalTax: parseFloat(totalTax) || 0,
  totalDiscount: parseFloat(totalDiscount) || 0,
  additionalDiscount: additionalDiscount,
  additionalCharges: parseFloat(additionalCharges) || 0,
  additionalChargesDetails: additionalChargesDetails,
  autoRoundOff: autoRoundOff === true || autoRoundOff === "true",
  grandTotal: calculatedGrandTotal,
  paidAmount: finalPaidAmount,
  dueAmount: finalDueAmount,  // ✅ Now correctly calculated
  advanceAmount: finalAdvanceAmount,
  fullyReceived: fullyReceived === true || fullyReceived === "true",
  paymentMethod: paymentMethod,
  status: finalStatus,
  notes: notes,
  termsAndConditions: termsAndConditions,
  attachments: attachments,
  createdBy: req.user?._id,
});

    // // Calculate round off value if needed
    // if (autoRoundOff) {
    //   const itemsDiscount = validatedItems.reduce(
    //     (sum, item) => sum + (item.discountAmt || 0),
    //     0
    //   );
    //   const additionalDiscountValue =
    //     additionalDiscount.amt +
    //     (subtotal * (additionalDiscount.pct || 0)) / 100;
    //   const totalDiscountCalc = itemsDiscount + additionalDiscountValue;

    //   const totalBeforeRound =
    //     subtotal + totalTax + additionalCharges - totalDiscountCalc;

    //   purchase.roundOffValue = Math.round(totalBeforeRound) - totalBeforeRound;
    // }
    // Calculate round off value if needed
    if (autoRoundOff) {
      // Ensure all values are numbers, default to 0 if undefined/NaN
      const itemsDiscount = validatedItems.reduce(
        (sum, item) => sum + (parseFloat(item.discountAmt) || 0),
        0,
      );

      const additionalDiscountValue =
        (parseFloat(additionalDiscount.amt) || 0) +
        ((parseFloat(subtotal) || 0) *
          (parseFloat(additionalDiscount.pct) || 0)) /
        100;

      const totalDiscountCalc = itemsDiscount + additionalDiscountValue;

      // Convert all values to numbers with fallback to 0
      const subTotalNum = parseFloat(subtotal) || 0;
      const totalTaxNum = parseFloat(totalTax) || 0;
      const additionalChargesNum = parseFloat(additionalCharges) || 0;

      const totalBeforeRound =
        subTotalNum + totalTaxNum + additionalChargesNum - totalDiscountCalc;

      // Check if totalBeforeRound is a valid number before calculating roundOffValue
      if (!isNaN(totalBeforeRound)) {
        purchase.roundOffValue = Math.round(totalBeforeRound) - totalBeforeRound;
      } else {
        purchase.roundOffValue = 0; // Default to 0 if calculation fails
      }
    }

    // Save purchase
    await purchase.save();

        const isConvertFromGRN = req.body._isConvertFromGRN === true || req.body.mode === "convert-from-grn";
    
    if (isConvertFromGRN && req.body.grnId) {
      try {
        // Update the GRN to mark it as converted
        const updatedGRN = await GRNModel.findByIdAndUpdate(
          req.body.grnId,
          {
            convertedToPurchase: true,
            convertedPurchaseId: purchase._id,
          },
          { new: true }
        );
        
        if (updatedGRN) {
          // console.log(`✅ GRN ${updatedGRN.grnNumber} marked as converted to Purchase ${purchase.purchaseNo}`);
        }
      } catch (grnUpdateError) {
        console.error("Failed to update GRN conversion status:", grnUpdateError);
        // Don't fail the purchase creation if GRN update fails
      }
    }

    // Update supplier statistics
    // Update supplier statistics
    // await SupplierModel.findByIdAndUpdate(supplierId, {
    //   $inc: {
    //     totalInvoices: 1,
    //     totalPurchaseAmount: calculatedGrandTotal, // Use calculatedGrandTotal
    //     totalPaidAmount: finalPaidAmount,
    //     totalDueAmount: finalDueAmount, // ✅ CORRECT: use finalDueAmount
    //   },
    //   $set: {
    //     lastInvoiceDate: new Date(),
    //     lastPurchaseAmount: calculatedGrandTotal,
    //   },
    // });

    // Update product stock quantities (INCREASE stock for supplier invoice)
    // for (const item of validatedItems) {
    //   if (item.productId) {
    //     await ProductModel.findByIdAndUpdate(item.productId, {
    //       $inc: { stockQuantity: item.qty },
    //     });
    //   }
    // }
    // Update product stock quantities (INCREASE stock for supplier invoice) - WITH VARIANT SUPPORT
    // for (const item of validatedItems) {
    //   if (item.productId) {
    //     const product = await ProductModel.findById(item.productId);

    //     if (product && product.variants && product.variants.length > 0) {
    //       // Find the specific variant by color and size
    //       const variant = product.variants.find(v =>
    //         (!item.selectedColor || v.color === item.selectedColor) &&
    //         (!item.selectedSize || v.size === item.selectedSize)
    //       );

    //       if (variant) {
    //         // Increase stock for the specific variant
    //         variant.stockQuantity = Math.max(0, (variant.stockQuantity || 0) + item.qty);
    //         // Also update openingQuantity if needed
    //         if (variant.openingQuantity !== undefined) {
    //           variant.openingQuantity = Math.max(0, (variant.openingQuantity || 0) + item.qty);
    //         }
    //         await product.save();
    //       } else {
    //         // Variant not found, fallback to product-level stock
    //         await ProductModel.findByIdAndUpdate(item.productId, {
    //           $inc: { stockQuantity: item.qty },
    //         });
    //       }
    //     } else {
    //       // Product has no variants - use product-level stock
    //       await ProductModel.findByIdAndUpdate(item.productId, {
    //         $inc: { stockQuantity: item.qty },
    //       });
    //     }
    //   }
    // }

    // Populate and return response
    const populatedPurchase = await PurchaseModel.findById(purchase._id)
      .populate("supplierId", "supplierName phone gstin address")
      .populate(
        "items.productId",
        "productName hsn  images unit purchasePrice tax",
      );

    res.status(201).json({
      success: true,
      message: "Purchase order created successfully",
      purchase: populatedPurchase,
      purchaseOrder: populatedPurchase, 
      data: populatedPurchase,
    });
  } catch (err) {
    // console.error("Supplier invoice creation error:", err);

    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: Object.values(err.errors).map((e) => e.message),
      });
    }

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Purchase  number already exists",
      });
    }

    res.status(500).json({
      success: false,
      error: "Server error",
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

// Get all supplier purchases
exports.getAllPurchases = async (req, res, next) => {
  try {
    const {
      CreatePurchase: PurchaseModel,
      Supplier: SupplierModel,
    } = await getAutoModels(req);

    const {
      supplierId,
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
    } = req.query;

    const filter = {};

    // Filter by supplier
    if (supplierId) {
      if (!mongoose.Types.ObjectId.isValid(supplierId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid supplier ID format",
        });
      }
      filter.supplierId = supplierId;
    }

    // Filter by status
    if (status) {
      const allowedStatuses = [
        "draft",
        "converted",
        "received",
        "partial",
        "cancelled",
        "overdue",
      ];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Allowed values: ${allowedStatuses.join(
            ", ",
          )}`,
        });
      }
      filter.status = status;
    }

    if (startDate || endDate) {
      filter.purchaseDate = {};
      // Date range filter
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

    // Pagination
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build query
    let query = PurchaseModel.find(filter)
      .select(
        "_id purchaseNo purchaseDate dueDate grandTotal paidAmount dueAmount totalTax additionalDiscount billingAddress status items referenceNo receiptDate",
      )
      .populate("supplierId", "supplierName  phone email")
      .populate({
        path: "items.productId",
        select: "itemBarcode category productName unit purchasePrice",
        populate: { path: "category", select: "categoryName" }
      })
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Handle search
    if (search) {
      const supplierIds = await SupplierModel.find({
        supplierName: { $regex: search, $options: "i" },
      }).distinct("_id");

      query = PurchaseModel.find({
        ...filter,
        $or: [
          { purchaseNo: { $regex: search, $options: "i" } },
          { supplierId: { $in: supplierIds } },
        ],
      })
        .populate("supplierId", "supplierName phone email")
        .populate({
          path: "items.productId",
          select: "itemBarcode category productName unit purchasePrice",
          populate: { path: "category", select: "categoryName" }
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
    }

    const purchases = await query;
    const normalizedPurchases = purchases.map((pur) => {
      const obj = pur.toObject();
      obj.items = (obj.items || []).map((item) => {
        const ib =
          item.itemBarcode ||
          (item.productId && item.productId.itemBarcode) ||
          "";
        return { ...item, itemBarcode: ib };
      });
      return obj;
    });
    const total = await PurchaseModel.countDocuments(filter);

    res.json({
      success: true,
      count: normalizedPurchases.length,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
      purchases: normalizedPurchases,
      data: normalizedPurchases,
    });
  } catch (err) {
    // console.error("Get supplier purchases error:", err);

    next(err);
  }
};

// Get single purchase
exports.getPurchaseById = async (req, res, next) => {
  try {
    const { CreatePurchase: PurchaseModel } = await getAutoModels(req);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid purchase ID format",
      });
    }

    const purchase = await PurchaseModel.findById(req.params.id)
      .populate(
        "supplierId",
        "supplierName  phone email address city state country pincode gstin",
      )
      .populate("createdBy", "firstName lastName email")
      .populate(
        "items.productId",
        "productName images hsn  unit purchasePrice tax barcode",
      );

    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: "Purchase not found",
      });
    }

    // Calculate totals if needed
    if (!purchase.subtotal || !purchase.totalTax || !purchase.grandTotal) {
      purchase.calculateTotals();
      await purchase.save();
    }

    res.json({
      success: true,
      purchase: purchase,           
      purchaseOrder: purchase,      
      data: purchase,               
      formatted: {
        purchaseDate: purchase.formattedDate,
        dueDate: purchase.formattedDueDate,
      },
    });
  } catch (err) {
     console.error("Get purchase error:", err);
    next(err);
  }
};
// Update purchase
exports.updatePurchase = async (req, res, next) => {
  try {
    const {
      CreatePurchase: PurchaseModel,
      Supplier: SupplierModel,
      Product: ProductModel,
    } = await getAutoModels(req);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid purchase ID format",
      });
    }

    const purchase = await PurchaseModel.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: "Purchase not found",
      });
    }

    // Parse FormData if exists
    let updateData = req.body;
    if (
      Object.keys(req.body).some(
        (key) => key.includes("[") && key.includes("]"),
      )
    ) {
      updateData = parseFormDataNested(req.body);
    }
    
    // Store old values for adjustment
    const oldStatus = purchase.status;
    const oldPaidAmount = purchase.paidAmount;
    const oldGrandTotal = purchase.grandTotal;
    const oldDueAmount = purchase.dueAmount;
    const oldItems = [...purchase.items];

    // ========== FIXED: Status change validation ==========
    if (updateData.status !== undefined) {
      const currentStatus = purchase.status;
      const newStatus = updateData.status;

      // NEW: If order is already approved (received), prevent any status change
      if (currentStatus === "received") {
        return res.status(400).json({
          success: false,
          error: "Cannot change status of an approved purchase order. Status is locked.",
        });
      }

      // Prevent changing from cancelled status as well
      if (currentStatus === "cancelled") {
        return res.status(400).json({
          success: false,
          error: "Cannot change status of a cancelled purchase order.",
        });
      }

      // Only allow specific transitions from "converted"
      if (currentStatus === "converted") {
        if (!["received", "cancelled"].includes(newStatus)) {
          return res.status(400).json({
            success: false,
            error: `Can only change from "converted" to "received" or "cancelled"`,
            allowedTransitions: ["received", "cancelled"],
          });
        }
      }
    }

    // Update fields
    const updatableFields = [
      "items",
      "billingAddress",
      "shippingAddress",
      "additionalDiscount",
      "additionalCharges",
      "additionalChargesDetails",
      "autoRoundOff",
      "paidAmount",
      "fullyReceived",
      "paymentMethod",
      "notes",
      "termsAndConditions",
      "status",
      "dueDate",
      "purchaseDate",
      "dueAmount",
      "referenceNo",
      "receiptDate",
    ];

    updatableFields.forEach((field) => {
      if (updateData[field] !== undefined) {
        if (field === "autoRoundOff" || field === "fullyReceived") {
          purchase[field] = updateData[field] === true || updateData[field] === "true";
        } else if (field === "paidAmount" || field === "dueAmount") {
          purchase[field] = parseFloat(updateData[field]) || 0;
        } else if (field === "additionalDiscount" && typeof updateData[field] === "string") {
          try {
            purchase[field] = JSON.parse(updateData[field]);
          } catch {
            purchase[field] = { pct: 0, amt: 0 };
          }
        } else {
          purchase[field] = updateData[field];
        }
      }
    });
    let attachments = [...(purchase.attachments || [])];

// Handle existing attachments (keep ones that are still there)
if (req.body.existingAttachments !== undefined) {
  try {
    const existingList = typeof req.body.existingAttachments === 'string'
      ? JSON.parse(req.body.existingAttachments)
      : req.body.existingAttachments;
    
    // Keep only attachments that exist in the existingList
    attachments = (purchase.attachments || []).filter(att =>
      existingList.some(existing => existing.public_id === att.public_id)
    );
    
    // Delete removed attachments from Cloudinary
    const removedAttachments = (purchase.attachments || []).filter(att =>
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
    console.error("Error parsing existing attachments:", e);
  }
}

// Handle new file uploads
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

purchase.attachments = attachments;

    // ========== FIXED: Handle APPROVAL (status becomes "received") ==========
    if (updateData.status === "received" && oldStatus !== "received") {
      // ONLY add stock when approving - NEVER before
      for (const item of purchase.items) {
        if (item.productId) {
          const product = await ProductModel.findById(item.productId);
          
          if (product && product.variants && product.variants.length > 0) {
            const variant = product.variants.find(v => 
              (!item.selectedColor || v.color === item.selectedColor) &&
              (!item.selectedSize || v.size === item.selectedSize)
            );
            
            if (variant) {
              variant.stockQuantity = Math.max(0, (variant.stockQuantity || 0) + item.qty);
              await product.save();
            } else {
              await ProductModel.findByIdAndUpdate(item.productId, {
                $inc: { stockQuantity: item.qty },
              });
            }
          } else {
            await ProductModel.findByIdAndUpdate(item.productId, {
              $inc: { stockQuantity: item.qty },
            });
          }
        }
      }
      
      // Update supplier statistics
      await SupplierModel.findByIdAndUpdate(purchase.supplierId, {
        $inc: {
          totalInvoices: 1,
          totalPurchaseAmount: purchase.grandTotal,
          totalPaidAmount: purchase.paidAmount || 0,
          totalDueAmount: purchase.dueAmount,
        },
        $set: {
          lastInvoiceDate: new Date(),
          lastPurchaseAmount: purchase.grandTotal,
        },
      });
      
      // Add payment record if any payment was made
      if (purchase.paidAmount > 0 && !purchase.paymentHistory?.length) {
        if (!purchase.paymentHistory) purchase.paymentHistory = [];
        purchase.paymentHistory.push({
          date: new Date(),
          amount: purchase.paidAmount,
          method: purchase.paymentMethod,
          notes: "Initial payment on approval",
          addedBy: req.user?._id,
        });
      }
    }

    // ========== FIXED: Handle REJECTION (status becomes "cancelled") ==========
    // IMPORTANT: Rejection should NEVER affect stock
    if (updateData.status === "cancelled" && oldStatus !== "cancelled") {
      // NO stock reversal here - stock was never added for converted orders
      // Only approved orders (received) cannot be rejected due to the check above
      
      // Set financial amounts to 0 for cancelled order
      purchase.paidAmount = 0;
      purchase.dueAmount = 0;
      purchase.fullyReceived = false;
      
      // Reverse any supplier statistics if payments were recorded
      if (oldPaidAmount > 0) {
        await SupplierModel.findByIdAndUpdate(purchase.supplierId, {
          $inc: {
            totalPaidAmount: -oldPaidAmount,
            totalDueAmount: -oldDueAmount,
          },
        });
      }
    }

    // ========== REMOVE THIS ENTIRE OLD BLOCK ==========
    // DELETE or COMMENT OUT the old rejection block that reversed stock:
    /*
    if (updateData.status === "cancelled" && oldStatus !== "cancelled") {
      skipStockAdjustment = true;
      for (const item of oldItems) {
        // ... stock reversal code ...
      }
    }
    */

    // Handle stock adjustment if items changed (but NOT for status changes)
    if (updateData.items !== undefined && updateData.status !== "cancelled" && oldStatus !== "received") {
      const updateVariantStock = async (productId, item, isIncrement) => {
        const product = await ProductModel.findById(productId);
        if (!product) return;
        const quantity = isIncrement ? item.qty : -item.qty;
        
        if (product.variants && product.variants.length > 0) {
          const variant = product.variants.find(v =>
            (!item.selectedColor || v.color === item.selectedColor) &&
            (!item.selectedSize || v.size === item.selectedSize)
          );
          if (variant) {
            variant.stockQuantity = Math.max(0, (variant.stockQuantity || 0) + quantity);
            await product.save();
          } else {
            await ProductModel.findByIdAndUpdate(productId, { $inc: { stockQuantity: quantity } });
          }
        } else {
          await ProductModel.findByIdAndUpdate(productId, { $inc: { stockQuantity: quantity } });
        }
      };

      // Restore old stock
      for (const item of oldItems) {
        if (item.productId) await updateVariantStock(item.productId, item, false);
      }
      // Add new stock
      for (const item of purchase.items) {
        if (item.productId) await updateVariantStock(item.productId, item, true);
      }
    }

    // Recalculate totals
    purchase.calculateTotals();

    // Handle status update based on payment (if status not explicitly set)
    if (updateData.status === undefined &&
        (updateData.paidAmount !== undefined || updateData.fullyReceived !== undefined) &&
        !["received", "cancelled"].includes(purchase.status)) {
      const newPaidAmount = purchase.paidAmount || 0;
      const newFullyReceived = purchase.fullyReceived || false;
      
      if (newFullyReceived || newPaidAmount >= purchase.grandTotal) {
        purchase.status = "received";
      } else if (newPaidAmount > 0) {
        purchase.status = "partial";
      } else {
        purchase.status = "converted";
      }
    }

    // Handle file uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "supplier_invoice_attachments",
          });
          purchase.attachments.push({
            url: result.secure_url,
            public_id: result.public_id,
            filename: file.originalname,
            uploadedAt: new Date(),
          });
        } catch (uploadError) {
          next(uploadError);
        }
      }
    }

    // Save updated invoice
    purchase.updatedAt = new Date();
    await purchase.save();

    // Update supplier statistics if amounts changed
    if (oldGrandTotal !== purchase.grandTotal || oldPaidAmount !== purchase.paidAmount) {
      const amountDiff = purchase.grandTotal - oldGrandTotal;
      const paidDiff = purchase.paidAmount - oldPaidAmount;
      await SupplierModel.findByIdAndUpdate(purchase.supplierId, {
        $inc: {
          totalPurchaseAmount: amountDiff,
          totalPaidAmount: paidDiff,
          totalDueAmount: purchase.grandTotal - purchase.paidAmount - (oldGrandTotal - oldPaidAmount),
        },
      });
    }

    // Populate for response
    const populatedPurchase = await PurchaseModel.findById(purchase._id)
      .populate("supplierId", "name phone email")
      .populate("items.productId", "productName hsn");

    res.json({
      success: true,
      message: "Purchase updated successfully",
      purchase: populatedPurchase,
      purchaseOrder: populatedPurchase,
      data: populatedPurchase, 
      changes: {
        paidAmount: oldPaidAmount !== purchase.paidAmount,
        status: oldStatus !== purchase.status,
        itemsChanged: updateData.items !== undefined,
      },
    });
  } catch (err) {
    console.error("Update supplier invoice error:", err);
    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: Object.values(err.errors).map((e) => e.message),
      });
    }
    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Purchase number conflict",
      });
    }
    res.status(500).json({
      success: false,
      error: "Failed to update purchase",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Delete invoice
exports.deletePurchase = async (req, res, next) => {
  try {
    const {
      Purchase: purchaseModel,
      Supplier: SupplierModel,
      Product: ProductModel,
    } = await getAutoModels(req);
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid purchase ID format",
      });
    }

    const purchase = await purchaseModel.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: "Purchase not found",
      });
    }

    const supplierId = purchase.supplierId;
    const paidAmount = purchase.paidAmount || 0;
    const grandTotal = purchase.grandTotal || 0;
    const items = purchase.items || [];

    // Restore product stock (DECREASE stock when deleting supplier invoice)
    // for (const item of items) {
    //   if (item.productId) {
    //     await ProductModel.findByIdAndUpdate(item.productId, {
    //       $inc: { stockQuantity: -item.qty },
    //     });
    //   }
    // }
    // Restore product stock (DECREASE stock when deleting supplier invoice) - WITH VARIANT SUPPORT
    for (const item of items) {
      if (item.productId) {
        const product = await ProductModel.findById(item.productId);

        if (product && product.variants && product.variants.length > 0) {
          const variant = product.variants.find(v =>
            (!item.selectedColor || v.color === item.selectedColor) &&
            (!item.selectedSize || v.size === item.selectedSize)
          );

          if (variant) {
            variant.stockQuantity = Math.max(0, (variant.stockQuantity || 0) - item.qty);
            if (variant.openingQuantity !== undefined) {
              variant.openingQuantity = Math.max(0, (variant.openingQuantity || 0) - item.qty);
            }
            await product.save();
          } else {
            await ProductModel.findByIdAndUpdate(item.productId, {
              $inc: { stockQuantity: -item.qty },
            });
          }
        } else {
          await ProductModel.findByIdAndUpdate(item.productId, {
            $inc: { stockQuantity: -item.qty },
          });
        }
      }
    }

    // Update supplier statistics
    await SupplierModel.findByIdAndUpdate(supplierId, {
      $inc: {
        totalInvoices: -1,
        totalPurchaseAmount: -grandTotal,
        totalPaidAmount: -paidAmount,
        totalDueAmount: -(grandTotal - paidAmount),
      },
    });

    // Delete attachments from Cloudinary
    if (purchase.attachments && purchase.attachments.length > 0) {
      const deletePromises = purchase.attachments
        .filter((attachment) => attachment.public_id)
        .map((attachment) =>
          cloudinary.uploader.destroy(attachment.public_id).catch((err) => {
            // console.error(`Failed to delete Cloudinary file ${attachment.public_id}:`,err.message,);
          }),
        );

      await Promise.allSettled(deletePromises);
    }

    // Delete the purchase
    await purchaseModel.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Supplier purchase deleted successfully",
      deleted: {
        purchaseId: req.params.id,
        purchaseNo: purchase.purchaseNo,
        stockAdjusted: items.length,
        attachmentsDeleted: purchase.attachments?.length || 0,
      },
    });
  } catch (err) {
    // console.error("Delete supplier purchase error:", err);
    // res.status(500).json({
    //   success: false,
    //   error: "Failed to delete purchase",
    //   message: process.env.NODE_ENV === "development" ? err.message : undefined,
    // });
    next(err);
  }
};

// Add payment to invoice
exports.addPayment = async (req, res, next) => {
  try {
    const {
      CreatePurchase: PurchaseModel,
      Supplier: SupplierModel,
    } = await getAutoModels(req);

    const { amount, paymentMethod, referenceNumber, notes } = req.body;

    // Validate input
    if (!amount || isNaN(amount) || parseFloat(amount) <= 0) {
      return res.status(400).json({
        success: false,
        error: "Valid payment amount greater than 0 is required",
      });
    }

    const paymentAmount = parseFloat(amount);

    // Validate invoice ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid purchase  ID format",
      });
    }

   const purchase = await PurchaseModel.findById(req.params.id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: "Purchase not found",
      });
    }
    
    // ✅ NEW: Restrict payment date to current date only
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0); // Reset time to start of day
    
    // Use current date always - ignore any date sent from frontend
    const paymentDate = currentDate;
        // Check if purchase is already fully paid
    if (purchase.paidAmount >= purchase.grandTotal) {
      return res.status(400).json({
        success: false,
        error: "Purchase is already fully paid",
        dueAmount: purchase.dueAmount,
        paidAmount: purchase.paidAmount,
      });
    }

    // ✅ MODIFIED: Allow payments on received/approved orders but check if fully paid
    if (purchase.status === "cancelled") {
      return res.status(400).json({
        success: false,
        error: "Cannot add payment to a cancelled purchase",
      });
    }

    // Calculate remaining due (even for received orders)
    const remainingDue = purchase.grandTotal - purchase.paidAmount;
    if (paymentAmount > remainingDue) {
      return res.status(400).json({
        success: false,
        error: `Payment amount exceeds due amount. Due: ₹${remainingDue.toFixed(2)}`,
        dueAmount: remainingDue,
        maxPayment: remainingDue,
      });
    }

    // Store old values
    const oldPaidAmount = purchase.paidAmount;
    const oldStatus = purchase.status;
    const oldDueAmount = purchase.dueAmount;

    // Update purchase payment
   purchase.paidAmount += paymentAmount;
    purchase.paymentMethod = paymentMethod || purchase.paymentMethod;

    // Add payment note if provided
    if (notes) {
      purchase.notes = purchase.notes
        ? `${purchase.notes}\nPayment: ${notes}`
        : `Payment: ${notes}`;
    }

    // Recalculate totals and status
    purchase.calculateTotals();

    // ✅ Update status based on payment
    if(purchase.status === "received") {
    if (purchase.paidAmount >= purchase.grandTotal) {
      purchase.fullyReceived = true;
    } 
    // else if (purchase.paidAmount > 0) {
    //   purchase.status = "partial";
    // }
  }

    // Add payment record to payment history
    if (!purchase.paymentHistory) {
      purchase.paymentHistory = [];
    }

    purchase.paymentHistory.push({
     date: paymentDate,
      amount: paymentAmount,
      method: paymentMethod || purchase.paymentMethod,
      reference: referenceNumber || "",
      notes: notes || "",
      addedBy: req.user?._id,
    });

    await purchase.save();

    // Update supplier statistics
    await SupplierModel.findByIdAndUpdate(purchase.supplierId, {
      $inc: {
        totalPaidAmount: paymentAmount,
        totalDueAmount: -paymentAmount,
      },
      $set: {
        lastPaymentDate: new Date(),
      },
    });

    // Populate for response
    const populatedPurchase = await PurchaseModel.findById(purchase._id)
      .populate("supplierId", "name phone")
      .populate("createdBy", "firstName lastName");

    res.json({
      success: true,
      message: "Payment added successfully",
      purchase: populatedPurchase,
      payment: {
        amount: paymentAmount,
        previousPaid: oldPaidAmount,
        newPaid: purchase.paidAmount,
        previousDue: oldDueAmount,
        newDue: purchase.dueAmount,
        statusChanged: oldStatus !== purchase.status,
        newStatus: purchase.status,
      },
    });
  } catch (err) {
    console.error("Add payment error:", err);
    next(err);
  }
};

// Get purchase statistics
exports.getPurchaseStats = async (req, res, next) => {
  try {
    const { CreatePurchase: PurchaseModel } = await getAutoModels(req);
    
    const stats = await PurchaseModel.aggregate([
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: "$grandTotal" },
          totalPaid: { $sum: "$paidAmount" },
          totalDue: { $sum: "$dueAmount" },
          avgPurchaseValue: { $avg: "$grandTotal" }
        }
      }
    ]);

    const result = stats[0] || {
      totalInvoices: 0,
      totalAmount: 0,
      totalPaid: 0,
      totalDue: 0,
      avgPurchaseValue: 0
    };

    res.json({
      success: true,
      stats: {
        totalInvoices: result.totalInvoices,
        totalAmount: result.totalAmount,
        totalPaid: result.totalPaid,
        totalDue: result.totalDue,
        avgPurchaseValue: result.avgPurchaseValue
      }
    });
  } catch (err) {
    console.error("Get stats error:", err);
    res.status(200).json({
      success: true,
      stats: {
        totalInvoices: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalDue: 0,
        avgPurchaseValue: 0
      }
    });
  }
};

// Get purchases by supplier
exports.getPurchasesBySupplier = async (req, res, next) => {
  try {
    const { CreatePurchase: PurchaseModel } = await getAutoModels(req);
    const { supplierId } = req.params;
    const {
      status,
      startDate,
      endDate,
      limit = 50,
      page = 1,
      search = "",
    } = req.query;

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid supplier ID format",
      });
    }

    const filter = { supplierId };

    if (status && status !== "all") {
      filter.status = status;
    }

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

    const limitNum = parseInt(limit);
    const pageNum = Math.max(1, parseInt(page));
    const skip = (pageNum - 1) * limitNum;

    const term = String(search || "").trim();
    const queryFilter = { ...filter };
    if (term) {
      queryFilter.$or = [
        { purchaseNo: { $regex: term, $options: "i" } },
        { "items.itemName": { $regex: term, $options: "i" } },
      ];
    }

    const purchases = await PurchaseModel.find(queryFilter)
      .select(
        "_id purchaseNo purchaseDate dueDate grandTotal paidAmount dueAmount status paymentMethod items",
      )
      .populate({
        path: "items.productId",
        select:
          "itemBarcode stockQuantity productName hsn purchasePrice category",
        populate: { path: "category", select: "categoryName" },
      })
      .sort({ purchaseDate: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await PurchaseModel.countDocuments(queryFilter);

    const summary = {
      totalInvoices: total,
      totalAmount: purchases.reduce(
        (sum, pur) => sum + (pur.grandTotal || 0),
        0,
      ),
      totalPaid: purchases.reduce((sum, pur) => sum + (pur.paidAmount || 0), 0),
      totalDue: purchases.reduce((sum, pur) => sum + (pur.dueAmount || 0), 0),
    };

    res.json({
      success: true,
      count: purchases.length,
      summary,
      purchases: purchases,
      pagination: {
        page: pageNum,
        limit: limitNum,
        total,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
    });
  } catch (error) {
    // console.error("Get supplier invoices error:", error);
    // res.status(500).json({
    //   success: false,
    //   error: "Failed to fetch supplier invoices",
    // });
    next(error);
  }
};

// Get unpaid purchases by supplier
exports.getUnpaidPurchasesBySupplier = async (req, res, next) => {
  try {
    const { CreatePurchase: PurchaseModel } = await getAutoModels(req);
    const { supplierId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid supplier ID format",
      });
    }

    const unpaidPurchases  = await PurchaseModel.find({
      supplierId,
      dueAmount: { $gt: 0 },
      status: { $in: ["converted", "partial"] },
    })
      .select(
        "_id purchaseNo purchaseDate dueDate grandTotal paidAmount dueAmount status",
      )
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      count: unpaidPurchases.length,
      purchases: unpaidPurchases,
    });
  } catch (error) {
    // console.error("Get unpaid supplier invoices error:", error);
    // res.status(500).json({
    //   success: false,
    //   error: "Failed to fetch unpaid invoices",
    // });
    next(error);
  }
};

// Get overdue invoices by supplier
exports.getOverduePurchasesBySupplier = async (req, res, next) => {
  try {
    const { CreatePurchase: PurchaseModel } = await getAutoModels(req);
    const { supplierId } = req.params;
    const today = new Date();

    if (!mongoose.Types.ObjectId.isValid(supplierId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid supplier ID format",
      });
    }

    const overduePurchases = await PurchaseModel.find({
      supplierId,
      dueDate: { $lt: today },
      dueAmount: { $gt: 0 },
      status: { $in: ["converted", "partial"] },
    })
      .select(
        "_id purchaseNo purchaseDate dueDate grandTotal paidAmount dueAmount status",
      )
      .sort({ dueDate: 1 });

    const totalOverdue = overduePurchases.reduce(
      (sum, pur) => sum + pur.dueAmount,
      0,
    );

    res.json({
      success: true,
      count: overduePurchases.length,
      totalOverdue,
      purchases: overduePurchases,
    });
  } catch (error) {
    // console.error("Get overdue supplier invoices error:", error);
    // res.status(500).json({
    //   success: false,
    //   error: "Failed to fetch overdue invoices",
    // });
    next(error);
  }
};

// Add this to your purchase order update function or create a new endpoint
exports.updateDebitNoteReference = async (req, res) => {
  try {
    const { id } = req.params;
    const { debitNoteId, debitNoteCreated } = req.body;
const { CreatePurchase: PurchaseModel } = await getAutoModels(req);
    const purchaseOrder = await PurchaseModel.findById(id);
    if (!purchaseOrder) {
      return res.status(404).json({ success: false, error: "Purchase order not found" });
    }

    // Update debit note reference
    purchaseOrder.debitNoteId = debitNoteId;
    purchaseOrder.hasDebitNote = debitNoteCreated;

    // If the debit note is for the full amount, mark as completed
    if (debitNoteCreated && purchaseOrder.status === "converted") {
      // Optionally update status based on debit note amount
      purchaseOrder.status = "partial"; // or keep as is
    }

    await purchaseOrder.save();

    res.json({ success: true, message: "Purchase order updated with debit note reference" });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add this new function after getAllPurchases
exports.getPurchaseStatusCounts = async (req, res, next) => {
  try {
   const { CreatePurchase: PurchaseModel } = await getAutoModels(req);
    
    const counts = await PurchaseModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    
    const statusCounts = {
      all: 0,
      converted: 0,
      received: 0,
      cancelled: 0
    };
    
    counts.forEach(item => {
      statusCounts.all += item.count;
      if (item._id === "converted") statusCounts.converted = item.count;
      if (item._id === "received") statusCounts.received = item.count;
      if (item._id === "cancelled") statusCounts.cancelled = item.count;
    });
    
    res.json({
      success: true,
      counts: statusCounts
    });
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add this function to your controller
exports.deleteAttachment = async (req, res, next) => {
  try {
    const { CreatePurchase: PurchaseModel } = await getAutoModels(req);
    const { id, attachmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid purchase ID format"
      });
    }

    const purchase = await PurchaseModel.findById(id);
    if (!purchase) {
      return res.status(404).json({
        success: false,
        error: "Purchase order not found"
      });
    }

    const attachment = purchase.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: "Attachment not found"
      });
    }

    if (attachment.public_id) {
      try {
        await cloudinary.uploader.destroy(attachment.public_id);
      } catch (err) {
        console.error("Failed to delete from Cloudinary:", err);
      }
    }

    purchase.attachments.pull(attachmentId);
    await purchase.save();

    res.json({
      success: true,
      message: "Attachment deleted successfully"
    });
  } catch (error) {
    console.error("Delete attachment error:", error);
    next(error);
  }
};
