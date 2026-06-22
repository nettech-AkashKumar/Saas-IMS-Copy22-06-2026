
// controllers/unitController.js
const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");

exports.createUnit = async (req, res, next) => {
  try {
    const { Unit: UnitModel } = await getAutoModels(req);
    const { unitsName, shortName, status } = req.body;

    const newUnit = new UnitModel({
      unitsName: unitsName,
      shortName: shortName,
      isDeleted: false,
    });
    await newUnit.save();

    res.status(201).json({
      message: "Unit created successfully",
      unit: newUnit,
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];

      return res.status(400).json({
        code: "DUPLICATE_KEY",
        field,
        message: `${field} already exists`,
      });
    }
    next(error);
  }
};

exports.getUnits = async (req, res, next) => {
  try {
    const { Unit: UnitModel } = await getAutoModels(req);
    const units = await UnitModel.find();
    res.status(200).json(units);
  } catch (error) {
    next(error);
  }
};

exports.getActiveUnits = async (req, res, next) => {
  try {
    const { Unit: UnitModel } = await getAutoModels(req);
    const activeUnits = await UnitModel.find({ isDeleted: false })
      .select("unitsName shortName createdAt")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Active units fetched successfully",
      total: activeUnits.length,
      units: activeUnits,
    });
  } catch (error) {
    next(error);
  }
};

exports.getUnitById = async (req, res, next) => {
  try {
    const { Unit: UnitModel } = await getAutoModels(req);
    const unit = await UnitModel.findById(req.params.id);
    if (!unit) return res.status(404).json({ message: "Unit not found" });
    res.status(200).json(unit);
  } catch (error) {
    next(error);
  }
};

exports.updateUnit = async (req, res, next) => {
  try {
    const { Unit: UnitModel } = await getAutoModels(req);
    const { id } = req.params;
    const { unitsName, shortName } = req.body;

    const updated = await UnitModel.findByIdAndUpdate(
      id,
      {
        unitsName: unitsName,
        shortName: shortName,
        isDeleted: false,
      },
      { new: true, runValidators: true }
    );

    res.status(200).json({
      message: "Unit updated successfully",
      unit: updated,
    });
  } catch (error) {
    if (error.code === 11000) {
      const field = Object.keys(error.keyPattern)[0];

      return res.status(400).json({
        code: "DUPLICATE_KEY",
        field,
        message: `${field} already exists`,
      });
    }
    next(error);
  }
};

exports.deleteUnit = async (req, res, next) => {
  try {
    const { Unit: UnitModel } = await getAutoModels(req);
    const unit = await UnitModel.findByIdAndUpdate(
      req.params.id, {
        isDeleted: true,
      }
    );
    if (!unit) return res.status(404).json({ message: "Unit not found" });
    res.status(200).json({ message: "Unit deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.getDeletedUnits = async (req, res, next) => {
  try {
    const { Unit: UnitModel } = await getAutoModels(req);
    const deletedUnits = await UnitModel.find({ isDeleted: true })
      .select("unitsName shortName") // only these fields
      .sort({ createdAt: -1 }); // optional: latest first

    res.status(200).json({
      message: "Deleted units fetched successfully",
      total: deletedUnits.length,
      units: deletedUnits,
    });
  } catch (error) {
    next(error);
  }
};

exports.restoreUnit = async (req, res, next) => {
  try {
    const { Unit: UnitModel } = await getAutoModels(req);
    const unit = await UnitModel.findByIdAndUpdate(
      req.params.id, {
        isDeleted: false,
      }
    );
    if (!unit) return res.status(404).json({ message: "Unit not found" });
    res.status(200).json({ message: "Unit restored successfully" });
  } catch (error) {
    next(error);
  }
};