const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");
const cloudinary = require("../utils/cloudinary/cloudinary");
const mongoose = require("mongoose");
const {
  resolveVariantForTracking,
  incrementVariantStock,
} = require("../utils/variantTrackingService.js"); // <-- adjust path to wherever you place the service

// Helper: generate a unique 13-digit barcode (re-uses the same EAN-13 logic as productControllers.js)
const computeEan13Check = (base12) => {
  const digits = String(base12).split("").map((d) => parseInt(d, 10));
  if (digits.length !== 12 || digits.some((d) => Number.isNaN(d))) return null;
  let sumOdd = 0;
  let sumEven = 0;
  for (let i = 0; i < 12; i++) {
    if (i % 2 === 0) sumOdd += digits[i];
    else sumEven += digits[i];
  }
  const total = sumOdd + sumEven * 3;
  return String((10 - (total % 10)) % 10);
};
const generateBase12 = () => String(Math.floor(Math.random() * 1e12)).padStart(12, "0");
const generateUniqueBarcode = async (ProductModel) => {
  let attempts = 0;
  while (attempts < 50) {
    const base12 = generateBase12();
    const check = computeEan13Check(base12);
    if (check === null) {
      attempts += 1;
      continue;
    }
    const candidate = base12 + check;
    const exists = await ProductModel.exists({
      isDelete: { $ne: true },
      $or: [{ itemBarcode: candidate }, { "variants.itemBarcode": candidate }],
    });
    if (!exists) return candidate;
    attempts += 1;
  }
  return null;
};

// Create GRN
exports.createGRN = async (req, res, next) => {
  try {
    const {
      GRN: GRNModel,
      PurchaseOrder: PurchaseOrderModel,
      Product: ProductModel,
      Supplier: SupplierModel,
    } = await getAutoModels(req);

    let {
      purchaseOrderId,
      receiveDate,
      items,
      subtotal,
      totalTax,
      additionalChargesDetails,
      grandTotal,
      notes,
    } = req.body;

    // Parse JSON strings from FormData
    if (typeof items === "string") {
      try {
        items = JSON.parse(items);
      } catch (e) {
        return res.status(400).json({ success: false, error: "Invalid items payload" });
      }
    }
    if (typeof additionalChargesDetails === "string") {
      try {
        additionalChargesDetails = JSON.parse(additionalChargesDetails);
      } catch (e) {
        additionalChargesDetails = {};
      }
    }

    // Validation
    if (!purchaseOrderId) {
      return res.status(400).json({ success: false, error: "Purchase order ID is required" });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: "At least one item is required" });
    }

    // Get purchase order
    const purchaseOrder = await PurchaseOrderModel.findById(purchaseOrderId);
    if (!purchaseOrder || purchaseOrder.isDeleted) {
      return res.status(404).json({ success: false, error: "Purchase order not found" });
    }

    // Get supplier
    const supplier = await SupplierModel.findById(purchaseOrder.supplierId);
    if (!supplier) {
      return res.status(404).json({ success: false, error: "Supplier not found" });
    }

    // Process attachments
    const attachments = [];
    if (req.body.existingAttachments) {
      try {
        const existingAtts = JSON.parse(req.body.existingAttachments);
        attachments.push(...existingAtts);
      } catch (e) {
        console.warn("Could not parse existing attachments:", e);
      }
    }
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "grn_attachments",
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
    const additionalChargesTotal = Object.values(additionalChargesDetails || {}).reduce(
      (sum, v) => sum + (v || 0),
      0
    );

    // Process items
    const processedItems = [];
    const productDocsById = new Map();

    for (const item of items) {
      if (!(item.receivingNow > 0)) continue;

      // Find the corresponding purchase order item
      const purchaseItem = purchaseOrder.items.find(
        (pi) => pi.productId.toString() === item.productId
      );
      if (!purchaseItem) {
        return res.status(400).json({
          success: false,
          error: `Product ${item.itemName} not found in purchase order`,
        });
      }

      // Load product document
      let productDoc = productDocsById.get(String(item.productId));
      if (!productDoc) {
        productDoc = await ProductModel.findById(item.productId);
        if (!productDoc) {
          return res.status(404).json({
            success: false,
            error: `Product not found: ${item.itemName}`,
          });
        }
        productDocsById.set(String(item.productId), productDoc);
      }
       let cleanSerialNos = [];
  if (item.selectedSerialNos) {
    // If it's a string, try to parse it
    if (typeof item.selectedSerialNos === 'string') {
      try {
        // Check if it's a JSON string like "[]" or ["123", "456"]
        if (item.selectedSerialNos.startsWith('[') && item.selectedSerialNos.endsWith(']')) {
          const parsed = JSON.parse(item.selectedSerialNos);
          if (Array.isArray(parsed)) {
            // Filter out empty strings and "[]" strings
            cleanSerialNos = parsed.filter(s => 
              s !== "" && s !== "[]" && s !== null && s !== undefined
            );
          }
        } else if (item.selectedSerialNos.includes(',')) {
          // Comma-separated list
          cleanSerialNos = item.selectedSerialNos.split(',')
            .map(s => s.trim())
            .filter(s => s !== "" && s !== "[]" && s !== null && s !== undefined);
        } else if (item.selectedSerialNos.trim() !== "" && item.selectedSerialNos !== "[]") {
          // Single serial number
          cleanSerialNos = [item.selectedSerialNos.trim()];
        }
      } catch (e) {
        // If parsing fails, try to handle as a single value
        if (item.selectedSerialNos.trim() !== "" && item.selectedSerialNos !== "[]") {
          cleanSerialNos = [item.selectedSerialNos.trim()];
        }
      }
    } 
    // If it's already an array
    else if (Array.isArray(item.selectedSerialNos)) {
      // Filter out empty values and "[]" strings
      cleanSerialNos = item.selectedSerialNos.filter(s => 
        s !== "" && s !== "[]" && s !== null && s !== undefined
      );
    }
  }

      // Build tracking payload
      const incomingTracking = {
        variantId: item.variantId || "",
        lotNumber: item.lotNumber || "",
        modelNo: item.modelNo || "",
        expiryDate: item.expiryDate || null,
        manufacturingDate: item.manufacturingDate || null,
        color: item.selectedColor || "",
        size: item.selectedSize || "",
        serialNumbers: cleanSerialNos,
        warrantyType: item.warrantyType || "",
        warrantyPeriod: item.warrantyPeriod || null,
        coverageScope: item.coverageScope || "",
        serviceMode: item.serviceMode || "",
        maxClaimsAllowed: item.maxClaimsAllowed || null,
        inspectionRequired: item.inspectionRequired || false,
        warrantyStartsFrom: item.warrantyStartsFrom || "",
        linkedto: item.linkedto || "",
        extensionPeriod: item.extensionPeriod || "",
        coverageType: item.coverageType || "",
        extendedWarrantyPrice: item.extendedWarrantyPrice || null,
        lifetimeDefination: item.lifetimeDefination || "",
        coverageOf: item.coverageOf || "",
        whatNotCovered: item.whatNotCovered || "",
        maxClaims: item.maxClaims || null,
        replacementOnceOnly: item.replacementOnceOnly || false,
        unit: item.unit,
        purchasePrice: item.receivingPrice ?? item.unitPrice,
        receivingPrice: item.receivingPrice ?? item.unitPrice,
        sellingPrice: item.sellingPrice,
        mrp: item.mrp,
        tax: item.taxRate != null ? String(item.taxRate) : undefined,
        minStockToMaintain: item.minStockToMaintain,
        discountAmount: item.discountAmount,
        discountType: item.discountType,
        receivingQty: item.receivingNow,
      };

      // Resolve: reuse existing variant OR create new product
      const resolution = resolveVariantForTracking(productDoc, incomingTracking);

      let variantId = null;
      let isNewProduct = false;
      let newProductId = null;
      let finalReceivingPrice = incomingTracking.receivingPrice;

      if (resolution.action === "reuse") {
        incrementVariantStock(resolution.variant, item.receivingNow);
        variantId = String(resolution.variant._id || "");
      } else if (resolution.action === "create_new_product") {
        isNewProduct = true;
        
        const barcode = await generateUniqueBarcode(ProductModel);
        if (resolution.newProductData.variants && resolution.newProductData.variants.length > 0) {
          resolution.newProductData.variants[0].itemBarcode = barcode || "";
        }
        resolution.newProductData.itemBarcode = barcode || "";
        
        const newProduct = new ProductModel(resolution.newProductData);
        await newProduct.save();
        newProductId = newProduct._id;
        
        const newVariant = newProduct.variants[0];
        variantId = String(newVariant._id || "");
        
        // NEW: Update the purchase item to reference the new product
        purchaseItem.productId = newProductId;
        purchaseItem.itemName = newProduct.productName;
        purchaseItem.unitPrice = finalReceivingPrice;
        
        // Recalculate amount for this item
        const taxAmount = (purchaseItem.unitPrice * purchaseItem.qty * purchaseItem.taxRate) / 100;
        purchaseItem.taxAmount = taxAmount;
        purchaseItem.amount = (purchaseItem.unitPrice * purchaseItem.qty) + taxAmount;
      }

      processedItems.push({
        productId: item.productId,
        variantId: variantId,
        isNewProduct: isNewProduct,
        newProductId: newProductId,
        itemName: item.itemName,
        hsnCode: item.hsnCode || purchaseItem.hsnCode,
        unit: item.unit || purchaseItem.unit,
        orderedQty: purchaseItem.qty,
        previousReceived: purchaseItem.previousReceivedQty || 0,
        receivingNow: item.receivingNow,
        unitPrice: purchaseItem.unitPrice,
        receivingPrice: finalReceivingPrice,
        taxRate: item.taxRate || purchaseItem.taxRate,
        taxAmount: item.taxAmount || 0,
        amount: item.amount || 0,
        selectedSerialNos: cleanSerialNos,
        selectedColor: item.selectedColor || "",
        selectedSize: item.selectedSize || "",
        lotNumber: item.lotNumber || "",
        modelNo: item.modelNo || "",
        expiryDate: item.expiryDate || null,
        manufacturingDate: item.manufacturingDate || null,
        warrantyType: item.warrantyType || "",
        warrantyPeriod: item.warrantyPeriod || null,
        coverageScope: item.coverageScope || "",
        serviceMode: item.serviceMode || "",
        maxClaimsAllowed: item.maxClaimsAllowed || null,
        inspectionRequired: Boolean(item.inspectionRequired),
        warrantyStartsFrom: item.warrantyStartsFrom || "",
        linkedto: item.linkedto || "",
        extensionPeriod: item.extensionPeriod || "",
        coverageType: item.coverageType || "",
        extendedWarrantyPrice: item.extendedWarrantyPrice || null,
        lifetimeDefination: item.lifetimeDefination || "",
        coverageOf: item.coverageOf || "",
        whatNotCovered: item.whatNotCovered || "",
        maxClaims: item.maxClaims || null,
        replacementOnceOnly: Boolean(item.replacementOnceOnly),
        isNewVariant: resolution.isNew,
        trackingChangedFields: resolution.changedFields,
      });

      purchaseItem.previousReceivedQty = (purchaseItem.previousReceivedQty || 0) + item.receivingNow;
    }

    if (processedItems.length === 0) {
      return res.status(400).json({ success: false, error: "No items with a receiving quantity > 0" });
    }

    // Recalculate purchase order totals after item updates
    purchaseOrder.subtotal = purchaseOrder.items.reduce((sum, i) => sum + (i.unitPrice * i.qty), 0);
    purchaseOrder.totalTax = purchaseOrder.items.reduce((sum, i) => sum + (i.taxAmount || 0), 0);
    purchaseOrder.grandTotal = purchaseOrder.subtotal + purchaseOrder.totalTax;

    // Save all product documents
    for (const productDoc of productDocsById.values()) {
      await productDoc.save();
    }

    // Create GRN
    const grn = new GRNModel({
      purchaseOrderId,
      supplierId: purchaseOrder.supplierId,
      receiveDate: receiveDate ? new Date(receiveDate) : new Date(),
      items: processedItems,
      subtotal: parseFloat(subtotal) || 0,
      totalTax: parseFloat(totalTax) || 0,
      additionalCharges: additionalChargesTotal,
      additionalChargesDetails: additionalChargesDetails || {},
      grandTotal: parseFloat(grandTotal) || 0,
      attachments,
      createdBy: req.user?._id,
      notes: notes || "",
      paidAmount: purchaseOrder.paidAmount || 0,
      dueAmount: purchaseOrder.dueAmount || 0,
      fullyReceived: purchaseOrder.fullyReceived || false,
      paymentMethod: purchaseOrder.paymentMethod || "cash",
      paymentHistory: purchaseOrder.paymentHistory || [],
    });

    await grn.save();

    // Update purchase order status
    const totalOrdered = purchaseOrder.items.reduce((sum, i) => sum + i.qty, 0);
    const totalReceived = purchaseOrder.items.reduce((sum, i) => sum + (i.previousReceivedQty || 0), 0);

    if (totalReceived >= totalOrdered) {
      purchaseOrder.status = "approved";
      purchaseOrder.fullyReceived = true;
    } else if (totalReceived > 0) {
      purchaseOrder.status = "partial_received";
    }

    // Add GRN to purchase order history
    purchaseOrder.grnHistory = purchaseOrder.grnHistory || [];
    purchaseOrder.grnHistory.push({
      grnId: grn._id,
      receivedDate: grn.receiveDate,
      itemsReceived: processedItems.map((item) => ({
        productId: item.productId,
        receivedQty: item.receivingNow,
      })),
    });

    await purchaseOrder.save();

    // Populate and return
    const populatedGRN = await GRNModel.findById(grn._id)
      .populate("supplierId", "supplierName phone email address")
      .populate("purchaseOrderId", "purchaseNo purchaseDate")
      .populate("items.productId", "productName unit images");

    res.status(201).json({
      success: true,
      message: "GRN created successfully",
      grn: populatedGRN,
      purchaseOrderUpdated: purchaseOrder,
    });
  } catch (err) {
    console.error("Create GRN error:", err);
    next(err);
  }
};

// Get all GRNs
exports.getAllGRNs = async (req, res, next) => {
  try {
    const { GRN: GRNModel } = await getAutoModels(req);

    const { page = 1, limit = 20, search } = req.query;

    const filter = { isDeleted: false };
    if (search) {
      filter.$or = [{ grnNumber: { $regex: search, $options: "i" } }];
    }

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const grns = await GRNModel.find(filter)
      .populate("supplierId", "supplierName phone")
      .populate("purchaseOrderId", "purchaseNo")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await GRNModel.countDocuments(filter);

    res.json({
      success: true,
      grns,
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

// Get single GRN
exports.getGRNById = async (req, res, next) => {
  try {
    const { GRN: GRNModel } = await getAutoModels(req);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid GRN ID format" });
    }

    const grn = await GRNModel.findById(req.params.id)
      .populate("supplierId", "supplierName phone email address gstin")
      .populate("purchaseOrderId", "purchaseNo purchaseDate")
      .populate("items.productId", "productName unit images variants");

    if (!grn || grn.isDeleted) {
      return res.status(404).json({ success: false, error: "GRN not found" });
    }

    const receivingSummary = grn.getReceivingSummary();

    res.json({
      success: true,
      grn,
      receivingSummary,
    });
  } catch (err) {
    next(err);
  }
};

// Delete GRN (soft delete) — also reverses stock from the specific variant it was added to
exports.deleteGRN = async (req, res, next) => {
  try {
    const {
      GRN: GRNModel,
      PurchaseOrder: PurchaseOrderModel,
      Product: ProductModel,
    } = await getAutoModels(req);

    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, error: "Invalid GRN ID format" });
    }

    const grn = await GRNModel.findById(req.params.id);
    if (!grn) {
      return res.status(404).json({ success: false, error: "GRN not found" });
    }

    // Reverse stock updates for each variant
    for (const item of grn.items) {
      const productDoc = await ProductModel.findById(item.productId);
      if (!productDoc) continue;

      let variant = null;
      if (item.variantId) {
        variant = productDoc.variants.find((v) => String(v._id) === String(item.variantId));
      }
      if (!variant) {
        variant = productDoc.variants.find(
          (v) => String(v.lotNumber || "") === String(item.lotNumber || "")
        );
      }
      if (variant) {
        variant.stockQuantity = Math.max(0, (variant.stockQuantity || 0) - item.receivingNow);
        await productDoc.save();
      }
    }

    // Update purchase order to revert received quantities
    const purchaseOrder = await PurchaseOrderModel.findById(grn.purchaseOrderId);
    if (purchaseOrder) {
      for (const item of grn.items) {
        const purchaseItem = purchaseOrder.items.find(
          (pi) => pi.productId.toString() === item.productId.toString()
        );
        if (purchaseItem) {
          purchaseItem.previousReceivedQty = Math.max(
            0,
            (purchaseItem.previousReceivedQty || 0) - item.receivingNow
          );
        }
      }
      await purchaseOrder.save();
    }

    grn.isDeleted = true;
    await grn.save();

    res.json({ success: true, message: "GRN deleted successfully" });
  } catch (err) {
    next(err);
  }
};


// const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");
// const cloudinary = require("../utils/cloudinary/cloudinary");
// const mongoose = require("mongoose");

// // Create GRN
// exports.createGRN = async (req, res, next) => {
//   try {
//     const { GRN: GRNModel, PurchaseOrder: PurchaseOrderModel, Product: ProductModel, Supplier: SupplierModel } = await getAutoModels(req);

//     const {
//       purchaseOrderId,
//       receiveDate,
//       items,
//       subtotal,
//       totalTax,
//       additionalChargesDetails,
//       grandTotal,
//       notes,
//     } = req.body;

//     // Validation
//     if (!purchaseOrderId) {
//       return res.status(400).json({ success: false, error: "Purchase order ID is required" });
//     }
//     if (!items || items.length === 0) {
//       return res.status(400).json({ success: false, error: "At least one item is required" });
//     }

//     // Get purchase order
//     const purchaseOrder = await PurchaseOrderModel.findById(purchaseOrderId);
//     if (!purchaseOrder || purchaseOrder.isDeleted) {
//       return res.status(404).json({ success: false, error: "Purchase order not found" });
//     }

//     // Get supplier
//     const supplier = await SupplierModel.findById(purchaseOrder.supplierId);
//     if (!supplier) {
//       return res.status(404).json({ success: false, error: "Supplier not found" });
//     }

//     // Process attachments
//     const attachments = [];
//      if (req.body.existingAttachments) {
//       try {
//         const existingAtts = JSON.parse(req.body.existingAttachments);
//         attachments.push(...existingAtts);
//       } catch (e) {
//         console.warn("Could not parse existing attachments:", e);
//       }
//     }
//     if (req.files && req.files.length > 0) {
//       for (const file of req.files) {
//         try {
//           const result = await cloudinary.uploader.upload(file.path, {
//             folder: "grn_attachments",
//             resource_type: "auto",
//           });
//           attachments.push({
//             url: result.secure_url,
//             public_id: result.public_id,
//             filename: file.originalname,
//             fileType: file.mimetype,
//             fileSize: file.size,
//             uploadedAt: new Date(),
//           });
//         } catch (uploadError) {
//           console.error("Cloudinary upload error:", uploadError);
//         }
//       }
//     }

//     // Calculate additional charges total
//     const additionalChargesTotal = Object.values(additionalChargesDetails || {}).reduce((sum, v) => sum + (v || 0), 0);

//     // Process items and update stock
//     const processedItems = [];
//     for (const item of items) {
//       if (item.receivingNow > 0) {
//         // Find the corresponding purchase order item
//         const purchaseItem = purchaseOrder.items.find(
//           pi => pi.productId.toString() === item.productId
//         );

//         if (!purchaseItem) {
//           return res.status(400).json({
//             success: false,
//             error: `Product ${item.itemName} not found in purchase order`
//           });
//         }

//         // Calculate remaining quantity
//         const remainingQty = purchaseItem.qty - (purchaseItem.previousReceivedQty || 0);

//         // Validate receiving quantity
//         if (item.receivingNow > remainingQty && remainingQty > 0) {
//           // Allow over-receiving with warning
//           console.log(`Warning: Receiving ${item.receivingNow} but only ${remainingQty} remaining`);
//         }

//         processedItems.push({
//           productId: item.productId,
//           itemName: item.itemName,
//           hsnCode: item.hsnCode || purchaseItem.hsnCode,
//           unit: item.unit || purchaseItem.unit,
//           orderedQty: purchaseItem.qty,
//           previousReceived: purchaseItem.previousReceivedQty || 0,
//           receivingNow: item.receivingNow,
//           unitPrice: purchaseItem.unitPrice,
//           receivingPrice: item.receivingPrice || purchaseItem.unitPrice,
//           taxRate: item.taxRate || purchaseItem.taxRate,
//           taxAmount: item.taxAmount || 0,
//           amount: item.amount || 0,
//           selectedSerialNos: item.selectedSerialNos || [],
//           selectedColor: item.selectedColor || "",
//           selectedSize: item.selectedSize || "",
//           lotNumber: item.lotNumber || "",
//         });
//       }
//     }

//     // Create GRN
//     const grn = new GRNModel({
//       purchaseOrderId,
//       supplierId: purchaseOrder.supplierId,
//       receiveDate: receiveDate ? new Date(receiveDate) : new Date(),
//       items: processedItems,
//       subtotal: parseFloat(subtotal) || 0,
//       totalTax: parseFloat(totalTax) || 0,
//       additionalCharges: additionalChargesTotal,
//       additionalChargesDetails: additionalChargesDetails || {},
//       grandTotal: parseFloat(grandTotal) || 0,
//       attachments,
//       createdBy: req.user?._id,
//       notes: notes || "",
//       paidAmount: purchaseOrder.paidAmount || 0,
//       dueAmount: purchaseOrder.dueAmount || 0,
//       fullyReceived: purchaseOrder.fullyReceived || false,
//       paymentMethod: purchaseOrder.paymentMethod || "cash",
//       paymentHistory: purchaseOrder.paymentHistory || [],
//     });

//     await grn.save();

//     // Update purchase order items with received quantities
//     for (const item of processedItems) {
//       const purchaseItem = purchaseOrder.items.find(
//         pi => pi.productId.toString() === item.productId
//       );
//       if (purchaseItem) {
//         purchaseItem.previousReceivedQty = (purchaseItem.previousReceivedQty || 0) + item.receivingNow;
//       }

//       // Update product stock
//       await ProductModel.findByIdAndUpdate(item.productId, {
//         $inc: { stockQuantity: item.receivingNow }
//       });
//     }
//       // Update purchase order status
//     const totalOrdered = purchaseOrder.items.reduce((sum, i) => sum + i.qty, 0);
//     const totalReceived = purchaseOrder.items.reduce((sum, i) => sum + (i.previousReceivedQty || 0), 0);

//     if (totalReceived >= totalOrdered) {
//       purchaseOrder.status = "approved";
//       purchaseOrder.fullyReceived = true;
//     } else if (totalReceived > 0) {
//       purchaseOrder.status = "partial_received";
//     }

//     // Add GRN to purchase order history
//     purchaseOrder.grnHistory = purchaseOrder.grnHistory || [];
//     purchaseOrder.grnHistory.push({
//       grnId: grn._id,
//       receivedDate: grn.receiveDate,
//       itemsReceived: processedItems.map(item => ({
//         productId: item.productId,
//         receivedQty: item.receivingNow,
//       })),
//     });

//     await purchaseOrder.save();

//     // Populate and return
//     const populatedGRN = await GRNModel.findById(grn._id)
//       .populate("supplierId", "supplierName phone email address")
//       .populate("purchaseOrderId", "purchaseNo purchaseDate")
//       .populate("items.productId", "productName unit images");

//     res.status(201).json({
//       success: true,
//       message: "GRN created successfully",
//       grn: populatedGRN,
//     });

//   } catch (err) {
//     console.error("Create GRN error:", err);
//     next(err);
//   }
// };

// // Get all GRNs
// exports.getAllGRNs = async (req, res, next) => {
//   try {
//     const { GRN: GRNModel } = await getAutoModels(req);

//     const { page = 1, limit = 20, search } = req.query;

//     const filter = { isDeleted: false };
//     if (search) {
//       filter.$or = [
//         { grnNumber: { $regex: search, $options: "i" } },
//       ];
//     }

//     const pageNum = Math.max(1, parseInt(page));
//     const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
//     const skip = (pageNum - 1) * limitNum;

//     const grns = await GRNModel.find(filter)
//       .populate("supplierId", "supplierName phone")
//       .populate("purchaseOrderId", "purchaseNo")
//       .sort({ createdAt: -1 })
//       .skip(skip)
//       .limit(limitNum);

//     const total = await GRNModel.countDocuments(filter);

//     res.json({
//       success: true,
//       grns,
//       total,
//       pagination: {
//         page: pageNum,
//         limit: limitNum,
//         totalPages: Math.ceil(total / limitNum),
//         hasNextPage: pageNum < Math.ceil(total / limitNum),
//         hasPrevPage: pageNum > 1,
//       },
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// // Get single GRN
// exports.getGRNById = async (req, res, next) => {
//   try {
//     const { GRN: GRNModel } = await getAutoModels(req);

//     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//       return res.status(400).json({ success: false, error: "Invalid GRN ID format" });
//     }

//     const grn = await GRNModel.findById(req.params.id)
//       .populate("supplierId", "supplierName phone email address gstin")
//       .populate("purchaseOrderId", "purchaseNo purchaseDate")
//       .populate("items.productId", "productName unit images");

//     if (!grn || grn.isDeleted) {
//       return res.status(404).json({ success: false, error: "GRN not found" });
//     }

//     // Get receiving summary
//     const receivingSummary = grn.getReceivingSummary();

//     res.json({
//       success: true,
//       grn,
//       receivingSummary
//     });
//   } catch (err) {
//     next(err);
//   }
// };

// // Delete GRN (soft delete)
// exports.deleteGRN = async (req, res, next) => {
//   try {
//     const { GRN: GRNModel, PurchaseOrder: PurchaseOrderModel, Product: ProductModel } = await getAutoModels(req);

//     if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
//       return res.status(400).json({ success: false, error: "Invalid GRN ID format" });
//     }

//     const grn = await GRNModel.findById(req.params.id);
//     if (!grn) {
//       return res.status(404).json({ success: false, error: "GRN not found" });
//     }

//     // Reverse stock updates
//     for (const item of grn.items) {
//       await ProductModel.findByIdAndUpdate(item.productId, {
//         $inc: { stockQuantity: -item.receivingNow }
//       });
//     }

//     // Update purchase order to revert received quantities
//     const purchaseOrder = await PurchaseOrderModel.findById(grn.purchaseOrderId);
//     if (purchaseOrder) {
//       for (const item of grn.items) {
//         const purchaseItem = purchaseOrder.items.find(
//           pi => pi.productId.toString() === item.productId
//         );
//         if (purchaseItem) {
//           purchaseItem.previousReceivedQty = Math.max(0, (purchaseItem.previousReceivedQty || 0) - item.receivingNow);
//         }
//       }
//       await purchaseOrder.save();
//     }

//     grn.isDeleted = true;
//     await grn.save();

//     res.json({ success: true, message: "GRN deleted successfully" });
//   } catch (err) {
//     next(err);
//   }
// };