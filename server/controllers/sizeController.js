
// controllers/unitController.js
const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");

exports.createSize = async (req, res, next) => {
  try {
    const { Size: SizeModel } = await getAutoModels(req);
    const { sizeName } = req.body;
    const newSize = new SizeModel({
      sizeName: sizeName,
      isDeleted: false,
    });
    await newSize.save();
    res.status(201).json({ message: "Size created successfully", size: newSize });
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

exports.getSize = async (req, res, next) => {
  try {
    const { Size: SizeModel } = await getAutoModels(req);
    const sizes = await SizeModel.find();
    res.status(200).json(sizes);
  } catch (error) {
    next(error);
  }
};

exports.getActiveSize = async (req, res, next) => {
  try {
    const { Size: SizeModel } = await getAutoModels(req);
    const activeSizes = await SizeModel.find({ isDeleted: false })
      .select("sizeName createdAt") // only these fields
      .sort({ createdAt: -1 }); // optional: latest first

    res.status(200).json({
      message: "Active sizes fetched successfully",
      total: activeSizes.length,
      sizes: activeSizes,
    });
  } catch (error) {
    next(error);
  }
};

exports.getSizeById = async (req, res, next) => {
  try {
    const { Size: SizeModel } = await getAutoModels(req);
    const size = await SizeModel.findById(req.params.id);
    if (!size) return res.status(404).json({ message: "Size not found" });
    res.status(200).json(size);
  } catch (error) {
    next(error);
  }
};

exports.updateSize = async (req, res, next) => {
  try {
    const { Size: SizeModel } = await getAutoModels(req);
    const { id } = req.params;
    const { sizeName } = req.body;

    const normalizedName = sizeName.trim();

    // ✅ Prevent duplicate (case-insensitive)
    const existing = await SizeModel.findOne({
      sizeName: normalizedName,
      _id: { $ne: id },
      isDeleted: false,
    });

    if (existing) {
      return res.status(400).json({
        code: "DUPLICATE_KEY",
        field: "sizeName",
        message: "Size already exists",
      });
    }

    const size = await SizeModel.findByIdAndUpdate(
      id,
      { sizeName: normalizedName },
      { new: true, runValidators: true }
    );

    if (!size) {
      return res.status(404).json({ message: "Size not found" });
    }

    res.status(200).json({
      message: "Size updated successfully",
      size
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

exports.deleteSize = async (req, res, next) => {
  try {
    const { Size: SizeModel } = await getAutoModels(req);
    const size = await SizeModel.updateOne({ _id: req.params.id }, { isDeleted: true });
    if (size.nModified === 0) return res.status(404).json({ message: "Size not found" });
    res.status(200).json({ message: "Size deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.getDeletedSizes = async (req, res, next) => {
  try {
    const { Size: SizeModel } = await getAutoModels(req);
    const deletedSizes = await SizeModel.find({ isDeleted: true }).sort({ createdAt: -1 });
    res.status(200).json({
      message: "Deleted sizes fetched successfully",
      total: deletedSizes.length,
      sizes: deletedSizes,
    });
  } catch (error) {
    next(error);
  }
};

exports.restoreSize = async (req, res, next) => {
  try {
    const { Size: SizeModel } = await getAutoModels(req);
    const { id } = req.params;
    const size = await SizeModel.updateOne({ _id: id }, { isDeleted: false });
    if (size.nModified === 0) return res.status(404).json({ message: "Size not found" });
    res.status(200).json({ message: "Size restored successfully" });
  } catch (error) {
    next(error);
  }
};