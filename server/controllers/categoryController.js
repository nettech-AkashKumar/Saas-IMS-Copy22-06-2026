// controllers/categoryController.js
const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");

const escapeRegex = (text) =>
  text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.createCategory = async (req, res, next) => {
  try {
    const { Category: CategoryModel, Subcategory: SubcategoryModel } = await getAutoModels(req);
    const { categoryName, subCategoryName } = req.body;

    if (!categoryName || !categoryName.trim()) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const cleanCategoryName = categoryName.trim();
    const escapedName = escapeRegex(cleanCategoryName);

    const existingCategory = await CategoryModel.findOne({
      categoryName: { $regex: `^${escapedName}$`, $options: "i" },
    });

    if (existingCategory) {
      return res.status(409).json({
        message: "Category already exists",
      });
    }

    // 1️⃣ Create Category
    const category = await CategoryModel.create({
      categoryName: categoryName.trim(),
    });

    // 2️⃣ OPTIONAL Subcategory create
    if (subCategoryName && subCategoryName.trim()) {
      const subcategory = await SubcategoryModel.create({
        name: subCategoryName.trim(),
        category: category._id,
      });

      category.subcategories.push(subcategory._id);
      await category.save();
    }

    res.status(201).json({
      message: "Category created successfully",
      category,
    });
  } catch (error) {
    next(error);
  }
};

const generateCategoryCode = async (CategoryModel) => {

  const lastCategory = await CategoryModel.findOne().sort({ createdAt: -1 });

  if (!lastCategory || !lastCategory.categoryCode) {
    return "CAT-0001";
  }

  const lastCodeNum = parseInt(lastCategory.categoryCode.split("-")[1], 10);
  const newCodeNum = lastCodeNum + 1;

  return `CAT-${String(newCodeNum).padStart(4, "0")}`;
};

exports.bulkAssignCategoryCodes = async (req, res, next) => {
  try {
    const { Category: CategoryModel } = await getAutoModels(req);
    const { selectedIds } = req.body;

    if (!Array.isArray(selectedIds) || selectedIds.length === 0) {
      return res.status(400).json({ message: "No categories selected" });
    }

    const categories = await CategoryModel.find({ _id: { $in: selectedIds } }).sort({
      createdAt: 1,
    });

    for (let i = 0; i < categories.length; i++) {
      const code = `CAT-${String(i + 1).padStart(4, "0")}`;
      categories[i].categoryCode = code;
      await categories[i].save();
    }

    res.status(200).json({ message: "Codes assigned successfully" });
  } catch (err) {
    next(err);
  }
};

exports.getAllCategories = async (req, res, next) => {
  try {
    const { Category: CategoryModel, Product } = await getAutoModels(req);
    const categories = await CategoryModel.find({ isDelete: false })
      .populate("subcategories", "name")
      .sort({ createdAt: -1 })
      .lean();

    // Get product counts
    const productCounts = await Product.aggregate([
      { $match: { isDelete: false } }, // Only active products
      { $group: { _id: "$category", count: { $sum: 1 } } },
    ]);

    const countMap = {};
    productCounts.forEach((p) => {
      if (p._id) countMap[p._id.toString()] = p.count;
    });

    const categoriesWithCount = categories.map((cat) => ({
      ...cat,
      count: countMap[cat._id.toString()] || 0,
    }));

    res.status(200).json(categoriesWithCount);
  } catch (err) {
    next(err);
  }
};

exports.getCategoryById = async (req, res, next) => {
  try {
    const { Category } = await getAutoModels(req);
    const category = await Category.findById(req.params.id);
    if (!category)
      return res.status(404).json({ message: "Category not found." });
    res.status(200).json(category);
  } catch (err) {
    next(err);
  }
};

exports.updateCategory = async (req, res, next) => {
  try {
    const { Category: CategoryModel } = await getAutoModels(req);
    const { categoryName, categorySlug } = req.body;
    const category = await CategoryModel.findByIdAndUpdate(
      req.params.id,
      { categoryName, categorySlug },
      { new: true }
    );
    if (!category)
      return res.status(404).json({ message: "Category not found." });

    res.status(200).json({ message: "Category updated", category });
  } catch (err) {
    next(err);
  }
};

exports.deleteCategory = async (req, res, next) => {
  try {
    const { Category: CategoryModel } = await getAutoModels(req);
    const { id } = req.params;

    // Find the category
    const category = await CategoryModel.findById(id);
    if (!category) {
      return res.status(404).json({ message: "Category not found." });
    }

    // Optional: prevent marking as deleted if already deleted
    if (category.isDelete === true) {
      return res.status(400).json({ message: "Category is already deleted." });
    }

    // Soft delete: mark as deleted
    category.isDelete = true;
    await category.save();

    res.status(200).json({ message: "Category deleted successfully." });
  } catch (err) {
    next(err);
  }
};

exports.bulkDeleteCategories = async (req, res, next) => {
  try {
    const { Category } = await getAutoModels(req);
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids)) {
      return res
        .status(400)
        .json({ message: "Invalid or missing 'ids' array in request body." });
    }

    await Category.deleteMany({ _id: { $in: ids } });

    res.status(200).json({ message: "Categories deleted successfully" });
  } catch (error) {
    next(error);
  }
};

exports.deleteSubCategory = async (req, res, next) => {
  try {
    const { Category: CategoryModel, Subcategory: SubcategoryModel } = await getAutoModels(req);
    const subCategoryId = req.params.id;

    // 1️⃣ Find subcategory and check if it exists and not already deleted
    const subcategory = await SubcategoryModel.findOne({
      _id: subCategoryId,
      isDeleted: false, // Optional: only allow deleting non-deleted ones
    });

    if (!subcategory) {
      return res.status(404).json({
        message: "Subcategory not found or already deleted"
      });
    }

    // 2️⃣ Soft delete: set isDeleted to true
    await SubcategoryModel.findByIdAndUpdate(
      subCategoryId,
      { isDeleted: true },
      { new: true }
    );

    // 3️⃣ Remove subcategory ID from parent's subcategories array
    await CategoryModel.findByIdAndUpdate(
      subcategory.category,
      { $pull: { subcategories: subCategoryId } },
      { new: true }
    );

    res.status(200).json({
      message: "Subcategory deleted successfully (soft delete)"
    });

  } catch (error) {
    next(error);
  }
};

exports.getDeletedCategories = async (req, res, next) => {
  try {
    const { Category: CategoryModel } = await getAutoModels(req);

    const categories = await CategoryModel.find({
      isDelete: true,
    })

    res.status(200).json(categories);
  } catch (err) {
    return next(ApiError.internal("Failed to fetch deleted categories"));
  }
};

exports.restoreCategory = async (req, res, next) => {
  try {
    const { Category: CategoryModel } = await getAutoModels(req);
    const category = await CategoryModel.findById(req.params.id);
    if (!category) return next(ApiError.notFound("Category not found"));

    category.isDelete = false;
    await category.save();

    res.status(200).json({ message: "Category restored successfully" });
  } catch (err) {
    return next(ApiError.internal("Failed to restore category"));
  }
};