const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");
const cloudinary = require("../utils/cloudinary/cloudinary");
const mongoose = require("mongoose");
// const Quotation = require("../models/CustomerQuotationModel");
// const Invoice = require("../models/CustomerInvoiceModel");
// const Customer = require("../models/customerModel");

// Helper: Generate unique quotation number
const generateQuotationNo = async (QuotationModel) => {
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  // Count quotations with same prefix (QUOT + YYYY + MM)
  const prefix = `QUOT${year}${month}`;
  const count = await QuotationModel.countDocuments({
    quotationNo: { $regex: `^${prefix}` },
  });

  // Generate 3-digit sequence
  const sequence = String(count + 1).padStart(3, "0");
  return `${prefix}${sequence}`;
};

// Helper: Parse FormData nested objects
const parseFormDataNested = (body) => {
  const parsed = { ...body };

  // Parse additionalDiscount
  // Parse additionalDiscount
  if (
    body["additionalDiscount[pct]"] !== undefined ||
    body["additionalDiscount[amt]"] !== undefined
  ) {
    parsed.additionalDiscount = {
      pct: parseFloat(body["additionalDiscount[pct]"]) || 0,
      amt: parseFloat(body["additionalDiscount[amt]"]) || 0,
    };
    // Remove the original flat keys
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
    parsed.additionalChargesDetails = {
      shipping: parseFloat(body["additionalChargesDetails[shipping]"]) || 0,
      handling: parseFloat(body["additionalChargesDetails[handling]"]) || 0,
      packing: parseFloat(body["additionalChargesDetails[packing]"]) || 0,
      service: parseFloat(body["additionalChargesDetails[service]"]) || 0,
      other: parseFloat(body["additionalChargesDetails[other]"]) || 0,
    };
    // Remove the original flat keys
    Object.keys(body).forEach(key => {
      if (key.startsWith("additionalChargesDetails[")) {
        delete parsed[key];
      }
    });
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
      } else if (field === "selectedSerialNos") {
        try {
          const serialNosValue = body[key];
          if (typeof serialNosValue === "string") {
            if (serialNosValue.startsWith("[") && serialNosValue.endsWith("]")) {
              items[index][field] = JSON.parse(serialNosValue);
            } else {
              items[index][field] = serialNosValue
                .split(",")
                .map(s => s.trim())
                .filter(s => s);
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
        items[index][field] = body[key];
      }

      // Remove the original flat key from parsed
      delete parsed[key];
    }
  });

  if (items.length > 0) {
    parsed.items = items.filter((item) => item !== undefined);
  }

  return parsed;
};

// Create quotation
exports.createQuotation = async (req, res, next) => {
  try {
    const { Quotation: QuotationModel, Customer: CustomerModel, Product: ProductModel } = await getAutoModels(req);
    // Parse FormData first
    const parsedBody = parseFormDataNested(req.body);

    // console.log("Parsed FormData for Quotation:", JSON.stringify(parsedBody, null, 2));

    // Extract fields from parsed body
    let {
      customerId,
      quotationDate,
      expiryDate,
      validForDays = 30,
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
      shoppingPointsUsed = 0,
      pointValue = 10,
      autoRoundOff = false,
      grandTotal,
      notes = "",
      termsAndConditions = "",
      status = "active",
    } = parsedBody;

    // Convert string booleans and numbers
    autoRoundOff = autoRoundOff === true || autoRoundOff === "true";
    validForDays = parseInt(validForDays) || 30;
    shoppingPointsUsed = parseFloat(shoppingPointsUsed) || 0;
    subtotal = parseFloat(subtotal) || 0;
    totalTax = parseFloat(totalTax) || 0;
    totalDiscount = parseFloat(totalDiscount) || 0;
    grandTotal = parseFloat(grandTotal) || 0;
    additionalCharges = parseFloat(additionalCharges) || 0;

    // Validate required fields
    if (!customerId) {
      return res.status(400).json({
        success: false,
        error: "Customer ID is required",
      });
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one item is required",
      });
    }

    // Validate customer exists
    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    // Validate shopping points
    if (shoppingPointsUsed > 0) {
      const availablePoints = customer.availablePoints || 0;
      if (shoppingPointsUsed > availablePoints) {
        return res.status(400).json({
          success: false,
          error: `Insufficient shopping points. Available: ${availablePoints}`,
        });
      }
    }

    // Validate products
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

      // Use item data from frontend (already calculated)
      const validatedItem = {
        productId: item.productId,
        itemName: item.itemName || product.productName,
        hsnCode: item.hsnCode || product.hsnCode || "",
        description: item.description || product.description || "",
        lotNumber: item.lotNumber || product.lotNumber || "",
        selectedSerialNos: item.selectedSerialNos || [],
        qty: parseFloat(item.qty) || 1,
        unit: item.unit || product.unit || "Piece",
        unitPrice: parseFloat(item.unitPrice) || product.sellingPrice || 0,
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

    // Calculate points redeemed amount
    const pointsRedeemedAmount = shoppingPointsUsed * pointValue;

    // Generate quotation number
    const quotationNo = await generateQuotationNo(QuotationModel);

    // Handle file uploads if any
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          // For PDFs and other non-image files, use 'raw' resource_type
      const resourceType = file.mimetype.startsWith('image/') ? 'image' : 'raw';
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "quotation_attachments",
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

    // Calculate expiry date if not provided
    let calculatedExpiryDate;
    if (expiryDate) {
      calculatedExpiryDate = new Date(expiryDate);
    } else {
      calculatedExpiryDate = new Date(quotationDate || new Date());
      calculatedExpiryDate.setDate(
        calculatedExpiryDate.getDate() + validForDays,
      );
    }

    // Create quotation
    const quotation = new QuotationModel({
      customerId,
      quotationNo,
      quotationDate: quotationDate ? new Date(quotationDate) : new Date(),
      expiryDate: calculatedExpiryDate,
      validForDays,
      items: validatedItems,
      billingAddress: billingAddress || customer.address || "",
      shippingAddress:
        shippingAddress || billingAddress || customer.address || "",
      subtotal: subtotal,
      totalTax: totalTax,
      totalDiscount: totalDiscount,
      additionalDiscount: additionalDiscount,
      additionalCharges: additionalCharges,
      additionalChargesDetails: additionalChargesDetails,
      shoppingPointsUsed: shoppingPointsUsed,
      pointValue: pointValue,
      autoRoundOff: autoRoundOff,
      grandTotal: grandTotal,
      status: status,
      notes: notes,
      termsAndConditions: termsAndConditions,
      attachments: attachments,
      createdBy: req.user?._id,
      isLatest: true,
      isRevised: false,
      revisionNumber: 1,
    });

    // Calculate round off value if needed
    if (autoRoundOff) {
      const itemsDiscount = validatedItems.reduce(
        (sum, item) => sum + (item.discountAmt || 0),
        0,
      );
      const additionalDiscountValue =
        additionalDiscount.amt +
        (subtotal * (additionalDiscount.pct || 0)) / 100;
      const totalDiscountCalc = itemsDiscount + additionalDiscountValue;

      const totalBeforeRound =
        subtotal +
        totalTax +
        additionalCharges -
        totalDiscountCalc -
        pointsRedeemedAmount;

      quotation.roundOffValue = Math.round(totalBeforeRound) - totalBeforeRound;
    }

    // Save quotation
    await quotation.save();

    // Update customer shopping points if used
    if (shoppingPointsUsed > 0) {
      await CustomerModel.findByIdAndUpdate(customerId, {
        $inc: {
          availablePoints: -shoppingPointsUsed,
          usedPoints: shoppingPointsUsed,
        },
        $set: {
          lastPointsRedeemedDate: new Date(),
        },
      });
    }

    // Populate and return response
    const populatedQuotation = await QuotationModel.findById(quotation._id)
      .populate("customerId", "name phone email availablePoints")
      .populate("items.productId", "productName hsnCode unit sellingPrice")
      .populate("createdBy", "firstName lastName");

    res.status(201).json({
      success: true,
      message: "Quotation created successfully",
      quotation: populatedQuotation,
      points: {
        redeemed: shoppingPointsUsed,
      },
    });
  } catch (err) {
    // console.error("Quotation creation error:", err);
    next(err); // Pass error to centralized error handler

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
        error: "Quotation number already exists",
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

// Get all quotations with filters
exports.getAllQuotations = async (req, res, next) => {
  try {
    const { Quotation: QuotationModel } = await getAutoModels(req);
    const {
      customerId,
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
      expired = false,
    } = req.query;

    const filter = {};

    // Validate customerId
    if (customerId) {
      if (!mongoose.Types.ObjectId.isValid(customerId)) {
        return res.status(400).json({
          success: false,
          error: "Invalid customer ID format",
        });
      }
      filter.customerId = customerId;
    }

    // Validate status
    if (status) {
      const allowedStatuses = [
        "draft",
        "sent",
        "accepted",
        "rejected",
        "expired",
        "converted",
      ];
      if (!allowedStatuses.includes(status)) {
        return res.status(400).json({
          success: false,
          error: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
        });
      }
      filter.status = status;
    }

    // Filter expired quotations
    if (expired === "true" || expired === true) {
      filter.expiryDate = { $lt: new Date() };
    } else if (expired === "false" || expired === false) {
      filter.expiryDate = { $gte: new Date() };
    }

    // Date range filter
    if (startDate || endDate) {
      filter.quotationDate = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            error: "Invalid start date format",
          });
        }
        filter.quotationDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            error: "Invalid end date format",
          });
        }
        filter.quotationDate.$lte = end;
      }
    }

    // Parse pagination parameters safely
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build query
    let query = QuotationModel.find(filter)
      .populate("customerId", "name phone email")
      .populate("createdBy", "firstName lastName")
      .populate("convertedToInvoice", "invoiceNo status")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Handle search
    if (search) {
      query = QuotationModel.find({
        ...filter,
        quotationNo: { $regex: search, $options: "i" },
      })
        .populate("customerId", "name phone email")
        .populate("createdBy", "firstName lastName")
        .populate("convertedToInvoice", "invoiceNo status")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
    }

    const quotations = await query;
     if (quotations.length > 0) {
      if (quotations[0].customerId && typeof quotations[0].customerId === 'object') {
      }
    }
    const total = await QuotationModel.countDocuments(filter);

    // Format response
    const response = {
      success: true,
      count: quotations.length,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
      quotations,
    };

    if (search && quotations.length === 0) {
      response.message = "No quotations found matching your search";
    }

    res.json(response);
  } catch (err) {
    // console.error("Get quotations error:", err);
    next(err); // Pass error to centralized error handler
    res.status(500).json({
      success: false,
      error: "Failed to fetch quotations",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};


// Get single quotation by ID
exports.getQuotationById = async (req, res, next) => {
  try {
    const { Quotation: QuotationModel } = await getAutoModels(req);
    // Validate ID format
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid quotation ID format",
      });
    }

    const quotation = await QuotationModel.findById(req.params.id)
      .populate(
        "customerId",
        "name phone email address city state country pincode gstin",
      )
      .populate("createdBy", "firstName lastName email")
      .populate("convertedToInvoice", "invoiceNo invoiceDate status grandTotal")
      .populate(
        "items.productId",
        "productName hsnCode sku barcode unit sellingPrice tax",
      );

    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
        message: `No quotation found with ID: ${req.params.id}`,
      });
    }

    // Calculate any missing totals
    if (!quotation.subtotal || !quotation.totalTax || !quotation.grandTotal) {
      quotation.calculateTotals();
      await quotation.save();
    }

    res.json({
      success: true,
      quotation,
      formatted: {
        quotationDate: quotation.formattedDate,
        expiryDate: quotation.formattedExpiryDate,
        daysRemaining: quotation.daysRemaining,
      },
    });
  } catch (err) {
    // console.error("Get quotation error:", err);
    next(err); // Pass error to centralized error handler

    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid quotation ID",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to fetch quotation",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Update quotation
// exports.updateQuotation = async (req, res, next) => {
//   try {
//     const { Quotation: QuotationModel, Customer: CustomerModel } = await getAutoModels(req);
//     // Validate quotation ID
//     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid quotation ID format",
//       });
//     }

//     const quotation = await QuotationModel.findById(req.params.id);
//     if (!quotation) {
//       return res.status(404).json({
//         success: false,
//         error: "Quotation not found",
//       });
//     }

//     // Parse FormData if exists
//     let updateData = req.body;
//     if (
//       Object.keys(req.body).some(
//         (key) => key.includes("[") && key.includes("]"),
//       )
//     ) {
//       updateData = parseFormDataNested(req.body);
//     }

//     // Store old values for adjustments
//     const oldPointsUsed = quotation.shoppingPointsUsed;
//     const oldStatus = quotation.status;

//     // Update fields with validation
//     const updatableFields = [
//        "customerId",
//       "items",
//       "billingAddress",
//       "shippingAddress",
//       "additionalDiscount",
//       "additionalCharges",
//       "additionalChargesDetails",
//       "shoppingPointsUsed",
//       "autoRoundOff",
//       "validForDays",
//       "expiryDate",
//       "quotationDate",
//       "status",
//       "notes",
//       "termsAndConditions",
//     ];

//     updatableFields.forEach((field) => {
//       if (updateData[field] !== undefined) {
//         // Convert string booleans
//         if (field === "autoRoundOff") {
//           quotation[field] =
//             updateData[field] === true || updateData[field] === "true";
//         }
//         // Convert numbers
//         else if (field === "shoppingPointsUsed" || field === "validForDays") {
//           quotation[field] = parseFloat(updateData[field]) || 0;
//         }
//         // Parse additionalDiscount if it's a string
//         else if (
//           field === "additionalDiscount" &&
//           typeof updateData[field] === "string"
//         ) {
//           try {
//             quotation[field] = JSON.parse(updateData[field]);
//           } catch {
//             quotation[field] = { pct: 0, amt: 0 };
//           }
//         } else {
//           quotation[field] = updateData[field];
//         }
//       }
//     });

//     // Handle shopping points adjustment
//     if (updateData.shoppingPointsUsed !== undefined) {
//       const newPointsUsed = parseFloat(updateData.shoppingPointsUsed) || 0;

//       if (newPointsUsed !== oldPointsUsed) {
//         const customer = await CustomerModel.findById(quotation.customerId);
//         if (customer) {
//           // Calculate point difference
//           const pointsDiff = newPointsUsed - oldPointsUsed;

//           // Check if customer has enough points for increase
//           if (pointsDiff > 0 && (customer.availablePoints || 0) < pointsDiff) {
//             return res.status(400).json({
//               success: false,
//               error: `Customer doesn't have enough points. Available: ${
//                 customer.availablePoints || 0
//               }`,
//             });
//           }

//           // Update customer points
//           customer.availablePoints =
//             (customer.availablePoints || 0) - pointsDiff;
//           customer.usedPoints = (customer.usedPoints || 0) + pointsDiff;
//           await customer.save();
//         }
//       }
//     }

//     // Recalculate totals
//     quotation.calculateTotals();

//     // Handle file uploads if new files added
//     if (req.files && req.files.length > 0) {
//       for (const file of req.files) {
//         try {
//           const result = await cloudinary.uploader.upload(file.path, {
//             folder: "quotation_attachments",
//           });

//           quotation.attachments.push({
//             url: result.secure_url,
//             public_id: result.public_id,
//             filename: file.originalname,
//             uploadedAt: new Date(),
//           });
//         } catch (uploadError) {
//           console.error("Cloudinary upload error:", uploadError);
//         }
//       }
//     }

//     // Update expiry date based on validForDays if changed
//     if (updateData.validForDays !== undefined && !updateData.expiryDate) {
//       quotation.expiryDate = new Date(quotation.quotationDate);
//       quotation.expiryDate.setDate(
//         quotation.expiryDate.getDate() + quotation.validForDays,
//       );
//     }

//     // Save updated quotation
//     quotation.updatedAt = new Date();
//     await quotation.save();

//     // Populate for response
//     const populatedQuotation = await QuotationModel.findById(quotation._id)
//       .populate("customerId", "name phone email")
//       .populate("createdBy", "firstName lastName")
//       .populate("items.productId", "productName hsnCode");

//     res.json({
//       success: true,
//       message: "Quotation updated successfully",
//       quotation: populatedQuotation,
//       changes: {
//         pointsUsed: oldPointsUsed !== quotation.shoppingPointsUsed,
//         status: oldStatus !== quotation.status,
//       },
//     });
//   } catch (err) {
//     // console.error("Update quotation error:", err);
//     next(err); // Pass error to centralized error handler

//     if (err.name === "ValidationError") {
//       return res.status(400).json({
//         success: false,
//         error: "Validation failed",
//         details: Object.values(err.errors).map((e) => e.message),
//       });
//     }

//     if (err.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         error: "Quotation number conflict",
//       });
//     }

//     res.status(500).json({
//       success: false,
//       error: "Failed to update quotation",
//       message: process.env.NODE_ENV === "development" ? err.message : undefined,
//     });
//   }
// };
// Update quotation with versioning - CREATE NEW DOCUMENT FOR EACH VERSION
exports.updateQuotation = async (req, res, next) => {
  try {
    const { Quotation: QuotationModel, Customer: CustomerModel } = await getAutoModels(req);

    // Validate quotation ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid quotation ID format",
      });
    }

    const currentQuotation = await QuotationModel.findById(req.params.id);
    if (!currentQuotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Check if this is already a revised version
    if (currentQuotation.isRevised && !currentQuotation.isLatest) {
      return res.status(400).json({
        success: false,
        error: "Cannot edit a revised/superseded quotation. Please edit the latest version.",
      });
    }

    // Check if quotation can be edited
    const nonEditableStatuses = ["converted_to_proforma", "converted_to_invoice", "converted_to_order"];
    if (nonEditableStatuses.includes(currentQuotation.status)) {
      return res.status(400).json({
        success: false,
        error: `Cannot edit quotation that has been ${currentQuotation.status.replace("_", " ")}`,
      });
    }

    // Parse FormData if exists
    let updateData = req.body;
    if (Object.keys(req.body).some(key => key.includes("[") && key.includes("]"))) {
      updateData = parseFormDataNested(req.body);
    }

    // Store old values for adjustments
    const oldPointsUsed = currentQuotation.shoppingPointsUsed || 0;

    // 1. Mark the current quotation as OLD/REVISED (but keep it as a record)
    currentQuotation.isLatest = false;
    currentQuotation.isRevised = true;
    currentQuotation.status = "revised";
    currentQuotation.revisedAt = new Date();
    currentQuotation.revisedBy = req.user?._id;
    await currentQuotation.save();

    // 2. Create a NEW quotation document with updated data (this will get a NEW _id)
    const newQuotationData = {
      customerId: currentQuotation.customerId,
      quotationNo: currentQuotation.quotationNo,  // SAME quotation number
      originalQuotationId: currentQuotation.originalQuotationId || currentQuotation._id,
      revisionNumber: (currentQuotation.revisionNumber || 1) + 1,
      isLatest: true,
      isRevised: false,
      // status: updateData.status === "revised" ? "active" : (updateData.status || "active"),
      status: "active",

      // Update with new data (or keep old if not provided)
      quotationDate: updateData.quotationDate ? new Date(updateData.quotationDate) : currentQuotation.quotationDate,
      validForDays: updateData.validForDays || currentQuotation.validForDays,
      items: updateData.items || currentQuotation.items,
      billingAddress: updateData.billingAddress || currentQuotation.billingAddress,
      shippingAddress: updateData.shippingAddress || currentQuotation.shippingAddress,
      additionalDiscount: updateData.additionalDiscount || currentQuotation.additionalDiscount,
      additionalChargesDetails: updateData.additionalChargesDetails || currentQuotation.additionalChargesDetails,
      shoppingPointsUsed: updateData.shoppingPointsUsed !== undefined ? parseFloat(updateData.shoppingPointsUsed) : currentQuotation.shoppingPointsUsed,
      autoRoundOff: updateData.autoRoundOff === true || updateData.autoRoundOff === "true" || currentQuotation.autoRoundOff,
      notes: updateData.notes || currentQuotation.notes,
      termsAndConditions: updateData.termsAndConditions || currentQuotation.termsAndConditions,
      createdBy: req.user?._id,
    };

    // Calculate expiry date
    let expiryDate;
    if (updateData.expiryDate) {
      expiryDate = new Date(updateData.expiryDate);
    } else if (newQuotationData.validForDays) {
      expiryDate = new Date(newQuotationData.quotationDate);
      expiryDate.setDate(expiryDate.getDate() + newQuotationData.validForDays);
    } else {
      expiryDate = currentQuotation.expiryDate;
    }
    newQuotationData.expiryDate = expiryDate;

    // Calculate totals for new quotation
    let subtotal = 0;
    let totalTax = 0;
    let itemsDiscount = 0;

    if (newQuotationData.items && Array.isArray(newQuotationData.items)) {
      newQuotationData.items.forEach(item => {
        const qty = parseFloat(item.qty) || 1;
        const unitPrice = parseFloat(item.unitPrice) || 0;
        subtotal += qty * unitPrice;
        totalTax += parseFloat(item.taxAmount) || 0;
        itemsDiscount += parseFloat(item.discountAmt) || 0;
      });
    }

    // Calculate additional discount
    let additionalDiscountValue = 0;
    if (newQuotationData.additionalDiscount) {
      if (newQuotationData.additionalDiscount.pct > 0) {
        additionalDiscountValue = (subtotal * newQuotationData.additionalDiscount.pct) / 100;
      } else if (newQuotationData.additionalDiscount.amt > 0) {
        additionalDiscountValue = newQuotationData.additionalDiscount.amt;
      }
    }

    const totalDiscount = itemsDiscount + additionalDiscountValue;

    // Calculate additional charges
    const additionalChargesTotal = Object.values(newQuotationData.additionalChargesDetails || {}).reduce((sum, v) => sum + (parseFloat(v) || 0), 0);

    // Calculate points redeemed amount
    const POINT_VALUE = 10;
    const pointsRedeemedAmount = (newQuotationData.shoppingPointsUsed || 0) * POINT_VALUE;

    // Calculate grand total
    let grandTotalBefore = subtotal + totalTax + additionalChargesTotal - totalDiscount - pointsRedeemedAmount;
    let roundOffValue = 0;
    let grandTotal;

    if (newQuotationData.autoRoundOff) {
      roundOffValue = Math.round(grandTotalBefore) - grandTotalBefore;
      grandTotal = Math.max(0, Math.round(grandTotalBefore));
    } else {
      roundOffValue = 0;
      grandTotal = Math.max(0, grandTotalBefore);
    }

    newQuotationData.subtotal = subtotal;
    newQuotationData.totalTax = totalTax;
    newQuotationData.totalDiscount = totalDiscount;
    newQuotationData.additionalCharges = additionalChargesTotal;
    newQuotationData.roundOffValue = roundOffValue;
    newQuotationData.grandTotal = grandTotal;

    // Handle attachments - copy from old and add new
    newQuotationData.attachments = currentQuotation.attachments ? [...currentQuotation.attachments] : [];

    // Add new attachments if any
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "quotation_attachments",
          });
          newQuotationData.attachments.push({
            url: result.secure_url,
            public_id: result.public_id,
            filename: file.originalname,
            uploadedAt: new Date(),
          });
        } catch (uploadError) {
          console.error("Cloudinary upload error:", uploadError);
        }
      }
    }

    // Handle shopping points adjustment
    const newPointsUsed = newQuotationData.shoppingPointsUsed;
    if (newPointsUsed !== oldPointsUsed) {
      const customer = await CustomerModel.findById(currentQuotation.customerId);
      if (customer) {
        const pointsDiff = newPointsUsed - oldPointsUsed;
        if (pointsDiff > 0 && (customer.availablePoints || 0) < pointsDiff) {
          // Revert - restore old quotation
          currentQuotation.isLatest = true;
          currentQuotation.isRevised = false;
          currentQuotation.status = updateData.oldStatus || "draft";
          currentQuotation.revisedAt = null;
          await currentQuotation.save();

          return res.status(400).json({
            success: false,
            error: `Customer doesn't have enough points. Available: ${customer.availablePoints || 0}`,
          });
        }

        customer.availablePoints = (customer.availablePoints || 0) - pointsDiff;
        customer.usedPoints = (customer.usedPoints || 0) + pointsDiff;
        await customer.save();
      }
    }

    // Create NEW quotation document
    const newQuotation = new QuotationModel(newQuotationData);
    await newQuotation.save();

    // Populate for response
    const populatedQuotation = await QuotationModel.findById(newQuotation._id)
      .populate("customerId", "name phone email")
      .populate("createdBy", "firstName lastName")
      .populate("items.productId", "productName hsnCode");

    res.json({
      success: true,
      message: "Quotation revised successfully. New version created.",
      quotation: populatedQuotation,
      versionInfo: {
        oldVersionId: currentQuotation._id,
        newVersionId: newQuotation._id,
        revisionNumber: newQuotationData.revisionNumber,
        oldVersionStatus: "revised",
        newVersionStatus: "active",
      },
    });

  } catch (err) {
    console.error("Update quotation error:", err);
    next(err);

    if (err.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        error: "Validation failed",
        details: Object.values(err.errors).map((e) => e.message),
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update quotation",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Delete quotation
exports.deleteQuotation = async (req, res, next) => {
  try {
    const { Quotation: QuotationModel, Customer: CustomerModel } = await getAutoModels(req);
    // Validate quotation ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid quotation ID format",
      });
    }

    const quotation = await QuotationModel.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Cannot delete converted quotation
    if (quotation.status === "converted" && quotation.convertedToInvoice) {
      return res.status(400).json({
        success: false,
        error: "Cannot delete quotation that has been converted to invoice",
        invoiceId: quotation.convertedToInvoice,
      });
    }

    // Store quotation data for cleanup
    const customerId = quotation.customerId;
    const shoppingPointsUsed = quotation.shoppingPointsUsed || 0;

    // Return shopping points to customer
    if (shoppingPointsUsed > 0) {
      const customer = await CustomerModel.findById(customerId);
      if (customer) {
        customer.availablePoints =
          (customer.availablePoints || 0) + shoppingPointsUsed;
        customer.usedPoints = Math.max(
          0,
          (customer.usedPoints || 0) - shoppingPointsUsed,
        );
        await customer.save();
      }
    }

    // Delete attachments from Cloudinary
    if (quotation.attachments && quotation.attachments.length > 0) {
      const deletePromises = quotation.attachments
        .filter((attachment) => attachment.public_id)
        .map((attachment) =>
          cloudinary.uploader.destroy(attachment.public_id).catch((err) => {
            console.error(
              `Failed to delete Cloudinary file ${attachment.public_id}:`,
              err.message,
            );
          }),
        );

      await Promise.allSettled(deletePromises);
    }

    // Delete the quotation
    await QuotationModel.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: "Quotation deleted successfully",
      deleted: {
        quotationId: req.params.id,
        quotationNo: quotation.quotationNo,
        pointsReturned: shoppingPointsUsed,
        attachmentsDeleted: quotation.attachments?.length || 0,
      },
    });
  } catch (err) {
    // console.error("Delete quotation error:", err);
    next(err); // Pass error to centralized error handler

    res.status(500).json({
      success: false,
      error: "Failed to delete quotation",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Convert quotation to invoice
exports.convertToInvoice = async (req, res, next) => {
  try {
    const { Quotation: QuotationModel, Invoice: InvoiceModel, Customer: CustomerModel } = await getAutoModels(req);
    // Validate quotation ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid quotation ID format",
      });
    }

    const quotation = await QuotationModel.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Check if already converted
    if (quotation.status === "converted") {
      return res.status(400).json({
        success: false,
        error: "Quotation already converted to invoice",
        invoiceId: quotation.convertedToInvoice,
      });
    }

    // Check if expired
    if (quotation.expiryDate < new Date() && quotation.status !== "expired") {
      quotation.status = "expired";
      await quotation.save();

      return res.status(400).json({
        success: false,
        error: "Cannot convert expired quotation",
        expiryDate: quotation.expiryDate,
      });
    }

    // Generate new invoice number
    const generateInvoiceNo = async () => {
      const date = new Date();
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0");
      const prefix = `INV${year}${month}`;
      const count = await InvoiceModel.countDocuments({
        invoiceNo: { $regex: `^${prefix}` },
      });
      const sequence = String(count + 1).padStart(3, "0");
      return `${prefix}${sequence}`;
    };

    const invoiceNo = await generateInvoiceNo();

    // Convert quotation to invoice
    const invoice = await quotation.convertToInvoice(invoiceNo);

    // Populate both for response
    const populatedInvoice = await InvoiceModel.findById(invoice._id)
      .populate("customerId", "name phone email")
      .populate("createdBy", "firstName lastName")
      .populate("items.productId", "productName hsnCode");

    const populatedQuotation = await QuotationModel.findById(quotation._id)
      .populate("customerId", "name phone email")
      .populate("convertedToInvoice", "invoiceNo status");

    res.json({
      success: true,
      message: "Quotation successfully converted to invoice",
      quotation: populatedQuotation,
      invoice: populatedInvoice,
    });
  } catch (err) {
    // console.error("Convert to invoice error:", err);
    next(err); // Pass error to centralized error handler

    if (err.code === 11000) {
      return res.status(400).json({
        success: false,
        error: "Invoice number already exists",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to convert quotation to invoice",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Update quotation status (accept/reject)
exports.updateStatus = async (req, res, next) => {
  try {
    const { Quotation: QuotationModel, Customer: CustomerModel } = await getAutoModels(req);
    const { status } = req.body;

    // Validate status
    const allowedStatuses = ["accepted", "rejected", "sent", "draft"];
    if (!status || !allowedStatuses.includes(status)) {
      return res.status(400).json({
        success: false,
        error: `Invalid status. Allowed values: ${allowedStatuses.join(", ")}`,
      });
    }

    // Validate quotation ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid quotation ID format",
      });
    }

    const quotation = await QuotationModel.findById(req.params.id);
    if (!quotation) {
      return res.status(404).json({
        success: false,
        error: "Quotation not found",
      });
    }

    // Check if already converted
    if (quotation.status === "converted") {
      return res.status(400).json({
        success: false,
        error: "Cannot change status of converted quotation",
        invoiceId: quotation.convertedToInvoice,
      });
    }

    // Check if expired
    if (quotation.expiryDate < new Date() && status === "accepted") {
      return res.status(400).json({
        success: false,
        error: "Cannot accept expired quotation",
        expiryDate: quotation.expiryDate,
      });
    }

    const oldStatus = quotation.status;
    quotation.status = status;
    quotation.updatedAt = new Date();

    await quotation.save();

    const populatedQuotation = await QuotationModel.findById(quotation._id)
      .populate("customerId", "name phone email")
      .populate("createdBy", "firstName lastName");

    res.json({
      success: true,
      message: `Quotation status updated to ${status}`,
      quotation: populatedQuotation,
      changes: {
        from: oldStatus,
        to: status,
      },
    });
  } catch (err) {
    // console.error("Update status error:", err);
    next(err); // Pass error to centralized error handler
    res.status(500).json({
      success: false,
      error: "Failed to update quotation status",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Get quotation statistics
exports.getQuotationStats = async (req, res, next) => {
  try {
    const { Quotation: QuotationModel, Customer: CustomerModel } = await getAutoModels(req);
    const {
      startDate,
      endDate,
      customerId,
      status,
      period = "all",
    } = req.query;

    // Build match stage
    const matchStage = {};

    // Filter by customer
    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
      matchStage.customerId = new mongoose.Types.ObjectId(customerId);
    }

    // Filter by status
    if (status) {
      const allowedStatuses = [
        "active",
  "revised",
  "sent",
  "accepted",
  "rejected",
  "expired",
  "converted",
      ];
      if (allowedStatuses.includes(status)) {
        matchStage.status = status;
      }
    }

    // Handle date range
    if (startDate || endDate || period !== "all") {
      matchStage.quotationDate = {};

      // Validate and set start date
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            error: "Invalid start date format",
          });
        }
        matchStage.quotationDate.$gte = start;
      } else if (period !== "all") {
        const now = new Date();
        if (period === "today") {
          matchStage.quotationDate.$gte = new Date(now.setHours(0, 0, 0, 0));
        } else if (period === "week") {
          matchStage.quotationDate.$gte = new Date(
            now.setDate(now.getDate() - 7),
          );
        } else if (period === "month") {
          matchStage.quotationDate.$gte = new Date(
            now.setMonth(now.getMonth() - 1),
          );
        } else if (period === "year") {
          matchStage.quotationDate.$gte = new Date(
            now.setFullYear(now.getFullYear() - 1),
          );
        }
      }

      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            error: "Invalid end date format",
          });
        }
        matchStage.quotationDate.$lte = end;
      }
    }

    // Main stats aggregation
    const statsPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalQuotations: { $sum: 1 },
          totalAmount: { $sum: "$grandTotal" },
          totalTax: { $sum: "$totalTax" },
          totalDiscount: { $sum: "$totalDiscount" },
          totalAdditionalCharges: { $sum: "$additionalCharges" },
          totalPointsUsed: { $sum: "$shoppingPointsUsed" },
          totalPointsValue: {
            $sum: { $multiply: ["$shoppingPointsUsed", "$pointValue"] },
          },
          avgQuotationValue: { $avg: "$grandTotal" },
          maxQuotationValue: { $max: "$grandTotal" },
          minQuotationValue: { $min: "$grandTotal" },
          totalConverted: {
            $sum: { $cond: [{ $eq: ["$status", "converted"] }, 1, 0] },
          },
          totalAccepted: {
            $sum: { $cond: [{ $eq: ["$status", "accepted"] }, 1, 0] },
          },
          totalRejected: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
          },
          totalExpired: {
            $sum: { $cond: [{ $eq: ["$status", "expired"] }, 1, 0] },
          },
        },
      },
      {
        $project: {
          _id: 0,
          totalQuotations: 1,
          totalAmount: { $round: ["$totalAmount", 2] },
          totalTax: { $round: ["$totalTax", 2] },
          totalDiscount: { $round: ["$totalDiscount", 2] },
          totalAdditionalCharges: { $round: ["$totalAdditionalCharges", 2] },
          totalPointsUsed: 1,
          totalPointsValue: { $round: ["$totalPointsValue", 2] },
          avgQuotationValue: { $round: ["$avgQuotationValue", 2] },
          maxQuotationValue: { $round: ["$maxQuotationValue", 2] },
          minQuotationValue: { $round: ["$minQuotationValue", 2] },
          totalConverted: 1,
          totalAccepted: 1,
          totalRejected: 1,
          totalExpired: 1,
          conversionRate: {
            $cond: {
              if: { $gt: ["$totalQuotations", 0] },
              then: {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$totalConverted", "$totalQuotations"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
              else: 0,
            },
          },
          acceptanceRate: {
            $cond: {
              if: { $gt: ["$totalQuotations", 0] },
              then: {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$totalAccepted", "$totalQuotations"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
              else: 0,
            },
          },
        },
      },
    ];

    const stats = await QuotationModel.aggregate(statsPipeline);

    // Status-wise counts
    const statusCounts = await QuotationModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$grandTotal" },
        },
      },
      { $sort: { count: -1 } },
      {
        $project: {
          status: "$_id",
          count: 1,
          totalAmount: { $round: ["$totalAmount", 2] },
          _id: 0,
        },
      },
    ]);

    // Monthly breakdown
    const monthlyBreakdown = await QuotationModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: "$quotationDate" },
            month: { $month: "$quotationDate" },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$grandTotal" },
          converted: {
            $sum: { $cond: [{ $eq: ["$status", "converted"] }, 1, 0] },
          },
        },
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 },
      {
        $project: {
          _id: 0,
          period: {
            $concat: [
              { $toString: "$_id.year" },
              "-",
              {
                $toString: {
                  $cond: {
                    if: { $lt: ["$_id.month", 10] },
                    then: { $concat: ["0", { $toString: "$_id.month" }] },
                    else: { $toString: "$_id.month" },
                  },
                },
              },
            ],
          },
          count: 1,
          totalAmount: { $round: ["$totalAmount", 2] },
          converted: 1,
          conversionRate: {
            $cond: {
              if: { $gt: ["$count", 0] },
              then: {
                $round: [
                  { $multiply: [{ $divide: ["$converted", "$count"] }, 100] },
                  2,
                ],
              },
              else: 0,
            },
          },
        },
      },
    ]);

    // Top customers by quotation count
    const topCustomers = await QuotationModel.aggregate([
      { $match: matchStage },
      {
        $lookup: {
          from: "customers",
          localField: "customerId",
          foreignField: "_id",
          as: "customer",
        },
      },
      { $unwind: "$customer" },
      {
        $group: {
          _id: "$customerId",
          customerName: { $first: "$customer.name" },
          quotationCount: { $sum: 1 },
          totalAmount: { $sum: "$grandTotal" },
          convertedCount: {
            $sum: { $cond: [{ $eq: ["$status", "converted"] }, 1, 0] },
          },
        },
      },
      { $sort: { totalAmount: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          customerId: "$_id",
          customerName: 1,
          quotationCount: 1,
          totalAmount: { $round: ["$totalAmount", 2] },
          convertedCount: 1,
          conversionRate: {
            $cond: {
              if: { $gt: ["$quotationCount", 0] },
              then: {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$convertedCount", "$quotationCount"] },
                      100,
                    ],
                  },
                  2,
                ],
              },
              else: 0,
            },
          },
        },
      },
    ]);

    // Expiring soon (within 7 days)
    const expiringSoon = await QuotationModel.find({
      status: { $in: ["draft", "sent"] },
      expiryDate: {
        $gte: new Date(),
        $lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    })
      .populate("customerId", "name phone email")
      .sort({ expiryDate: 1 })
      .limit(10);

    res.json({
      success: true,
      stats: stats[0] || {
        totalQuotations: 0,
        totalAmount: 0,
        totalTax: 0,
        totalDiscount: 0,
        totalAdditionalCharges: 0,
        totalPointsUsed: 0,
        totalPointsValue: 0,
        avgQuotationValue: 0,
        maxQuotationValue: 0,
        minQuotationValue: 0,
        totalConverted: 0,
        totalAccepted: 0,
        totalRejected: 0,
        totalExpired: 0,
        conversionRate: 0,
        acceptanceRate: 0,
      },
      statusCounts,
      monthlyBreakdown,
      topCustomers,
      expiringSoon,
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        customerId: customerId || null,
        status: status || null,
        period: period,
      },
    });
  } catch (err) {
    // console.error("Get quotation stats error:", err);
    next(err); // Pass error to centralized error handler
    res.status(500).json({
      success: false,
      error: "Failed to fetch quotation statistics",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// for status
// Update quotation status when converted to proforma
exports.updateQuotationStatus = async (req, res, next) => {
  try {
    const { Quotation: QuotationModel } = await getAutoModels(req);
    const { id } = req.params;

    const quotation = await QuotationModel.findByIdAndUpdate(
      id,
      { status: "converted_to_proforma" },
      { new: true }
    );

    res.json({ success: true, message: "Quotation status updated", quotation });
  } catch (err) {
    next(err);
  }
};

// Add this to customerquotationController.js
exports.convertToProforma = async (req, res, next) => {
  try {
    const { Quotation: QuotationModel, CustomerProformaInvoice: ProformaModel } = await getAutoModels(req);
    const { id } = req.params;

    const quotation = await QuotationModel.findById(id);
    if (!quotation) {
      return res.status(404).json({ success: false, error: "Quotation not found" });
    }

    // Create proforma from quotation
    const proforma = new ProformaModel({
      customerId: quotation.customerId,
      quotationId: quotation._id,
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
      status: "draft"
    });

    // Generate proforma number
    const date = new Date();
    const prefix = `PI${date.getFullYear()}${String(date.getMonth() + 1).padStart(2, "0")}`;
    const count = await ProformaModel.countDocuments({ proformaNo: { $regex: `^${prefix}` } });
    proforma.proformaNo = `${prefix}${String(count + 1).padStart(3, "0")}`;
    proforma.proformaDate = new Date();
    proforma.validUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);

    await proforma.save();

    // Update quotation status
    await QuotationModel.findByIdAndUpdate(id, { status: "converted_to_proforma" });

    res.json({ success: true, message: "Converted to Proforma", proforma });
  } catch (err) {
    next(err);
  }
};
