// const BalanceSheet = require("../models/balanceSheetSchema");

// const saveBalanceSheet = async (req, res) => {
//   try {
//     const balanceSheet = new BalanceSheet(req.body);
//     await balanceSheet.save();
//     res.status(201).json({ success: true, data: balanceSheet });
//   } catch (error) {
//     console.error("Save failed:", error);
//     res.status(500).json({ success: false, message: "Server error" });
//   }
// };


const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");

// Save new balance sheet
const saveBalanceSheet = async (req, res) => {
  try {
    const {BalanceSheet: BalanceSheetModel} = await getAutoModels(req);
    const balanceSheet = new BalanceSheetModel(req.body);
    await balanceSheet.save();
    res.status(201).json({ success: true, data: balanceSheet });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

// Get all balance sheets
const getBalanceSheets = async (req, res) => {
  try {
    const {BalanceSheet: BalanceSheetModel} = await getAutoModels(req);
    const data = await BalanceSheetModel.find().sort({ createdAt: -1 });
    res.status(200).json({ success: true, data });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server error" });
  }
};

module.exports = { saveBalanceSheet, getBalanceSheets };
