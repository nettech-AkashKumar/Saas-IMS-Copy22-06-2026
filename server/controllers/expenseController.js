const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");
const cloudinary = require("../utils/cloudinary/cloudinary.js");

const getPaginatedExpenses = async (req, res) => {
  try {
    const { Expense: ExpenseModel } = await getAutoModels(req);
    // let { page = 1, limit = 10 } = req.query;

    // page = parseInt(page);
    // limit = parseInt(limit);

    // const skip = (page - 1) * limit;

    const expenses = await ExpenseModel.find({ isDeleted: false })
    // .sort({ date: -1 })
    // .skip(skip)
    // .limit(limit);

    const total = await ExpenseModel.countDocuments({ isDeleted: false });

    res.json({
      expenses,
      total,
      // page,
      // totalPages: Math.ceil(total / limit),
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getExpenseSummary = async (req, res) => {
  try {
    const { Expense: ExpenseModel } = await getAutoModels(req);
    const expenses = await ExpenseModel.find({ isDeleted: false });
    const totalAmount = expenses.reduce(
      (sum, exp) => sum + (Number(exp.amount) || 0),
      0
    );
    const totalCount = expenses.length;

    res.json({ totalAmount, totalCount });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const createExpense = async (req, res) => {
  try {
    const { Expense: ExpenseModel } = await getAutoModels(req);
    let receipt = [];

    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const uploaded = await cloudinary.uploader.upload(file.path, { folder: "expense_receipts" });
        receipt.push({ url: uploaded.secure_url, public_id: uploaded.public_id });
      }
    }

    const newExpense = new ExpenseModel({
      date: req.body.date,
      paymentStatus: req.body.paymentStatus,
      expenseTitle: req.body.expenseTitle,
      notes: req.body.notes,
      paymentMode: req.body.paymentMode,
      paidTo: req.body.paidTo,
      amount: req.body.amount,
      receipt,
    });

    await newExpense.save();
    res.status(201).json({ message: "Expense saved successfully", newExpense });
  } catch (err) {
    console.error("❌ createExpense error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

const getAllExpenses = async (req, res) => {
  try {
    const { Expense: ExpenseModel } = await getAutoModels(req);
    const expenses = await ExpenseModel.find({ isDeleted: false }).sort({
      createdAt: -1,
    });

    res.status(200).json(expenses);
  } catch (err) {
    console.error("❌ getAllExpenses error:", err.message);
    res.status(500).json({ error: err.message });
  }
};

const getExpenseById = async (req, res) => {
  try {
    const { Expense: ExpenseModel } = await getAutoModels(req);
    const expense = await ExpenseModel.findById(req.params.id);
    if (!expense) return res.status(404).json({ error: "Expense not found" });
    res.status(200).json(expense);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const updateExpense = async (req, res) => {
  try {
    const { Expense: ExpenseModel } = await getAutoModels(req);
    const removeReceipt = req.body.removeReceipt === "true";

    const existingExpense = await ExpenseModel.findById(req.params.id);
    if (!existingExpense) {
      return res.status(404).json({ error: "Expense not found" });
    }

    let updateData = {
      date: req.body.date,
      paymentStatus: req.body.paymentStatus,
      expenseTitle: req.body.expenseTitle,
      notes: req.body.notes,
      paymentMode: req.body.paymentMode,
      paidTo: req.body.paidTo,
      amount: req.body.amount,
    };

    // Delete old receipt from Cloudinary if needed
    if ((removeReceipt || req.file) && existingExpense.receipt?.length > 0) {
      for (const r of existingExpense.receipt) {
        if (r.public_id) {
          await cloudinary.uploader.destroy(r.public_id);
        }
      }
    }

    // CASE 1: remove only
    if (removeReceipt && !req.file) {
      updateData.receipt = [];
    }

    // CASE 2: replace with new file
    if (req.file) {
      const uploaded = await cloudinary.uploader.upload(req.file.path, {
        folder: "expense_receipts",
      });

      updateData.receipt = [
        {
          url: uploaded.secure_url,
          public_id: uploaded.public_id,
        },
      ];
    }

    const updatedExpense = await ExpenseModel.findByIdAndUpdate(
      req.params.id,
      updateData,
      { new: true }
    );

    res.status(200).json({
      message: "Expense updated successfully",
      updatedExpense,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const deleteExpense = async (req, res) => {
  try {
    const { Expense: ExpenseModel } = await getAutoModels(req);
    const updated = await ExpenseModel.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Expense not found" });
    res.status(200).json({ message: "Expense soft-deleted successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getActiveExpenses = async (req, res) => {
  try {
    const { Expense: ExpenseModel } = await getAutoModels(req);
    const expenses = await ExpenseModel.find({ isDeleted: false }).sort({
      createdAt: -1,
    });

    res.status(200).json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const getDeletedExpenses = async (req, res) => {
  try {
    const { Expense: ExpenseModel } = await getAutoModels(req);
    const expenses = await ExpenseModel.find({ isDeleted: true }).sort({
      createdAt: -1,
    });

    res.status(200).json(expenses);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const restoreExpense = async (req, res) => {
  try {
    const { Expense: ExpenseModel } = await getAutoModels(req);
    const updated = await ExpenseModel.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: "Expense not found" });
    res.status(200).json({ message: "Expense restored successfully" });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

module.exports = {
  getPaginatedExpenses,
  getExpenseSummary,
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getDeletedExpenses,
  restoreExpense,
  getActiveExpenses,
};