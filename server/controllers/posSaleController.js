const mongoose = require('mongoose');
const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");

// Create new POS sale
const createPosSale = async (req, res) => {
  try {
    const { Customer: CustomerModel, Product: ProductModel, PosSale: PosSaleModel } = await getAutoModels(req);
    const {
      customerId,
      items,
      paymentMethod,
      amountReceived,
      changeReturned,
      bagCharge,
      additionalCharges,
      overallDiscount,
      subtotal,
      discount,
      tax,
      profit,
      totalAmount
    } = req.body;

    const pointsUsed = Number(req.body.pointsUsed || 0);
    if (isNaN(pointsUsed) || pointsUsed < 0) {
      return res.status(400).json({ message: 'Invalid pointsUsed value' });
    }

    // Validate required fields
    if (!customerId || !items || items.length === 0 || !paymentMethod) {
      return res.status(400).json({
        message: 'Missing required fields',
        details: {
          customerId: !customerId ? 'Customer ID is required' : 'OK',
          items: !items || items.length === 0 ? 'At least one item is required' : 'OK',
          paymentMethod: !paymentMethod ? 'Payment method is required' : 'OK'
        }
      });
    }

    // Validate customerId format
    if (!mongoose.Types.ObjectId.isValid(customerId)) {
      return res.status(400).json({ message: 'Invalid customer ID format' });
    }

    // Get customer details
    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      return res.status(404).json({ message: 'Customer not found' });
    }

    // Validate points usage against customer's available points
    if (pointsUsed > 0 && pointsUsed > (customer.availablePoints || 0)) {
      return res.status(400).json({ message: 'Insufficient points available to redeem' });
    }

    const normalizeSerialNumbers = (item) => {
      if (!item) return [];
      if (Array.isArray(item.serialNumbers)) {
        return item.serialNumbers
          .filter((s) => typeof s === 'string')
          .map((s) => s.trim())
          .filter(Boolean);
      }
      if (typeof item.serialNumber === 'string' && item.serialNumber.trim()) {
        return [item.serialNumber.trim()];
      }
      return [];
    };

    const seenSerialKeys = new Set();

    // Validate items structure
    for (const item of items) {
      if (!item.productId || !mongoose.Types.ObjectId.isValid(item.productId)) {
        return res.status(400).json({ message: 'Invalid product ID in items' });
      }
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({ message: 'Invalid quantity in items' });
      }
      if (item.variantId && !mongoose.Types.ObjectId.isValid(item.variantId)) {
        return res.status(400).json({ message: 'Invalid variantId in items' });
      }
      const serialNumbers = normalizeSerialNumbers(item);
      if (serialNumbers.length > 0) {
        if (serialNumbers.length !== Number(item.quantity)) {
          return res.status(400).json({
            message: 'Serialized items quantity must match selected serial numbers count',
          });
        }
        if (new Set(serialNumbers).size !== serialNumbers.length) {
          return res.status(400).json({ message: 'Duplicate serial numbers in an item' });
        }
        const variantKey = item.variantId ? String(item.variantId) : '';
        for (const sn of serialNumbers) {
          const key = `${String(item.productId)}:${variantKey}:${sn}`;
          if (seenSerialKeys.has(key)) {
            return res.status(400).json({ message: `Duplicate serial number in request: ${sn}` });
          }
          seenSerialKeys.add(key);
        }
      }
    }

    const getVariantFromProduct = (product, variantId) => {
      if (!product || !Array.isArray(product.variants) || product.variants.length === 0) return null;
      if (!variantId) return product.variants[0] || null;
      if (typeof product.variants.id === 'function') {
        return product.variants.id(variantId) || null;
      }
      return product.variants.find((v) => String(v._id) === String(variantId)) || null;
    };

    // Prepare items with product details (validate stock + serial presence, but don't mutate DB yet)
    const saleItems = [];
    for (const item of items) {
      const product = await ProductModel.findById(item.productId);
      if (!product) {
        return res.status(404).json({ message: `Product ${item.productId} not found` });
      }

      const variant = getVariantFromProduct(product, item.variantId);
      const variantQty = variant ? Number(variant.stockQuantity || 0) : 0;
      const productQty = Number(product.stockQuantity || 0);
      const serialNumbers = normalizeSerialNumbers(item);

      if (variant) {
        if (variantQty < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for ${product.productName}. Available: ${variantQty}`
          });
        }
        if (serialNumbers.length > 0) {
          const serials = Array.isArray(variant.serialNumbers) ? variant.serialNumbers : [];
          for (const sn of serialNumbers) {
            const exists = serials.some((s) => String(s) === String(sn));
            if (!exists) {
              return res.status(400).json({
                message: `Serial number not available for ${product.productName}: ${sn}`
              });
            }
          }
        }
      } else {
        if (productQty < item.quantity) {
          return res.status(400).json({
            message: `Insufficient stock for ${product.productName}. Available: ${productQty}`
          });
        }
      }

      saleItems.push({
        productId: item.productId,
        variantId: item.variantId || null,
        serialNumber: serialNumbers.length === 1 ? serialNumbers[0] : (item.serialNumber || null),
        serialNumbers: serialNumbers.length > 0 ? serialNumbers : undefined,
        status: 'Sold',
        productName: product.productName,
        quantity: item.quantity,
        unitPrice: item.sellingPrice,
        totalPrice: item.totalPrice,
        discount: item.discountValue || 0,
        discountType: item.discountType || 'Fixed',
        tax: item.tax || 0,
        profit: (() => {
          const purchasePrice = variant
            ? Number(variant.purchasePrice || variant.costPrice || 0)
            : Number(product.purchasePrice || product.costPrice || 0);
          const sellingPrice = Number(item.sellingPrice || 0);
          const qty = Number(item.quantity || 0);
          const itemDiscount = Number(item.discountValue || 0);
          const discountPerUnit = item.discountType === 'Percentage'
            ? (sellingPrice * itemDiscount) / 100
            : itemDiscount;
          const effectiveSelling = sellingPrice - discountPerUnit;
          return Number((effectiveSelling - purchasePrice) * qty).toFixed(2) * 1;
        })(),
        unit: product.unit || 'pcs',
        images: (Array.isArray(product.images)
          ? product.images
            .map(img => (typeof img === 'string' ? img : img?.url))
            .filter(Boolean)
          : [])
      });
    }

    // Validate payment method
    if (!paymentMethod || !['Cash', 'Card', 'UPI'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid payment method' });
    }

    // Validate totals data
    if (typeof subtotal !== 'number' || subtotal < 0) {
      return res.status(400).json({ message: 'Invalid subtotal value' });
    }
    if (typeof totalAmount !== 'number' || totalAmount < 0) {
      return res.status(400).json({ message: 'Invalid total amount value' });
    }

    const parsedAdditionalCharges = Array.isArray(additionalCharges)
      ? additionalCharges
        .filter((c) => c && c.name)
        .map((c) => ({
          name: String(c.name),
          amount: Number(c.amount || 0),
        }))
        .filter((c) => !isNaN(c.amount) && c.amount > 0)
      : [];

    const additionalChargesTotal = parsedAdditionalCharges.reduce(
      (sum, c) => sum + (c.amount || 0),
      0,
    );

    const rawProfit = saleItems.reduce((sum, i) => sum + Number(i.profit || 0), 0);

    const totalProfit = Number(
      (rawProfit + Number(bagCharge || 0) + additionalChargesTotal - Number(overallDiscount || 0)).toFixed(2)
    );

    // Ensure all numeric values are numbers
    const numericFields = {
      subtotal: Number(subtotal),
      discount: Number(discount || 0),
      overallDiscount: Number(overallDiscount || 0),
      tax: Number(tax || 0),
      profit: totalProfit,
      bagCharge: Number(bagCharge || 0),
      totalAmount: Number(totalAmount),
      totalProfit,
    };

    // Validate numeric conversion
    for (const [field, value] of Object.entries(numericFields)) {
      if (isNaN(value)) {
        return res.status(400).json({ message: `Invalid ${field} value: not a number` });
      }
    }

    // Calculate due amount
    const dueAmount = Math.max(0, numericFields.totalAmount - (amountReceived || 0));
    const saleStatus = dueAmount > 0 ? 'Due' : 'Paid';

    // Create sale record
    const saleData = {
      customer: {
        customerId: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email
      },
      items: saleItems,
      additionalCharges: parsedAdditionalCharges,
      paymentDetails: {
        paymentMethod,
        amountReceived: amountReceived || 0,
        changeReturned: changeReturned || 0,
        bagCharge: bagCharge || 0,
        dueAmount: dueAmount
      },
      totals: {
        subtotal: numericFields.subtotal,
        discount: numericFields.discount,
        overallDiscount: numericFields.overallDiscount,
        tax: numericFields.tax,
        profit: numericFields.profit,
        bagCharge: numericFields.bagCharge,
        additionalCharges: additionalChargesTotal,
        totalAmount: numericFields.totalAmount,
        totalProfit: numericFields.totalProfit,
      },
      pointsUsed,
      saleDate: new Date(),
      status: saleStatus,
      createdBy: req.user && req.user._id ? req.user._id : null
    };

    // Remove any undefined values that might cause save issues
    Object.keys(saleData).forEach(key => {
      if (saleData[key] === undefined) {
        delete saleData[key];
      }
    });

    // Validate required fields are present
    const requiredFields = ['customer', 'items', 'paymentDetails', 'totals'];
    for (const field of requiredFields) {
      if (!saleData[field]) {
        // console.error(`Missing required field: ${field}`);
        return res.status(400).json({
          message: `Missing required field: ${field}`,
          details: `Field ${field} is required but not provided`
        });
      }
    }

    // Generate invoice number directly in controller
    // Generate invoice number: INV + YYYY + MM + 3-digit monthly index
    // e.g. INV202606001
    try {
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      const prefix = `INV${year}${month}`; // e.g. INV202606

      // Count only this month's invoices for the sequential index
      const monthlyCount = await PosSaleModel.countDocuments({
        invoiceNumber: { $regex: `^${prefix}` }
      });

      let invoiceNumber = `${prefix}${String(monthlyCount + 1).padStart(3, "0")}`;

      // Race condition guard: if this number already exists, keep incrementing
      let attempts = 0;
      while (attempts < 10) {
        const exists = await PosSaleModel.findOne({ invoiceNumber });
        if (!exists) break;
        invoiceNumber = `${prefix}${String(monthlyCount + attempts + 2).padStart(3, "0")}`;
        attempts++;
      }

      saleData.invoiceNumber = invoiceNumber;
    } catch (error) {
      // Fallback keeps the format but uses timestamp-based index
      const now = new Date();
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, "0");
      saleData.invoiceNumber = `INV${year}${month}${Date.now()}`;
    }

    let posSale;
    try {
      posSale = new PosSaleModel(saleData);
    } catch (modelError) {
      return res.status(500).json({
        message: 'Error creating sale model',
        error: modelError.message,
        details: 'Failed to create PosSale document instance'
      });
    }

    try {
      const validationError = posSale.validateSync();
      if (validationError) {
        return res.status(400).json({
          message: 'Validation error',
          error: validationError.message,
          details: validationError.errors
        });
      }

      let savedSale;
      try {
        savedSale = await posSale.save();
      } catch (err) {
        if (err && err.code === 11000 && err.keyPattern && err.keyPattern.invoiceNumber) {
          posSale.invoiceNumber = `INV${Date.now()}${Math.floor(Math.random() * 10000)}`;
          savedSale = await posSale.save();
        } else {
          throw err;
        }
      }

      // After successful sale, update stockQuantity and remove serialNumbers (if any)
      for (const item of items) {
        const product = await ProductModel.findById(item.productId);
        if (!product) continue;

        const variant = getVariantFromProduct(product, item.variantId);
        const serialNumbers = normalizeSerialNumbers(item);

        if (variant) {
          variant.stockQuantity = Math.max(
            0,
            (Number(variant.stockQuantity) || 0) - Number(item.quantity || 0),
          );
          if (serialNumbers.length > 0) {
            const serials = Array.isArray(variant.serialNumbers)
              ? variant.serialNumbers
              : [];
            const removeSet = new Set(serialNumbers.map((s) => String(s)));
            variant.serialNumbers = serials.filter((s) => !removeSet.has(String(s)));
          }
          await product.save();
        } else {
          await ProductModel.findByIdAndUpdate(item.productId, {
            $inc: { stockQuantity: -Number(item.quantity || 0) }
          });
        }
      }

      if (pointsUsed > 0) {
        try {
          await customer.redeemPoints(pointsUsed);
        } catch (pointsError) { }
      }

      res.status(201).json({
        success: true,
        message: 'Sale recorded successfully',
        data: savedSale
      });
    } catch (saveError) {

      return res.status(500).json({
        message: saveError && saveError.code === 11000 ? 'Duplicate invoice number' : 'Error saving sale record',
        error: saveError.message,
        details: saveError.errors || saveError.message
      });
    }

  } catch (error) {
    console.error('FULL ERROR:', error); // <-- add this
    res.status(500).json({ message: 'Internal server error', error: error.message });

  }
};

// Get all POS sales with pagination
const getPosSales = async (req, res) => {
  try {
    const { PosSale: PosSaleModel } = await getAutoModels(req);
    // One-time migration: Update any existing "Completed" status to "Paid"
    try {
      await PosSaleModel.updateMany(
        { status: 'Completed' },
        { status: 'Paid' }
      );
    } catch (migrationError) {
      // console.log('Migration completed or no records to update');
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    // Build filter object
    const filter = {};
    if (req.query.status) filter.status = req.query.status;
    if (req.query.paymentMethod) filter['paymentDetails.paymentMethod'] = req.query.paymentMethod;
    if (req.query.customerId) filter['customer.customerId'] = req.query.customerId;
    if (req.query.startDate && req.query.endDate) {
      filter.saleDate = {
        $gte: new Date(req.query.startDate),
        $lte: new Date(req.query.endDate)
      };
    }

    // Handle search functionality
    if (req.query.search && req.query.search.trim()) {
      const searchTerm = req.query.search.trim();
      const searchRegex = new RegExp(searchTerm, 'i');

      filter.$or = [
        { invoiceNumber: searchRegex },
        { 'customer.name': searchRegex },
        { 'customer.phone': searchRegex },
        { 'items.productName': searchRegex }
      ];
    }

    // Get total count
    const totalSales = await PosSaleModel.countDocuments(filter);
    const totalPages = Math.ceil(totalSales / limit);

    // Get sales with pagination
    const sales = await PosSaleModel.find(filter)
      .populate('customer.customerId', 'name phone email')
      .populate({
        path: 'items.productId',
        select: 'productName images itemBarcode variants costPrice supplier',
        populate: {
          path: 'category',
          select: 'categoryName',
        },
      })
      .populate('createdBy', 'name email')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      data: sales,
      pagination: {
        currentPage: page,
        totalPages,
        totalSales,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });

  } catch (error) {
    // console.error('Error fetching POS sales:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get single POS sale by ID
const getPosSaleById = async (req, res) => {
  try {
    const { PosSale: PosSaleModel } = await getAutoModels(req);
    const sale = await PosSaleModel.findById(req.params.id)
      .populate('customer.customerId', 'name phone email address')
      .populate('items.productId', 'productName images category unit');

    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    res.status(200).json({
      success: true,
      data: sale
    });

  } catch (error) {
    // console.error('Error fetching POS sale:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

// Get sales summary/statistics
const getSalesSummary = async (req, res) => {
  try {
    const { PosSale: PosSaleModel } = await getAutoModels(req);
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todaySales = await PosSaleModel.find({
      saleDate: { $gte: startOfDay, $lte: endOfDay }
    });

    const totalSales = todaySales.length;
    const totalRevenue = todaySales.reduce((sum, sale) => sum + sale.totals.totalAmount, 0);
    const totalItems = todaySales.reduce((sum, sale) =>
      sum + sale.items.reduce((itemSum, item) => itemSum + item.quantity, 0), 0
    );

    res.status(200).json({
      success: true,
      data: {
        totalSales,
        totalRevenue,
        totalItems,
        averageOrderValue: totalSales > 0 ? totalRevenue / totalSales : 0
      }
    });

  } catch (error) {
    // console.error('Error fetching sales summary:', error);
    res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const getPosSaleByInvoiceNumber = async (req, res) => {
  try {
    const { PosSale: PosSaleModel } = await getAutoModels(req);
    const invoiceNumber = String(req.params.invoiceNumber || '').trim();
    if (!invoiceNumber) {
      return res.status(400).json({ message: 'Invoice number is required' });
    }
    const sale = await PosSaleModel.findOne({ invoiceNumber });
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }
    return res.status(200).json({ success: true, data: sale });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports = {
  createPosSale,
  getPosSales,
  getPosSaleById,
  getSalesSummary,
  getPosSaleByInvoiceNumber
};
