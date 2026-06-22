const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");
const cloudinary = require("../utils/cloudinary/cloudinary");
const mongoose = require("mongoose");
const { updateCustomerDueAmount, } = require("../controllers/customerController");

// Helper: Generate unique invoice number - MATCHING FRONTEND FORMAT
const generateInvoiceNo = async (req) => {
  const { Counter: CounterModel } = await getAutoModels(req);
  // const { CustomerInvoice: InvoiceModel } = await getAutoModels(req);
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");

  const counterKey = `INV${year}${month}`;

  // Count invoices with same prefix (INV + YYYY + MM)
  // const prefix = `INV${year}${month}`;
  // const count = await InvoiceModel.countDocuments({
  //   invoiceNo: { $regex: `^${prefix}` },
  // });
  const counter = await CounterModel.findByIdAndUpdate(
    counterKey,
    { $inc: { seq: 1 } },
    { upsert: true, new: true }
  );

  // Generate 3-digit sequence
  //   const sequence = String(count + 1).padStart(3, "0");
  //   return `${prefix}${sequence}`;
  // };
  const sequence = String(counter.seq).padStart(3, "0");
  return `${counterKey}${sequence}`;
};

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
// Helper: Parse FormData nested objects
const parseFormDataNested = (body) => {
  const parsed = { ...body };

  // Check if autoRoundOff is an array (this happens from FormData)
  if (Array.isArray(body.autoRoundOff)) {
    // Extract the actual value (should be the last element if both checkbox and value are sent)
    if (body.autoRoundOff.length === 2) {
      // If first element is "false" and second is a number, use the number
      if (
        body.autoRoundOff[0] === "false" &&
        !isNaN(parseInt(body.autoRoundOff[1]))
      ) {
        parsed.autoRoundOff = body.autoRoundOff[1]; // Use the numeric value
      } else {
        // Otherwise try to find a valid value
        const validValue = body.autoRoundOff.find((val) =>
          ["0", "1", "5", "10"].includes(val),
        );
        parsed.autoRoundOff = validValue || "0";
      }
    } else if (body.autoRoundOff.length === 1) {
      parsed.autoRoundOff = body.autoRoundOff[0];
    }
  }

  // Check for dueDate in various possible formats
  if (body.dueDate !== undefined) {
    // Handle if dueDate is an array
    if (Array.isArray(body.dueDate)) {
      const validDate = body.dueDate.find((d) => d && d !== "");
      parsed.dueDate = validDate || body.dueDate[0] || "";
    } else {
      parsed.dueDate = body.dueDate;
    }
  } else if (body["dueDate[0]"] !== undefined) {
    // Handle array format dueDate[0], dueDate[1], etc.
    const dueDateArray = [];
    let i = 0;
    while (body[`dueDate[${i}]`] !== undefined) {
      dueDateArray.push(body[`dueDate[${i}]`]);
      i++;
    }
    // Take the first valid value from the array
    parsed.dueDate = dueDateArray[0] || "";
  }

  // ========== FIX: Parse tax settings properly ==========
  // Handle taxSettings if sent as separate fields
  if (body["taxSettings[autoRoundOff]"] !== undefined) {
    parsed.taxSettings = parsed.taxSettings || {};
    parsed.taxSettings.autoRoundOff = body["taxSettings[autoRoundOff]"];
  }
  if (body["taxSettings[enableGSTBilling]"] !== undefined) {
    parsed.taxSettings = parsed.taxSettings || {};
    parsed.taxSettings.enableGSTBilling =
      body["taxSettings[enableGSTBilling]"] !== "false";
  }
  if (body["taxSettings[priceIncludeGST]"] !== undefined) {
    parsed.taxSettings = parsed.taxSettings || {};
    parsed.taxSettings.priceIncludeGST =
      body["taxSettings[priceIncludeGST]"] !== "false";
  }
  if (body["taxSettings[defaultGSTRate]"] !== undefined) {
    parsed.taxSettings = parsed.taxSettings || {};
    parsed.taxSettings.defaultGSTRate = body["taxSettings[defaultGSTRate]"];
  }

  if (
    body["additionalDiscount[pct]"] !== undefined ||
    body["additionalDiscount[amt]"] !== undefined
  ) {
    // Parse additionalDiscount
    parsed.additionalDiscount = {
      pct: parseFloat(body["additionalDiscount[pct]"]) || 0,
      amt: parseFloat(body["additionalDiscount[amt]"]) || 0,
    };
  }

  // Parse additionalChargesDetails
  parsed.additionalChargesDetails = {
    shipping: parseFloat(body["additionalChargesDetails[shipping]"]) || 0,
    handling: parseFloat(body["additionalChargesDetails[handling]"]) || 0,
    packing: parseFloat(body["additionalChargesDetails[packing]"]) || 0,
    service: parseFloat(body["additionalChargesDetails[service]"]) || 0,
    other: parseFloat(body["additionalChargesDetails[other]"]) || 0,
  };

  // Parse transport fields
  if (body.transporterId !== undefined) {
    const transporterValue = body.transporterId;
    if (Array.isArray(transporterValue)) {
      parsed.transporterId = transporterValue[0] || "";
    } else {
      parsed.transporterId = transporterValue;
    }
  }

  if (body.vehicleId !== undefined) {
    const vehicleValue = body.vehicleId;
    if (Array.isArray(vehicleValue)) {
      parsed.vehicleId = vehicleValue[0] || "";
    } else {
      parsed.vehicleId = vehicleValue;
    }
  }

  if (body.driverId !== undefined) {
    const driverValue = body.driverId;
    if (Array.isArray(driverValue)) {
      parsed.driverId = driverValue[0] || "";
    } else {
      parsed.driverId = driverValue;
    }
  }

  // Handle additionalChargesDetails when they come as arrays
  if (body["additionalChargesDetails[shipping]"] !== undefined) {
    const shippingValue = body["additionalChargesDetails[shipping]"];
    parsed.additionalChargesDetails = parsed.additionalChargesDetails || {};

    // If it's an array, take the first element (since all values are the same)
    if (Array.isArray(shippingValue)) {
      parsed.additionalChargesDetails.shipping = parseFloat(shippingValue[0]) || 0;
    } else {
      parsed.additionalChargesDetails.shipping = parseFloat(shippingValue) || 0;
    }
  }

  if (body["additionalChargesDetails[handling]"] !== undefined) {
    const handlingValue = body["additionalChargesDetails[handling]"];
    parsed.additionalChargesDetails = parsed.additionalChargesDetails || {};

    if (Array.isArray(handlingValue)) {
      parsed.additionalChargesDetails.handling = parseFloat(handlingValue[0]) || 0;
    } else {
      parsed.additionalChargesDetails.handling = parseFloat(handlingValue) || 0;
    }
  }

  if (body["additionalChargesDetails[packing]"] !== undefined) {
    const packingValue = body["additionalChargesDetails[packing]"];
    parsed.additionalChargesDetails = parsed.additionalChargesDetails || {};

    if (Array.isArray(packingValue)) {
      parsed.additionalChargesDetails.packing = parseFloat(packingValue[0]) || 0;
    } else {
      parsed.additionalChargesDetails.packing = parseFloat(packingValue) || 0;
    }
  }

  if (body["additionalChargesDetails[service]"] !== undefined) {
    const serviceValue = body["additionalChargesDetails[service]"];
    parsed.additionalChargesDetails = parsed.additionalChargesDetails || {};

    if (Array.isArray(serviceValue)) {
      parsed.additionalChargesDetails.service = parseFloat(serviceValue[0]) || 0;
    } else {
      parsed.additionalChargesDetails.service = parseFloat(serviceValue) || 0;
    }
  }

  if (body["additionalChargesDetails[other]"] !== undefined) {
    const otherValue = body["additionalChargesDetails[other]"];
    parsed.additionalChargesDetails = parsed.additionalChargesDetails || {};

    if (Array.isArray(otherValue)) {
      parsed.additionalChargesDetails.other = parseFloat(otherValue[0]) || 0;
    } else {
      parsed.additionalChargesDetails.other = parseFloat(otherValue) || 0;
    }
  }

  if (body.additionalChargesDetails && typeof body.additionalChargesDetails === 'object' && !Array.isArray(body.additionalChargesDetails)) {
    parsed.additionalChargesDetails = {
      shipping: parseFloat(body.additionalChargesDetails.shipping) || 0,
      handling: parseFloat(body.additionalChargesDetails.handling) || 0,
      packing: parseFloat(body.additionalChargesDetails.packing) || 0,
      service: parseFloat(body.additionalChargesDetails.service) || 0,
      other: parseFloat(body.additionalChargesDetails.other) || 0,
    };
  }

  // Parse items array from FormData bracket notation
  const items = [];
  const itemRegex = /^items\[(\d+)\]\[(\w+)\]$/;

  Object.keys(body).forEach((key) => {
    const match = key.match(itemRegex);
    if (match) {
      const index = parseInt(match[1]);
      const field = match[2];

      if (!items[index]) {
        items[index] = {};
      }

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
      }
      else {
        const value = body[key];
        if (Array.isArray(value)) {
          items[index][field] = value[0] !== undefined ? String(value[0]) : "";
        } else if (value === null || value === undefined) {
          items[index][field] = "";
        } else {
          items[index][field] = body[key];
        }
      }
    }
  });

  if (items.length > 0) {
    parsed.items = items.filter((item) => item !== undefined);
  }

  // Parse itemsSalesman array from FormData bracket notation
  const itemsSalesmanParsed = [];
  const salesmanRegex = /^itemsSalesman\[(\d+)\]\[(\w+)\]$/;

  Object.keys(body).forEach((key) => {
    const match = key.match(salesmanRegex);
    if (match) {
      const index = parseInt(match[1]);
      const field = match[2];

      if (!itemsSalesmanParsed[index]) {
        itemsSalesmanParsed[index] = {};
      }

      const value = body[key];
      if (field === "qty") {
        itemsSalesmanParsed[index][field] = parseFloat(value) || 1;
      } else if (field === "unitPrice") {
        itemsSalesmanParsed[index][field] = parseFloat(value) || 0;
      } else {
        // broker_salesman_id, broker_salesman_name, assignType, productItemId, productId, itemName
        if (Array.isArray(value)) {
          itemsSalesmanParsed[index][field] = value[0] !== undefined ? String(value[0]) : "";
        } else {
          itemsSalesmanParsed[index][field] = value !== null && value !== undefined ? String(value) : "";
        }
      }
    }
  });

  if (itemsSalesmanParsed.length > 0) {
    parsed.itemsSalesman = itemsSalesmanParsed.filter(Boolean);
  }

  return parsed;
};

// Create invoice with file uploads - NO TRANSACTION VERSION
exports.createInvoice = async (req, res, next) => {
  try {
    // Get models from auto initializer
    const {
      CustomerInvoice: InvoiceModel,
      Customer: CustomerModel,
      Product: ProductModel,
      CompanyBank: CompanyBankModel,
    } = await getAutoModels(req);
    // Parse FormData first
    const parsedBody = parseFormDataNested(req.body);
    // Add tax settings to parsed body
    if (!parsedBody.taxSettings) {
      parsedBody.taxSettings = {
        enableGSTBilling: parsedBody.enableGSTBilling !== "false",
        priceIncludeGST: parsedBody.priceIncludeGST !== "false",
        autoRoundOff: parsedBody.autoRoundOff || "0",
        defaultGSTRate: parsedBody.defaultGSTRate || "18",
      };
    } else {
      if (Array.isArray(parsedBody.taxSettings.autoRoundOff)) {
        parsedBody.taxSettings.autoRoundOff =
          parsedBody.taxSettings.autoRoundOff[0] || "0";
      }
      // Ensure all fields have proper values
      parsedBody.taxSettings = {
        enableGSTBilling: parsedBody.taxSettings.enableGSTBilling !== false,
        priceIncludeGST: parsedBody.taxSettings.priceIncludeGST !== false,
        autoRoundOff: parsedBody.taxSettings.autoRoundOff || "0",
        defaultGSTRate: parsedBody.taxSettings.defaultGSTRate || "18",
      };
    }

    let {
      customerId,
      invoiceDate,
      dueDate,
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
      transportMode = 'roadways',
      subMode = null,
      lrNo = null,
      wagonNo = null,
      trainNo = null,
      railwayReceiptNo = null,
      railwayWagonNo = null,
      railwayTrainNo = null,
      rrbNo = null,
      freightCharge = 0,
      otherCharges = 0,
      transporterId,
      vehicleId,
      driverId,
      shoppingPointsUsed = 0,
      pointValue = 10,
      autoRoundOff = false,
      grandTotal,
      paidAmount = 0,
      fullyReceived = false,
      paymentMethod = "cash",
      notes = "",
      termsAndConditions = "",
    } = parsedBody;

    freightCharge = parseFloat(freightCharge) || 0;
    otherCharges = parseFloat(otherCharges) || 0;

    const convertedAdditionalChargesDetails = {
      shipping: parseFloat(additionalChargesDetails?.shipping) || 0,
      handling: parseFloat(additionalChargesDetails?.handling) || 0,
      packing: parseFloat(additionalChargesDetails?.packing) || 0,
      service: parseFloat(additionalChargesDetails?.service) || 0,
      other: parseFloat(additionalChargesDetails?.other) || 0,
    };

    const convertedAdditionalCharges = parseFloat(additionalCharges) || 0;

    const calculatedAdditionalChargesTotal =
      convertedAdditionalChargesDetails.shipping +
      convertedAdditionalChargesDetails.handling +
      convertedAdditionalChargesDetails.packing +
      convertedAdditionalChargesDetails.service +
      convertedAdditionalChargesDetails.other;

    // Use the converted values
    const finalAdditionalCharges = convertedAdditionalCharges || calculatedAdditionalChargesTotal;
    const finalAdditionalChargesDetails = convertedAdditionalChargesDetails;

    if (additionalChargesDetails) {
      additionalChargesDetails = {
        shipping: parseFloat(additionalChargesDetails.shipping) || 0,
        handling: parseFloat(additionalChargesDetails.handling) || 0,
        packing: parseFloat(additionalChargesDetails.packing) || 0,
        service: parseFloat(additionalChargesDetails.service) || 0,
        other: parseFloat(additionalChargesDetails.other) || 0,
      };
    }

    additionalCharges = parseFloat(additionalCharges) || 0;

    // Convert string booleans and numbers
    autoRoundOff = autoRoundOff === true || autoRoundOff === "true";
    fullyReceived = fullyReceived === true || fullyReceived === "true";
    paidAmount = parseFloat(paidAmount) || 0;
    shoppingPointsUsed = parseFloat(shoppingPointsUsed) || 0;
    subtotal = parseFloat(subtotal) || 0;
    totalTax = parseFloat(totalTax) || 0;
    totalDiscount = parseFloat(totalDiscount) || 0;
    grandTotal = parseFloat(grandTotal) || 0;
    additionalCharges = parseFloat(additionalCharges) || 0;

    // ========== FIX: Handle dueDate properly ==========
    let finalDueDate;

    // Log what we're receiving
    // console.log("Raw dueDate received:", dueDate);
    // console.log("Type of dueDate:", typeof dueDate);

    // If dueDate is an array (this is the issue!)
    if (Array.isArray(dueDate)) {
      // console.log("dueDate is an array, processing...");

      // Get the first valid date from the array
      for (const dateStr of dueDate) {
        const date = new Date(dateStr);
        if (!isNaN(date.getTime())) {
          finalDueDate = date;
          // console.log("Selected valid date from array:", finalDueDate);
          break;
        }
      }

      // If no valid date in array, use default
      if (!finalDueDate) {
        // console.log("No valid date in array, using default");
        const defaultDueDate = new Date(invoiceDate || new Date());
        defaultDueDate.setDate(defaultDueDate.getDate() + 7);
        finalDueDate = defaultDueDate;
      }
    }
    // If dueDate is a string (normal case)
    else if (dueDate && typeof dueDate === "string") {
      finalDueDate = new Date(dueDate);
      // console.log("dueDate is string, parsing:", finalDueDate);

      // Validate date
      if (isNaN(finalDueDate.getTime())) {
        // console.log("Invalid date string, using default");
        const defaultDueDate = new Date(invoiceDate || new Date());
        defaultDueDate.setDate(defaultDueDate.getDate() + 7);
        finalDueDate = defaultDueDate;
      }
    }
    // If no dueDate provided, use default
    else {
      // console.log("No dueDate provided, using default");
      const defaultDueDate = new Date(invoiceDate || new Date());
      defaultDueDate.setDate(defaultDueDate.getDate() + 7);
      finalDueDate = defaultDueDate;
    }

    // Validate invoice date
    const invoiceDateObj = invoiceDate ? new Date(invoiceDate) : new Date();

    // Validate that due date is not before invoice date
    if (finalDueDate < invoiceDateObj) {
      return res.status(400).json({
        success: false,
        error: "Due Date cannot be before invoice date",
      });
    }
    if (!customerId) {
      // Validate required fields
      return res.status(400).json({
        success: false,
        error: "Customer ID is required",
      });
    }
    // Fetch active reward settings
    const { RewardSystem: RewardSystemModel } = await getAutoModels(req);
    const activeReward = await RewardSystemModel.findOne({
      rewardType: "Shopping Points",
      status: "active",
      deadline: { $gte: new Date() },
      isDelete: false
    });

    if (activeReward && shoppingPointsUsed > 0) {
      // Validate min invoice value for redemption
      if (grandTotal < activeReward.minInvoiceValue) {
        return res.status(400).json({
          success: false,
          error: `Minimum invoice value of ₹${activeReward.minInvoiceValue} required for points redemption`
        });
      }

      // Validate max eligible amount
      if (activeReward.maxEligibleAmount) {
        const maxPointsValue = (grandTotal * activeReward.maxEligibleAmount) / 100;
        const pointsValueUsed = shoppingPointsUsed * pointValue;
        if (pointsValueUsed > maxPointsValue) {
          return res.status(400).json({
            success: false,
            error: `Cannot redeem more than ${activeReward.maxEligibleAmount}% of invoice value`
          });
        }
      }
    }

    if (!items || items.length === 0) {
      return res.status(400).json({
        success: false,
        error: "At least one item is required",
      });
    }

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

      const product = await ProductModel.findById(item.productId); // NO SESSION
      if (!product) {
        return res.status(404).json({
          success: false,
          error: `Product not found: ${item.productId}`,
        });
      }
      // Use item data from frontend (already calculated)
      let serialnoValue = item.serialno;

      // CRITICAL FIX: Ensure serialno is a string, not an array
      if (Array.isArray(serialnoValue)) {
        serialnoValue = serialnoValue[0] || "";
      } else if (serialnoValue === null || serialnoValue === undefined) {
        serialnoValue = "";
      } else {
        serialnoValue = String(serialnoValue);
      }

      // Use item data from frontend (already calculated)
      const validatedItem = {
        productId: item.productId,
        itemName: item.itemName || product.productName,
        itemBarcode: item.itemBarcode || product.itemBarcode || "",
        hsnCode: item.hsnCode || product.hsn?.hsnCode || product.hsnCode || "",
        description: item.description || product.description || "",
        lotNumber: item.lotNumber || product.lotNumber || "",
        selectedSerialNos: (item.selectedSerialNos && item.selectedSerialNos.length > 0) ? item.selectedSerialNos : "",
        selectedColor: item.selectedColor || "",
        selectedSize: item.selectedSize || "",
        qty: parseFloat(item.qty) || 1,
        unit: item.unit || product.unit || "Piece",
        unitPrice: parseFloat(item.unitPrice) || product.sellingPrice || 0,
        taxType: item.taxType || product.tax || "GST 0%",
        taxRate: parseFloat(item.taxRate) || parseFloat(product.tax?.match(/\d+/)?.[0]) || 0,
        taxAmount: parseFloat(item.taxAmount) || 0,
        discountPct: parseFloat(item.discountPct) || 0,
        discountAmt: parseFloat(item.discountAmt) || 0,
        amount: parseFloat(item.amount) || 0,
        // ✅ ADD THESE TWO
        costPrice: product.costPrice || product.purchasePrice || 0,
        profit: (() => {
          const qty = parseFloat(item.qty) || 1;
          const unitPrice = parseFloat(item.unitPrice) || product.sellingPrice || 0;
          const discountAmt = parseFloat(item.discountAmt) || 0;
          const costPrice = product.costPrice || product.purchasePrice || 0;
          const revenue = (unitPrice - discountAmt) * qty;
          const cost = costPrice * qty;
          return parseFloat((revenue - cost).toFixed(2));
        })(),
      };

      validatedItems.push(validatedItem);
    }
    // Process multi salesman assignments
    let itemsSalesman = [];

    if (parsedBody.multiSalesmanEnabled === "true" || parsedBody.multiSalesmanEnabled === true) {
      const rawAssignments = parsedBody.itemsSalesman || [];

      for (const assignment of rawAssignments) {
        const matchedItem = validatedItems.find(
          (vi) => String(vi.productId) === String(assignment.productId)
        );

        const brokerId = assignment.broker_salesman_id && assignment.broker_salesman_id.trim() !== ""
          ? assignment.broker_salesman_id.trim()
          : null;

        itemsSalesman.push({
          productItemId: assignment.productItemId || "",
          productId: assignment.productId || null,
          itemName: assignment.itemName || "",
          qty: parseFloat(assignment.qty) || 1,
          unitPrice: matchedItem?.unitPrice ?? parseFloat(assignment.unitPrice) ?? 0,
          broker_salesman_id: brokerId,
          broker_salesman_name: assignment.broker_salesman_name || "",
          assignType: assignment.assignType || "salesman",
          assignedAt: new Date(),
        });
      }
    }

    // Calculate points redeemed amount
    const pointsRedeemedAmount = shoppingPointsUsed * pointValue;

    // Generate invoice number (matching frontend format)
    const invoiceNo = await generateInvoiceNo(req);

    // Handle file uploads if any
    const attachments = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "invoice_attachments",
            resource_type: "auto",
          });

          attachments.push({
            url: result.secure_url,
            public_id: result.public_id,
            filename: file.originalname,
          });
        } catch (uploadError) {
          // console.error("Cloudinary upload error:", uploadError);
          next(uploadError);
        }
      }
    }

    // Calculate payment amounts (frontend logic)
    const finalPaidAmount = fullyReceived ? grandTotal : paidAmount;
    const dueAmount = Math.max(0, grandTotal - finalPaidAmount);
    const advanceAmount = Math.max(0, finalPaidAmount - grandTotal);

    // Determine status (frontend logic)
    let finalStatus = "draft";
    if (fullyReceived || finalPaidAmount >= grandTotal) {
      finalStatus = "paid";
    } else if (finalPaidAmount > 0) {
      finalStatus = "partial";
    }
    // Fetch default company bank (snapshot)
    const defaultBank = await CompanyBankModel.findOne({ isDefault: true });

    if (!defaultBank) {
      return res.status(400).json({
        success: false,
        error:
          "No default company bank account found. Please set a default bank.",
      });
    }
    const { Company: CompanyModel } = await getAutoModels(req);
    const companyProfile = await CompanyModel.findOne();

    // If no company profile found, you might want to handle it
    if (!companyProfile) {
      // You can either return an error or use default values
      // For now, we'll proceed with empty values
      console.warn("No company profile found. Using default values for GST calculation.");
    }

    // ========== END OF ADDED CODE ==========

    // Get customer state from customer object
    const customerState = customer?.state || "";

    // Extract state from GSTIN if not available directly
    let companyState = companyProfile?.state || "";

    // If company state is empty, try to get from GSTIN
    if (!companyState && companyProfile?.gstin) {
      const gstinStateCode = companyProfile.gstin.substring(0, 2);
      companyState = gstinStateCode;
    }

    // GST Split Logic
    let gstType = 'none';
    let cgstAmount = 0;
    let sgstAmount = 0;
    let igstAmount = 0;

    if (parsedBody.taxSettings && parsedBody.taxSettings.enableGSTBilling && totalTax > 0) {
      if (companyState && customerState && companyState.toString().toLowerCase() === customerState.toString().toLowerCase()) {
        gstType = 'CGST_SGST';
        cgstAmount = totalTax / 2;
        sgstAmount = totalTax / 2;
      } else {
        gstType = 'IGST';
        igstAmount = totalTax;
      }
    }

    // Add stock validation before creating invoice
    // for (const item of validatedItems) {
    //   if (item.productId) {
    //     const product = await ProductModel.findById(item.productId);
    //     if (product) {
    //       // After use stock quantity
    //       const currentStock = product.stockQuantity || 0;
    //       if (currentStock < item.qty) {
    //         return res.status(400).json({
    //           success: false,
    //           error: `Insufficient stock for ${product.productName}. Available: ${currentStock}, Requested: ${item.qty}`,
    //         });
    //       }
    //     }
    //   }
    // }
    // Update product stock quantities

    for (const item of validatedItems) {

      if (item.productId) {
        const product = await ProductModel.findById(item.productId);

        if (product && product.variants && product.variants.length > 0) {

          // Find the specific variant
          const variant = product.variants.find(v =>
            (!item.selectedColor || v.color === item.selectedColor) &&
            (!item.selectedSize || v.size === item.selectedSize)
          );

          if (variant) {
            variant.stockQuantity = Math.max(0, (variant.stockQuantity || 0) - item.qty);
            // REMOVE SELECTED SERIAL NUMBERS from variant
            if (item.selectedSerialNos && item.selectedSerialNos.length > 0) {
              if (variant.serialNumbers && Array.isArray(variant.serialNumbers)) {
                // Filter out the sold serial numbers
                variant.serialNumbers = variant.serialNumbers.filter(
                  serial => !item.selectedSerialNos.includes(serial)
                );
              }
            }
            await product.save();
          } else {

            product.variants.map(v => ({ color: v.color, size: v.size, stock: v.stockQuantity }))
          }
        } else {
          // Product has no variants - use product-level stock
          const result = await ProductModel.findByIdAndUpdate(
            item.productId,
            { $inc: { stockQuantity: -item.qty } },
            { new: true }
          );
          // ALSO remove serial numbers from product level
          if (item.selectedSerialNos && item.selectedSerialNos.length > 0) {
            await ProductModel.findByIdAndUpdate(
              item.productId,
              { $pull: { serialNumbers: { $in: item.selectedSerialNos } } }
            );
          }
        }
      }
    }
    // Create invoice - USING VALUES FROM FRONTEND
    const invoice = new InvoiceModel({
      customerId,
      invoiceNo,
      invoiceDate: invoiceDate ? new Date(invoiceDate) : new Date(),
      dueDate: finalDueDate,
      bankDetails: {
        bankName: defaultBank.bankName,
        accountHolderName: defaultBank.accountHolderName,
        accountNumber: defaultBank.accountNumber,
        ifsc: defaultBank.ifsc,
        branch: defaultBank.branch,
        upiId: defaultBank.upiId,
        qrCode: defaultBank.qrCode,
      },
      gstType: gstType,
      cgstAmount: cgstAmount,
      sgstAmount: sgstAmount,
      igstAmount: igstAmount,
      companyState: companyState || "",
      customerState: customerState || "",
      items: validatedItems,
      billingAddress: billingAddress || customer.address || "",
      shippingAddress:
        shippingAddress || billingAddress || customer.address || "",
      subtotal: subtotal,
      totalTax: totalTax,
      totalDiscount: totalDiscount,
      additionalDiscount: additionalDiscount,
      additionalCharges: finalAdditionalCharges,  // Use converted value
      additionalChargesDetails: finalAdditionalChargesDetails,
      // for transport
      transportMode: transportMode || 'roadways',
      subMode: subMode || null,
      lrNo: lrNo || null,
      wagonNo: wagonNo || null,
      trainNo: trainNo || null,
      railwayReceiptNo: railwayReceiptNo || null,
      railwayWagonNo: railwayWagonNo || null,
      railwayTrainNo: railwayTrainNo || null,
      rrbNo: rrbNo || null,
      freightCharge: freightCharge,
      otherCharges: otherCharges,
      totalCharges: freightCharge + otherCharges,
      transporterId: transporterId || null,
      vehicleId: vehicleId || null,
      driverId: driverId || null,
      shoppingPointsUsed: shoppingPointsUsed,
      pointValue: pointValue,
      autoRoundOff: autoRoundOff,
      grandTotal: grandTotal,
      paidAmount: finalPaidAmount,
      dueAmount: dueAmount,
      advanceAmount: advanceAmount,
      fullyReceived: fullyReceived,
      paymentMethod: paymentMethod,
      status: finalStatus,
      notes: notes,
      termsAndConditions: termsAndConditions,
      taxSettings: parsedBody.taxSettings,
      attachments: attachments,
      multiSalesmanEnabled: parsedBody.multiSalesmanEnabled === "true" || parsedBody.multiSalesmanEnabled === true,
      itemsSalesman: itemsSalesman,
      createdBy: req.user?._id,
    });

    // Calculate round off value if needed  
    if (autoRoundOff) {
      // Recalculate to get round off value
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

      invoice.roundOffValue = Math.round(totalBeforeRound) - totalBeforeRound;
    }

    invoice.totalProfit = parseFloat(
      validatedItems.reduce((sum, item) => sum + (item.profit || 0), 0).toFixed(2)
    );

    // Save invoice - NO SESSION
    await invoice.save();

    // Calculate points earned (1 point per ₹10 spent)
    let pointsEarningRate = 0; // Default
    if (activeReward && activeReward.amountForPoint) {
      pointsEarningRate = activeReward.amountForPoint;
    }
    const pointsEarned = finalPaidAmount > 0 ? Math.floor(finalPaidAmount / pointsEarningRate) : 0;

    // Update customer points and purchase history - NO SESSION
    await CustomerModel.findByIdAndUpdate(customerId, {
      $inc: {
        availablePoints: pointsEarned - shoppingPointsUsed,
        totalPointsEarned: pointsEarned,
        totalPointsRedeemed: shoppingPointsUsed,
        totalPurchases: 1,
        totalPurchaseAmount: grandTotal,
      },
      $set: {
        lastPurchaseDate: new Date(),
        lastPointsEarnedDate:
          pointsEarned > 0 ? new Date() : customer.lastPointsEarnedDate,
        lastPointsRedeemedDate:
          shoppingPointsUsed > 0 ? new Date() : customer.lastPointsRedeemedDate,
      },
    });

    // Update customer due amount
    await updateCustomerDueAmount(req, customerId);

    // Update product stock quantities
    for (const item of validatedItems) {
      if (item.productId) {
        await ProductModel.findByIdAndUpdate(
          item.productId,
          {
            $inc: { stockQuantity: -item.qty },
          },
          { new: true },
        );
      }
    }

    // Populate and return response
    const populatedInvoice = await InvoiceModel.findById(invoice._id)
      .populate("customerId", "name phone availablePoints")
      .populate("items.productId", "productName hsnCode itemBarcode");

    // ✅ RESPONSE (ONLY ONCE)
    return res.status(201).json({
      success: true,
      message: "Invoice created successfully",
      invoice: populatedInvoice,
      points: {
        earned: pointsEarned,
        redeemed: shoppingPointsUsed,
        net: pointsEarned - shoppingPointsUsed,
      },
    });
  } catch (err) {
    // console.error("Invoice creation error:", err);
    // next(err);

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
        error: "Invoice number already exists",
      });
    }

    return res.status(500).json({
      success: false,
      error: "Server error",
      message: err.message,
      stack: process.env.NODE_ENV === "development" ? err.stack : undefined,
    });
  }
};

// Get all invoices with filters
exports.getAllInvoices = async (req, res, next) => {
  try {
    const { CustomerInvoice: InvoiceModel } = await getAutoModels(req);

    // ✅ Get Users model from the same tenant connection
    const { forTenant } = require("../models/usersModels.js"); // adjust path as needed
    const tenantConn = InvoiceModel.db; // reuse the same connection
    const UserModel = forTenant(tenantConn);

    const {
      customerId,
      status,
      startDate,
      endDate,
      search,
      page = 1,
      limit = 20,
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

    // Validate status (only if provided)
    if (status) {
      const allowedStatuses = [
        "draft",
        "sent",
        "paid",
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

    // Date range filter
    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            error: "Invalid start date format",
          });
        }
        filter.invoiceDate.$gte = start;
      }
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            error: "Invalid end date format",
          });
        }
        filter.invoiceDate.$lte = end;
      }
    }

    // Parse pagination parameters safely
    const pageNum = Math.max(1, parseInt(page) || 1);
    const limitNum = Math.min(100, Math.max(1, parseInt(limit) || 20));
    const skip = (pageNum - 1) * limitNum;

    // Build query

    let query = InvoiceModel.find(filter)
      .populate("customerId", "name phone email")
      .populate({
        path: "createdBy",
        select: "name email",
        model: UserModel,  // ← force correct model on tenant connection
      })
      .populate({
        path: "items.productId",
        select: "productName hsnCode hsn",
        populate: { path: "hsn", select: "hsnCode" }
      })
      .populate("transporterId", "transporterName ownerName")
      .populate("vehicleId", "vehicleNumber vehicleType")
      .populate("driverId", "driverName phoneNumber")
      .populate("shipmentId", "transportMode subMode lrNo railwayReceiptNo transporterId vehicleId driverId")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limitNum);

    // Handle search
    if (search) {
      query = InvoiceModel.find({
        ...filter,
        invoiceNo: { $regex: search, $options: "i" },
      })
        .populate("customerId", "name phone email")
        .populate({
          path: "createdBy",
          select: "name email",
          model: UserModel,  // ← here too
        })
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limitNum);
    }

    const invoices = await query;
    const total = await InvoiceModel.countDocuments(filter);

    // Format response
    const response = {
      success: true,
      count: invoices.length,
      total,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum),
        hasNextPage: pageNum < Math.ceil(total / limitNum),
        hasPrevPage: pageNum > 1,
      },
      invoices,
    };

    // If no invoices found but search was used
    if (search && invoices.length === 0) {
      response.message = "No invoices found matching your search";
    }

    res.json(response);
  } catch (err) {
    // console.error("Get invoices error:", err);
    // res.status(500).json({
    //   success: false,
    //   error: "Failed to fetch invoices",
    //   message: process.env.NODE_ENV === "development" ? err.message : undefined,
    // });
    console.error("❌ getAllInvoices error:", err.message, err.stack);
    next(err);
  }
};

// Get single invoice by ID
exports.getInvoiceById = async (req, res, next) => {
  try {
    const { CustomerInvoice: InvoiceModel } = await getAutoModels(req);
    const identifier = req.params.id;
    let invoice;

    if (mongoose.Types.ObjectId.isValid(identifier)) {
      invoice = await InvoiceModel.findById(identifier)
        .populate(
          "customerId",
          "name phone email address city state country pincode gstin",
        )
        .populate("createdBy", "name email")
        .populate({
          path: "items.productId",
          select: "productName hsnCode hsn barcode unit sellingPrice tax description lotNumber serialNumbers",
          populate: {
            path: "hsn",
            select: "hsnCode description"
          }
        })
        .populate("transporterId", "transporterName ownerName")
        .populate("vehicleId", "vehicleNumber vehicleType")
        .populate("driverId", "driverName phoneNumber")
    } else {
      invoice = await InvoiceModel.findOne({ invoiceNo: identifier })
        .populate(
          "customerId",
          "name phone email address city state country pincode gstin",
        )
        .populate("createdBy", "firstName lastName email")
        .populate({
          path: "items.productId",
          select: "productName hsnCode hsn barcode unit sellingPrice tax description lotNumber serialNumbers",
          populate: {
            path: "hsn",
            select: "hsnCode description"
          }
        });
    }

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
        message: `No invoice found with identifier: ${identifier}`,
      });
    }

    // Calculate any missing totals (backward compatibility)
    if (!invoice.subtotal || !invoice.totalTax || !invoice.grandTotal) {
      invoice.calculateTotals();
      await invoice.save();
    }

    res.json({
      success: true,
      invoice,
      formatted: {
        invoiceDate: invoice.formattedDate,
        dueDate: invoice.formattedDueDate,
        dueStatus: invoice.dueStatus,
        daysRemaining: invoice.daysRemaining,
      },
    });
  } catch (err) {
    // console.error("Get invoice error:", err);
    next(err);

    if (err.name === "CastError") {
      return res.status(400).json({
        success: false,
        error: "Invalid invoice ID",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to fetch invoice",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

exports.updateInvoice = async (req, res, next) => {
  try {
    const { CustomerInvoice: InvoiceModel, Customer: CustomerModel, Product: ProductModel } = await getAutoModels(req);
    // Validate invoice ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid invoice ID format",
      });
    }

    const invoice = await InvoiceModel.findById(req.params.id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
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
    let keptAttachments = [...invoice.attachments];

    if (updateData.existingAttachments !== undefined) {
      try {
        const existingList = typeof updateData.existingAttachments === 'string'
          ? JSON.parse(updateData.existingAttachments)
          : updateData.existingAttachments;

        keptAttachments = invoice.attachments.filter(att =>
          existingList.some(existing => existing.public_id === att.public_id)
        );

        // Delete removed attachments from Cloudinary
        const removedAttachments = invoice.attachments.filter(att =>
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
        keptAttachments = [...invoice.attachments];
      }
    }

    // Upload new files
    const newAttachments = [...keptAttachments];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "invoice_attachments",
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

    invoice.attachments = newAttachments;

    // Store old values for adjustments
    const oldPointsUsed = invoice.shoppingPointsUsed;
    const oldPaidAmount = invoice.paidAmount;
    const oldStatus = invoice.status;

    // Handle items separately (needs async)
    if (updateData.items && Array.isArray(updateData.items)) {
      const validatedItems = [];
      for (const item of updateData.items) {
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

        validatedItems.push({
          productId: item.productId,
          itemName: item.itemName || product.productName,
          itemBarcode: item.itemBarcode || product.itemBarcode || "",
          hsnCode: item.hsnCode || product.hsnCode || "",
          description: item.description || product.description || "",
          lotNumber: item.lotNumber || product.lotNumber || "",
          selectedSerialNos: item.selectedSerialNos || [],
          qty: parseFloat(item.qty) || 1,
          unit: item.unit || product.unit || "Piece",
          unitPrice: parseFloat(item.unitPrice) || product.sellingPrice || 0,
          taxType: item.taxType || product.tax || "GST 0%",
          taxRate: parseFloat(item.taxRate) || parseFloat(product.tax?.match(/\d+/)?.[0]) || 0,
          taxAmount: parseFloat(item.taxAmount) || 0,
          discountPct: parseFloat(item.discountPct) || 0,
          discountAmt: parseFloat(item.discountAmt) || 0,
          amount: parseFloat(item.amount) || 0,
        });
      }
      invoice.items = validatedItems;
    }

    // Update basic fields (no async operations)
    const updatableFields = [
      "invoiceNo",
      "invoiceDate",
      "dueDate",
      "billingAddress",
      "shippingAddress",
      "additionalDiscount",
      "additionalCharges",
      "additionalChargesDetails",
      "shoppingPointsUsed",
      "autoRoundOff",
      "paidAmount",
      "fullyReceived",
      "paymentMethod",
      "notes",
      "termsAndConditions",
      "status",
      "subtotal",
      "totalTax",
      "totalDiscount",
      "grandTotal",
      "transportMode",
      "subMode",
      "lrNo",
      "wagonNo",
      "trainNo",
      "railwayReceiptNo",
      "railwayWagonNo",
      "railwayTrainNo",
      "rrbNo",
      "freightCharge",
      "otherCharges",
    ];

    for (const field of updatableFields) {
      if (updateData[field] !== undefined) {
        if (field === "dueDate") {
          const newDueDate = new Date(updateData[field]);
          const invoiceDate = updateData.invoiceDate
            ? new Date(updateData.invoiceDate)
            : invoice.invoiceDate;
          if (newDueDate < invoiceDate) {
            return res.status(400).json({
              success: false,
              error: "Due date cannot be before invoice date",
            });
          }
          invoice[field] = newDueDate;
        }
        else if (field === "autoRoundOff" || field === "fullyReceived") {
          invoice[field] = updateData[field] === true || updateData[field] === "true";
        }
        else if (field === "invoiceDate") {
          invoice[field] = new Date(updateData[field]);
        }
        else if (["shoppingPointsUsed", "paidAmount", "subtotal", "totalTax", "totalDiscount", "grandTotal"].includes(field)) {
          invoice[field] = parseFloat(updateData[field]) || 0;
        }
        else if (field === "additionalDiscount" && typeof updateData[field] === "string") {
          try {
            invoice[field] = JSON.parse(updateData[field]);
          } catch {
            invoice[field] = { pct: 0, amt: 0 };
          }
        }
        else {
          invoice[field] = updateData[field];
        }
      }
    }

    // Handle shopping points adjustment
    if (updateData.shoppingPointsUsed !== undefined) {
      const newPointsUsed = parseFloat(updateData.shoppingPointsUsed) || 0;

      if (newPointsUsed !== oldPointsUsed) {
        const customer = await CustomerModel.findById(invoice.customerId);
        if (customer) {
          const pointsDiff = newPointsUsed - oldPointsUsed;

          if (pointsDiff > 0 && (customer.availablePoints || 0) < pointsDiff) {
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
    }

    // Recalculate totals
    invoice.calculateTotals();

    // Handle status update based on payment changes
    if (updateData.paidAmount !== undefined || updateData.fullyReceived !== undefined) {
      const newPaidAmount = invoice.paidAmount || 0;
      const newFullyReceived = invoice.fullyReceived || false;

      if (newFullyReceived || newPaidAmount >= invoice.grandTotal) {
        invoice.status = "paid";
      } else if (newPaidAmount > 0) {
        invoice.status = "partial";
      } else {
        invoice.status = "draft";
      }
    }

    // Handle file uploads if new files added
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        try {
          const result = await cloudinary.uploader.upload(file.path, {
            folder: "invoice_attachments",
          });

          invoice.attachments.push({
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

    // Update timestamp and save (UPDATES THE ORIGINAL - NO NEW DOCUMENT)
    invoice.updatedAt = new Date();
    await invoice.save();

    // Update customer due amount
    await updateCustomerDueAmount(invoice.customerId);

    // Update customer points earned if status changed to paid/partial
    if (invoice.status !== oldStatus && (invoice.status === "paid" || invoice.status === "partial")) {
      const customer = await CustomerModel.findById(invoice.customerId);
      if (customer) {
        const POINTS_RATE = 10;
        const pointsEarned = invoice.paidAmount > 0 ? Math.floor(invoice.paidAmount / POINTS_RATE) : 0;

        customer.totalPointsEarned = (customer.totalPointsEarned || 0) + pointsEarned;
        customer.availablePoints = (customer.availablePoints || 0) + pointsEarned;
        customer.lastPointsEarnedDate = new Date();
        await customer.save();
      }
    }

    // Populate for response
    const populatedInvoice = await InvoiceModel.findById(invoice._id)
      .populate("customerId", "name phone email")
      .populate("createdBy", "firstName lastName")
      .populate({
        path: "items.productId",
        select: "productName hsnCode hsn itemBarcode",
        populate: {
          path: "hsn",
          select: "hsnCode"
        }
      });

    res.json({
      success: true,
      message: "Invoice updated successfully",
      invoice: populatedInvoice,
      changes: {
        pointsUsed: oldPointsUsed !== invoice.shoppingPointsUsed,
        paidAmount: oldPaidAmount !== invoice.paidAmount,
        status: oldStatus !== invoice.status,
      },
    });
  } catch (err) {
    // console.error("Update invoice error:", err);
    next(err);

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
        error: "Invoice number conflict",
      });
    }

    res.status(500).json({
      success: false,
      error: "Failed to update invoice",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Delete invoice - NO TRANSACTION VERSION
exports.deleteInvoice = async (req, res, next) => {
  try {
    const { CustomerInvoice: InvoiceModel, Product: ProductModel, Customer: CustomerModel } = await getAutoModels(req);
    // Validate invoice ID
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid invoice ID format",
      });
    }

    const invoice = await InvoiceModel.findById(req.params.id); // NO SESSION
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    // Store invoice data for cleanup
    const customerId = invoice.customerId;
    const shoppingPointsUsed = invoice.shoppingPointsUsed || 0;
    const paidAmount = invoice.paidAmount || 0;
    const items = invoice.items || [];

    // Return shopping points to customer
    if (shoppingPointsUsed > 0) {
      const customer = await CustomerModel.findById(customerId); // NO SESSION
      if (customer) {
        customer.availablePoints =
          (customer.availablePoints || 0) + shoppingPointsUsed;
        customer.usedPoints = Math.max(
          0,
          (customer.usedPoints || 0) - shoppingPointsUsed,
        );
        await customer.save(); // NO SESSION
      }
    }

    // Deduct earned points from customer (if invoice was paid/partial)
    if (
      paidAmount > 0 &&
      (invoice.status === "paid" || invoice.status === "partial")
    ) {
      const customer = await CustomerModel.findById(customerId); // NO SESSION
      if (customer) {
        const POINTS_RATE = 10;
        const pointsEarned = Math.floor(paidAmount / POINTS_RATE);

        customer.availablePoints = Math.max(
          0,
          (customer.availablePoints || 0) - pointsEarned,
        );
        customer.totalPointsEarned = Math.max(
          0,
          (customer.totalPointsEarned || 0) - pointsEarned,
        );
        await customer.save(); // NO SESSION
      }
    }

    // Restore product stock if needed
    for (const item of items) {
      if (item.productId) {
        const product = await ProductModel.findById(item.productId); // NO SESSION
        // if (
        //   product &&
        //   product.stockQuantity !== undefined &&
        //   product.stockQuantity !== null
        // ) {
        //   product.openingQuantity += item.qty || 0;
        //   await product.save(); // NO SESSION
        // }
        if (product) {
          await ProductModel.findByIdAndUpdate(item.productId, {
            $inc: { stockQuantity: item.qty },
          });
        }
      }
    }

    // Update customer purchase history
    const customer = await CustomerModel.findById(customerId); // NO SESSION
    if (customer) {
      customer.totalPurchases = Math.max(0, (customer.totalPurchases || 0) - 1);
      customer.totalPurchaseAmount = Math.max(
        0,
        (customer.totalPurchaseAmount || 0) - (invoice.grandTotal || 0),
      );

      // Recalculate average order value
      if (customer.totalPurchases > 0) {
        customer.averageOrderValue =
          customer.totalPurchaseAmount / customer.totalPurchases;
      } else {
        customer.averageOrderValue = 0;
      }

      await customer.save(); // NO SESSION
    }

    // Delete attachments from Cloudinary
    if (invoice.attachments && invoice.attachments.length > 0) {
      const deletePromises = invoice.attachments
        .filter((attachment) => attachment.public_id)
        .map((attachment) =>
          cloudinary.uploader.destroy(attachment.public_id).catch((err) => {
            console.error(`Failed to delete Cloudinary file ${attachment.public_id}:`, err.message,);
          }),
        );

      await Promise.allSettled(deletePromises);
    }

    // Delete the invoice
    await InvoiceModel.findByIdAndDelete(req.params.id); // NO SESSION
    await updateCustomerDueAmount(customerId);

    res.json({
      success: true,
      message: "Invoice deleted successfully",
      deleted: {
        invoiceId: req.params.id,
        invoiceNo: invoice.invoiceNo,
        pointsReturned: shoppingPointsUsed,
        stockRestored: items.length,
        attachmentsDeleted: invoice.attachments?.length || 0,
      },
    });
  } catch (err) {
    // console.error("Delete invoice error:", err);
    next(err);

    // res.status(500).json({
    //   success: false,
    //   error: "Failed to delete invoice",
    //   message: process.env.NODE_ENV === "development" ? err.message : undefined,
    // });
  }
};

// Add payment to invoice - NO TRANSACTION VERSION
exports.addPayment = async (req, res, next) => {
  try {
    const { CustomerInvoice: InvoiceModel, Customer: CustomerModel, } = await getAutoModels(req);
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
        error: "Invalid invoice ID format",
      });
    }

    const invoice = await InvoiceModel.findById(req.params.id); // NO SESSION
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    // Check if invoice is already fully paid
    if (invoice.status === "paid" && invoice.dueAmount <= 0) {
      return res.status(400).json({
        success: false,
        error: "Invoice is already fully paid",
        dueAmount: invoice.dueAmount,
        paidAmount: invoice.paidAmount,
      });
    }

    // Check if payment exceeds due amount
    const remainingDue = invoice.grandTotal - invoice.paidAmount;
    if (paymentAmount > remainingDue) {
      return res.status(400).json({
        success: false,
        error: `Payment amount exceeds due amount. Due: ₹${remainingDue.toFixed(
          2,
        )}`,
        dueAmount: remainingDue,
        maxPayment: remainingDue,
      });
    }

    // Store old values for comparison
    const oldPaidAmount = invoice.paidAmount;
    const oldStatus = invoice.status;
    const oldDueAmount = invoice.dueAmount;

    // Update invoice payment
    invoice.paidAmount += paymentAmount;
    invoice.paymentMethod = paymentMethod || invoice.paymentMethod;

    // Add payment note if provided
    if (notes) {
      invoice.notes = invoice.notes
        ? `${invoice.notes}\nPayment: ${notes}`
        : `Payment: ${notes}`;
    }

    // Recalculate totals and status
    invoice.calculateTotals();

    // Add payment record to payment history
    if (!invoice.paymentHistory) {
      invoice.paymentHistory = [];
    }

    invoice.paymentHistory.push({
      date: new Date(),
      amount: paymentAmount,
      method: paymentMethod || invoice.paymentMethod,
      reference: referenceNumber || "",
      notes: notes || "",
      addedBy: req.user?._id,
    });

    await invoice.save(); // NO SESSION
    await updateCustomerDueAmount(invoice.customerId);

    // Calculate points earned from this payment (1 point per ₹10)
    const POINTS_RATE = 10;
    const pointsEarned = Math.floor(paymentAmount / POINTS_RATE);

    // Update customer points if points were earned
    if (pointsEarned > 0) {
      const customer = await CustomerModel.findById(invoice.customerId); // NO SESSION
      if (customer) {
        customer.availablePoints =
          (customer.availablePoints || 0) + pointsEarned;
        customer.totalPointsEarned =
          (customer.totalPointsEarned || 0) + pointsEarned;
        customer.lastPointsEarnedDate = new Date();

        // Update payment history
        if (!customer.paymentHistory) {
          customer.paymentHistory = [];
        }

        customer.paymentHistory.push({
          date: new Date(),
          invoiceId: invoice._id,
          invoiceNo: invoice.invoiceNo,
          amount: paymentAmount,
          pointsEarned: pointsEarned,
        });

        await customer.save(); // NO SESSION
      }
    }

    // Populate for response
    const populatedInvoice = await InvoiceModel.findById(invoice._id)
      .populate("customerId", "name phone")
      .populate("createdBy", "firstName lastName");

    res.json({
      success: true,
      message: "Payment added successfully",
      invoice: populatedInvoice,
      payment: {
        amount: paymentAmount,
        pointsEarned: pointsEarned,
        previousPaid: oldPaidAmount,
        newPaid: invoice.paidAmount,
        previousDue: oldDueAmount,
        newDue: invoice.dueAmount,
        statusChanged: oldStatus !== invoice.status,
        newStatus: invoice.status,
      },
    });
  } catch (err) {
    // console.error("Add payment error:", err);
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
      error: "Failed to add payment",
      message: process.env.NODE_ENV === "development" ? err.message : undefined,
    });
  }
};

// Get invoice statistics
exports.getInvoiceStats = async (req, res, next) => {
  try {
    const { CustomerInvoice: InvoiceModel } = await getAutoModels(req);
    const {
      startDate,
      endDate,
      customerId,
      status,
      period = "all",
    } = req.query;

    const matchStage = {};
    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
      matchStage.customerId = new mongoose.Types.ObjectId(customerId);
    }

    // Filter by status
    if (status) {
      const allowedStatuses = [
        "draft",
        "sent",
        "paid",
        "partial",
        "cancelled",
        "overdue",
      ];
      if (allowedStatuses.includes(status)) {
        matchStage.status = status;
      }
    }

    // Handle date range
    if (startDate || endDate || period !== "all") {
      matchStage.invoiceDate = {};

      // Validate and set start date
      if (startDate) {
        const start = new Date(startDate);
        if (isNaN(start.getTime())) {
          return res.status(400).json({
            success: false,
            error: "Invalid start date format",
          });
        }
        matchStage.invoiceDate.$gte = start;
      } else if (period !== "all") {
        // Set default start based on period
        const now = new Date();
        if (period === "today") {
          matchStage.invoiceDate.$gte = new Date(now.setHours(0, 0, 0, 0));
        } else if (period === "week") {
          matchStage.invoiceDate.$gte = new Date(
            now.setDate(now.getDate() - 7),
          );
        } else if (period === "month") {
          matchStage.invoiceDate.$gte = new Date(
            now.setMonth(now.getMonth() - 1),
          );
        } else if (period === "year") {
          matchStage.invoiceDate.$gte = new Date(
            now.setFullYear(now.getFullYear() - 1),
          );
        }
      }

      // Validate and set end date
      if (endDate) {
        const end = new Date(endDate);
        if (isNaN(end.getTime())) {
          return res.status(400).json({
            success: false,
            error: "Invalid end date format",
          });
        }
        matchStage.invoiceDate.$lte = end;
      }
    }

    // Main stats aggregation
    const statsPipeline = [
      { $match: matchStage },
      {
        $group: {
          _id: null,
          totalInvoices: { $sum: 1 },
          totalAmount: { $sum: "$grandTotal" },
          totalPaid: { $sum: "$paidAmount" },
          totalDue: { $sum: "$dueAmount" },
          totalTax: { $sum: "$totalTax" },
          totalDiscount: { $sum: "$totalDiscount" },
          totalAdditionalCharges: { $sum: "$additionalCharges" },
          totalPointsUsed: { $sum: "$shoppingPointsUsed" },
          totalPointsValue: {
            $sum: { $multiply: ["$shoppingPointsUsed", "$pointValue"] },
          },
          avgInvoiceValue: { $avg: "$grandTotal" },
          maxInvoiceValue: { $max: "$grandTotal" },
          minInvoiceValue: { $min: "$grandTotal" },
        },
      },
      {
        $project: {
          _id: 0,
          totalInvoices: 1,
          totalAmount: { $round: ["$totalAmount", 2] },
          totalPaid: { $round: ["$totalPaid", 2] },
          totalDue: { $round: ["$totalDue", 2] },
          totalTax: { $round: ["$totalTax", 2] },
          totalDiscount: { $round: ["$totalDiscount", 2] },
          totalAdditionalCharges: { $round: ["$totalAdditionalCharges", 2] },
          totalPointsUsed: 1,
          totalPointsValue: { $round: ["$totalPointsValue", 2] },
          avgInvoiceValue: { $round: ["$avgInvoiceValue", 2] },
          maxInvoiceValue: { $round: ["$maxInvoiceValue", 2] },
          minInvoiceValue: { $round: ["$minInvoiceValue", 2] },
          paymentEfficiency: {
            $cond: {
              if: { $gt: ["$totalAmount", 0] },
              then: {
                $round: [
                  {
                    $multiply: [
                      { $divide: ["$totalPaid", "$totalAmount"] },
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

    const stats = await InvoiceModel.aggregate(statsPipeline);

    // Status-wise counts
    const statusCounts = await InvoiceModel.aggregate([
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

    // Monthly breakdown (last 12 months)
    const monthlyBreakdown = await InvoiceModel.aggregate([
      { $match: matchStage },
      {
        $group: {
          _id: {
            year: { $year: "$invoiceDate" },
            month: { $month: "$invoiceDate" },
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$grandTotal" },
          totalPaid: { $sum: "$paidAmount" },
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
          totalPaid: { $round: ["$totalPaid", 2] },
        },
      },
    ]);

    // Top customers by invoice count
    const topCustomers = await InvoiceModel.aggregate([
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
          invoiceCount: { $sum: 1 },
          totalSpent: { $sum: "$grandTotal" },
          avgInvoiceValue: { $avg: "$grandTotal" },
        },
      },
      { $sort: { totalSpent: -1 } },
      { $limit: 10 },
      {
        $project: {
          _id: 0,
          customerId: "$_id",
          customerName: 1,
          invoiceCount: 1,
          totalSpent: { $round: ["$totalSpent", 2] },
          avgInvoiceValue: { $round: ["$avgInvoiceValue", 2] },
        },
      },
    ]);

    res.json({
      success: true,
      stats: stats[0] || {
        totalInvoices: 0,
        totalAmount: 0,
        totalPaid: 0,
        totalDue: 0,
        totalTax: 0,
        totalDiscount: 0,
        totalAdditionalCharges: 0,
        totalPointsUsed: 0,
        totalPointsValue: 0,
        avgInvoiceValue: 0,
        maxInvoiceValue: 0,
        minInvoiceValue: 0,
        paymentEfficiency: 0,
      },
      statusCounts,
      monthlyBreakdown,
      topCustomers,
      filters: {
        startDate: startDate || null,
        endDate: endDate || null,
        customerId: customerId || null,
        status: status || null,
        period: period,
      },
    });
  } catch (err) {
    // console.error("Get stats error:", err);
    // res.status(500).json({
    //   success: false,
    //   error: "Failed to fetch statistics",
    //   message: process.env.NODE_ENV === "development" ? err.message : undefined,
    // });
    next(err);
  }
};

// Get invoices by customer
exports.getInvoicesByCustomer = async (req, res, next) => {
  try {
    const { CustomerInvoice: InvoiceModel } = await getAutoModels(req);
    const { customerId } = req.params;
    const { status, startDate, endDate, limit = 50 } = req.query;

    // Validate customer ID
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid customer ID format",
      });
    }

    const filter = { customerId };

    // Add status filter if provided
    if (status && status !== "all") {
      filter.status = status;
    }

    // Add date range filter
    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate);
      if (endDate) filter.invoiceDate.$lte = new Date(endDate);
    }

    // Get invoices
    const invoices = await InvoiceModel.find(filter)
      .select(
        "invoiceNo invoiceDate dueDate grandTotal paidAmount dueAmount status paymentMethod",
      )
      .sort({ invoiceDate: -1 })
      .limit(parseInt(limit));

    // Calculate summary
    const summary = {
      totalInvoices: invoices.length,
      totalAmount: invoices.reduce((sum, inv) => sum + inv.grandTotal, 0),
      totalPaid: invoices.reduce((sum, inv) => sum + inv.paidAmount, 0),
      totalDue: invoices.reduce((sum, inv) => sum + inv.dueAmount, 0),
    };

    res.json({
      success: true,
      count: invoices.length,
      summary,
      invoices,
    });
  } catch (error) {
    // console.error("Get customer invoices error:", error);
    // res.status(500).json({
    //   success: false,
    //   error: "Failed to fetch customer invoices",
    // });
    next(error);
  }
};

// Get overdue invoices by customer
exports.getOverdueInvoicesByCustomer = async (req, res, next) => {
  try {
    const { CustomerInvoice: InvoiceModel } = await getAutoModels(req);
    const { customerId } = req.params;
    const today = new Date();

    // Validate customer ID
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid customer ID format",
      });
    }

    // Find overdue invoices (due date passed and not fully paid)
    const overdueInvoices = await InvoiceModel.find({
      customerId,
      dueDate: { $lt: today },
      dueAmount: { $gt: 0 },
      status: { $in: ["sent", "partial"] },
    })
      .select(
        "invoiceNo invoiceDate dueDate grandTotal paidAmount dueAmount status",
      )
      .sort({ dueDate: 1 });

    // Calculate total overdue amount
    const totalOverdue = overdueInvoices.reduce(
      (sum, inv) => sum + inv.dueAmount,
      0,
    );

    res.json({
      success: true,
      count: overdueInvoices.length,
      totalOverdue,
      invoices: overdueInvoices,
    });
  } catch (error) {
    // console.error("Get overdue invoices error:", error);
    // res.status(500).json({
    //   success: false,
    //   error: "Failed to fetch overdue invoices",
    // });
    next(error);
  }
};

// Get unpaid invoices by customer
exports.getUnpaidInvoicesByCustomer = async (req, res, next) => {
  try {
    const { CustomerInvoice: InvoiceModel } = await getAutoModels(req);
    const { customerId } = req.params;

    // Validate customer ID
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid customer ID format",
      });
    }

    // Find unpaid or partially paid invoices
    const unpaidInvoices = await InvoiceModel.find({
      customerId,
      dueAmount: { $gt: 0 },
      status: { $in: ["sent", "partial"] },
    })
      .select(
        "invoiceNo invoiceDate dueDate grandTotal paidAmount dueAmount status",
      )
      .sort({ dueDate: 1 });

    res.json({
      success: true,
      count: unpaidInvoices.length,
      invoices: unpaidInvoices,
    });
  } catch (error) {
    // console.error("Get unpaid invoices error:", error);
    // res.status(500).json({
    //   success: false,
    //   error: "Failed to fetch unpaid invoices",
    // });
    next(error);
  }
};

// Get sales list with product details
exports.getSalesList = async (req, res, next) => {
  try {
    const { CustomerInvoice: InvoiceModel } = await getAutoModels(req);
    const {
      startDate,
      endDate,
      customerId,
      status,
      search,
      page = 1,
      limit = 10,
    } = req.query;

    // Build filter
    const filter = {};

    // Date filter
    if (startDate || endDate) {
      filter.invoiceDate = {};
      if (startDate) filter.invoiceDate.$gte = new Date(startDate);
      if (endDate) filter.invoiceDate.$lte = new Date(endDate);
    }

    // Customer filter
    if (customerId && mongoose.Types.ObjectId.isValid(customerId)) {
      filter.customerId = customerId;
    }

    // Status filter - FIXED FOR "due" TAB
    if (status && status !== "all") {
      if (status === "due") {
        // For "due" tab, filter by dueAmount > 0
        filter.dueAmount = { $gt: 0 };
      } else if (status === "recent") {
        // For "recent" tab, get invoices from last 7 days
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
        filter.invoiceDate = { $gte: sevenDaysAgo };
      } else {
        // For other statuses like "paid", "draft", etc.
        filter.status = status;
      }
    }

    // Search filter
    if (search) {
      filter.$or = [
        { invoiceNo: { $regex: search, $options: "i" } },
        { "customerId.name": { $regex: search, $options: "i" } },
      ];
    }

    // Pagination
    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    // Get invoices with populated data
    const invoices = await InvoiceModel.find(filter)
      .populate("customerId", "name phone email")
      .populate({
        path: "items.productId",
        select: "productName category hsn itemBarcode sellingPrice costPrice variants supplier",
        populate: [
          {
            path: "category",
            select: "categoryName",
          },
          {
            path: "hsn",
            select: "hsnCode",
          },
        ],
      })
      .sort({ invoiceDate: -1 })
      .skip(skip)
      .limit(limitNum)
      .lean();

    // Count total
    const total = await InvoiceModel.countDocuments(filter);

    // Calculate summary statistics
    const stats = await InvoiceModel.aggregate([
      { $match: filter },
      {
        $group: {
          _id: null,
          totalRevenue: { $sum: "$grandTotal" },
          totalOrders: { $sum: 1 },
          totalPaid: { $sum: "$paidAmount" },
          totalDue: { $sum: "$dueAmount" },
          avgOrderValue: { $avg: "$grandTotal" },
        },
      },
    ]);

    // Format response
    const salesList = invoices.map((invoice) => {
      // Calculate sold items count
      const soldItems = invoice.items.reduce((sum, item) => sum + item.qty, 0);

      return {
        _id: invoice._id,
        invoiceNo: invoice.invoiceNo,
        customer: invoice.customerId?.name || "N/A",
        soldItems,
        totalAmount: invoice.grandTotal,
        status: invoice.status,
        dueAmount: invoice.dueAmount,
        invoiceDate: invoice.invoiceDate,
        paymentMethod: invoice.paymentMethod,
        // Include all items for expanded view
        items: invoice.items.map((item) => ({
          productId: item.productId?._id || item.productId,
          productName: item.productId?.productName || item.itemName,
          itemBarcode: item.itemBarcode || item.productId?.itemBarcode || "N/A",
          hsn: item.productId?.hsn?.hsnCode || "N/A",
          qty: item.qty,
          category: item.productId?.category?.categoryName || "",
          unitPrice: item.unitPrice,
          discountAmt: item.discountAmt || 0,
          total: item.amount,
          costPrice: item.productId?.costPrice || 0,
          profit: item.profit || 0,
          variants: item.productId?.variants || [],
          supplier: item.productId?.supplier || "",
        })),
      };
    });

    res.json({
      success: true,
      data: {
        sales: salesList,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum),
        },
        stats: stats[0] || {
          totalRevenue: 0,
          totalOrders: 0,
          totalPaid: 0,
          totalDue: 0,
          avgOrderValue: 0,
        },
      },
    });
  } catch (error) {
    // console.error("Get sales list error:", error);
    // res.status(500).json({
    //   success: false,
    //   error: "Failed to fetch sales list",
    // });
    next(error);
  }
};

exports.sendThroughEmail = async (req, res, next) => {
  try {
    const { CustomerInvoice: InvoiceModel, PurchaseOrder: PurchaseOrderModel, Company: CompanyModel } = await getAutoModels(req);
    const { invoiceId, toEmail, subject, type = "sales" } = req.body;

    // console.log("📧 Email sending request received:", {
    //   invoiceId,
    //   toEmail,
    //   subject,
    //   type,
    // });

    // Validate inputs
    if (!toEmail || !invoiceId) {
      return res.status(400).json({
        success: false,
        message: "Recipient email and invoice ID are required",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(toEmail)) {
      return res.status(400).json({
        success: false,
        message: "Invalid email format",
      });
    }

    // 1. Fetch invoice data
    let invoice;
    if (type === "purchase") {
      // For purchase orders
      // const PurchaseOrder = require("../models/PurchaseOrder"); // Adjust path as needed
      invoice = await PurchaseOrderModel.findById(invoiceId).populate(
        "supplierId",
        "supplierName email phone address",
      );
    } else {
      // For sales invoices
      // const Invoice = require("../models/Invoice"); // Adjust path as needed
      invoice = await InvoiceModel.findById(invoiceId).populate(
        "customerId",
        "name email phone address",
      );
    }

    if (!invoice) {
      return res.status(404).json({
        success: false,
        message: "Invoice not found",
      });
    }

    // console.log("📄 Invoice found:", invoice.invoiceNo);

    // 2. Get company info from database or use defaults
    // const Company = require("../models/CompanyProfile"); // Adjust path as needed
    const company = await CompanyModel.findOne();

    const companyName = company?.companyName || "Your Company";
    const companyEmail =
      company?.companyemail ||
      process.env.EMAIL_USER ||
      "";
    const companyPhone = company?.companyphone || "";
    const companyAddress = company?.companyaddress || "";
    const companyLogo = company?.companyLogo || "";

    // 3. Prepare email content
    const emailSubject =
      subject ||
      `${type === "purchase" ? "Purchase" : "Sales"} Invoice - ${invoice.invoiceNo}`;

    // Create HTML email template
    const emailHtml = createInvoiceEmailTemplate(
      invoice,
      companyName,
      companyEmail,
      companyPhone,
      type,
    );

    // 4. Send email
    const emailResult = await sendEmailWithNodemailer(
      toEmail,
      emailSubject,
      emailHtml,
      invoice,
    );

    if (emailResult.success) {
      // Update invoice status
      if (type === "purchase") {
        await PurchaseOrderModel.findByIdAndUpdate(invoiceId, {
          $set: {
            status: "sent",
            sentAt: new Date(),
            sentVia: "email",
          },
        });
      } else {
        await InvoiceModel.findByIdAndUpdate(invoiceId, {
          $set: {
            status: "sent",
            sentAt: new Date(),
            sentVia: "email",
          },
        });
      }

      return res.json({
        success: true,
        message: `Invoice sent via email to ${toEmail}`,
        data: {
          email: toEmail,
          invoiceNo: invoice.invoiceNo,
          timestamp: new Date().toISOString(),
          type: type,
        },
      });
    } else {
      return res.status(500).json({
        success: false,
        message: "Failed to send email",
        error: emailResult.error,
      });
    }
  } catch (error) {
    // console.error("❌ Error sending email:", error.message);
    // console.error(error.stack);

    // res.status(500).json({
    //   success: false,
    //   message: "Failed to process email request",
    //   error:
    //     process.env.NODE_ENV === "development"
    //       ? error.message
    //       : "Internal server error",
    // });
    next(error);
  }
};

// Function to create email template
function createInvoiceEmailTemplate(
  invoice,
  companyName,
  companyEmail,
  companyPhone,
  type,
) {
  const invoiceDate = invoice.invoiceDate
    ? new Date(invoice.invoiceDate).toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    })
    : "N/A";

  const customerName =
    type === "purchase"
      ? invoice.supplierId?.supplierName || "Supplier"
      : invoice.customerId?.name || "Customer";

  const itemsHtml =
    invoice.items && invoice.items.length > 0
      ? invoice.items
        .map(
          (item, index) => `
            <tr>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${index + 1}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.itemName || item.name || "N/A"}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">${item.qty || 0}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.unitPrice?.toFixed(2) || "0.00"}</td>
                <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.amount?.toFixed(2) || "0.00"}</td>
            </tr>
        `,
        )
        .join("")
      : '<tr><td colspan="5" style="padding: 8px; text-align: center;">No items</td></tr>';

  return `
        <!DOCTYPE html>
        <html>
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Invoice ${invoice.invoiceNo}</title>
            <style>
                body {
                    font-family: Arial, sans-serif;
                    line-height: 1.6;
                    color: #333;
                    max-width: 600px;
                    margin: 0 auto;
                    padding: 20px;
                }
                .header {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 20px;
                    border-radius: 5px 5px 0 0;
                    text-align: center;
                }
                .content {
                    padding: 20px;
                    background: #f9f9f9;
                    border-radius: 0 0 5px 5px;
                }
                .invoice-details {
                    background: white;
                    padding: 20px;
                    border-radius: 5px;
                    margin: 20px 0;
                    border-left: 4px solid #667eea;
                }
                table {
                    width: 100%;
                    border-collapse: collapse;
                    margin: 20px 0;
                }
                th {
                    background: #f5f5f5;
                    padding: 10px;
                    text-align: left;
                    border-bottom: 2px solid #ddd;
                }
                .total-section {
                    background: white;
                    padding: 15px;
                    border-radius: 5px;
                    margin: 20px 0;
                    border-top: 2px solid #667eea;
                }
                .footer {
                    margin-top: 30px;
                    padding-top: 20px;
                    border-top: 1px solid #ddd;
                    color: #666;
                    font-size: 12px;
                }
                .btn {
                    display: inline-block;
                    background: #667eea;
                    color: white;
                    padding: 12px 24px;
                    text-decoration: none;
                    border-radius: 5px;
                    margin: 10px 0;
                }
            </style>
        </head>
        <body>
            <div class="header">
                <h1 style="margin: 0; font-size: 24px;">${companyName}</h1>
                <p style="margin: 5px 0 0 0; opacity: 0.9;">${type === "purchase" ? "Purchase Invoice" : "Tax Invoice"}</p>
            </div>
            
            <div class="content">
                <p>Dear ${customerName},</p>
                <p>Please find your invoice details below:</p>
                
                <div class="invoice-details">
                    <h3 style="margin-top: 0; color: #667eea;">Invoice Summary</h3>
                    <p><strong>Invoice No:</strong> ${invoice.invoiceNo || "N/A"}</p>
                    <p><strong>Date:</strong> ${invoiceDate}</p>
                    <p><strong>Status:</strong> <span style="color: ${invoice.status === "paid" ? "#28a745" : invoice.status === "pending" ? "#ffc107" : "#dc3545"}; font-weight: bold;">
                        ${invoice.status?.toUpperCase() || "PENDING"}
                    </span></p>
                </div>
                
                <h3>Items Details</h3>
                <table>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Item Name</th>
                            <th>Qty</th>
                            <th>Unit Price</th>
                            <th>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${itemsHtml}
                    </tbody>
                </table>
                
                <div class="total-section">
                    <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                        <span><strong>Subtotal:</strong></span>
                        <span><strong>₹${invoice.subtotal?.toFixed(2) || "0.00"}</strong></span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                        <span>Tax:</span>
                        <span>₹${invoice.totalTax?.toFixed(2) || "0.00"}</span>
                    </div>
                    <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                        <span>Discount:</span>
                        <span>₹${invoice.totalDiscount?.toFixed(2) || "0.00"}</span>
                    </div>
                    ${invoice.shoppingPointsUsed > 0
      ? `
                    <div style="display: flex; justify-content: space-between; margin: 5px 0;">
                        <span>🪙 Shopping Points:</span>
                        <span>₹${invoice.shoppingPointsUsed?.toFixed(2) || "0.00"}</span>
                    </div>
                    `
      : ""
    }
                    <div style="display: flex; justify-content: space-between; margin: 5px 0; font-size: 18px; color: #667eea; padding-top: 10px; border-top: 1px solid #ddd;">
                        <span><strong>Total Amount:</strong></span>
                        <span><strong>₹${invoice.grandTotal?.toFixed(2) || "0.00"}</strong></span>
                    </div>
                    ${invoice.dueAmount > 0
      ? `
                    <div style="display: flex; justify-content: space-between; margin: 5px 0; color: #dc3545;">
                        <span><strong>Due Amount:</strong></span>
                        <span><strong>₹${invoice.dueAmount?.toFixed(2) || "0.00"}</strong></span>
                    </div>
                    `
      : ""
    }
                </div>
                
                <p>You can view and download the complete invoice by clicking the button below:</p>
                <a href="${process.env.FRONTEND_URL || "http://localhost:3000"}/invoices/${invoice._id}" class="btn">
                    View Complete Invoice
                </a>
                
                <p>If you have any questions about this invoice, please reply to this email or contact us.</p>
                
                <div class="footer">
                    <p><strong>${companyName}</strong></p>
                    ${companyAddress ? `<p>${companyAddress}</p>` : ""}
                    ${companyPhone ? `<p>Phone: ${companyPhone}</p>` : ""}
                    <p>Email: ${companyEmail}</p>
                    <p style="margin-top: 10px; font-size: 11px; color: #999;">
                        This is an automated email. Please do not reply directly to this message.
                    </p>
                </div>
            </div>
        </body>
        </html>
    `;
}

// Function to send email using nodemailer
async function sendEmailWithNodemailer(
  toEmail,
  subject,
  htmlContent,
  invoiceData,
) {
  try {
    // Check if email is configured
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      console.error("❌ Email configuration missing");
      return {
        success: false,
        error: "Email configuration missing",
        simulated: true,
      };
    }

    // console.log("🔧 Configuring email transporter...");

    // Create transporter
    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 587,
      secure: false, // true for 465, false for other ports
      auth: {
        user: process.env.EMAIL_USER, // madhav005542@gmail.com
        pass: process.env.EMAIL_PASS, // lfvu mxyh fnlc qqts
      },
      tls: {
        rejectUnauthorized: false,
      },
    });

    // Verify connection configuration
    // console.log("🔍 Verifying email configuration...");
    await transporter.verify();
    // console.log("✅ Email server is ready to take messages");

    // Prepare email options
    const mailOptions = {
      from: `"Invoice System" <${process.env.EMAIL_USER}>`, // From: madhav005542@gmail.com
      to: toEmail,
      subject: subject,
      html: htmlContent,
      text: `Invoice ${invoiceData.invoiceNo} - Total: ₹${invoiceData.grandTotal?.toFixed(2) || "0.00"}. Please view the HTML version for complete details.`,
      attachments: [], // You can add PDF attachment here if generated
    };

    // console.log("📤 Sending email...");
    // console.log("   From:", mailOptions.from);
    // console.log("   To:", mailOptions.to);
    // console.log("   Subject:", mailOptions.subject);

    // Send email
    const info = await transporter.sendMail(mailOptions);

    // console.log("✅ Email sent successfully!");
    // console.log("   Message ID:", info.messageId);
    // console.log("   Response:", info.response);

    return {
      success: true,
      messageId: info.messageId,
      response: info.response,
    };
  } catch (error) {
    // console.error("❌ Email sending failed:");
    // console.error("   Error:", error.message);
    // console.error("   Code:", error.code);
    // console.error("   Command:", error.command);

    // Provide helpful error messages
    let errorMessage = error.message;
    if (error.code === "EAUTH") {
      errorMessage =
        "Email authentication failed. Check your email credentials.";
    } else if (error.code === "ECONNECTION") {
      errorMessage = "Connection to email server failed. Check your network.";
    }

    return {
      success: false,
      error: errorMessage,
      details: error,
    };
  }
}

exports.sendThroughSMS = async (req, res, next) => {
  try {
    const { invoiceId, phoneNumber, message } = req.body;
    // Send SMS using SMS service (Twilio, etc.)
    res.json({ success: true, message: "SMS sent" });
  } catch (error) {
    // res.status(500).json({ error: error.message });
    next(error);
  }
};

// get overdue invoices
exports.getOverdueInvoices = async (req, res, next) => {
  try {
    const { CustomerInvoice: InvoiceModel } = await getAutoModels(req);
    const today = new Date();
    const overdueInvoices = await InvoiceModel.find({
      dueDate: { $lt: today },
      status: { $in: ["sent", "partial"] },
      dueAmount: { $gt: 0 },
    })
      .populate("customerId", "name phone email")
      .sort({ dueDate: 1 });
    res.json({
      success: true,
      count: overdueInvoices.length,
      invoices: overdueInvoices,
    });
  } catch (error) {
    // console.error("Get overdue invoices error:", error);
    // res.status(500).json({
    //   success: false,
    //   error: "Failed to fetch overdue invoices",
    // });
    next(error);
  }
};

// update transport details for an existing invoice
// exports.updateInvoiceTransport = async (req, res, next) => {
//   try {
//     const {CustomerInvoice:InvoiceModel} = await getAutoModels(req);
//     const {id} = req.params;
//     const {transporterId, vehicleId, driverId} = req.body;
//     // validate invoice ID
//     if(!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success:false,
//         error:"Invalid invoice ID format",
//       });
//     }
//     // find and update the invoice
//     const invoice = await InvoiceModel.findByIdAndUpdate(id, {
//       $set:{
//         transporterId:transporterId || null,
//         vehicleId:vehicleId || null,
//         driverId:driverId || null,
//       }
//     },
//   {new:true} //return updated document
//   ).populate("transporterId", "transporterName ownerName")
//   .populate("vehicleId", "vehicleNumber vehicleType")
//   .populate("driverId", "driverName phoneNumber");
//   if(!invoice) {
//     return res.status(404).json({
//       success:false,
//       error:"Invoice not found",
//     });
//   }
//   res.json({
//     success:true,
//     message:"Transport details updated successfully",
//     invoice,
//   })
//   }catch(error) {
//     console.error("Update invoice transport error", error);
//     res.status(500).json({
//       success:false,
//       error:"Failed to update transport details",
//       message:error.message
//     })
//   }
// }
// In your updateInvoiceTransport function or when assigning transpor
// When assigning transport, generate and save shipment number once
exports.updateInvoiceTransport = async (req, res, next) => {
  try {
    const { CustomerInvoice: InvoiceModel } = await getAutoModels(req);
    const { id } = req.params;
    const {
      transportMode,
      subMode,
      transporterId,
      vehicleId,
      driverId,
      lrNo,
      wagonNo,
      trainNo,
      railwayReceiptNo,
      railwayWagonNo,
      railwayTrainNo,
      rrbNo,
      freightCharge,
      otherCharges,
    }
      = req.body;

    const invoice = await InvoiceModel.findById(id);
    if (!invoice) {
      return res.status(404).json({ success: false, error: "Invoice not found" });
    }

    // Generate shipment number only if this is the first time assigning transport
    if (transportMode !== undefined) invoice.transportMode = transportMode;
    if (subMode !== undefined) invoice.subMode = subMode;
    if (transporterId !== undefined) invoice.transporterId = transporterId;
    if (vehicleId !== undefined) invoice.vehicleId = vehicleId;
    if (driverId !== undefined) invoice.driverId = driverId;
    if (lrNo !== undefined) invoice.lrNo = lrNo;
    if (wagonNo !== undefined) invoice.wagonNo = wagonNo;
    if (trainNo !== undefined) invoice.trainNo = trainNo;
    if (railwayReceiptNo !== undefined) invoice.railwayReceiptNo = railwayReceiptNo;
    if (railwayWagonNo !== undefined) invoice.railwayWagonNo = railwayWagonNo;
    if (railwayTrainNo !== undefined) invoice.railwayTrainNo = railwayTrainNo;
    if (rrbNo !== undefined) invoice.rrbNo = rrbNo;
    if (freightCharge !== undefined) invoice.freightCharge = freightCharge;
    if (otherCharges !== undefined) invoice.otherCharges = otherCharges;

    invoice.totalCharges = (invoice.freightCharge || 0) + (invoice.otherCharges || 0);

    await invoice.save();

    res.json({
      success: true,
      message: "Transport details updated successfully",
      invoice
    });
  } catch (error) {
    next(error);
  }
};

// Add this function to CustomerInvoiceController.js
exports.convertToSalesOrder = async (req, res, next) => {
  try {
    const {
      CustomerInvoice: InvoiceModel,
      SalesOrder: SalesOrderModel,
      Customer: CustomerModel,
      Product: ProductModel
    } = await getAutoModels(req);

    const { id } = req.params;

    // Validate invoice ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid invoice ID format",
      });
    }

    // Find the invoice
    const invoice = await InvoiceModel.findById(id)
      .populate("customerId", "name phone email address")
      .populate("items.productId");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    // Check if already converted
    if (invoice.convertedToSalesOrder) {
      return res.status(400).json({
        success: false,
        error: "Invoice has already been converted to Sales Order",
      });
    }

    // Generate Sales Order Number (similar to Proforma)
    const generateSONo = async () => {
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

    const salesOrderNo = await generateSONo();

    // Create Sales Order from Invoice data
    const salesOrder = new SalesOrderModel({
      salesOrderNo: salesOrderNo,
      customerId: invoice.customerId._id,
      orderDate: new Date(),
      expectedDeliveryDate: invoice.dueDate,
      items: invoice.items.map(item => ({
        productId: item.productId._id,
        itemName: item.itemName,
        itemBarcode: item.itemBarcode,
        qty: item.qty,
        unitPrice: item.unitPrice,
        taxRate: item.taxRate,
        taxAmount: item.taxAmount,
        discountPct: item.discountPct,
        discountAmt: item.discountAmt,
        amount: item.amount,
        hsnCode: item.hsnCode,
        description: item.description,
      })),
      billingAddress: invoice.billingAddress,
      shippingAddress: invoice.shippingAddress,
      subtotal: invoice.subtotal,
      totalTax: invoice.totalTax,
      totalDiscount: invoice.totalDiscount,
      additionalDiscount: invoice.additionalDiscount,
      additionalCharges: invoice.additionalCharges,
      additionalChargesDetails: invoice.additionalChargesDetails,
      grandTotal: invoice.grandTotal,
      status: "open", // Set status to open
      notes: `Converted from Invoice ${invoice.invoiceNo}`,
      termsAndConditions: invoice.termsAndConditions,
      sourceInvoiceId: invoice._id,
      sourceType: "Invoice",
      createdBy: req.user?._id,
    });

    await salesOrder.save();

    // Mark invoice as converted
    invoice.convertedToSalesOrder = true;
    invoice.convertedToSalesOrderId = salesOrder._id;
    invoice.convertedAt = new Date();
    await invoice.save();

    res.json({
      success: true,
      message: "Successfully converted to Sales Order",
      salesOrder: salesOrder,
    });

  } catch (err) {
    console.error("Convert to Sales Order error:", err);
    next(err);
  }
};


// Update shipment status for an invoice
// exports.updateShipmentStatus = async (req, res, next) => {
//   try {
//     const { CustomerInvoice: InvoiceModel } = await getAutoModels(req);
//     const { id } = req.params;
//     const { shipmentStatus, notes } = req.body;

//     if (!mongoose.Types.ObjectId.isValid(id)) {
//       return res.status(400).json({
//         success: false,
//         error: "Invalid invoice ID format",
//       });
//     }

//     const invoice = await InvoiceModel.findByIdAndUpdate(
//       id,
//       {
//         $set: { shipmentStatus },
//         $push: {
//           shipmentHistory: {
//             status: shipmentStatus,
//             updatedBy: req.user?._id,
//             notes: notes || "",
//             updatedAt: new Date()
//           }
//         }
//       },
//       { new: true }
//     );

//     if (!invoice) {
//       return res.status(404).json({
//         success: false,
//         error: "Invoice not found",
//       });
//     }

//     res.json({
//       success: true,
//       message: "Shipment status updated successfully",
//       invoice,
//     });
//   } catch (error) {
//     console.error("Update shipment status error:", error);
//     res.status(500).json({
//       success: false,
//       error: "Failed to update shipment status",
//       message: error.message
//     });
//   }
// };


// Mark Invoice as Dispatched
exports.dispatchInvoice = async (req, res, next) => {
  try {
    const { CustomerInvoice: InvoiceModel } = await getAutoModels(req);
    const { id } = req.params;
    const { dispatched, dispatchedAt, shipmentStatus } = req.body;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid invoice ID format",
      });
    }

    const invoice = await InvoiceModel.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found",
      });
    }

    invoice.dispatched = dispatched;
    invoice.dispatchedAt = dispatchedAt || new Date();
    invoice.shipmentStatus = shipmentStatus || "dispatched";

    // Add to shipment history
    if (!invoice.shipmentHistory) {
      invoice.shipmentHistory = [];
    }
    invoice.shipmentHistory.push({
      status: shipmentStatus || "dispatched",
      updatedBy: req.user?._id,
      notes: `Invoice marked as ${dispatched ? "dispatched" : "not dispatched"}`,
      updatedAt: new Date()
    });

    await invoice.save();

    res.json({
      success: true,
      message: "Invoice dispatched successfully",
      invoice
    });
  } catch (error) {
    console.error("Dispatch invoice error:", error);
    next(error);
  }
};



// ==================== INTEREST CALCULATION FUNCTIONS ====================

/**
 * Calculate days overdue for an invoice
 */
const calculateDaysOverdue = (dueDate) => {
  const due = new Date(dueDate);
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  due.setHours(0, 0, 0, 0);
  const diffTime = today - due;
  return Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
};

/**
 * Calculate interest amount based on due amount, rate, and days overdue
 * Formula: (dueAmount * interestRate * daysOverdue) / (100 * 365)
 */
const calculateInterestAmount = (dueAmount, interestRate, daysOverdue) => {
  if (dueAmount <= 0 || interestRate <= 0 || daysOverdue <= 0) return 0;
  return (dueAmount * interestRate * daysOverdue) / (100 * 365);
};

/**
 * Add or update interest settings for an invoice
 */
exports.addOrUpdateInterestSettings = async (req, res, next) => {
  try {
    const { CustomerInvoice: InvoiceModel } = await getAutoModels(req);
    const { id } = req.params;
    const {
      interestRate,
      minAmount,
      interestAmount,
      daysOverdue,
      notes
    } = req.body;

    // Validate invoice ID
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid invoice ID format"
      });
    }

    // Find invoice
    const invoice = await InvoiceModel.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found"
      });
    }

    // Check if invoice is overdue
    const daysOverdueActual = calculateDaysOverdue(invoice.dueDate);
    if (daysOverdueActual <= 0 && invoice.dueAmount > 0) {
      return res.status(400).json({
        success: false,
        error: "Invoice is not overdue yet. Interest can only be applied to overdue invoices."
      });
    }

    // Check minimum amount condition
    const minAmt = parseFloat(minAmount) || 0;
    const dueAmount = invoice.dueAmount || 0;

    if (dueAmount < minAmt) {
      return res.status(400).json({
        success: false,
        error: `Due amount (₹${dueAmount.toFixed(2)}) is less than minimum amount (₹${minAmt.toFixed(2)}). Interest not applicable.`
      });
    }

    // Calculate interest if not provided
    let finalInterestAmount = interestAmount;
    if (!finalInterestAmount && interestRate) {
      finalInterestAmount = calculateInterestAmount(dueAmount, interestRate, daysOverdueActual);
    }

    // Store previous settings for history
    const previousSettings = invoice.interestSettings ? { ...invoice.interestSettings } : null;

    // Update interest settings
    invoice.interestSettings = {
      interestRate: parseFloat(interestRate),
      minAmount: minAmt,
      interestAmount: finalInterestAmount,
      lastCalculatedAt: new Date(),
      calculatedDays: daysOverdueActual,
      isActive: true,
      appliedBy: req.user?._id,
      appliedAt: new Date()
    };

    // Add to interest history
    if (!invoice.interestHistory) invoice.interestHistory = [];
    invoice.interestHistory.push({
      calculatedAt: new Date(),
      interestRate: parseFloat(interestRate),
      minAmount: minAmt,
      interestAmount: finalInterestAmount,
      daysOverdue: daysOverdueActual,
      dueAmountAtCalculation: dueAmount,
      calculatedBy: req.user?._id,
      notes: notes || (previousSettings ? "Interest settings updated" : "Interest settings applied")
    });

    // Update total interest accrued
    invoice.totalInterestAccrued = (invoice.totalInterestAccrued || 0) + finalInterestAmount;

    await invoice.save();

    // Populate for response
    const populatedInvoice = await InvoiceModel.findById(id)
      .populate("customerId", "name phone email")
      .populate("interestSettings.appliedBy", "firstName lastName");

    res.json({
      success: true,
      message: previousSettings ? "Interest settings updated successfully" : "Interest settings applied successfully",
      data: {
        interestSettings: invoice.interestSettings,
        interestHistory: invoice.interestHistory,
        invoice: populatedInvoice
      }
    });

  } catch (error) {
    console.error("Add/Update interest settings error:", error);
    next(error);
  }
};

/**
 * Get interest details for an invoice
 */
exports.getInterestDetails = async (req, res, next) => {
  try {
    const { CustomerInvoice: InvoiceModel } = await getAutoModels(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid invoice ID format"
      });
    }

    const invoice = await InvoiceModel.findById(id)
      .populate("interestSettings.appliedBy", "firstName lastName")
      .populate("interestHistory.calculatedBy", "firstName lastName");

    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found"
      });
    }

    // Calculate current interest (recalculate based on current days)
    const daysOverdue = calculateDaysOverdue(invoice.dueDate);
    let currentInterestAmount = 0;
    let shouldRecalculate = false;

    if (invoice.interestSettings && invoice.interestSettings.isActive) {
      const lastCalculatedDays = invoice.interestSettings.calculatedDays || 0;
      const dueAmount = invoice.dueAmount || 0;
      const interestRate = invoice.interestSettings.interestRate;
      const minAmount = invoice.interestSettings.minAmount;

      // Check if we need to recalculate (days changed or amount changed)
      if (daysOverdue !== lastCalculatedDays || dueAmount !== invoice.interestSettings.dueAmountAtCalculation) {
        if (dueAmount >= minAmount) {
          currentInterestAmount = calculateInterestAmount(dueAmount, interestRate, daysOverdue);
          shouldRecalculate = true;
        }
      } else {
        currentInterestAmount = invoice.interestSettings.interestAmount || 0;
      }
    }

    res.json({
      success: true,
      data: {
        interestSettings: invoice.interestSettings,
        interestHistory: invoice.interestHistory,
        totalInterestAccrued: invoice.totalInterestAccrued || 0,
        currentCalculation: {
          daysOverdue,
          dueAmount: invoice.dueAmount,
          currentInterestAmount,
          shouldRecalculate,
          isOverdue: daysOverdue > 0 && invoice.dueAmount > 0
        }
      }
    });

  } catch (error) {
    console.error("Get interest details error:", error);
    next(error);
  }
};

/**
 * Recalculate interest for an invoice (for daily updates)
 */
exports.recalculateInterest = async (req, res, next) => {
  try {
    const { CustomerInvoice: InvoiceModel } = await getAutoModels(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid invoice ID format"
      });
    }

    const invoice = await InvoiceModel.findById(id);
    if (!invoice) {
      return res.status(404).json({
        success: false,
        error: "Invoice not found"
      });
    }

    // Check if interest settings exist and are active
    if (!invoice.interestSettings || !invoice.interestSettings.isActive) {
      return res.status(400).json({
        success: false,
        error: "No active interest settings found for this invoice"
      });
    }

    const daysOverdue = calculateDaysOverdue(invoice.dueDate);
    const dueAmount = invoice.dueAmount || 0;
    const interestRate = invoice.interestSettings.interestRate;
    const minAmount = invoice.interestSettings.minAmount;

    // Check minimum amount condition
    if (dueAmount < minAmount) {
      return res.status(400).json({
        success: false,
        error: `Due amount (₹${dueAmount.toFixed(2)}) is less than minimum amount (₹${minAmount.toFixed(2)}). Interest not applicable.`
      });
    }

    // Calculate new interest amount
    const newInterestAmount = calculateInterestAmount(dueAmount, interestRate, daysOverdue);
    const previousInterestAmount = invoice.interestSettings.interestAmount || 0;
    const interestDifference = newInterestAmount - previousInterestAmount;

    // Update interest settings
    invoice.interestSettings.interestAmount = newInterestAmount;
    invoice.interestSettings.lastCalculatedAt = new Date();
    invoice.interestSettings.calculatedDays = daysOverdue;

    // Add to history for tracking daily changes (optional - can be too many entries)
    // Uncomment if you want to track daily recalculations
    /*
    invoice.interestHistory.push({
      calculatedAt: new Date(),
      interestRate,
      minAmount,
      interestAmount: newInterestAmount,
      daysOverdue,
      dueAmountAtCalculation: dueAmount,
      calculatedBy: req.user?._id,
      notes: `Daily recalculation - Interest updated from ₹${previousInterestAmount.toFixed(2)} to ₹${newInterestAmount.toFixed(2)}`
    });
    */

    // Update total interest accrued (add only the difference if not already counted)
    // invoice.totalInterestAccrued = (invoice.totalInterestAccrued || 0) + Math.max(0, interestDifference);

    await invoice.save();

    res.json({
      success: true,
      message: "Interest recalculated successfully",
      data: {
        previousInterest: previousInterestAmount,
        currentInterest: newInterestAmount,
        difference: interestDifference,
        daysOverdue,
        dueAmount,
        interestRate,
        recalculatedAt: new Date()
      }
    });

  } catch (error) {
    console.error("Recalculate interest error:", error);
    next(error);
  }
};

/**
 * Get all overdue invoices with interest calculations (for dashboard/report)
 */
exports.getOverdueInvoicesWithInterest = async (req, res, next) => {
  try {
    const { CustomerInvoice: InvoiceModel } = await getAutoModels(req);
    const { page = 1, limit = 20 } = req.query;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all overdue invoices (due date passed and due amount > 0)
    const filter = {
      dueDate: { $lt: today },
      dueAmount: { $gt: 0 },
      status: { $nin: ["paid", "cancelled"] }
    };

    const pageNum = Math.max(1, parseInt(page));
    const limitNum = Math.min(100, Math.max(1, parseInt(limit)));
    const skip = (pageNum - 1) * limitNum;

    const invoices = await InvoiceModel.find(filter)
      .populate("customerId", "name phone email")
      .populate("interestSettings.appliedBy", "firstName lastName")
      .sort({ dueDate: 1 })
      .skip(skip)
      .limit(limitNum);

    // Calculate current interest for each invoice
    const invoicesWithInterest = invoices.map(invoice => {
      const daysOverdue = calculateDaysOverdue(invoice.dueDate);
      let currentInterest = 0;
      let hasInterestSettings = false;
      let interestRate = null;
      let minAmount = null;

      if (invoice.interestSettings && invoice.interestSettings.isActive) {
        hasInterestSettings = true;
        interestRate = invoice.interestSettings.interestRate;
        minAmount = invoice.interestSettings.minAmount;

        if (invoice.dueAmount >= minAmount) {
          currentInterest = calculateInterestAmount(
            invoice.dueAmount,
            interestRate,
            daysOverdue
          );
        }
      }

      return {
        _id: invoice._id,
        invoiceNo: invoice.invoiceNo,
        customerId: invoice.customerId,
        dueAmount: invoice.dueAmount,
        dueDate: invoice.dueDate,
        daysOverdue,
        interestSettings: invoice.interestSettings,
        hasInterestSettings,
        interestRate,
        minAmount,
        currentInterest,
        grandTotal: invoice.grandTotal,
        status: invoice.status
      };
    });

    const total = await InvoiceModel.countDocuments(filter);

    // Calculate summary statistics
    const summary = {
      totalOverdueInvoices: total,
      totalOverdueAmount: invoicesWithInterest.reduce((sum, inv) => sum + inv.dueAmount, 0),
      totalInterestAccrued: invoicesWithInterest.reduce((sum, inv) => sum + inv.currentInterest, 0),
      invoicesWithInterestApplied: invoicesWithInterest.filter(inv => inv.hasInterestSettings).length,
      averageInterestRate: invoicesWithInterest
        .filter(inv => inv.interestRate)
        .reduce((sum, inv, _, arr) => sum + (inv.interestRate / arr.length), 0) || 0
    };

    res.json({
      success: true,
      data: {
        invoices: invoicesWithInterest,
        summary,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages: Math.ceil(total / limitNum)
        }
      }
    });

  } catch (error) {
    console.error("Get overdue invoices with interest error:", error);
    next(error);
  }
};

/**
 * Bulk apply interest to multiple overdue invoices
 */
exports.bulkApplyInterest = async (req, res, next) => {
  try {
    const { CustomerInvoice: InvoiceModel } = await getAutoModels(req);
    const { invoiceIds, interestRate, minAmount } = req.body;

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return res.status(400).json({
        success: false,
        error: "Please provide invoice IDs"
      });
    }

    const results = [];
    const errors = [];

    for (const id of invoiceIds) {
      try {
        if (!mongoose.Types.ObjectId.isValid(id)) {
          errors.push({ id, error: "Invalid invoice ID format" });
          continue;
        }

        const invoice = await InvoiceModel.findById(id);
        if (!invoice) {
          errors.push({ id, error: "Invoice not found" });
          continue;
        }

        const daysOverdue = calculateDaysOverdue(invoice.dueDate);
        const dueAmount = invoice.dueAmount || 0;

        if (daysOverdue <= 0) {
          errors.push({ id, error: "Invoice is not overdue" });
          continue;
        }

        if (dueAmount < minAmount) {
          errors.push({ id, error: `Due amount (₹${dueAmount.toFixed(2)}) is less than minimum amount (₹${minAmount.toFixed(2)})` });
          continue;
        }

        const interestAmount = calculateInterestAmount(dueAmount, interestRate, daysOverdue);

        // Update interest settings
        invoice.interestSettings = {
          interestRate: parseFloat(interestRate),
          minAmount: parseFloat(minAmount),
          interestAmount,
          lastCalculatedAt: new Date(),
          calculatedDays: daysOverdue,
          isActive: true,
          appliedBy: req.user?._id,
          appliedAt: new Date()
        };

        if (!invoice.interestHistory) invoice.interestHistory = [];
        invoice.interestHistory.push({
          calculatedAt: new Date(),
          interestRate: parseFloat(interestRate),
          minAmount: parseFloat(minAmount),
          interestAmount,
          daysOverdue,
          dueAmountAtCalculation: dueAmount,
          calculatedBy: req.user?._id,
          notes: "Bulk interest application"
        });

        invoice.totalInterestAccrued = (invoice.totalInterestAccrued || 0) + interestAmount;

        await invoice.save();

        results.push({
          id,
          invoiceNo: invoice.invoiceNo,
          interestAmount,
          success: true
        });

      } catch (err) {
        errors.push({ id, error: err.message });
      }
    }

    res.json({
      success: true,
      message: `Interest applied to ${results.length} out of ${invoiceIds.length} invoices`,
      data: {
        successful: results,
        failed: errors,
        summary: {
          totalProcessed: invoiceIds.length,
          successful: results.length,
          failed: errors.length,
          totalInterestAmount: results.reduce((sum, r) => sum + r.interestAmount, 0)
        }
      }
    });

  } catch (error) {
    console.error("Bulk apply interest error:", error);
    next(error);
  }
};

/**
 * Daily cron job to recalculate interest for all active interest invoices
 * Call this function from a scheduled job (node-cron)
 */
exports.dailyInterestRecalculation = async () => {
  try {
    const { CustomerInvoice: InvoiceModel } = await getAutoModels({ tenant: 'master' }); // Adjust for multi-tenant
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    // Find all invoices with active interest settings and still overdue
    const invoices = await InvoiceModel.find({
      "interestSettings.isActive": true,
      dueAmount: { $gt: 0 },
      dueDate: { $lt: today },
      status: { $nin: ["paid", "cancelled"] }
    });

    let updatedCount = 0;
    let totalInterestAdded = 0;

    for (const invoice of invoices) {
      const daysOverdue = calculateDaysOverdue(invoice.dueDate);
      const dueAmount = invoice.dueAmount || 0;
      const interestRate = invoice.interestSettings.interestRate;
      const minAmount = invoice.interestSettings.minAmount;

      if (dueAmount >= minAmount) {
        const newInterestAmount = calculateInterestAmount(dueAmount, interestRate, daysOverdue);
        const previousInterestAmount = invoice.interestSettings.interestAmount || 0;

        invoice.interestSettings.interestAmount = newInterestAmount;
        invoice.interestSettings.lastCalculatedAt = new Date();
        invoice.interestSettings.calculatedDays = daysOverdue;

        await invoice.save();
        updatedCount++;
        totalInterestAdded += Math.max(0, newInterestAmount - previousInterestAmount);
      }
    }

    // console.log(`Daily interest recalculation completed: ${updatedCount} invoices updated, total interest added: ₹${totalInterestAdded.toFixed(2)}`);

    return { updatedCount, totalInterestAdded };
  } catch (error) {
    console.error("Daily interest recalculation error:", error);
    return { error: error.message };
  }
};


// Add this function to your invoice controller
exports.getUnshippedInvoicesByCustomer = async (req, res) => {
  try {
    const { CustomerInvoice: InvoiceModel } = await getAutoModels(req);
    const { customerId } = req.params;

    // Validate customer ID
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({
        success: false,
        error: "Invalid customer ID format"
      });
    }

    const invoices = await InvoiceModel.find({
      customerId: customerId,
      shipmentNo: { $eq: null }, // Only invoices without shipment
      // Remove or modify the status filter - include draft invoices
      status: { $nin: ['cancelled'] } // Only exclude cancelled, include draft and others
    })
      .populate('customerId', 'name phone email address gstin city state country pincode')
      .sort({ createdAt: -1 });

    // console.log(`Found ${invoices.length} invoices for customer`);

    res.json({
      success: true,
      invoices: invoices
    });
  } catch (error) {
    console.error("Error fetching customer invoices:", error);
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
