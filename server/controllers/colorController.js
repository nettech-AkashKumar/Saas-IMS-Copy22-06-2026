
// controllers/colorController.js
const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");

exports.createColor = async (req, res, next) => {
  try {
    const { Color: ColorModel } = await getAutoModels(req);
    const { colorName, colorCode } = req.body;

    // ✅ Prevent duplicate (case-insensitive)
    const existing = await ColorModel.findOne({
      colorName: colorName.trim(),
    });

    if (existing) {
      return res.status(400).json({
        code: "DUPLICATE_KEY",
        field: "colorName",
        message: "Color Name already exists",
      });
    }

    // ✅ Prevent duplicate (case-insensitive)
    const existingCode = await ColorModel.findOne({
      colorCode: colorCode.trim(),
    });
    if (existingCode) {
      return res.status(400).json({
        code: "DUPLICATE_KEY",
        field: "colorCode",
        message: "Color Code already exists",
      });
    }
    
    const newColor = new ColorModel({ colorName: colorName.trim(), colorCode: colorCode.trim(), isDeleted: false });
    await newColor.save();
    res.status(201).json({ message: "Color created successfully", color: newColor });
  } catch (error) {
    next(error);
  }
};

exports.getColor = async (req, res, next) => {
  try {
    const { Color: ColorModel } = await getAutoModels(req);
    const colors = await ColorModel.find();
    res.status(200).json(colors);
  } catch (error) {
    next(error);
  }
};

exports.getActiveColor = async (req, res, next) => {
  try {
    const { Color: ColorModel } = await getAutoModels(req);
    const activeColors = await ColorModel.find({ isDeleted: false })
      .select("colorName colorCode createdAt") // only these fields
      .sort({ createdAt: -1 }); // optional: latest first

    res.status(200).json({
      message: "Active colors fetched successfully",
      total: activeColors.length,
      colors: activeColors,
    });
  } catch (error) {
    next(error);
  }
};

exports.getColorById = async (req, res, next) => {
  try {
    const { Color: ColorModel } = await getAutoModels(req);
    const color = await ColorModel.findById(req.params.id);
    if (!color) return res.status(404).json({ message: "Color not found" });
    res.status(200).json(color);
  } catch (error) {
    next(error);
  }
};

exports.updateColor = async (req, res, next) => {
  try {
    const { Color: ColorModel } = await getAutoModels(req);
    const { colorName, colorCode } = req.body;
    // ✅ Prevent duplicate (case-insensitive)
    const existing = await ColorModel.findOne({
      colorName: colorName.trim(),
      _id: { $ne: req.params.id },
      isDeleted: false,
    });
    if (existing) {
      return res.status(400).json({
        code: "DUPLICATE_KEY",
        field: "colorName",
        message: "Color Name already exists",
      });
    }
    // ✅ Prevent duplicate (case-insensitive)
    const existingCode = await ColorModel.findOne({
      colorCode: colorCode.trim(),
      _id: { $ne: req.params.id },
      isDeleted: false,
    });
    if (existingCode) {
      return res.status(400).json({
        code: "DUPLICATE_KEY",
        field: "colorCode",
        message: "Color Code already exists",
      });
    }
    const color = await ColorModel.findByIdAndUpdate(
      req.params.id,
      { colorName: colorName.trim(), colorCode: colorCode.trim() },
      { new: true }
    );
    if (!color) return res.status(404).json({ message: "Color not found" });
    res.status(200).json({ message: "Color updated successfully", color });
  } catch (error) {
    next(error);
  }
};

exports.deleteColor = async (req, res, next) => {
  try {
    const { Color: ColorModel } = await getAutoModels(req);
    const color = await ColorModel.findByIdAndUpdate(
      req.params.id,
      { isDeleted: true },
      { new: true }
    );
    if (!color) return res.status(404).json({ message: "Color not found" });
    res.status(200).json({ message: "Color deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.getDeletedColor = async (req, res, next) => {
  try {
    const { Color: ColorModel } = await getAutoModels(req);
    const deletedColors = await ColorModel.find({ isDeleted: true })
      .select("colorName colorCode createdAt") // only these fields
      .sort({ createdAt: -1 }); // optional: latest first

    res.status(200).json({
      message: "Deleted colors fetched successfully",
      total: deletedColors.length,
      colors: deletedColors,
    });
  } catch (error) {
    next(error);
  }
};

exports.restoreColor = async (req, res, next) => {
  try {
    const { Color: ColorModel } = await getAutoModels(req);
    const color = await ColorModel.findByIdAndUpdate(
      req.params.id,
      { isDeleted: false },
      { new: true }
    );
    if (!color) return res.status(404).json({ message: "Color not found" });
    res.status(200).json({ message: "Color restored successfully" });
  } catch (error) {
    next(error);
  }
};