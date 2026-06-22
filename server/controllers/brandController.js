const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");
const cloudinary = require("../utils/cloudinary/cloudinary");
const ApiError = require("../utils/ApiError");

exports.addBrand = async (req, res, next) => {
  try {
    const { Brand: BrandModel } = await getAutoModels(req);
    const { brandName } = req.body;

    // 🔍 Check if brand already exists (case-insensitive)
    const existingBrand = await BrandModel.findOne({
      brandName: { $regex: new RegExp("^" + brandName + "$", "i") },
    });

    if (existingBrand) {
      return res.status(400).json({ message: "Brand already exists" });
    }

    const uploadedImages = await Promise.all(
      req.files.map((file) =>
        cloudinary.uploader.upload(file.path, { folder: "brand_images" })
      )
    );

    const imageUrls = uploadedImages.map((img) => ({
      url: img.secure_url,
      public_id: img.public_id,
    }));


    const brand = new BrandModel({
      brandName,
      image: imageUrls,
      // status: status === "Active" ? "Active" : "Inactive",
      isDeleted: false,
    });

    await brand.save();

    res.status(201).json({
      message: "Brand created successfully",
      brand,
    });
  } catch (error) {
    return next(ApiError.internal("Error creating brand"));
  }
};

exports.updateBrand = async (req, res, next) => {
  try {
    const { Brand: BrandModel } = await getAutoModels(req);
    const { brandName } = req.body;
    const { id } = req.params;

    const brand = await BrandModel.findById(id);
    if (!brand) return res.status(404).json({ message: "Brand not found" });

    // Update basic fields
    brand.brandName = brandName || brand.brandName;
    // brand.status = status === "Active" ? "Active" : "Inactive";
    brand.isDeleted = false;

    // If new images are uploaded
    if (req.files && req.files.length > 0) {
      const imageUploadPromises = req.files.map((file) =>
        cloudinary.uploader.upload(file.path, { folder: "brand_images" })
      );

      const uploadedImages = await Promise.all(imageUploadPromises);
      // const imageUrls = uploadedImages.map((img) => img.secure_url);

      // brand.image = imageUrls;
      const imageUrls = uploadedImages.map((img) => ({
        url: img.secure_url,
        public_id: img.public_id,
      }));
      brand.image = imageUrls;
    }

    await brand.save();

    res.status(200).json({
      message: "Brand updated successfully",
      brand,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Brand name must be unique" });
    }
    return next(ApiError.internal("Error updating brand"));
  }
};

// Get brands with pagination and filtering
exports.getBrands = async (req, res, next) => {
  try {
    const { Brand: BrandModel } = await getAutoModels(req);
    const isDeleted = req.query.isDeleted || false;
    if (isDeleted) {
      query.isDeleted = isDeleted;
    } else if (isDeleted) {
      query.isDeleted = isDeleted;
    }

    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;
    const search = req.query.search || "";
    // const status = req.query.status || "All";
    const sort = req.query.sort || "Latest";

    let query = {};
    if (search) {
      query.brandName = { $regex: search, $options: "i" };
    }
    // if (status !== "All") {
    //   query.status = status;
    // }

    let sortQuery = { createdAt: -1 };
    if (sort === "Ascending") sortQuery = { brandName: 1 };
    if (sort === "Descending") sortQuery = { brandName: -1 };

    const [brands, total] = await Promise.all([
      BrandModel.find(query).sort(sortQuery).skip(skip).limit(limit),
      BrandModel.countDocuments(query),
    ]);

    res.status(200).json({
      message: "Brands fetched successfully",
      brands,
      total,
      page,
      limit,
    });
  } catch (error) {
    return next(ApiError.internal("Error fetching brands"));
  }
};

// Get only active brands (sorted by latest)
exports.getActiveBrands = async (req, res, next) => {
  try {
    const { Brand: BrandModel } = await getAutoModels(req);
    const activeBrands = await BrandModel.find({ isDeleted: false }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Active brands fetched successfully",
      total: activeBrands.length,
      brands: activeBrands,
    });
  } catch (error) {
    return next(ApiError.internal("Error fetching active brands"));
  }
};

exports.deleteBrand = async (req, res, next) => {
  try {
    const { Brand: BrandModel } = await getAutoModels(req);
    const { id } = req.params;
    const brand = await BrandModel.findById(id);

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    // Delete associated Cloudinary images
    const deletePromises = brand.image.map((img) =>
      cloudinary.uploader.destroy(img.public_id)
    );
    await Promise.all(deletePromises);

    await BrandModel.updateOne({ _id: id }, { isDeleted: true });

    res.status(200).json({ message: "Brand deleted successfully" });
  } catch (error) {
    return next(ApiError.internal("Error deleting brand"));
  }
};

exports.getDeletedBrands = async (req, res, next) => {
  try {
    const { Brand: BrandModel } = await getAutoModels(req);
    const deletedBrands = await BrandModel.find({ isDeleted: true }).sort({ createdAt: -1 });

    res.status(200).json({
      message: "Deleted brands fetched successfully",
      total: deletedBrands.length,
      brands: deletedBrands,
    });
  } catch (error) {
    return next(ApiError.internal("Error fetching deleted brands"));
  }
};

exports.restoreBrand = async (req, res, next) => {
  try {
    const { Brand: BrandModel } = await getAutoModels(req);
    const { id } = req.params;
    const brand = await BrandModel.findById(id);

    if (!brand) {
      return res.status(404).json({ message: "Brand not found" });
    }

    await BrandModel.updateOne({ _id: id }, { isDeleted: false });

    res.status(200).json({ message: "Brand restored successfully" });
  } catch (error) {
    return next(ApiError.internal("Error restoring brand"));
  }
};
