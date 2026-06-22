// controllers/deliveryChallanController.js
const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");
const cloudinary = require("../utils/cloudinary/cloudinary");

// Generate unique challan number
const generateChallanNo = async (req) => {
  const { Counter: CounterModel } = await getAutoModels(req);
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const counterKey = `DC${year}${month}`;

  const counter = await CounterModel.findByIdAndUpdate(
    counterKey,
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );

  const sequence = String(counter.seq).padStart(4, "0");
  return `${counterKey}${sequence}`;
};

// Create Delivery Challan from Invoice
// const createFromInvoice = async (req, res) => {
//   try {
//     const {
//       CustomerInvoice: InvoiceModel,
//       DeliveryChallan: DeliveryChallanModel,
//     } = await getAutoModels(req);

//     const { 
//       invoiceId, 
//       transporterId, 
//       vehicleId, 
//       driverId, 
//       itemsToDispatch,
//       challanDate,
//       notes,
//       // ========== NEW TRANSPORT FIELDS ==========
//       transportMode,
//       subMode,
//       lrNo,
//       railwayReceiptNo,
//       wagonNo,
//       trainNo,
//       railwayWagonNo,
//       railwayTrainNo,
//       rrbNo,
//       freightCharge,
//       otherCharges,
//     } = req.body;

//     // Get source invoice
//     const invoice = await InvoiceModel.findById(invoiceId)
//       .populate("customerId")
//       .populate("transporterId")
//       .populate("vehicleId")
//       .populate("driverId");

//     if (!invoice) {
//       return res.status(404).json({ success: false, error: "Invoice not found" });
//     }

//     // Validate transport fields if provided
//     if (transportMode === "roadways" && subMode === "LR" && lrNo) {
//       const validation = validateLRNumber(lrNo);
//       if (validation.error) {
//         return res.status(400).json({ success: false, error: validation.error });
//       }
//     }

//     // Generate challan number
//     const challanNo = await generateChallanNo(req);

//     // Prepare items for delivery challan
//     const challanItems = itemsToDispatch.map(item => {
//       const originalItem = invoice.items.find(i => 
//         i.productId?.toString() === item.productId || i.productId === item.productId
//       );

//       const unitPrice = originalItem?.unitPrice || 0;
//       const taxRate = originalItem?.taxRate || 0;
//       const taxAmount = originalItem?.taxAmount || 0;
//       const amount = originalItem?.amount || 0;
//       const hsnCode = originalItem?.hsnCode || "";

//       let serialNumbers = [];
//       if (item.selectedSerialNos) {
//         if (Array.isArray(item.selectedSerialNos)) {
//           serialNumbers = item.selectedSerialNos.filter(sn => sn && sn !== "[]");
//         } else if (typeof item.selectedSerialNos === 'string' && item.selectedSerialNos !== "[]") {
//           try {
//             const parsed = JSON.parse(item.selectedSerialNos);
//             serialNumbers = Array.isArray(parsed) ? parsed : [item.selectedSerialNos];
//           } catch {
//             serialNumbers = [item.selectedSerialNos];
//           }
//         }
//       }

//       return {
//         productId: item.productId,
//         itemName: originalItem?.itemName || item.itemName,
//         description: originalItem?.description || "",
//         qty: originalItem?.qty || item.dispatchedQty,
//         dispatchedQty: item.dispatchedQty,
//         unit: originalItem?.unit || item.unit,
//         serialNumbers: serialNumbers,
//         lotNumber: originalItem?.lotNumber || item.lotNumber || "",
//         unitPrice: unitPrice,
//         taxRate: taxRate,
//         taxAmount: taxAmount,
//         amount: amount,
//         hsnCode: hsnCode,
//       };
//     });

//     // Create delivery challan with transport details
//     const deliveryChallan = new DeliveryChallanModel({
//       challanNo,
//       challanType: "against_invoice",
//       sourceType: "Invoice",
//       sourceId: invoiceId,
//       customerId: invoice.customerId._id,
//       customerGstin: invoice.customerId.gstin || "",
//       customerState: invoice.customerId.state || "",
//       customerCity: invoice.customerId.city || "",
//       customerPincode: invoice.customerId.pincode || "",
//       // Transport details
//       transportMode: transportMode || invoice.transportMode || null,
//       subMode: subMode || invoice.subMode || null,
//       lrNo: lrNo || invoice.lrNo || null,
//       railwayReceiptNo: railwayReceiptNo || invoice.railwayReceiptNo || null,
//       wagonNo: wagonNo || invoice.wagonNo || null,
//       trainNo: trainNo || invoice.trainNo || null,
//       railwayWagonNo: railwayWagonNo || invoice.railwayWagonNo || null,
//       railwayTrainNo: railwayTrainNo || invoice.railwayTrainNo || null,
//       rrbNo: rrbNo || invoice.rrbNo || null,
//       freightCharge: freightCharge || invoice.freightCharge || 0,
//       otherCharges: otherCharges || invoice.otherCharges || 0,
//       transporterId: transporterId || invoice.transporterId?._id || null,
//       vehicleId: vehicleId || invoice.vehicleId?._id || null,
//       driverId: driverId || invoice.driverId?._id || null,
//       items: challanItems,
//       challanDate: challanDate ? new Date(challanDate) : new Date(),
//       fromAddress: invoice.shippingAddress || invoice.billingAddress,
//       toAddress: invoice.customerId.address,
//       subtotal: invoice.subtotal || 0,
//       totalTax: invoice.totalTax || 0,
//       grandTotal: invoice.grandTotal || 0,
//       status: "dispatched",
//       notes: notes || `Created from Invoice ${invoice.invoiceNo}`,
//       createdBy: req.user?._id,
//     });

//     await deliveryChallan.save();

//     // Update invoice
//     invoice.dispatched = true;
//     invoice.shipmentStatus = "dispatched";
//     invoice.shipmentNo = deliveryChallan.challanNo;
//     if (!invoice.deliveryChallans) invoice.deliveryChallans = [];
//     invoice.deliveryChallans.push(deliveryChallan._id);
//     await invoice.save();

//     res.status(201).json({
//       success: true,
//       message: "Delivery Challan created successfully",
//       deliveryChallan,
//     });
//   } catch (error) {
//     console.error("Error creating delivery challan:", error);
//     res.status(500).json({ success: false, error: error.message });
//   }
// };

// Create Delivery Challan from Invoice (Updated to handle both direct and converted)
const createFromInvoice = async (req, res) => {
  try {
    const {
      CustomerInvoice: InvoiceModel,
      DeliveryChallan: DeliveryChallanModel,
    } = await getAutoModels(req);

    let attachments = [];

    // Handle existing attachments
    if (req.body.existingAttachments) {
      try {
        attachments = JSON.parse(req.body.existingAttachments);
      } catch (e) {
        attachments = [];
      }
    }

    // Handle new file uploads
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "delivery_challan_attachments",
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
    let itemsToDispatch = req.body.itemsToDispatch;
    if (typeof itemsToDispatch === 'string') {
      try {
        itemsToDispatch = JSON.parse(itemsToDispatch);
      } catch (e) {
        itemsToDispatch = [];
      }
    }

    const {
      invoiceId,           // For direct "against_invoice" flow
      sourceInvoiceId,     // For conversion flow
      sourceType,          // "Invoice" for conversion
      transporterId,
      vehicleId,
      driverId,
      challanDate,
      notes,
      transportMode,
      subMode,
      lrNo,
      railwayReceiptNo,
      wagonNo,
      trainNo,
      railwayWagonNo,
      railwayTrainNo,
      rrbNo,
      freightCharge,
      otherCharges,
    } = req.body;

    // Determine which ID to use (sourceInvoiceId takes priority for conversion)
    const actualInvoiceId = sourceInvoiceId || invoiceId;

    if (!actualInvoiceId) {
      return res.status(400).json({
        success: false,
        error: "Invoice ID is required"
      });
    }

    // Get source invoice
    const invoice = await InvoiceModel.findById(actualInvoiceId)
      .populate("customerId")
      .populate("transporterId")
      .populate("vehicleId")
      .populate("driverId");

    if (!invoice) {
      return res.status(404).json({ success: false, error: "Invoice not found" });
    }

    // Determine challan type - if sourceType is provided, it's a conversion
    const challanTypeValue = sourceType === "Invoice" ? "against_invoice" : "against_invoice";

    // Generate challan number
    const challanNo = await generateChallanNo(req);

    // Prepare items for delivery challan
    const challanItems = itemsToDispatch.map(item => {
      const originalItem = invoice.items.find(i =>
        i.productId?.toString() === item.productId || i.productId === item.productId
      );

      // Get discount values from the original invoice item
      const discountPct = originalItem?.discountPct || 0;
      const discountAmt = originalItem?.discountAmt || 0;

      const unitPrice = originalItem?.unitPrice || 0;
      const taxRate = originalItem?.taxRate || 0;
      const taxAmount = originalItem?.taxAmount || 0;
      const amount = originalItem?.amount || 0;
      const hsnCode = originalItem?.hsnCode || "";

      let serialNumbers = [];
      if (item.selectedSerialNos) {
        if (Array.isArray(item.selectedSerialNos)) {
          serialNumbers = item.selectedSerialNos.filter(sn => sn && sn !== "[]");
        } else if (typeof item.selectedSerialNos === 'string' && item.selectedSerialNos !== "[]") {
          try {
            const parsed = JSON.parse(item.selectedSerialNos);
            serialNumbers = Array.isArray(parsed) ? parsed : [item.selectedSerialNos];
          } catch {
            serialNumbers = [item.selectedSerialNos];
          }
        }
      }

      return {
        productId: item.productId,
        itemName: originalItem?.itemName || item.itemName,
        description: originalItem?.description || "",
        qty: originalItem?.qty || item.dispatchedQty,
        dispatchedQty: item.dispatchedQty,
        unit: originalItem?.unit || item.unit,
        serialNumbers: serialNumbers,
        lotNumber: originalItem?.lotNumber || item.lotNumber || "",
        unitPrice: unitPrice,
        taxRate: taxRate,
        taxAmount: taxAmount,
        discountPct: discountPct,    // ← ADD THIS
        discountAmt: discountAmt,
        amount: amount,
        hsnCode: hsnCode,
      };
    });

    // Create delivery challan with transport details
    const deliveryChallan = new DeliveryChallanModel({
      challanNo,
      challanType: challanTypeValue,
      sourceType: "Invoice",
      sourceId: actualInvoiceId,
      customerId: invoice.customerId._id,
      customerGstin: invoice.customerId.gstin || "",
      customerState: invoice.customerId.state || "",
      customerCity: invoice.customerId.city || "",
      customerPincode: invoice.customerId.pincode || "",
      // Transport details
      transportMode: transportMode || invoice.transportMode || null,
      subMode: subMode || invoice.subMode || null,
      lrNo: lrNo || invoice.lrNo || null,
      railwayReceiptNo: railwayReceiptNo || invoice.railwayReceiptNo || null,
      wagonNo: wagonNo || invoice.wagonNo || null,
      trainNo: trainNo || invoice.trainNo || null,
      railwayWagonNo: railwayWagonNo || invoice.railwayWagonNo || null,
      railwayTrainNo: railwayTrainNo || invoice.railwayTrainNo || null,
      rrbNo: rrbNo || invoice.rrbNo || null,
      freightCharge: freightCharge || invoice.freightCharge || 0,
      otherCharges: otherCharges || invoice.otherCharges || 0,
      transporterId: transporterId || invoice.transporterId?._id || null,
      vehicleId: vehicleId || invoice.vehicleId?._id || null,
      driverId: driverId || invoice.driverId?._id || null,
      items: challanItems,
      challanDate: challanDate ? new Date(challanDate) : new Date(),
      fromAddress: invoice.shippingAddress || invoice.billingAddress,
      toAddress: invoice.customerId.address,
      subtotal: invoice.subtotal || 0,
      totalTax: invoice.totalTax || 0,
      grandTotal: invoice.grandTotal || 0,
      status: "dispatched",
      notes: notes || `Created from Invoice ${invoice.invoiceNo}`,
      attachments: attachments,
      createdBy: req.user?._id,
    });

    await deliveryChallan.save();

    // Update invoice
    invoice.dispatched = true;
    invoice.shipmentStatus = "dispatched";
    invoice.shipmentNo = deliveryChallan.challanNo;
    if (!invoice.deliveryChallans) invoice.deliveryChallans = [];
    invoice.deliveryChallans.push(deliveryChallan._id);
    await invoice.save();

    res.status(201).json({
      success: true,
      message: "Delivery Challan created successfully",
      deliveryChallan,
    });
  } catch (error) {
    console.error("Error creating delivery challan:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Get all Delivery Challans
const getAll = async (req, res) => {
  try {
    const models = await getAutoModels(req);

    const DeliveryChallanModel = models?.DeliveryChallan;
    const EWBModel = models?.EWB;

    if (!DeliveryChallanModel) {
      return res.status(500).json({
        success: false,
        error: "DeliveryChallan model not found",
      });
    }

    const {
      page = 1,
      limit = 10,
      search,
      status,
      startDate,
      endDate,
    } = req.query;

    const filter = {};

    // STATUS FILTER
    if (status && status !== "All" && status !== "Recent") {
      filter.status = status.toLowerCase();
    }

    // SEARCH FILTER
    if (search?.trim()) {
      filter.$or = [
        {
          challanNo: {
            $regex: search.trim(),
            $options: "i",
          },
        },
        {
          ewayBillNo: {
            $regex: search.trim(),
            $options: "i",
          },
        },
      ];
    }

    // DATE FILTER
    if (startDate || endDate) {
      filter.challanDate = {};

      if (startDate) {
        filter.challanDate.$gte = new Date(startDate);
      }

      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.challanDate.$lte = end;
      }
    }

    // PAGINATION
    const pageNumber = Math.max(1, parseInt(page) || 1);
    const limitNumber = Math.max(1, parseInt(limit) || 10);
    const skip = (pageNumber - 1) * limitNumber;

    // FETCH CHALLANS
    let deliveryChallans = await DeliveryChallanModel.find(filter)
      .populate("customerId", "name phone address gstin city state country pincode")
      .populate("transporterId", "transporterName")
      .populate("vehicleId", "vehicleNumber vehicleType")
      .populate("driverId", "driverName phoneNumber")
      .populate("sourceId", "invoiceNo")
      // .select('+generatedInvoice +generatedInvoiceNo') 
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNumber)
      .lean();

    if (!Array.isArray(deliveryChallans)) {
      deliveryChallans = [];
    }

    // =========================
    // FIXED EWB FETCH (ROBUST)
    // =========================
    const ewbMap = new Map();

    if (EWBModel && deliveryChallans.length > 0) {
      const challanIds = deliveryChallans
        .map((ch) => ch?._id)
        .filter(Boolean);

      const ewbs = await EWBModel.find({
        deliveryChallanId: { $in: challanIds },
      })
        .sort({ createdAt: -1 })
        .lean();

      for (const ewb of ewbs) {
        if (ewb?.deliveryChallanId) {
          const key = String(ewb.deliveryChallanId);
          if (!ewbMap.has(key)) {
            ewbMap.set(key, ewb);
          }
        }
      }
    }

    // =========================
    // MERGE
    // =========================
    deliveryChallans = deliveryChallans.map((ch) => {
      const ewb = ewbMap.get(String(ch._id));

      return {
        ...ch,

        ewayBillNo: ewb?.ewayBillNo || ch?.ewayBillNo || "",
        ewayBillDate: ewb?.ewayBillDate || ch?.ewayBillDate || null,
        validUpto: ewb?.validUpto || "",
        ewbStatus: ewb?.status || ch?.ewbStatus || "NOT_GENERATED",
        ewbId: ewb?._id || ch?.ewbId || null,
      };
    });

    // COUNT
    const total = await DeliveryChallanModel.countDocuments(filter);

    return res.status(200).json({
      success: true,
      deliveryChallans,
      total,
      page: pageNumber,
      limit: limitNumber,
      totalPages: Math.ceil(total / limitNumber),
    });

  } catch (error) {
    console.error("Error fetching delivery challans:", error);

    return res.status(500).json({
      success: false,
      error: error?.message || "Internal server error",
    });
  }
};
// Get single Delivery Challan by ID
// Get single Delivery Challan by ID - FIXED with product financial data
const getDeliveryChallanById = async (req, res) => {
  try {
    const { DeliveryChallan: DeliveryChallanModel, Product: ProductModel } = await getAutoModels(req);
    const { id } = req.params;

    const deliveryChallan = await DeliveryChallanModel.findById(id)
      .populate("customerId", "name phone address email gstin city state country pincode")
      .populate("transporterId", "transporterName ownerName phone")
      .populate("vehicleId", "vehicleNumber vehicleType")
      .populate("driverId", "driverName phoneNumber")
      .populate("sourceId", "invoiceNo invoiceDate grandTotal")
      .populate("createdBy", "firstName lastName");

    if (!deliveryChallan) {
      return res.status(404).json({ success: false, error: "Delivery Challan not found" });
    }

    // Process items to add financial data
    const processedItems = await Promise.all(deliveryChallan.items.map(async (item) => {
      // Get full product details if productId exists
      let product = null;
      let unitPrice = item.unitPrice || 0;
      let taxRate = item.taxRate || 0;
      let hsnCode = item.hsnCode || "";
      let taxAmount = item.taxAmount || 0;
      let amount = item.amount || 0;

      if (item.productId) {
        product = await ProductModel.findById(item.productId);
        if (product) {
          // Use item values if they exist, otherwise use product values
          unitPrice = unitPrice || product.sellingPrice || 0;

          // Extract tax rate from product tax string (e.g., "GST 18%" -> 18)
          if (product.tax) {
            const taxMatch = product.tax.match(/\d+/);
            taxRate = taxRate || (taxMatch ? parseFloat(taxMatch[0]) : 0);
          }

          hsnCode = hsnCode || (product.hsn?.hsnCode || "");
        }
      }

      // Calculate financials if not already present
      const qty = item.qty || item.dispatchedQty || 0;
      const amountWithoutTax = qty * unitPrice;

      // Only calculate if values are zero
      if (taxAmount === 0 && amountWithoutTax > 0) {
        taxAmount = (amountWithoutTax * taxRate) / 100;
      }

      if (amount === 0 && amountWithoutTax > 0) {
        amount = amountWithoutTax + taxAmount;
      }

      return {
        productId: item.productId,
        itemName: item.itemName,
        qty: qty,
        dispatchedQty: item.dispatchedQty || qty,
        unit: item.unit || product?.unit || "Piece",
        serialNumbers: item.serialNumbers || [],
        lotNumber: item.lotNumber || "",
        hsnCode: hsnCode,
        unitPrice: unitPrice,
        taxRate: taxRate,
        taxAmount: taxAmount,
        amount: amount,
        description: product?.description || "",
      };
    }));

    // Calculate totals
    const subtotal = processedItems.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
    const totalTax = processedItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    const totalDiscount = deliveryChallan.totalDiscount || 0;
    const additionalCharges = deliveryChallan.additionalCharges || 0;
    const pointsRedeemedAmount = deliveryChallan.pointsRedeemedAmount || 0;
    const grandTotal = subtotal + totalTax - totalDiscount - pointsRedeemedAmount + additionalCharges;
    const paidAmount = deliveryChallan.paidAmount || 0;

    // Convert to plain object and add calculated fields
    const challanObj = deliveryChallan.toObject();
    challanObj.items = processedItems;
    challanObj.subtotal = subtotal;
    challanObj.totalTax = totalTax;
    challanObj.totalDiscount = totalDiscount;
    challanObj.additionalCharges = additionalCharges;
    challanObj.pointsRedeemedAmount = pointsRedeemedAmount;
    challanObj.grandTotal = grandTotal;
    challanObj.paidAmount = paidAmount;

    res.json({ success: true, deliveryChallan: challanObj });
  } catch (error) {
    console.error("Error fetching delivery challan:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Update Delivery Challan status
const updateDeliveryChallanStatus = async (req, res) => {
  try {
    const { DeliveryChallan: DeliveryChallanModel } = await getAutoModels(req);
    const { id } = req.params;
    const { status, actualDeliveryDate } = req.body;

    const deliveryChallan = await DeliveryChallanModel.findById(id);
    if (!deliveryChallan) {
      return res.status(404).json({ success: false, error: "Delivery Challan not found" });
    }

    deliveryChallan.status = status || deliveryChallan.status;
    if (actualDeliveryDate) {
      deliveryChallan.actualDeliveryDate = actualDeliveryDate;
    }

    await deliveryChallan.save();

    res.json({
      success: true,
      message: "Delivery Challan status updated successfully",
      deliveryChallan,
    });
  } catch (error) {
    console.error("Error updating delivery challan:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create Independent Delivery Challan (without invoice)
const createIndependent = async (req, res) => {
  try {
    const {
      DeliveryChallan: DeliveryChallanModel,
      Customer: CustomerModel,
      Product: ProductModel,
    } = await getAutoModels(req);
    let attachments = [];

    if (req.body.existingAttachments) {
      try {
        attachments = JSON.parse(req.body.existingAttachments);
      } catch (e) {
        attachments = [];
      }
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "delivery_challan_attachments",
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
    let items = req.body.items;
    if (typeof items === 'string') {
      try {
        items = JSON.parse(items);
      } catch (e) {
        items = [];
      }
    }

    const {
      challanType,
      customerId,
      transporterId,
      vehicleId,
      driverId,
      challanDate,
      fromAddress,
      toAddress,
      purposeOfMovement,
      expectedReturnDate,
      ewayBillNo,
      notes,
      // ========== NEW TRANSPORT FIELDS ==========
      transportMode,      // 'roadways' or 'railways'
      subMode,            // 'LR' or 'RR' (for roadways)
      lrNo,               // LR number (for roadways LR)
      railwayReceiptNo,   // Railway Receipt No (for roadways RR)
      wagonNo,            // Wagon No (for roadways RR)
      trainNo,            // Train No (for roadways RR)
      railwayWagonNo,     // Wagon No (for railways)
      railwayTrainNo,     // Train No (for railways)
      rrbNo,              // RR Number (for railways)
      freightCharge,
      otherCharges,
    } = req.body;

    // Validate required fields
    if (!customerId) {
      return res.status(400).json({ success: false, error: "Customer is required" });
    }
    if (!items || items.length === 0) {
      return res.status(400).json({ success: false, error: "At least one item is required" });
    }

    // Validate customer
    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, error: "Customer not found" });
    }

    // Generate challan number
    const challanNo = await generateChallanNo(req);

    // Process items
    const challanItems = await Promise.all(items.map(async (item) => {
      let product = null;
      let productName = item.itemName;
      let unitPrice = item.unitPrice || 0;
      let taxRate = item.taxRate || 0;
      let hsnCode = item.hsnCode || "";

      if (item.productId) {
        product = await ProductModel.findById(item.productId);
        if (product) {
          productName = product.productName;
          unitPrice = unitPrice || product.sellingPrice || 0;
          if (product.tax) {
            const taxMatch = product.tax.match(/\d+/);
            taxRate = taxRate || (taxMatch ? parseFloat(taxMatch[0]) : 0);
          }
          hsnCode = hsnCode || (product.hsn?.hsnCode || "");
        }
      }

      const qty = item.qty || 1;
      const amountWithoutTax = qty * unitPrice;
      const discountAmt = item.discountAmt || 0;
      const discountPct = item.discountPct || 0;
      const taxableAmount = amountWithoutTax - discountAmt;
      const taxAmount = (taxableAmount * taxRate) / 100;
      const totalAmount = taxableAmount + taxAmount;

      return {
        productId: item.productId || null,
        itemName: productName || item.itemName,
        description: item.description || "",
        qty: qty,
        dispatchedQty: qty,
        unit: item.unit || product?.unit || "Piece",
        serialNumbers: Array.isArray(item.serialNumbers)
          ? item.serialNumbers.filter(s => s && s !== "[]" && s !== "")
          : [],
        lotNumber: item.lotNumber || "",
        unitPrice: unitPrice,
        taxRate: taxRate,
        taxAmount: taxAmount,
        discountPct: item.discountPct || 0,
        discountAmt: item.discountAmt || 0,
        amount: totalAmount,
        hsnCode: hsnCode,
        reason: item.reason || "",
      };
    }));

    const subtotal = challanItems.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
    const totalTax = challanItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    const grandTotal = subtotal + totalTax + (parseFloat(freightCharge) || 0) + (parseFloat(otherCharges) || 0);

    // Create delivery challan with transport details
    const deliveryChallan = new DeliveryChallanModel({
      challanNo,
      challanType: challanType || "other",
      sourceType: null,
      sourceId: null,
      customerId,
      customerGstin: req.body.customerGstin || "",
      customerState: req.body.customerState || "",
      customerCity: req.body.customerCity || "",
      customerPincode: req.body.customerPincode || "",
      // Transport details
      transportMode: transportMode || null,
      subMode: subMode || null,
      lrNo: lrNo || null,
      railwayReceiptNo: railwayReceiptNo || null,
      wagonNo: wagonNo || null,
      trainNo: trainNo || null,
      railwayWagonNo: railwayWagonNo || null,
      railwayTrainNo: railwayTrainNo || null,
      rrbNo: rrbNo || null,
      freightCharge: parseFloat(freightCharge) || 0,
      otherCharges: parseFloat(otherCharges) || 0,
      transporterId: transporterId || null,
      vehicleId: vehicleId || null,
      driverId: driverId || null,
      items: challanItems,
      challanDate: challanDate || new Date(),
      expectedReturnDate: expectedReturnDate || null,
      fromAddress: fromAddress || "",
      toAddress: toAddress || "",
      purposeOfMovement: purposeOfMovement || "",
      ewayBillNo: ewayBillNo || "",
      subtotal: subtotal,
      totalTax: totalTax,
      grandTotal: grandTotal,
      status: "dispatched",
      notes: notes || "",
      attachments: attachments,
      createdBy: req.user?._id,
    });

    await deliveryChallan.save();

    res.status(201).json({
      success: true,
      message: "Delivery Challan created successfully",
      deliveryChallan,
    });
  } catch (error) {
    console.error("Error creating independent delivery challan:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add this new function to deliveryChallanController.js

// const convertToInvoice = async (req, res) => {
//   try {
//     const {
//       DeliveryChallan: DeliveryChallanModel,
//       CustomerInvoice: InvoiceModel,
//       Customer: CustomerModel,
//     } = await getAutoModels(req);

//     const { id } = req.params;

//     // ── fetch challan with all populated refs ──────────────────────────
//     const challan = await DeliveryChallanModel.findById(id)
//       .populate("customerId")
//       .populate("transporterId")
//       .populate("vehicleId")
//       .populate("driverId");

//     if (!challan) {
//       return res.status(404).json({ success: false, error: "Delivery challan not found" });
//     }

//     // ── build items — fix taxAmount + amount + serialNumbers ───────────
//     // const invoiceItems = challan.items.map((item) => {
//     //   const qty = item.qty || item.dispatchedQty || 1;
//     //   const unitPrice = item.unitPrice || 0;
//     //   const taxRate = item.taxRate || 0;
//     //    const discountAmt = item.discountAmt || 0;
//     //   const discountPct = item.discountPct || 0;

//     //   const baseAmount = qty * unitPrice;
//     //   const taxAmount = parseFloat(((baseAmount * taxRate) / 100).toFixed(2));
//     //   const amount = parseFloat((baseAmount + taxAmount).toFixed(2));
//         const invoiceItems = challan.items.map((item) => {
//       const qty = item.qty || item.dispatchedQty || 1;
//       const unitPrice = item.unitPrice || 0;
//       const taxRate = item.taxRate || 0;

//       // Calculate item discount
//       const discountAmt = item.discountAmt || 0;
//       const discountPct = item.discountPct || 0;

//       const baseAmount = qty * unitPrice;

//       // Calculate discount amount
//       let finalDiscountAmt = discountAmt;
//       if (discountPct > 0 && finalDiscountAmt === 0) {
//         finalDiscountAmt = (baseAmount * discountPct) / 100;
//       }

//       const taxableAmount = baseAmount - finalDiscountAmt;
//       const taxAmount = parseFloat(((taxableAmount * taxRate) / 100).toFixed(2));
//       const amount = parseFloat((taxableAmount + taxAmount).toFixed(2));

//       // Fix "[]" string that comes from incorrect serialisation
//       let selectedSerialNos = [];
//       if (Array.isArray(item.serialNumbers)) {
//         selectedSerialNos = item.serialNumbers.filter(
//           (s) => s && s !== "[]" && s !== ""
//         );
//       }

//       return {
//          productId: item.productId,
//         itemName: item.itemName,
//         hsnCode: item.hsnCode || "",
//         description: item.description || "",
//         lotNumber: item.lotNumber || "",
//         selectedSerialNos,
//         qty,
//         unit: item.unit || "Piece",
//         unitPrice,
//         taxType: `GST ${taxRate}%`,
//         taxRate,
//         taxAmount,
//         discountPct: discountPct,
//         discountAmt: finalDiscountAmt,
//         amount,
//       };
//     });

//  const subtotal = invoiceItems.reduce((s, i) => s + (i.qty * i.unitPrice), 0);
//     const totalDiscount = invoiceItems.reduce((s, i) => s + (i.discountAmt || 0), 0);
//     const totalTax = invoiceItems.reduce((s, i) => s + (i.taxAmount || 0), 0);
//     const grandTotal = subtotal - totalDiscount + totalTax;

//     // ── address ────────────────────────────────────────────────────────
//     const customer = challan.customerId; // populated
//     const addressParts = [
//       customer.address, customer.city,
//       customer.state, customer.country, customer.pincode,
//     ].filter(Boolean);
//     const address = addressParts.join(", ");

//     // ── transport — use IDs directly (they are ObjectIds after populate) ─
//     const transporterId = challan.transporterId ?
//       (challan.transporterId?._id || challan.transporterId) : null;
//     const vehicleId = challan.vehicleId
//     ?  (challan.vehicleId?._id || challan.vehicleId) : null;
//     const driverId = challan.driverId
//     ?  (challan.driverId?._id || challan.driverId) : null;

//     // ── copy attachments ───────────────────────────────────────────────
//     const attachments = (challan.attachments || []).map((a) => ({
//       url: a.url,
//       public_id: a.public_id,
//       filename: a.filename,
//       fileType: a.fileType,
//       fileSize: a.fileSize,
//       uploadedAt: a.uploadedAt,
//     }));

//     // ── generate invoice number ────────────────────────────────────────
//     const { Counter: CounterModel } = await getAutoModels(req);
//     const date = new Date();
//     const year = date.getFullYear();
//     const month = String(date.getMonth() + 1).padStart(2, "0");
//     const counterKey = `INV${year}${month}`;
//     const counter = await CounterModel.findByIdAndUpdate(
//       counterKey,
//       { $inc: { seq: 1 } },
//       { upsert: true, new: true }
//     );
//     const invoiceNo = `INV${year}${month}${String(counter.seq).padStart(3, "0")}`;

//     // ── build invoice ──────────────────────────────────────────────────
//     const dueDate = new Date();
//     dueDate.setDate(dueDate.getDate() + 7);

//     let additionalDiscountPct = 0;
//     let additionalDiscountAmt = 0;
//     if (challan.additionalDiscountPct) additionalDiscountPct = challan.additionalDiscountPct;
//     if (challan.additionalDiscountAmt) additionalDiscountAmt = challan.additionalDiscountAmt;

//     // const invoice = new InvoiceModel({
//     //   customerId: customer._id,
//     //   invoiceNo,
//     //   invoiceDate: new Date(),
//     //   dueDate,
//     //   billingAddress: address,
//     //   shippingAddress: challan.toAddress || address,
//     //   items: invoiceItems,
//     //   subtotal,
//     //   totalTax,
//     //   totalDiscount: 0,
//     //   additionalCharges: 0,
//     //   additionalChargesDetails: {
//     //     shipping: 0, handling: 0, packing: 0, service: 0, other: 0,
//     //   },
//     //   grandTotal,
//     //   paidAmount: 0,
//     //   dueAmount: grandTotal,
//     //   fullyReceived: false,

//     //   // ── transport ──────────────────────────────────────────────────
//     //   transportMode: challan.transportMode || null,
//     //   subMode: challan.subMode || null,
//     //   lrNo: challan.lrNo || null,
//     //   railwayReceiptNo: challan.railwayReceiptNo || null,
//     //   wagonNo: challan.wagonNo || null,
//     //   trainNo: challan.trainNo || null,
//     //   railwayWagonNo: challan.railwayWagonNo || null,
//     //   railwayTrainNo: challan.railwayTrainNo || null,
//     //   rrbNo: challan.rrbNo || null,
//     //   freightCharge: challan.freightCharge || 0,
//     //   otherCharges: challan.otherCharges || 0,
//     //   transporterId,
//     //   vehicleId,
//     //   driverId,

//     //   notes: challan.notes || "",
//     //   attachments,
//     //   type: "invoice",
//     //   status: "draft",
//     //   dispatched: false,
//     //   sourceDeliveryChallanId: challan._id,
//     //   createdBy: req.user?._id,
//     // });

//     // await invoice.save();

//     const invoice = new InvoiceModel({
//       customerId: customer._id,
//       invoiceNo,
//       invoiceDate: new Date(),
//       dueDate,
//       billingAddress: address,
//       shippingAddress: challan.toAddress || address,
//       items: invoiceItems,
//       subtotal: subtotal,
//       totalTax: totalTax,
//       totalDiscount: totalDiscount,
//       additionalDiscount: {
//         pct: additionalDiscountPct,
//         amt: additionalDiscountAmt,
//       },
//       additionalCharges: challan.additionalCharges || 0,
//       additionalChargesDetails: {
//         shipping: 0, handling: 0, packing: 0, service: 0, other: 0,
//       },
//       grandTotal: grandTotal,
//       paidAmount: 0,
//       dueAmount: grandTotal,
//       fullyReceived: false,

//       // ========== TRANSPORT FIELDS - COPY ALL ==========
//       transportMode: challan.transportMode || null,
//       subMode: challan.subMode || null,
//       lrNo: challan.lrNo || null,
//       railwayReceiptNo: challan.railwayReceiptNo || null,
//       wagonNo: challan.wagonNo || null,
//       trainNo: challan.trainNo || null,
//       railwayWagonNo: challan.railwayWagonNo || null,
//       railwayTrainNo: challan.railwayTrainNo || null,
//       rrbNo: challan.rrbNo || null,
//       freightCharge: challan.freightCharge || 0,
//       otherCharges: challan.otherCharges || 0,
//       transporterId: transporterId,
//       vehicleId: vehicleId,
//       driverId: driverId,

//       notes: challan.notes || "",
//       attachments: attachments,
//       type: "invoice",
//       status: "draft",
//       dispatched: false,
//       sourceDeliveryChallanId: challan._id,
//       createdBy: req.user?._id,
//     });

//     await invoice.save();

//     // ── mark challan as converted ──────────────────────────────────────
//     challan.generatedInvoice = invoice._id;
//     challan.generatedInvoiceNo = invoice.invoiceNo;  // ← add
//     challan.convertedAt = new Date();
//     await challan.save();

//     return res.status(201).json({
//       success: true,
//       message: "Invoice created from delivery challan",
//       invoice,
//     });
//   } catch (error) {
//     console.error("convertToInvoice error:", error);
//     return res.status(500).json({ success: false, error: error.message });
//   }
// };
const convertToInvoice = async (req, res) => {
  try {
    const {
      DeliveryChallan: DeliveryChallanModel,
      CustomerInvoice: InvoiceModel,
      Customer: CustomerModel,
    } = await getAutoModels(req);

    const { id } = req.params;

    // ── fetch challan with all populated refs ──────────────────────────
    const challan = await DeliveryChallanModel.findById(id)
      .populate("customerId")
      .populate("transporterId")
      .populate("vehicleId")
      .populate("driverId");

    if (!challan) {
      return res.status(404).json({ success: false, error: "Delivery challan not found" });
    }

    // ── build items — FIXED: Properly calculate taxAmount and amount ───────────
    const invoiceItems = challan.items.map((item) => {
      const qty = item.qty || item.dispatchedQty || 1;
      const unitPrice = item.unitPrice || 0;
      const taxRate = item.taxRate || 0;

      // Get item discount (fix: use discountAmt/discountPct from schema)
      const discountAmt = item.discountAmt || 0;
      const discountPct = item.discountPct || 0;

      const baseAmount = qty * unitPrice;

      // Calculate discount amount
      let finalDiscountAmt = discountAmt;
      if (discountPct > 0 && finalDiscountAmt === 0) {
        finalDiscountAmt = (baseAmount * discountPct) / 100;
      }

      const taxableAmount = baseAmount - finalDiscountAmt;
      const taxAmount = parseFloat(((taxableAmount * taxRate) / 100).toFixed(2));
      const amount = parseFloat((taxableAmount + taxAmount).toFixed(2));

      // Fix "[]" string that comes from incorrect serialisation
      let selectedSerialNos = [];
      if (Array.isArray(item.serialNumbers)) {
        selectedSerialNos = item.serialNumbers.filter(
          (s) => s && s !== "[]" && s !== ""
        );
      }

      return {
        productId: item.productId,
        itemName: item.itemName,
        hsnCode: item.hsnCode || "",
        description: item.description || "",
        lotNumber: item.lotNumber || "",
        selectedSerialNos,
        qty,
        unit: item.unit || "Piece",
        unitPrice,
        taxType: `GST ${taxRate}%`,
        taxRate,
        taxAmount,
        discountPct: discountPct,
        discountAmt: finalDiscountAmt,
        amount,
      };
    });

    // Recalculate totals based on items
    const subtotal = invoiceItems.reduce((s, i) => s + (i.qty * i.unitPrice), 0);
    const totalDiscount = invoiceItems.reduce((s, i) => s + (i.discountAmt || 0), 0);
    const totalTax = invoiceItems.reduce((s, i) => s + (i.taxAmount || 0), 0);
    const grandTotal = subtotal - totalDiscount + totalTax;

    // ── address ────────────────────────────────────────────────────────
    const customer = challan.customerId;
    const addressParts = [
      customer.address, customer.city,
      customer.state, customer.country, customer.pincode,
    ].filter(Boolean);
    const address = addressParts.join(", ");

    // ── transport — use IDs directly ───────────────────────────────────
    const transporterId = challan.transporterId ?
      (challan.transporterId?._id || challan.transporterId) : null;
    const vehicleId = challan.vehicleId
      ? (challan.vehicleId?._id || challan.vehicleId) : null;
    const driverId = challan.driverId
      ? (challan.driverId?._id || challan.driverId) : null;

    // ── copy attachments ───────────────────────────────────────────────
    const attachments = (challan.attachments || []).map((a) => ({
      url: a.url,
      public_id: a.public_id,
      filename: a.filename,
      fileType: a.fileType,
      fileSize: a.fileSize,
      uploadedAt: a.uploadedAt,
    }));

    // ── generate invoice number ────────────────────────────────────────
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
    const invoiceNo = `INV${year}${month}${String(counter.seq).padStart(3, "0")}`;

    // ── build invoice ──────────────────────────────────────────────────
    const dueDate = new Date();
    dueDate.setDate(dueDate.getDate() + 7);

    // Get additional discount from challan (if exists)
    let additionalDiscountPct = 0;
    let additionalDiscountAmt = 0;
    if (challan.additionalDiscountPct) additionalDiscountPct = challan.additionalDiscountPct;
    if (challan.additionalDiscountAmt) additionalDiscountAmt = challan.additionalDiscountAmt;

    // ========== CRITICAL: Copy payment fields from challan ==========
    // These fields are now in your DeliveryChallan schema
    const paidAmount = challan.paidAmount || 0;
    const fullyReceived = challan.fullyReceived || false;
    const paymentMethod = challan.paymentMethod || "cash";

    // Calculate due amount based on grand total and paid amount
    const dueAmount = Math.max(0, grandTotal - paidAmount);

    // Determine status based on payment
    let status = "draft";
    if (fullyReceived || paidAmount >= grandTotal) {
      status = "paid";
    } else if (paidAmount > 0) {
      status = "partial";
    }

    const invoice = new InvoiceModel({
      customerId: customer._id,
      invoiceNo,
      invoiceDate: new Date(),
      dueDate,
      billingAddress: address,
      shippingAddress: challan.toAddress || address,
      items: invoiceItems,
      subtotal: subtotal,
      totalTax: totalTax,
      totalDiscount: totalDiscount,
      additionalDiscount: {
        pct: additionalDiscountPct,
        amt: additionalDiscountAmt,
      },
      additionalCharges: challan.additionalCharges || 0,
      additionalChargesDetails: {
        shipping: 0, handling: 0, packing: 0, service: 0, other: 0,
      },
      grandTotal: grandTotal,

      // ========== PAYMENT FIELDS - COPY FROM CHALLAN ==========
      paidAmount: paidAmount,
      dueAmount: dueAmount,
      fullyReceived: fullyReceived,
      paymentMethod: paymentMethod,
      status: status,

      // ========== TRANSPORT FIELDS - COPY ALL ==========
      transportMode: challan.transportMode || null,
      subMode: challan.subMode || null,
      lrNo: challan.lrNo || null,
      railwayReceiptNo: challan.railwayReceiptNo || null,
      wagonNo: challan.wagonNo || null,
      trainNo: challan.trainNo || null,
      railwayWagonNo: challan.railwayWagonNo || null,
      railwayTrainNo: challan.railwayTrainNo || null,
      rrbNo: challan.rrbNo || null,
      freightCharge: challan.freightCharge || 0,
      otherCharges: challan.otherCharges || 0,
      transporterId: transporterId,
      vehicleId: vehicleId,
      driverId: driverId,

      notes: challan.notes || "",
      attachments: attachments,
      type: "invoice",
      dispatched: false,
      sourceDeliveryChallanId: challan._id,
      createdBy: req.user?._id,
    });

    await invoice.save();

    // ── mark challan as converted ──────────────────────────────────────
    challan.generatedInvoice = invoice._id;
    challan.generatedInvoiceNo = invoice.invoiceNo;
    challan.convertedAt = new Date();
    await challan.save();

    return res.status(201).json({
      success: true,
      message: "Invoice created from delivery challan",
      invoice,
    });
  } catch (error) {
    console.error("convertToInvoice error:", error);
    return res.status(500).json({ success: false, error: error.message });
  }
};
// Update Delivery Challan
const updateDeliveryChallan = async (req, res) => {
  try {
    const { DeliveryChallan: DeliveryChallanModel, Customer: CustomerModel, Product: ProductModel } = await getAutoModels(req);
    const { id } = req.params;
    let attachments = [...(await DeliveryChallanModel.findById(id)).attachments || []];

    if (req.body.existingAttachments !== undefined) {
      try {
        const existingList = typeof req.body.existingAttachments === 'string'
          ? JSON.parse(req.body.existingAttachments)
          : req.body.existingAttachments;

        attachments = attachments.filter(att =>
          existingList.some(existing => existing.public_id === att.public_id)
        );

        const removedAttachments = attachments.filter(att =>
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

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "delivery_challan_attachments",
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


    const {
      challanType,
      customerId,
      transporterId,
      vehicleId,
      driverId,
      items,
      challanDate,
      fromAddress,
      toAddress,
      purposeOfMovement,
      ewayBillNo,
      notes,
      // ========== NEW TRANSPORT FIELDS ==========
      transportMode,
      subMode,
      lrNo,
      railwayReceiptNo,
      wagonNo,
      trainNo,
      railwayWagonNo,
      railwayTrainNo,
      rrbNo,
      freightCharge,
      otherCharges,
    } = req.body;

    // Find existing delivery challan
    const deliveryChallan = await DeliveryChallanModel.findById(id);
    if (!deliveryChallan) {
      return res.status(404).json({ success: false, error: "Delivery Challan not found" });
    }

    // Validate customer
    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      return res.status(404).json({ success: false, error: "Customer not found" });
    }

    // Process items
    const challanItems = await Promise.all(items.map(async (item) => {
      let product = null;
      let productName = item.itemName;
      let hsnCode = item.hsnCode || "";
      let unitPrice = item.unitPrice || 0;
      let taxRate = item.taxRate || 0;
      let taxAmount = item.taxAmount || 0;
      let amount = item.amount || 0;

      if (item.productId) {
        product = await ProductModel.findById(item.productId);
        if (product) {
          productName = product.productName;
          if (!hsnCode) hsnCode = product.hsn?.hsnCode || "";
          if (!unitPrice) unitPrice = product.sellingPrice || 0;
          if (!taxRate && product.tax) {
            const taxMatch = product.tax.match(/\d+/);
            taxRate = taxMatch ? parseFloat(taxMatch[0]) : 0;
          }
        }
      }
      const qty = item.qty || 1;
      const amountWithoutTax = qty * unitPrice;
      if (taxAmount === 0 && amountWithoutTax > 0) {
        taxAmount = (amountWithoutTax * taxRate) / 100;
      }
      if (amount === 0 && amountWithoutTax > 0) {
        amount = amountWithoutTax + taxAmount;
      }

      const discountPct = item.discountPct || 0;
      const discountAmt = item.discountAmt || 0;

      return {
        productId: item.productId || null,
        itemName: productName || item.itemName,
        description: item.description || "",
        qty: item.qty || 1,
        dispatchedQty: item.qty || 1,
        unit: item.unit || product?.unit || "Piece",
        serialNumbers: item.serialNumbers || [],
        lotNumber: item.lotNumber || "",
        reason: item.reason || "",
        hsnCode: hsnCode,
        unitPrice: unitPrice,
        taxRate: taxRate,
        taxAmount: taxAmount,
        discountPct: item.discountPct || 0,
        discountAmt: item.discountAmt || 0,
        amount: amount,
      };
    }));

    // Update delivery challan with transport details
    deliveryChallan.challanType = challanType || deliveryChallan.challanType;
    deliveryChallan.customerId = customerId;
    deliveryChallan.customerGstin = req.body.customerGstin || deliveryChallan.customerGstin;
    deliveryChallan.customerState = req.body.customerState || deliveryChallan.customerState;
    deliveryChallan.customerCity = req.body.customerCity || deliveryChallan.customerCity;
    deliveryChallan.customerPincode = req.body.customerPincode || deliveryChallan.customerPincode;
    deliveryChallan.transportMode = transportMode || deliveryChallan.transportMode;
    deliveryChallan.subMode = subMode || deliveryChallan.subMode;
    deliveryChallan.lrNo = lrNo || deliveryChallan.lrNo;
    deliveryChallan.railwayReceiptNo = railwayReceiptNo || deliveryChallan.railwayReceiptNo;
    deliveryChallan.wagonNo = wagonNo || deliveryChallan.wagonNo;
    deliveryChallan.trainNo = trainNo || deliveryChallan.trainNo;
    deliveryChallan.railwayWagonNo = railwayWagonNo || deliveryChallan.railwayWagonNo;
    deliveryChallan.railwayTrainNo = railwayTrainNo || deliveryChallan.railwayTrainNo;
    deliveryChallan.rrbNo = rrbNo || deliveryChallan.rrbNo;
    deliveryChallan.freightCharge = freightCharge || deliveryChallan.freightCharge || 0;
    deliveryChallan.otherCharges = otherCharges || deliveryChallan.otherCharges || 0;
    deliveryChallan.transporterId = transporterId || null;
    deliveryChallan.vehicleId = vehicleId || null;
    deliveryChallan.driverId = driverId || null;
    deliveryChallan.items = challanItems;
    deliveryChallan.challanDate = challanDate ? new Date(challanDate) : new Date();
    deliveryChallan.fromAddress = fromAddress || "";
    deliveryChallan.toAddress = toAddress || "";
    deliveryChallan.purposeOfMovement = purposeOfMovement || "";
    deliveryChallan.ewayBillNo = ewayBillNo || "";
    deliveryChallan.notes = notes || "";
    deliveryChallan.updatedAt = new Date();

    // Recalculate totals
    const subtotal = challanItems.reduce((sum, item) => sum + (item.qty * item.unitPrice), 0);
    const totalTax = challanItems.reduce((sum, item) => sum + (item.taxAmount || 0), 0);
    deliveryChallan.subtotal = subtotal;
    deliveryChallan.totalTax = totalTax;
    deliveryChallan.grandTotal = subtotal + totalTax + deliveryChallan.freightCharge + deliveryChallan.otherCharges;

    await deliveryChallan.save();

    res.status(200).json({
      success: true,
      message: "Delivery Challan updated successfully",
      deliveryChallan,
    });
  } catch (error) {
    console.error("Error updating delivery challan:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Create Delivery Challan from Sales Order
const createFromSalesOrder = async (req, res) => {
  try {
    const {
      SalesOrder: SalesOrderModel,
      DeliveryChallan: DeliveryChallanModel,
    } = await getAutoModels(req);
    let attachments = [];

    if (req.body.existingAttachments) {
      try {
        attachments = JSON.parse(req.body.existingAttachments);
      } catch (e) {
        attachments = [];
      }
    }

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "delivery_challan_attachments",
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
    let itemsToDispatch = req.body.itemsToDispatch;
    if (typeof itemsToDispatch === 'string') {
      try {
        itemsToDispatch = JSON.parse(itemsToDispatch);
      } catch (e) {
        itemsToDispatch = [];
      }
    }

    const {
      sourceSalesOrderId,
      transporterId,
      vehicleId,
      driverId,
      challanDate,
      notes,
      transportMode,
      subMode,
      lrNo,
      railwayReceiptNo,
      wagonNo,
      trainNo,
      railwayWagonNo,
      railwayTrainNo,
      rrbNo,
      freightCharge,
      otherCharges,
    } = req.body;

    // Get source sales order
    const salesOrder = await SalesOrderModel.findById(sourceSalesOrderId)
      .populate("customerId")
    // .populate("transporterId")
    // .populate("vehicleId")
    // .populate("driverId");

    if (!salesOrder) {
      return res.status(404).json({ success: false, error: "Sales Order not found" });
    }
    const finalTransporterId = transporterId || salesOrder.transporterId;
    const finalVehicleId = vehicleId || salesOrder.vehicleId;
    const finalDriverId = driverId || salesOrder.driverId;
    const finalTransportMode = transportMode || salesOrder.transportMode;
    const finalSubMode = subMode || salesOrder.subMode;
    const finalLrNo = lrNo || salesOrder.lrNo;

    // Generate challan number
    const challanNo = await generateChallanNo(req);

    const discountPct = salesOrder.discountPct || 0;
    const discountAmt = salesOrder.discountAmt || 0;

    // Create delivery challan
    const deliveryChallan = new DeliveryChallanModel({
      challanNo,
      challanType: "against_sales_order",
      sourceType: "SalesOrder",
      sourceId: sourceSalesOrderId,
      customerId: salesOrder.customerId._id,
      customerGstin: salesOrder.customerId.gstin || "",
      customerState: salesOrder.customerId.state || "",
      customerCity: salesOrder.customerId.city || "",
      customerPincode: salesOrder.customerId.pincode || "",
      transportMode: transportMode || null,
      subMode: subMode || null,
      lrNo: lrNo || null,
      railwayReceiptNo: railwayReceiptNo || null,
      wagonNo: wagonNo || null,
      trainNo: trainNo || null,
      railwayWagonNo: railwayWagonNo || null,
      railwayTrainNo: railwayTrainNo || null,
      rrbNo: rrbNo || null,
      freightCharge: parseFloat(freightCharge) || 0,
      otherCharges: parseFloat(otherCharges) || 0,
      transporterId: finalTransporterId,
      vehicleId: finalVehicleId,
      driverId: finalDriverId,
      items: itemsToDispatch.map(item => ({
        productId: item.productId,
        itemName: item.itemName,
        description: item.description || "",
        qty: item.dispatchedQty,
        dispatchedQty: item.dispatchedQty,
        unit: item.unit || "Piece",
        serialNumbers: item.selectedSerialNos || [],
        lotNumber: item.lotNumber || "",
        hsnCode: item.hsnCode || "",
        discountPct: discountPct,    // ← ADD THIS
        discountAmt: discountAmt,
      })),
      challanDate: challanDate ? new Date(challanDate) : new Date(),
      fromAddress: salesOrder.shippingAddress || salesOrder.billingAddress,
      toAddress: salesOrder.customerId.address,
      status: "dispatched",
      notes: notes || `Created from Sales Order ${salesOrder.salesOrderNo}`,
      attachments: attachments,
      createdBy: req.user?._id,
    });

    await deliveryChallan.save();

    res.status(201).json({
      success: true,
      message: "Delivery Challan created successfully from Sales Order",
      deliveryChallan,
    });
  } catch (error) {
    console.error("Error creating delivery challan from sales order:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

const deleteAttachment = async (req, res) => {
  try {
    const { DeliveryChallan: DeliveryChallanModel } = await getAutoModels(req);
    const { id, attachmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid delivery challan ID format"
      });
    }

    const deliveryChallan = await DeliveryChallanModel.findById(id);
    if (!deliveryChallan) {
      return res.status(404).json({
        success: false,
        error: "Delivery Challan not found"
      });
    }

    const attachment = deliveryChallan.attachments.id(attachmentId);
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

    deliveryChallan.attachments.pull(attachmentId);
    await deliveryChallan.save();

    res.json({
      success: true,
      message: "Attachment deleted successfully"
    });
  } catch (error) {
    console.error("Delete attachment error:", error);
    res.status(500).json({ success: false, error: error.message });
  }
};

// Add to module.exports
module.exports = {
  createFromInvoice,
  createFromSalesOrder,
  createIndependent,
  convertToInvoice,
  getAll,
  getDeliveryChallanById,
  updateDeliveryChallanStatus,
  updateDeliveryChallan, // Add this
  deleteAttachment,
};

