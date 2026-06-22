const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");
const cloudinary = require("../utils/cloudinary/cloudinary");
const mongoose = require("mongoose");

exports.createCustomer = async (req, res, next) => {
  try {
    const { Customer: CustomerModel } = await getAutoModels(req);
    const {
      name,
      phone,
      email,
      gstin,
      address,
      country,
      state,
      city,
      pincode,
    } = req.body;

    if (!name || !phone) {
      return res.status(400).json({ error: "Name and Phone are required" });
    }

    const { Customer } = await getAutoModels(req);

    const phoneExists = await Customer.findOne({ phone });
    if (phoneExists) {
      return res.status(400).json({
        errors: {
          phone: "Phone number already exists"
        }
      });
    }

    if (email) {
      const emailExists = await CustomerModel.findOne({ email });
      if (emailExists) {
        return res.status(400).json({
          errors: {
            email: "Email already exists"
          }
        });
      }
    }

    const customer = new CustomerModel({
      name,
      phone,
      email,
      gstin,
      address,
      country,
      state,
      city,
      pincode,
      isDeleted: false,
    });

    await customer.save();

    res.status(201).json(customer);
  } catch (err) {
    // res.status(500).json({ error: err.message });
    next(err);
  }
};

// Get customer statistics (points, total spent, due amounts)
exports.getCustomerStatistics = async (req, res, next) => {
  try {
    const { Customer: CustomerModel } = await getAutoModels(req);
    const customerId = req.params.id;

    const { Customer, CustomerInvoice } = await getAutoModels(req);

    // Get customer with all fields
    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Get all invoices for this customer in one query with aggregation
    const invoiceStats = await CustomerInvoice.aggregate([
      {
        $match: {
          customerId: new mongoose.Types.ObjectId(customerId),
          status: { $ne: "draft" },
        },
      },
      {
        $facet: {
          // Calculate total due amount
          totalDueAmount: [
            {
              $group: {
                _id: null,
                total: { $sum: "$dueAmount" },
              },
            },
          ],
          // Count unpaid invoices
          unpaidInvoices: [
            {
              $match: { dueAmount: { $gt: 0 } },
            },
            {
              $count: "count",
            },
          ],
          // Count overdue invoices
          overdueInvoices: [
            {
              $match: {
                dueAmount: { $gt: 0 },
                dueDate: { $lt: new Date() },
              },
            },
            {
              $count: "count",
            },
          ],
          // Get invoice status counts
          statusCounts: [
            {
              $group: {
                _id: "$status",
                count: { $sum: 1 },
              },
            },
          ],
          // Get all invoices for recent purchases
          allInvoices: [
            {
              $sort: { invoiceDate: -1 },
            },
            {
              $limit: 50,
            },
            {
              $project: {
                _id: 1,
                invoiceNo: 1,
                invoiceDate: 1,
                grandTotal: 1,
                dueAmount: 1,
                status: 1,
                dueDate: 1,
                paidAmount: 1,
              },
            },
          ],
        },
      },
    ]);

    const stats = invoiceStats[0];

    // Extract values with defaults
    const totalDueAmount = stats.totalDueAmount[0]?.total || 0;
    const unpaidInvoices = stats.unpaidInvoices[0]?.count || 0;
    const overdueInvoices = stats.overdueInvoices[0]?.count || 0;
    const allInvoices = stats.allInvoices || [];

    // Create status count map
    const statusCounts = {};
    stats.statusCounts?.forEach((item) => {
      statusCounts[item._id] = item.count;
    });

    // Get recent purchases (last 5)
    const recentInvoices = allInvoices.slice(0, 5);

    // Update customer's totalDueAmount in database if different
    if (customer.totalDueAmount !== totalDueAmount) {
      customer.totalDueAmount = totalDueAmount;
      await customer.save();
    }

    // Calculate first purchase date (earliest invoice)
    let firstPurchaseDate = null;
    if (allInvoices.length > 0) {
      const sortedByDate = [...allInvoices].sort(
        (a, b) => new Date(a.invoiceDate) - new Date(b.invoiceDate),
      );
      firstPurchaseDate = sortedByDate[0].invoiceDate;
    }

    // Format response
    const response = {
      customer: {
        _id: customer._id,
        name: customer.name,
        phone: customer.phone,
        email: customer.email,
        address: customer.address,
        city: customer.city,
        state: customer.state,
        pincode: customer.pincode,
      },
      statistics: {
        // Points info (from customer model)
        availablePoints: customer.availablePoints || 0,
        totalPointsEarned: customer.totalPointsEarned || 0,
        totalPointsRedeemed: customer.totalPointsRedeemed || 0,
        loyaltyTier: customer.loyaltyTier || "regular",

        // Purchase stats (from customer model)
        totalPurchases: customer.totalPurchases || 0,
        totalPurchaseAmount: customer.totalPurchaseAmount || 0,
        averageOrderValue: customer.averageOrderValue || 0,

        // First & last purchase dates
        firstPurchaseDate: firstPurchaseDate,
        lastPurchaseDate: customer.lastPurchaseDate || null,

        // Calculated due amounts (from invoices)
        totalDueAmount: totalDueAmount,
        unpaidInvoices: unpaidInvoices,
        overdueInvoices: overdueInvoices,

        // Calculated point values
        pointValue: 10, // 1 point = ₹10
        redeemableValue: (customer.availablePoints || 0) * 10,

        // Loyalty tier benefits (example)
        tierBenefits: getTierBenefits(customer.loyaltyTier),
      },
      recentPurchases: recentInvoices.map((invoice) => ({
        _id: invoice._id,
        invoiceNo: invoice.invoiceNo,
        date: invoice.invoiceDate,
        totalAmount: invoice.grandTotal,
        paidAmount: invoice.paidAmount || 0,
        dueAmount: invoice.dueAmount || 0,
        status: invoice.status,
        dueDate: invoice.dueDate,
        isOverdue:
          invoice.dueAmount > 0 && new Date(invoice.dueDate) < new Date(),
        isPartiallyPaid: invoice.status === "partial",
      })),
      summary: {
        totalInvoices: allInvoices.length,
        paidInvoices: statusCounts.paid || 0,
        partialInvoices: statusCounts.partial || 0,
        draftInvoices: statusCounts.draft || 0,
        overdueInvoices: overdueInvoices,
        totalAmountOwed: totalDueAmount,
      },
    };

    res.json(response);
  } catch (err) {
    // console.error("Get customer statistics error:", err);
    // res.status(500).json({ error: err.message });
    next(err);
  }
};

// Helper function for tier benefits
function getTierBenefits(tier) {
  const benefits = {
    regular: {
      pointsMultiplier: 1,
      discountPercentage: 0,
      freeShippingThreshold: 5000,
    },
    silver: {
      pointsMultiplier: 1.05, // 5% extra points
      discountPercentage: 2,
      freeShippingThreshold: 3000,
    },
    gold: {
      pointsMultiplier: 1.1, // 10% extra points
      discountPercentage: 5,
      freeShippingThreshold: 2000,
    },
    platinum: {
      pointsMultiplier: 1.15, // 15% extra points
      discountPercentage: 8,
      freeShippingThreshold: 1000,
    },
  };

  return benefits[tier] || benefits.regular;
}

exports.updateCustomer = async (req, res, next) => {
  try {
    const { Customer: CustomerModel } = await getAutoModels(req);
    const { email, phone } = req.body;

    const { Customer } = await getAutoModels(req);

    // Check if phone is being changed and already exists
    if (phone) {
      const existingPhone = await CustomerModel.findOne({
        phone,
        _id: { $ne: req.params.id },
      });
      if (existingPhone) {
        return res.status(400).json({
          errors: {
            phone: "Phone number already exists"
          }
        });
      }
    }

    // Check if email is being changed and already exists
    if (email) {
      const existingEmail = await CustomerModel.findOne({
        email,
        _id: { $ne: req.params.id },
      });
      if (existingEmail) {
        return res
          .status(400)
          .json({ error: "Email already in use by another customer" });
      }
    }

    const customer = await CustomerModel.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    res.json(customer);
  } catch (err) {
    // res.status(500).json({ error: err.message });
    next(err);
  }
};

exports.getAllCustomers = async (req, res, next) => {
  try {
    const { Customer, CustomerInvoice } = await getAutoModels(req);
    const { startDate, endDate } = req.query;
    let query = {};
    // Add date filter for customer creation date
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      };
    }
    const customers = await Customer.find(query).sort({ createdAt: -1 });
    // Get due amounts for all customers in a single query (more efficient)
    const customerIds = customers.map((c) => c._id);

    // Aggregate invoices to get total due amount per customer
    const invoiceAggregation = await CustomerInvoice.aggregate([
      {
        $match: {
          customerId: { $in: customerIds },
          status: { $nin: ["cancelled"] },
        },
      },
      {
        $group: {
          _id: "$customerId",
          totalDueAmount: { $sum: "$dueAmount" },
          totalAdvanceAmount: { $sum: "$advanceAmount" }, // Use the existing advanceAmount field
          totalPaidAmount: { $sum: "$paidAmount" },
          totalGrandTotal: { $sum: "$grandTotal" },
          invoiceCount: { $sum: 1 },
        },
      },
    ]);

    // Create a map for quick lookup
    const dueAmountMap = {};
    invoiceAggregation.forEach((item) => {
      // Calculate balance (advance - due)
      const balance = item.totalAdvanceAmount - item.totalDueAmount;
      // Determine customer type
      let customerType = "normal";
      if (balance < 0) {
        customerType = "due";
      } else if (balance > 0) {
        customerType = "advance";
      }

      dueAmountMap[item._id.toString()] = {
        totalDueAmount: item.totalDueAmount || 0,
        totalAdvanceAmount: item.totalAdvanceAmount || 0,
        totalPaidAmount: item.totalPaidAmount || 0,
        totalPurchaseAmount: item.totalGrandTotal || 0,
        balance: balance,
        customerType: customerType, // Add customer type for filtering
        invoiceCount: item.invoiceCount || 0,
      };
    });

    // Add due amount to each customer
    const customersWithDueAmount = customers.map((customer) => {
      const dueInfo = dueAmountMap[customer._id.toString()] || {
        totalDueAmount: 0,
        totalAdvanceAmount: 0,
        totalPaidAmount: 0,
        totalPurchaseAmount: 0,
        balance: 0,
        customerType: "normal",
        invoiceCount: 0,
      };

      return {
        ...customer.toObject(),
        totalDueAmount: dueInfo.totalDueAmount,
        totalAdvanceAmount: dueInfo.totalAdvanceAmount,
        totalPaidAmount: dueInfo.totalPaidAmount,
        totalPurchaseAmount: dueInfo.totalPurchaseAmount,
        balance: dueInfo.balance,
        customerType: dueInfo.customerType,
        totalInvoiceCount: dueInfo.invoiceCount,
      };
    });

    res.json(customersWithDueAmount);
  } catch (err) {
    // console.error("Get all customers error:", err);
    // res.status(500).json({ error: err.message });
    next(err);
  }
};

exports.getFilteredCustomersByType = async (req, res, next) => {
  try {
    const { Customer: CustomerModel, CustomerInvoice: CustomerInvoiceModel } = await getAutoModels(req);

    const { type = "all", search = "", startDate, endDate } = req.query;
    let query = {};
    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate)
      }
    }


    // console.log(`Fetching customers with type: ${type}, search: ${search}`);

    // First get all customers
    const customers = await CustomerModel.find(query).sort({ createdAt: -1 });
    const customerIds = customers.map((c) => c._id);

    // Get financial data for all customers in one query
    const invoiceAggregation = await CustomerInvoiceModel.aggregate([
      {
        $match: {
          customerId: { $in: customerIds },
          status: { $nin: ["cancelled"] },
        },
      },
      {
        $group: {
          _id: "$customerId",
          totalDueAmount: { $sum: "$dueAmount" },
          totalAdvanceAmount: { $sum: "$advanceAmount" },
          totalPaidAmount: { $sum: "$paidAmount" },
          totalGrandTotal: { $sum: "$grandTotal" },
          invoiceCount: { $sum: 1 },
        },
      },
    ]);

    // Create dueAmountMap - KEEPING YOUR NAME
    const dueAmountMap = {};
    invoiceAggregation.forEach((item) => {
      const balance = item.totalAdvanceAmount - item.totalDueAmount;
      let customerType = "normal";

      if (balance < 0) {
        customerType = "due";
      } else if (balance > 0) {
        customerType = "advance";
      }

      dueAmountMap[item._id.toString()] = {
        totalDueAmount: item.totalDueAmount || 0,
        totalAdvanceAmount: item.totalAdvanceAmount || 0,
        totalPaidAmount: item.totalPaidAmount || 0,
        totalPurchaseAmount: item.totalGrandTotal || 0,
        balance: balance,
        customerType: customerType,
        invoiceCount: item.invoiceCount || 0,
      };
    });

    // Combine customer data with financial data
    let combinedCustomers = customers.map((customer) => {
      const dueInfo = dueAmountMap[customer._id.toString()] || {
        totalDueAmount: 0,
        totalAdvanceAmount: 0,
        totalPaidAmount: 0,
        totalPurchaseAmount: 0,
        balance: 0,
        customerType: "normal",
        invoiceCount: 0,
      };

      return {
        ...customer.toObject(),
        totalDueAmount: dueInfo.totalDueAmount,
        totalAdvanceAmount: dueInfo.totalAdvanceAmount,
        totalPaidAmount: dueInfo.totalPaidAmount,
        totalPurchaseAmount: dueInfo.totalPurchaseAmount,
        balance: dueInfo.balance,
        customerType: dueInfo.customerType,
        totalInvoiceCount: dueInfo.invoiceCount,
        availablePoints: customer.availablePoints || 0,
      };
    });

    // Apply type filter
    let filteredCustomers = [];

    if (type === "all") {
      // Show only customers with dues OR advance (exclude normal)
      filteredCustomers = combinedCustomers.filter(
        (c) => c.customerType === "due" || c.customerType === "advance",
      );
    } else if (type === "due") {
      filteredCustomers = combinedCustomers.filter(
        (c) => c.customerType === "due",
      );
    } else if (type === "advance") {
      filteredCustomers = combinedCustomers.filter(
        (c) => c.customerType === "advance",
      );
    } else {
      filteredCustomers = combinedCustomers;
    }

    // Apply search filter
    if (search.trim()) {
      const searchLower = search.toLowerCase();
      filteredCustomers = filteredCustomers.filter(
        (customer) =>
          customer.name?.toLowerCase().includes(searchLower) ||
          customer.phone?.includes(search) ||
          customer.email?.toLowerCase().includes(searchLower),
      );
    }

    // Calculate summary
    const summary = {
      totalCustomers: filteredCustomers.length,
      totalDue: filteredCustomers.reduce((sum, c) => sum + c.totalDueAmount, 0),
      totalAdvance: filteredCustomers.reduce(
        (sum, c) => sum + c.totalAdvanceAmount,
        0,
      ),
      totalSpent: filteredCustomers.reduce(
        (sum, c) => sum + c.totalPurchaseAmount,
        0,
      ),
      totalBalance: filteredCustomers.reduce((sum, c) => sum + c.balance, 0),
    };

    // Calculate tab counts for All, Due, Advance
    const dueCustomers = combinedCustomers.filter(
      (c) => c.customerType === "due",
    );
    const advanceCustomers = combinedCustomers.filter(
      (c) => c.customerType === "advance",
    );
    const allNonNormalCustomers = combinedCustomers.filter(
      (c) => c.customerType === "due" || c.customerType === "advance",
    );

    const tabCounts = {
      all: allNonNormalCustomers.length,
      due: dueCustomers.length,
      advance: advanceCustomers.length,
    };

    res.json({
      success: true,
      customers: filteredCustomers,
      summary,
      tabCounts,
      filter: {
        type,
        search,
      },
    });
  } catch (err) {
    // console.error("Get filtered customers error:", err);
    // res.status(500).json({
    //   success: false,
    //   error: "Failed to fetch filtered customers",
    //   message: err.message,
    // });
    next(err);
  }
};

exports.getCustomerById = async (req, res, next) => {
  try {
    const { Customer } = await getAutoModels(req);

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json(customer);
  } catch (err) {
    // res.status(500).json({ error: err.message });
    next(err);
  }
};

exports.deleteCustomer = async (req, res, next) => {
  try {
    const { Customer } = await getAutoModels(req);

    const customer = await Customer.findByIdAndUpdate(req.params.id, { isDeleted: true });
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    res.json({ message: "Customer deleted successfully" });
  } catch (err) {
    // res.status(500).json({ error: err.message });
    next(err);
  }
};

exports.getCustomerPoints = async (req, res, next) => {
  try {
    const { Customer } = await getAutoModels(req);

    const customer = await Customer.findById(req.params.id);

    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    let pointValue = 10; // Default
    const { RewardSystem: RewardSystemModel } = await getAutoModels(req);
    const activeReward = await RewardSystemModel.findOne({
      rewardType: "Shopping Points",
      status: "active",
      deadline: { $gte: new Date() },
      isDelete: false
    });
    if (activeReward && activeReward.pointValue) {
      pointValue = activeReward.pointValue;
    }
    const redeemableValue = (customer.availablePoints || 0) * pointValue;

    res.json({
      success: true,
      customer: {
        ...customer.toObject(),
        redeemableValue,
        pointValue: POINT_VALUE,
      },
    });
  } catch (err) {
    // console.error("Get customer points error:", err);
    // res.status(500).json({ error: err.message });
    next(err);
  }
};

exports.addManualPoints = async (req, res, next) => {
  try {
    const { points, reason } = req.body;

    if (!points || points <= 0) {
      return res.status(400).json({ error: "Valid points required" });
    }

    const { Customer } = await getAutoModels(req);

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }

    // Add points using the schema method
    await customer.addPoints(points, reason || "Manual adjustment");

    res.json({
      success: true,
      message: `${points} points added to ${customer.name}`,
      customer: {
        name: customer.name,
        phone: customer.phone,
        availablePoints: customer.availablePoints,
        totalPointsEarned: customer.totalPointsEarned,
      },
    });
  } catch (err) {
    // console.error("Add manual points error:", err);
    // res.status(500).json({ error: err.message });
    next(err);
  }
};

exports.getPointsHistory = async (req, res, next) => {
  try {
    const customerId = req.params.id;
    const { limit = 50 } = req.query;

    const { CustomerInvoice } = await getAutoModels(req);

    // Get invoices for this customer
    const invoices = await CustomerInvoice.find({
      customerId,
      status: { $ne: "draft" },
    })
      .select(
        "invoiceNo invoiceDate grandTotal shoppingPointsUsed paidAmount status dueDate",
      )
      .sort({ invoiceDate: -1 })
      .limit(parseInt(limit));

    const POINTS_RATE = 10; // 1 point per ₹10 spent
    const history = invoices.map((invoice) => {
      const pointsEarned =
        invoice.paidAmount > 0
          ? Math.floor(invoice.paidAmount / POINTS_RATE)
          : 0;

      return {
        date: invoice.invoiceDate,
        invoiceNo: invoice.invoiceNo,
        purchaseAmount: invoice.grandTotal,
        paidAmount: invoice.paidAmount,
        pointsEarned: pointsEarned,
        pointsRedeemed: invoice.shoppingPointsUsed || 0,
        netPoints: pointsEarned - (invoice.shoppingPointsUsed || 0),
        status: invoice.status,
        dueDate: invoice.dueDate,
        isOverdue: invoice.dueDate && new Date(invoice.dueDate) < new Date(),
        type: "purchase",
      };
    });

    // Get customer info
    const customer = await Customer.findById(customerId).select(
      "name phone availablePoints totalPointsEarned totalPointsRedeemed",
    );

    res.json({
      success: true,
      customer: customer,
      history,
      summary: {
        totalTransactions: history.length,
        totalPointsEarned: history.reduce(
          (sum, item) => sum + item.pointsEarned,
          0,
        ),
        totalPointsRedeemed: history.reduce(
          (sum, item) => sum + item.pointsRedeemed,
          0,
        ),
        totalNetPoints: customer.availablePoints,
      },
    });
  } catch (err) {
    // console.error("Get points history error:", err);
    // res.status(500).json({ error: err.message });
    next(err);
  }
};

exports.redeemPoints = async (req, res, next) => {
  try {
    const { points } = req.body;

    const { Customer } = await getAutoModels(req);

    const customer = await Customer.findById(req.params.id);
    if (!customer) {
      return res.status(404).json({ error: "Customer not found" });
    }
    const pts = Number(points || 0);
    if (isNaN(pts) || pts <= 0) {
      return res.status(400).json({ error: "Valid points required" });
    }
    if (pts > (customer.availablePoints || 0)) {
      return res.status(400).json({ error: "Insufficient points" });
    }
    await customer.redeemPoints(pts);
    res.json({
      success: true,
      message: `${pts} points redeemed for ${customer.name}`,
      customer: {
        _id: customer._id,
        name: customer.name,
        availablePoints: customer.availablePoints,
        totalPointsRedeemed: customer.totalPointsRedeemed,
        lastPointsRedeemedDate: customer.lastPointsRedeemedDate,
      },
    });
  } catch (err) {
    // res.status(500).json({ error: err.message });
    next(err);
  }
};

exports.updateCustomerDueAmount = async (req, customerId) => {
  try {
    const { CustomerInvoice, Customer: CustomerModel } = await getAutoModels(req);

    const invoiceStats = await CustomerInvoice.aggregate([
      {
        $match: {
          customerId: new mongoose.Types.ObjectId(customerId),
          status: { $ne: "draft" },
        },
      },
      {
        $group: {
          _id: null,
          totalDueAmount: { $sum: "$dueAmount" },
          totalAdvanceAmount: { $sum: "$advanceAmount" }, // Add this
          totalPaidAmount: { $sum: "$paidAmount" },
          totalGrandTotal: { $sum: "$grandTotal" },
        },
      },
    ]);
    const stats = invoiceStats[0] || {};
    const totalDueAmount = stats.totalDueAmount || 0;
    const totalAdvanceAmount = stats.totalAdvanceAmount || 0; // Get advance amount
    const totalPaidAmount = stats.totalPaidAmount || 0;
    const totalPurchaseAmount = stats.totalGrandTotal || 0;

    const balance = totalAdvanceAmount - totalDueAmount;
    let customerType = "normal";

    if (balance < 0) {
      customerType = "due";
    } else if (balance > 0) {
      customerType = "advance";
    }

    await CustomerModel.findByIdAndUpdate(customerId, {
      totalDueAmount,
      totalAdvanceAmount, // Add this
      totalPaidAmount,
      totalPurchaseAmount,
      balance,
      customerType, // Add customer type
    });

    return {
      totalDueAmount,
      totalAdvanceAmount,
      totalPaidAmount,
      totalPurchaseAmount,
      balance,
      customerType,
    };
  } catch (err) {
    // console.error("Error updating customer due amount:", err);
    throw err;
  }
};

exports.recalculateCustomerDue = async (req, res, next) => {
  try {
    const customerId = req.params.id;

    const { Customer } = await getAutoModels(req);

    // Check if customer exists
    const customer = await CustomerModel.findById(customerId);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found",
      });
    }

    // Recalculate due amount using the helper function
    const totalDueAmount = await exports.updateCustomerDueAmount(customerId);

    res.json({
      success: true,
      message: "Customer due amount recalculated successfully",
      totalDueAmount,
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        totalDueAmount: totalDueAmount,
      },
    });
  } catch (err) {
    // console.error("Recalculate customer due error:", err);
    // res.status(500).json({
    //   success: false,
    //   error: "Failed to recalculate due amount",
    //   message: err.message,
    // });
    next(err);
  }
};

exports.getCustomerPoints = async (req, res, next) => {
  try {
    const { Customer: CustomerModel } = await getAutoModels(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid customer ID format"
      });
    }

    const customer = await CustomerModel.findById(id).select('availablePoints totalPointsEarned totalPointsRedeemed');

    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found"
      });
    }

    res.json({
      success: true,
      customer: {
        availablePoints: customer.availablePoints || 0,
        totalPointsEarned: customer.totalPointsEarned || 0,
        totalPointsRedeemed: customer.totalPointsRedeemed || 0
      }
    });
  } catch (error) {
    console.error("Get customer points error:", error);
    next(error);
  }
};

exports.getDeletedCustomers = async (req, res, next) => {
  try {
    const { Customer: CustomerModel } = await getAutoModels(req);

    const deletedCustomers = await CustomerModel.find({ isDeleted: true }).sort({ createdAt: -1 });

    res.json({
      success: true,
      customers: deletedCustomers,
    });
  } catch (error) {
    console.error("Get deleted customers error:", error);
    next(error);
  }
};

exports.restoreCustomer = async (req, res, next) => {
  try {
    const { Customer: CustomerModel } = await getAutoModels(req);
    const { id } = req.params;

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({
        success: false,
        error: "Invalid customer ID format"
      });
    }

    const customer = await CustomerModel.findById(id);
    if (!customer) {
      return res.status(404).json({
        success: false,
        error: "Customer not found"
      });
    }

    if (!customer.isDeleted) {
      return res.status(400).json({
        success: false,
        error: "Customer is not deleted"
      });
    }

    await CustomerModel.findByIdAndUpdate(id, {
      isDeleted: false,
    });

    res.json({
      success: true,
      message: "Customer restored successfully",
      customer: {
        id: customer._id,
        name: customer.name,
        phone: customer.phone,
        totalDueAmount: customer.totalDueAmount,
      },
    });
  } catch (error) {
    console.error("Restore customer error:", error);
    next(error);
  }
};

exports.getActiveCustomers = async (req, res, next) => {
  try {
    const { Customer, CustomerInvoice } = await getAutoModels(req);
    const { startDate, endDate } = req.query;

    let query = { isDeleted: false };

    if (startDate && endDate) {
      query.createdAt = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }

    const customers = await Customer.find(query).sort({ createdAt: -1 });
    const customerIds = customers.map((c) => c._id);

    const invoiceAggregation = await CustomerInvoice.aggregate([
      {
        $match: {
          customerId: { $in: customerIds },
          status: { $nin: ["cancelled"] },
        },
      },
      {
        $group: {
          _id: "$customerId",
          totalDueAmount: { $sum: "$dueAmount" },
          totalAdvanceAmount: { $sum: "$advanceAmount" },
          totalPaidAmount: { $sum: "$paidAmount" },
          totalGrandTotal: { $sum: "$grandTotal" },
          invoiceCount: { $sum: 1 },
        },
      },
    ]);

    const dueAmountMap = {};
    invoiceAggregation.forEach((item) => {
      const balance = item.totalAdvanceAmount - item.totalDueAmount;
      dueAmountMap[item._id.toString()] = {
        totalDueAmount: item.totalDueAmount || 0,
        totalAdvanceAmount: item.totalAdvanceAmount || 0,
        totalPaidAmount: item.totalPaidAmount || 0,
        totalPurchaseAmount: item.totalGrandTotal || 0,
        balance,
        customerType: balance < 0 ? "due" : balance > 0 ? "advance" : "normal",
        invoiceCount: item.invoiceCount || 0,
      };
    });

    const customersWithDueAmount = customers.map((customer) => {
      const dueInfo = dueAmountMap[customer._id.toString()] || {
        totalDueAmount: 0,
        totalAdvanceAmount: 0,
        totalPaidAmount: 0,
        totalPurchaseAmount: 0,
        balance: 0,
        customerType: "normal",
        invoiceCount: 0,
      };
      return {
        ...customer.toObject(),
        ...dueInfo,
        totalInvoiceCount: dueInfo.invoiceCount,
      };
    });

    res.json({ success: true, customers: customersWithDueAmount });  // ✅ key matches frontend
  } catch (err) {
    next(err);
  }
};