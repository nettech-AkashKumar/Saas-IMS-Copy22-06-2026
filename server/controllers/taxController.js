
// controllers/unitController.js
const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");

exports.createtax = async (req, res, next) => {
  try {
    const { Tax: TaxModel } = await getAutoModels(req);
    const { taxName, taxShortName, taxRate } = req.body;
    
    // Check if same taxName + taxRate combination already exists
    const existingTax = await TaxModel.findOne({
      taxShortName: taxShortName.trim().toUpperCase(),
      taxRate: Number(taxRate),
    });

    if (existingTax) {
      return res.status(409).json({
        message: `Tax with same Rate already exists`,
      });
    }

    const newtax = new TaxModel({
      taxName: taxName.trim(),
      taxShortName: taxShortName.trim().toUpperCase(),
      taxRate: Number(taxRate),
      isDeleted: false,
    });
    await newtax.save();
    res.status(201).json({ message: "Tax created successfully", tax: newtax });
  } catch (error) {
    next(error);
  }
};

exports.gettax = async (req, res, next) => {
  try {
    const { Tax: TaxModel } = await getAutoModels(req);
    const taxs = await TaxModel.find();
    res.status(200).json(taxs);
  } catch (error) {
    next(error);
  }
};

exports.getActivetax = async (req, res, next) => {
  try {
    const { Tax: TaxModel } = await getAutoModels(req);
    const activetaxs = await TaxModel.find({ isDeleted: false })
      .select("taxName taxShortName taxRate isDeleted createdAt") // Include taxRate and status
      .sort({ createdAt: -1 }); // optional: latest first

    res.status(200).json({
      message: "Active taxs fetched successfully",
      total: activetaxs.length,
      taxs: activetaxs,
    });
  } catch (error) {
    next(error);
  }
};

exports.gettaxById = async (req, res, next) => {
  try {
    const { Tax: TaxModel } = await getAutoModels(req);
    const tax = await TaxModel.findById(req.params.id);
    if (!tax) return res.status(404).json({ message: "Tax not found" });
    res.status(200).json(tax);
  } catch (error) {
    next(error);
  }
};

exports.updatetax = async (req, res, next) => {
  try {
    const { Tax: TaxModel } = await getAutoModels(req);
    const { id } = req.params;
    const { taxName, taxShortName, taxRate } = req.body;
    
    // Check if same taxName + taxRate combination already exists
    const existingTax = await TaxModel.findOne({
      taxShortName: taxShortName.trim().toUpperCase(),
      taxRate: Number(taxRate),
      isDeleted: false,
    });

    if (existingTax) {
      return res.status(409).json({
        message: `Tax with same Rate already exists`,
      });
    }
    const tax = await TaxModel.findByIdAndUpdate(
      id,
      {
        taxName: taxName.trim(),
        taxShortName: taxShortName.trim().toUpperCase(),
        taxRate: Number(taxRate),
        isDeleted: false,
      },
      { new: true }
    );
    if (!tax) return res.status(404).json({ message: "Tax not found" });
    res.status(200).json({ message: "Tax updated successfully", tax });
  } catch (error) {
    // if (error.code === 11000) {
    //   const field = Object.keys(error.keyPattern)[0];

    //   return res.status(400).json({
    //     code: "DUPLICATE_KEY",
    //     field,
    //     message: `${field} already exists`,
    //   });
    // }
    next(error);
  }
};

exports.deletetax = async (req, res, next) => {
  try {
    const { Tax: TaxModel } = await getAutoModels(req);
    const tax = await TaxModel.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!tax) return res.status(404).json({ message: "Tax not found" });
    res.status(200).json({ message: "Tax deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.getDeletedTax = async (req, res, next) => {
  try {
    const { Tax: TaxModel } = await getAutoModels(req);
    const deletedTaxs = await TaxModel.find({ isDeleted: true })
      .select("taxName taxShortName taxRate isDeleted") // Include taxRate and status
      .sort({ createdAt: -1 }); // optional: latest first

    res.status(200).json({
      message: "Deleted taxs fetched successfully",
      total: deletedTaxs.length,
      taxs: deletedTaxs,
    });
  } catch (error) {
    next(error);
  }
};

exports.restoreTax = async (req, res, next) => {
  try {
    const { Tax: TaxModel } = await getAutoModels(req);
    const tax = await TaxModel.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false },
      { new: true }
    );
    if (!tax) return res.status(404).json({ message: "Tax not found" });
    res.status(200).json({ message: "Tax restored successfully" });
  } catch (error) {
    next(error);
  }
};