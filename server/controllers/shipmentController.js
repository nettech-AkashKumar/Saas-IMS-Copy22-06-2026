// controllers/shipmentController.js
const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");
const mongoose = require("mongoose");
const cloudinary = require("../utils/cloudinary/cloudinary");

// Helper: Generate unique shipment number
const generateShipmentNo = async (req) => {
  const { Counter: CounterModel } = await getAutoModels(req);
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const counterKey = `SHP${year}${month}`;

  const counter = await CounterModel.findByIdAndUpdate(
    counterKey,
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );

  const sequence = String(counter.seq).padStart(4, '0');
  return `${counterKey}${sequence}`;
};

// ========== CREATE SHIPMENT ==========
// exports.createShipment = async (req, res, next) => {
//   try {
//     const { Shipment: ShipmentModel } = await getAutoModels(req);

//     const {
//       shipmentDate,
//       expectedDeliveryDate,
//       transportMode,

//       // Roadways LR
//       subMode,
//       transporterId,
//       vehicleId,
//       driverId,
//       lrNo,
//       lrDate,

//       // Roadways RR
//       wagonNo,
//       trainNo,
//       railwayReceiptNo,

//       // Airways
//       flightNo,
//       airwayBillNo,
//       cargoType,

//       // Shipways
//       vesselName,
//       containerNo,
//       portOfLoading,
//       portOfDischarge,
//       billOfLading,

//       // Railways
//       railwayWagonNo,
//       railwayTrainNo,
//       rrbNo,

//       // Consignor/Consignee
//       consignor,
//       consignee,
//       fromAddress,
//       toAddress,

//       // Items
//       items,

//       // Status
//       status,

//       // Charges
//       freightCharge,
//       otherCharges,

//       // Notes
//       notes
//     } = req.body;
//     // console.log('Received lrNo:', lrNo);

//     // Validation
//     if (!consignor?.name || !consignee?.name) {
//       return res.status(400).json({
//         success: false,
//         error: "Consignor and Consignee names are required"
//       });
//     }

//     if (!fromAddress || !toAddress) {
//       return res.status(400).json({
//         success: false,
//         error: "From and To addresses are required"
//       });
//     }

//     if (!items || items.length === 0) {
//       return res.status(400).json({
//         success: false,
//         error: "At least one item is required"
//       });
//     }

//     // Generate shipment number
//     const shipmentNo = await generateShipmentNo(req);

//     // Create shipment
//     const shipment = new ShipmentModel({
//       shipmentNo,
//       shipmentDate: shipmentDate || new Date(),
//       expectedDeliveryDate: expectedDeliveryDate || null,
//       transportMode,

//       // Roadways
//       subMode: transportMode === 'roadways' ? subMode : null,
//       transporterId: transportMode === 'roadways' && subMode === 'LR' ? transporterId : null,
//       vehicleId: transportMode === 'roadways' && subMode === 'LR' ? vehicleId : null,
//       driverId: transportMode === 'roadways' && subMode === 'LR' ? driverId : null,
//       lrNo: transportMode === 'roadways' && subMode === 'LR' ? lrNo : null,
//       lrDate: lrDate || null,

//       // RR (Train within roadways)
//       wagonNo: (transportMode === 'roadways' && subMode === 'RR') ? wagonNo : null,
//       trainNo: (transportMode === 'roadways' && subMode === 'RR') ? trainNo : null,
//       railwayReceiptNo: (transportMode === 'roadways' && subMode === 'RR') ? railwayReceiptNo : null,

//       // Airways
//       flightNo: transportMode === 'airways' ? flightNo : null,
//       airwayBillNo: transportMode === 'airways' ? airwayBillNo : null,
//       cargoType: transportMode === 'airways' ? cargoType : 'General',

//       // Shipways
//       vesselName: transportMode === 'shipways' ? vesselName : null,
//       containerNo: transportMode === 'shipways' ? containerNo : null,
//       portOfLoading: transportMode === 'shipways' ? portOfLoading : null,
//       portOfDischarge: transportMode === 'shipways' ? portOfDischarge : null,
//       billOfLading: transportMode === 'shipways' ? billOfLading : null,

//       // Railways (simple)
//       railwayWagonNo: transportMode === 'railways' ? railwayWagonNo : null,
//       railwayTrainNo: transportMode === 'railways' ? railwayTrainNo : null,
//        rrbNo: transportMode === 'railways' ? (rrbNo || null) : null,

//       // Consignor & Consignee
//       consignor: {
//         name: consignor.name,
//         phone: consignor.phone || "",
//         email: consignor.email || "",
//         address: consignor.address || "",
//         gstin: consignor.gstin || "",
//         customerId: consignor.customerId || null
//       },
//       consignee: {
//         name: consignee.name,
//         phone: consignee.phone || "",
//         email: consignee.email || "",
//         address: consignee.address,
//         gstin: consignee.gstin || "",
//         customerId: consignee.customerId || null
//       },

//       fromAddress,
//       toAddress,

//       items: items.map(item => ({
//         productId: item.productId || null,
//         itemName: item.itemName,
//         description: item.description || "",
//         hsnCode: item.hsnCode || "",
//         quantity: item.quantity,
//         unit: item.unit || "Piece",
//         weight: item.weight || 0,
//         selectedSerialNos: item.selectedSerialNos || [],
//         lotNumber: item.lotNumber || "",
//         unitPrice: item.unitPrice || 0,
//   taxRate: item.taxRate || 0,
//   taxType: item.taxType || `GST ${item.taxRate || 0}%`,
//   taxAmount: item.taxAmount || 0,
//   discountPct: item.discountPct || 0,
//   discountAmt: item.discountAmt || 0,
//   amount: item.amount || 0
//       })),
//       // invoicePaymentStatus: invoice.status,        // 'paid', 'partial', 'draft'
//       // invoicePaidAmount: invoice.paidAmount || 0,
//       // invoiceDueAmount: invoice.dueAmount || 0,
//       // invoiceFullyReceived: invoice.fullyReceived || false,
//       invoicePaymentStatus: null,
// invoicePaidAmount: 0,
// invoiceDueAmount: 0,
// invoiceFullyReceived: false,

//       status: status || 'draft',

//       trackingHistory: [{
//         status: status || 'draft',
//         remarks: 'Shipment created',
//         updatedBy: req.user?._id,
//         updatedAt: new Date()
//       }],

//       freightCharge: freightCharge || 0,
//       otherCharges: otherCharges || 0,
//       notes: notes || "",
//       createdBy: req.user?._id
//     });

//     await shipment.save();

//     // Populate references
//     const populatedShipment = await ShipmentModel.findById(shipment._id)
//       .populate("transporterId", "transporterName ownerName phone")
//       .populate("vehicleId", "vehicleNumber vehicleType")
//       .populate("driverId", "driverName phoneNumber")
//       .populate("consignor.customerId", "name phone email")
//       .populate("consignee.customerId", "name phone email")
//       .populate("createdBy", "firstName lastName");

//     res.status(201).json({
//       success: true,
//       message: "Shipment created successfully",
//       shipment: populatedShipment
//     });

//   } catch (error) {
//     console.error("Create shipment error:", error);

//     if (error.name === "ValidationError") {
//       return res.status(400).json({
//         success: false,
//         error: "Validation failed",
//         details: Object.values(error.errors).map(e => e.message)
//       });
//     }

//     if (error.code === 11000) {
//       return res.status(400).json({
//         success: false,
//         error: "Shipment number already exists"
//       });
//     }

//     res.status(500).json({
//       success: false,
//       error: "Failed to create shipment",
//       message: error.message
//     });
//   }
// };
exports.createShipmentFromInvoice = async (req, res, next) => {
  try {
    const {
      Shipment: ShipmentModel,
      CustomerInvoice: InvoiceModel
    } = await getAutoModels(req);

    const { invoiceId } = req.params;
    // Parse attachments from request body if they exist
    let attachments = [];
    
    // Handle existing attachments (from invoice or passed data)
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
            folder: "shipment_attachments",
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
      transporterId,
      vehicleId,
      driverId,
      transportMode,
      subMode,
      wagonNo,
      trainNo,
       railwayWagonNo,
      railwayTrainNo,
      railwayReceiptNo,
      flightNo,
      airwayBillNo,
      vesselName,
      containerNo,
      portOfLoading,
      portOfDischarge,
      lrNo,
      freightCharge,
      otherCharges,
       fromAddress,
      toAddress,
      consignor,
      consignee
    } = req.body;

    // Find the invoice
    const invoice = await InvoiceModel.findById(invoiceId)
      .populate("customerId", "name phone email address gstin");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found"
      });
    }

    // Check if shipment already exists for this invoice
    const existingShipment = await ShipmentModel.findOne({ invoiceId });
    if (existingShipment) {
      return res.status(400).json({
        success: false,
        error: "Shipment already exists for this invoice",
        shipmentNo: existingShipment.shipmentNo
      });
    }

    // Generate shipment number
    const shipmentNo = await generateShipmentNo(req);
const { Company: CompanyModel } = await getAutoModels(req);
const company = await CompanyModel.findOne();
  const finalFromAddress = fromAddress || company?.companyaddress || invoice.billingAddress || "";
    const finalToAddress = toAddress || invoice.shippingAddress || invoice.billingAddress || "";
        const finalConsignor = consignor || {
      name: company?.companyName || "",
      phone: company?.companyphone || "",
      email: company?.companyemail || "",
      address: finalFromAddress,
      gstin: company?.gstin || "",
      customerId: null
    };

    const finalConsignee = consignee || {
      name: invoice.customerId?.name || "",
      phone: invoice.customerId?.phone || "",
      email: invoice.customerId?.email || "",
      address: finalToAddress,
      gstin: invoice.customerId?.gstin || "",
      customerId: invoice.customerId?._id
    };

     let finalRrbNo = railwayReceiptNo || null;
    
    // If transport mode is railways and invoice has rrbNo, use that
    if (transportMode === 'railways') {
      if (invoice.rrbNo) {
        finalRrbNo = invoice.rrbNo;
      } else if (invoice.railwayReceiptNo) {
        finalRrbNo = invoice.railwayReceiptNo;
      }
    }
    
    // For roadways with RR sub-mode, use railwayReceiptNo
    if (transportMode === 'roadways' && subMode === 'RR') {
      if (invoice.railwayReceiptNo) {
        finalRrbNo = invoice.railwayReceiptNo;
      }
    }

    // Create shipment from invoice data
    const shipment = new ShipmentModel({
      shipmentNo,
      shipmentDate: new Date(),
      expectedDeliveryDate: invoice.dueDate || null,
      transportMode: transportMode || 'roadways',

      // Transport details (from form input)
      subMode: subMode || null,
      transporterId: transporterId || null,
      vehicleId: vehicleId || null,
      driverId: driverId || null,
      lrNo: lrNo || null,
      wagonNo: wagonNo || null,
      trainNo: trainNo || null,
      railwayReceiptNo: railwayReceiptNo || null,
       consignor: finalConsignor,
      consignee: finalConsignee,
      fromAddress: finalFromAddress,
      toAddress: finalToAddress,
      flightNo: flightNo || null,
      airwayBillNo: airwayBillNo || null,
      vesselName: vesselName || null,
      containerNo: containerNo || null,
      portOfLoading: portOfLoading || null,
      portOfDischarge: portOfDischarge || null,
      railwayWagonNo: transportMode === 'railways' ? (railwayWagonNo || null) : null,
      railwayTrainNo: transportMode === 'railways' ? (railwayTrainNo || null) : null,
       railwayReceiptNo: transportMode === 'railways' ? (railwayReceiptNo || null) : (railwayReceiptNo || null),
      // Items from invoice (only logistics fields, no pricing)
      items: invoice.items.map(item => ({
        productId: item.productId,
        itemName: item.itemName,
        description: item.description || "",
        hsnCode: item.hsnCode || "",
        quantity: item.qty,
        unit: item.unit || "Piece",
        weight: 0,
        selectedSerialNos: item.selectedSerialNos || [],
        lotNumber: item.lotNumber || "",
        unitPrice: item.unitPrice || 0,
    taxRate: item.taxRate || 0,
    taxType: item.taxType || `GST ${item.taxRate || 0}%`,
    taxAmount: item.taxAmount || 0,
    discountPct: item.discountPct || 0,
    discountAmt: item.discountAmt || 0,
    amount: item.amount || 0
      })),
      subtotal: invoice.subtotal || 0,
  totalTax: invoice.totalTax || 0,
  totalDiscount: invoice.totalDiscount || 0,
  additionalDiscount: invoice.additionalDiscount || { pct: 0, amt: 0 },
  additionalCharges:  req.body.additionalCharges || 0,
   additionalChargesDetails: req.body.additionalChargesDetails || {  // ADD THIS
    shipping: 0,
    handling: 0,
    packing: 0,
    service: 0,
    other: 0
  },
  grandTotal: invoice.grandTotal || 0,
  paidAmount: invoice.paidAmount || 0,
  dueAmount: invoice.dueAmount || 0,
  advanceAmount: invoice.advanceAmount || 0,
  fullyReceived: invoice.fullyReceived || false,
  paymentMethod: invoice.paymentMethod || "cash",
  shoppingPointsUsed: invoice.shoppingPointsUsed || 0,
  pointValue: invoice.pointValue || 10,
  taxSettings: invoice.taxSettings || {},
  
  // 🔽 ADD INVOICE PAYMENT REFERENCE
  invoicePaymentStatus: invoice.status,
  invoicePaidAmount: invoice.paidAmount || 0,
  invoiceDueAmount: invoice.dueAmount || 0,
  invoiceFullyReceived: invoice.fullyReceived || false,

      status: 'assigned',
      attachments: attachments,

      trackingHistory: [{
        status: 'assigned',
        remarks: `Shipment created from Invoice ${invoice.invoiceNo}`,
        updatedBy: req.user?._id,
        updatedAt: new Date()
      }],

      freightCharge: freightCharge || 0,
      otherCharges: otherCharges || 0,
      notes: `Created from Invoice ${invoice.invoiceNo}`,
      invoiceId: invoice._id,  // Link back to invoice
      invoiceNo: invoice.invoiceNo,
      createdBy: req.user?._id
    });

    await shipment.save();

    // Update invoice with shipment reference (optional - keeps backward compatibility)
    invoice.shipmentNo = shipment.shipmentNo;
    invoice.shipmentStatus = 'assigned';
    await invoice.save();
        // Update the invoice with transport details from the shipment
    const updateData = {
      shipmentNo: shipment.shipmentNo,
      shipmentStatus: shipment.status || 'assigned',
      dispatched: false,
      // Transport details
      transportMode: transportMode,
      subMode: subMode,
      transporterId: transporterId || null,
      vehicleId: vehicleId || null,
      driverId: driverId || null,
      lrNo: lrNo || null,
      wagonNo: wagonNo || null,
      trainNo: trainNo || null,
      railwayReceiptNo: railwayReceiptNo || null,
      railwayWagonNo: railwayWagonNo || null,
      railwayTrainNo: railwayTrainNo || null,
      rrbNo: finalRrbNo,
      freightCharge: parseFloat(freightCharge) || 0,
      otherCharges: parseFloat(otherCharges) || 0,
      totalCharges: (parseFloat(freightCharge) || 0) + (parseFloat(otherCharges) || 0),
      // Add to shipment history
      $push: {
        shipmentHistory: {
          status: 'assigned',
          notes: `Shipment created with number: ${shipment.shipmentNo}`,
          updatedBy: req.user?._id,
          updatedAt: new Date()
        }
      }
    };

    await InvoiceModel.findByIdAndUpdate(invoiceId, updateData);

    // Populate for response
    const populatedShipment = await ShipmentModel.findById(shipment._id)
      .populate("transporterId", "transporterName")
      .populate("vehicleId", "vehicleNumber")
      .populate("driverId", "driverName phoneNumber");

    res.status(201).json({
      success: true,
      message: "Shipment created from invoice successfully",
      shipment: populatedShipment,
      invoice: {
        id: invoice._id,
        invoiceNo: invoice.invoiceNo,
        shipmentNo: shipment.shipmentNo
      }
    });

  } catch (error) {
    console.error("Create shipment from invoice error:", error);
    next(error);
  }
};

// ========== GET ALL SHIPMENTS ==========
exports.getAllShipments = async (req, res, next) => {
  try {
    const { Shipment: ShipmentModel } = await getAutoModels(req);

    const {
      status,
      transportMode,
      consigneeId,
      consignorId,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20
    } = req.query;

    const filter = {};

    // Filter by status
    if (status && status !== 'all') {
      filter.status = status;
    }

    // Filter by transport mode
    if (transportMode && transportMode !== 'all') {
      filter.transportMode = transportMode;
    }

    // Filter by consignee customer
    if (consigneeId && mongoose.Types.ObjectId.isValid(consigneeId)) {
      filter["consignee.customerId"] = consigneeId;
    }

    // Filter by consignor customer
    if (consignorId && mongoose.Types.ObjectId.isValid(consignorId)) {
      filter["consignor.customerId"] = consignorId;
    }

    // Date range filter
    if (startDate || endDate) {
      filter.shipmentDate = {};
      if (startDate) filter.shipmentDate.$gte = new Date(startDate);
      if (endDate) filter.shipmentDate.$lte = new Date(endDate);
    }

    // Search filter
    if (search) {
      filter.$or = [
        { shipmentNo: { $regex: search, $options: "i" } },
        { "consignor.name": { $regex: search, $options: "i" } },
        { "consignee.name": { $regex: search, $options: "i" } },
        { lrNo: { $regex: search, $options: "i" } },
        { airwayBillNo: { $regex: search, $options: "i" } }
      ];
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const shipments = await ShipmentModel.find(filter)
      .populate("transporterId", "transporterName ownerName phone")
      .populate("vehicleId", "vehicleNumber vehicleType")
      .populate("driverId", "driverName phoneNumber")
      .populate("consignor.customerId", "name phone email")
      .populate("consignee.customerId", "name phone email")
      .populate("createdBy", "firstName lastName")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    const total = await ShipmentModel.countDocuments(filter);

    // Calculate summary statistics
    const stats = await ShipmentModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalShipments: { $sum: 1 },
          totalDelivered: { $sum: { $cond: [{ $eq: ["$status", "delivered"] }, 1, 0] } },
          totalInTransit: { $sum: { $cond: [{ $eq: ["$status", "in_transit"] }, 1, 0] } },
          totalFreight: { $sum: "$freightCharge" },
          totalItemsShipped: { $sum: { $sum: "$items.quantity" } }
        }
      }
    ]);

    res.json({
      success: true,
      data: {
        shipments,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        },
        stats: stats[0] || {
          totalShipments: 0,
          totalDelivered: 0,
          totalInTransit: 0,
          totalFreight: 0,
          totalItemsShipped: 0
        }
      }
    });

  } catch (error) {
    console.error("Get shipments error:", error);
    next(error);
  }
};

// ========== GET SINGLE SHIPMENT ==========
exports.getShipmentById = async (req, res, next) => {
  try {
    const { Shipment: ShipmentModel } = await getAutoModels(req);
    const { id } = req.params;

    let shipment;

    if (mongoose.Types.ObjectId.isValid(id)) {
      shipment = await ShipmentModel.findById(id)
        .populate("transporterId", "transporterName ownerName phone email")
        .populate("vehicleId", "vehicleNumber vehicleType registrationNumber")
        .populate("driverId", "driverName phoneNumber licenseNumber")
        .populate("consignor.customerId", "name phone email address")
        .populate("consignee.customerId", "name phone email address")
        .populate("items.productId", "productName hsnCode unit sellingPrice")
        .populate("createdBy", "firstName lastName email")
        .populate("trackingHistory.updatedBy", "firstName lastName");
    } else {
      shipment = await ShipmentModel.findOne({ shipmentNo: id })
        .populate("transporterId", "transporterName ownerName phone email")
        .populate("vehicleId", "vehicleNumber vehicleType registrationNumber")
        .populate("driverId", "driverName phoneNumber licenseNumber")
        .populate("consignor.customerId", "name phone email address")
        .populate("consignee.customerId", "name phone email address")
        .populate("items.productId", "productName hsnCode unit sellingPrice")
        .populate("createdBy", "firstName lastName email")
        .populate("trackingHistory.updatedBy", "firstName lastName");
    }

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: "Shipment not found"
      });
    }

    res.json({
      success: true,
      shipment
    });

  } catch (error) {
    console.error("Get shipment error:", error);
    next(error);
  }
};

// // ========== UPDATE SHIPMENT STATUS ==========
// exports.updateShipmentStatus = async (req, res, next) => {
//   try {
//     const { Shipment: ShipmentModel } = await getAutoModels(req);
//     const { id } = req.params;
//     const { status, remarks, location } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid shipment ID format"
//       });
//     }

//     const shipment = await ShipmentModel.findById(id);

//     if (!shipment) {
//       return res.status(404).json({
//         success: false,
//         error: "Shipment not found"
//       });
//     }

//     const allowedStatuses = ['booked', 'picked_up', 'in_transit', 'out_for_delivery', 'delivered', 'failed', 'cancelled'];

//     if (!allowedStatuses.includes(status)) {
//       return res.status(400).json({
//         success: false,
//         error: `Invalid status. Allowed: ${allowedStatuses.join(", ")}`
//       });
//     }

//     // Update status using the model method
//     await shipment.updateStatus(status, remarks || "", req.user?._id);

//     // If location provided, update the last tracking entry
//     if (location && shipment.trackingHistory.length > 0) {
//       shipment.trackingHistory[shipment.trackingHistory.length - 1].location = location;
//       await shipment.save();
//     }

//     // Populate for response
//     const updatedShipment = await ShipmentModel.findById(id)
//       .populate("transporterId", "transporterName")
//       .populate("driverId", "driverName phoneNumber")
//       .populate("trackingHistory.updatedBy", "firstName lastName");

//     res.json({
//       success: true,
//       message: `Shipment status updated to ${status}`,
//       shipment: updatedShipment
//     });

//   } catch (error) {
//     console.error("Update shipment status error:", error);
//     next(error);
//   }
// };

// ========== UPDATE SHIPMENT DETAILS ==========
exports.updateShipment = async (req, res, next) => {
  try {
    const { Shipment: ShipmentModel } = await getAutoModels(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid shipment ID format"
      });
    }

    const shipment = await ShipmentModel.findById(id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: "Shipment not found"
      });
    }

    // Don't allow updates to delivered or cancelled shipments
    if (shipment.status === 'delivered' || shipment.status === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: `Cannot update ${shipment.status} shipment`
      });
    }

     // Handle attachments update
    let attachments = [...(shipment.attachments || [])];
    
    // Handle existing attachments (keep ones that are still there)
    if (req.body.existingAttachments !== undefined) {
      try {
        const existingList = typeof req.body.existingAttachments === 'string'
          ? JSON.parse(req.body.existingAttachments)
          : req.body.existingAttachments;
        
        // Keep only attachments that exist in the existingList
        attachments = (shipment.attachments || []).filter(att =>
          existingList.some(existing => existing.public_id === att.public_id)
        );
        
        // Delete removed attachments from Cloudinary
        const removedAttachments = (shipment.attachments || []).filter(att =>
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
            folder: "shipment_attachments",
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
    
    shipment.attachments = attachments;

    const {
      expectedDeliveryDate,
      transporterId,
      vehicleId,
      driverId,
      lrNo,
      airwayBillNo,
      freightCharge,
      otherCharges,
      notes
    } = req.body;

    // Update allowed fields
    if (expectedDeliveryDate) shipment.expectedDeliveryDate = expectedDeliveryDate;
    if (transporterId) shipment.transporterId = transporterId;
    if (vehicleId) shipment.vehicleId = vehicleId;
    if (driverId) shipment.driverId = driverId;
    if (lrNo) shipment.lrNo = lrNo;
    if (airwayBillNo) shipment.airwayBillNo = airwayBillNo;
    if (freightCharge !== undefined) shipment.freightCharge = freightCharge;
    if (otherCharges !== undefined) shipment.otherCharges = otherCharges;
    if (notes !== undefined) shipment.notes = notes;

    shipment.updatedBy = req.user?._id;

    await shipment.save();

    const updatedShipment = await ShipmentModel.findById(id)
      .populate("transporterId", "transporterName")
      .populate("vehicleId", "vehicleNumber")
      .populate("driverId", "driverName phoneNumber");

    res.json({
      success: true,
      message: "Shipment updated successfully",
      shipment: updatedShipment
    });

  } catch (error) {
    console.error("Update shipment error:", error);
    next(error);
  }
};

// ========== DELETE SHIPMENT ==========
exports.deleteShipment = async (req, res, next) => {
  try {
    const { Shipment: ShipmentModel } = await getAutoModels(req);
    const { id, attachmentId  } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid shipment ID format"
      });
    }

    const shipment = await ShipmentModel.findById(id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: "Shipment not found"
      });
    }

    // Don't allow deletion of delivered or in-transit shipments
    if (shipment.status === 'in_transit' || shipment.status === 'delivered') {
      return res.status(400).json({
        success: false,
        error: `Cannot delete shipment that is ${shipment.status}`
      });
    }

    await ShipmentModel.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Shipment deleted successfully",
      deletedShipment: {
        id: shipment._id,
        shipmentNo: shipment.shipmentNo
      }
    });

  } catch (error) {
    console.error("Delete shipment error:", error);
    next(error);
  }
};

exports.deleteAttachment = async (req, res, next) => {
  try {
    const { Shipment: ShipmentModel } = await getAutoModels(req);
    const { id, attachmentId } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid shipment ID format"
      });
    }

    const shipment = await ShipmentModel.findById(id);
    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: "Shipment not found"
      });
    }

    // Find the attachment
    const attachment = shipment.attachments.id(attachmentId);
    if (!attachment) {
      return res.status(404).json({
        success: false,
        error: "Attachment not found"
      });
    }

    // Delete from Cloudinary
    if (attachment.public_id) {
      try {
        await cloudinary.uploader.destroy(attachment.public_id);
      } catch (err) {
        console.error("Failed to delete from Cloudinary:", err);
      }
    }

    // Remove from array
    shipment.attachments.pull(attachmentId);
    await shipment.save();

    res.json({
      success: true,
      message: "Attachment deleted successfully"
    });

  } catch (error) {
    console.error("Delete attachment error:", error);
    next(error);
  }
};

// ========== ADD TRACKING UPDATE ==========
exports.addTrackingUpdate = async (req, res, next) => {
  try {
    const { Shipment: ShipmentModel } = await getAutoModels(req);
    const { id } = req.params;
    const { status, location, remarks } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid shipment ID format"
      });
    }

    const shipment = await ShipmentModel.findById(id);

    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: "Shipment not found"
      });
    }

    // Add tracking entry without changing main status
    shipment.trackingHistory.push({
      status: status || shipment.status,
      location: location || "",
      remarks: remarks || "Tracking update",
      updatedBy: req.user?._id,
      updatedAt: new Date()
    });

    await shipment.save();

    res.json({
      success: true,
      message: "Tracking update added",
      trackingHistory: shipment.trackingHistory
    });

  } catch (error) {
    console.error("Add tracking error:", error);
    next(error);
  }
};

// ========== GET SHIPMENT STATISTICS ==========
exports.getShipmentStats = async (req, res, next) => {
  try {
    const { Shipment: ShipmentModel } = await getAutoModels(req);

    const stats = await ShipmentModel.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalFreight: { $sum: "$freightCharge" },
          totalItems: { $sum: { $sum: "$items.quantity" } }
        }
      }
    ]);

    const monthlyStats = await ShipmentModel.aggregate([
      {
        $group: {
          _id: {
            year: { $year: "$shipmentDate" },
            month: { $month: "$shipmentDate" }
          },
          count: { $sum: 1 },
          totalFreight: { $sum: "$freightCharge" }
        }
      },
      { $sort: { "_id.year": -1, "_id.month": -1 } },
      { $limit: 12 }
    ]);

    res.json({
      success: true,
      data: {
        byStatus: stats,
        monthlyStats: monthlyStats.map(stat => ({
          period: `${stat._id.year}-${String(stat._id.month).padStart(2, '0')}`,
          count: stat.count,
          totalFreight: stat.totalFreight
        }))
      }
    });

  } catch (error) {
    console.error("Get shipment stats error:", error);
    next(error);
  }
};

exports.updateShipmentStatus = async (req, res, next) => {
  try {
    const { Shipment: ShipmentModel, CustomerInvoice: InvoiceModel } = await getAutoModels(req);
    const { id } = req.params;
    const { status, notes, location } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid shipment ID format"
      });
    }

    const shipment = await ShipmentModel.findById(id);
    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: "Shipment not found"
      });
    }

    // Define allowed status transitions
    const allowedTransitions = {
      // From status -> can transition to
      'draft': ['assigned', 'cancelled'],
      'assigned': ['in_transit', 'cancelled', 'failed'],
      'in_transit': ['out_for_delivery', 'failed', 'cancelled'],
      'out_for_delivery': ['delivered', 'failed', 'cancelled'],
      'delivered': [], // Terminal state - no further transitions
      'failed': ['assigned', 'cancelled'], // Can retry from failed
      'cancelled': [] // Terminal state - no further transitions
    };

    const currentStatus = shipment.status;
    const newStatus = status;

    // Check if current status is valid
    if (!allowedTransitions[currentStatus]) {
      return res.status(400).json({
        success: false,
        error: `Invalid current status: ${currentStatus}`
      });
    }

    // Check if transition is allowed
    if (!allowedTransitions[currentStatus].includes(newStatus)) {
      // Provide helpful error message
      let errorMessage = `Cannot change shipment status from "${currentStatus}" to "${newStatus}". `;
      
      if (currentStatus === 'delivered') {
        errorMessage += 'Delivered shipments cannot be changed.';
      } else if (currentStatus === 'cancelled') {
        errorMessage += 'Cancelled shipments cannot be changed.';
      } else if (allowedTransitions[currentStatus].length === 0) {
        errorMessage += 'This is a terminal status with no further transitions allowed.';
      } else {
        errorMessage += `Allowed transitions from "${currentStatus}" are: ${allowedTransitions[currentStatus].join(', ')}`;
      }
      
      return res.status(400).json({
        success: false,
        error: errorMessage
      });
    }

    // Additional validation rules
    // 1. Cannot change status of delivered shipment
    if (currentStatus === 'delivered') {
      return res.status(400).json({
        success: false,
        error: "Cannot update status of a delivered shipment"
      });
    }

    // 2. Cannot change status of cancelled shipment
    if (currentStatus === 'cancelled') {
      return res.status(400).json({
        success: false,
        error: "Cannot update status of a cancelled shipment"
      });
    }

    // 3. If trying to mark as delivered, validate delivery info
    if (newStatus === 'delivered') {
      // You can add validation for delivery proof here
      if (!req.body.deliveryProof) {
        // Not a hard requirement, but can be added
        console.log("Warning: No delivery proof provided for delivered shipment");
      }
    }

    // 4. If cancelling, require a reason
    if (newStatus === 'cancelled' && !notes) {
      return res.status(400).json({
        success: false,
        error: "Cancellation reason is required when cancelling a shipment"
      });
    }

    // Store old status
    const oldStatus = shipment.status;
    
    // Update ONLY the 'status' field
    shipment.status = newStatus;
    
    // Add to status history
    if (!shipment.statusHistory) shipment.statusHistory = [];
    shipment.statusHistory.push({
      status: newStatus,
      updatedBy: req.user?._id,
      notes: notes || `Status changed from ${oldStatus} to ${newStatus}`,
      location: location || "",
      updatedAt: new Date()
    });

    // Also add to trackingHistory for compatibility
    shipment.trackingHistory.push({
      status: newStatus,
      remarks: notes || `Status changed from ${oldStatus} to ${newStatus}`,
      location: location || "",
      updatedBy: req.user?._id,
      updatedAt: new Date()
    });

    // If delivered, set delivery date
    if (newStatus === 'delivered') {
      shipment.deliveredAt = new Date();
    }

    await shipment.save();

     // Also update the associated invoice's shipmentStatus if invoiceId exists
    if (shipment.invoiceId) {
      await InvoiceModel.findByIdAndUpdate(shipment.invoiceId, {
        shipmentStatus: newStatus,
        $push: {
          shipmentHistory: {
            status: newStatus,
            notes: notes || `Shipment status updated to ${newStatus}`,
            updatedBy: req.user?._id,
            updatedAt: new Date()
          }
        }
      });
    }

    // Also update the associated invoice's shipmentStatus if invoiceId exists
    if (shipment.invoiceId) {
      const invoice = await InvoiceModel.findById(shipment.invoiceId);
      if (invoice) {
        invoice.shipmentStatus = newStatus;
        if (!invoice.shipmentHistory) invoice.shipmentHistory = [];
        invoice.shipmentHistory.push({
          status: newStatus,
          updatedBy: req.user?._id,
          notes: notes || `Shipment status updated to ${newStatus}`,
          updatedAt: new Date()
        });
        await invoice.save();
      }
    }

    // Populate for response
    const updatedShipment = await ShipmentModel.findById(id)
      .populate("transporterId", "transporterName")
      .populate("driverId", "driverName phoneNumber")
      .populate("statusHistory.updatedBy", "firstName lastName");

    res.json({
      success: true,
      message: `Shipment status updated from "${oldStatus}" to "${newStatus}"`,
      shipment: updatedShipment,
      allowedTransitions: allowedTransitions[newStatus] // Return next allowed transitions
    });

  } catch (error) {
    console.error("Update shipment status error:", error);
    next(error);
  }
};

// ========== UPDATE SHIPMENT STATUS BY INVOICE ID ==========
exports.updateShipmentStatusByInvoice = async (req, res, next) => {
  try {
    const { Shipment: ShipmentModel, CustomerInvoice: InvoiceModel } = await getAutoModels(req);
    const { invoiceId } = req.params;
    const { status, notes, location } = req.body;

    // Find shipment by invoice ID
    const shipment = await ShipmentModel.findOne({ invoiceId: invoiceId });
    
    if (!shipment) {
      return res.status(404).json({
        success: false,
        error: "No shipment found for this invoice"
      });
    }

    // Delegate to the main update function by calling it with the shipment's ID
    req.params.id = shipment._id;
    return exports.updateShipmentStatus(req, res, next);
    
  } catch (error) {
    console.error("Update shipment status by invoice error:", error);
    next(error);
  }
};