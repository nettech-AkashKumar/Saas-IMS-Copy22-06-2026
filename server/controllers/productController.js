// FACTORY PATTERN APPLIED - USES getAutoModels for tenant/master context
const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");
// const Product = require("../models/productModels");
// const Brand = require("../models/brandModels");
// const Category = require("../models/categoryModels");
// const Subcategory = require("../models/subCateoryModal");
// const HSN = require("../models/hsnModels");
const cloudinary = require("../utils/cloudinary/cloudinary");
const multer = require("multer");
const upload = multer({ dest: "uploads/" }); // Configure storage as needed
const { createAuditLog } = require("../utils/auditLogger");
const ApiError = require("../utils/ApiError");

const computeEan13Check = (base12) => {
  const digits = String(base12).split("").map((d) => parseInt(d, 10));
  if (digits.length !== 12 || digits.some((d) => Number.isNaN(d))) return null;
  let sumOdd = 0;
  let sumEven = 0;
  for (let i = 0; i < 12; i++) {
    if (i % 2 === 0) sumOdd += digits[i];
    else sumEven += digits[i];
  }
  const total = sumOdd + sumEven * 3;
  const checksum = (10 - (total % 10)) % 10;
  return String(checksum);
};

const generateBase12 = () => {
  const n = Math.floor(Math.random() * 1e12);
  return String(n).padStart(12, "0");
};

const generateUniqueBarcode = async (ProductModel) => {
  if (!ProductModel) return null;
  let attempts = 0;
  const maxAttempts = 50;
  while (attempts < maxAttempts) {
    const base12 = generateBase12();
    const check = computeEan13Check(base12);
    if (check === null) {
      attempts += 1;
      continue;
    }
    const candidate = base12 + check;
    const exists = await ProductModel.exists({
      isDelete: { $ne: true },
      $or: [{ itemBarcode: candidate }, { "variants.barcode": candidate }],
    });
    if (!exists) return candidate;
    attempts += 1;
  }
  return null;
};

const toBoolean = (value) => value === true || value === "true" || value === "Yes";

const normalizePurchasePrice = (price, taxRate, taxType) => {
  const amount = Number(price);
  const rate = Number(taxRate);
  if (!Number.isFinite(amount)) return 0;
  if (!Number.isFinite(rate) || rate <= 0) return amount;

  const normalized = taxType === "withgst"
    ? amount / (1 + rate / 100)
    : amount * (1 + rate / 100);

  return Number(normalized.toFixed(2));
};

const buildWarrantyFields = (variant = {}) => ({
  warrantyType: variant.warrantyType || "",
  warrantyPeriod: variant.warrantyPeriod === "" ? null : variant.warrantyPeriod,
  coverageScope: variant.coverageScope || "",
  serviceMode: variant.serviceMode || "",
  maxClaimsAllowed: variant.maxClaimsAllowed === "" ? null : variant.maxClaimsAllowed,
  inspectionRequired: toBoolean(variant.inspectionRequired),
  warrantyStartsFrom: variant.warrantyStartsFrom || "",
  linkedto: variant.linkedto || "",
  extensionPeriod: variant.extensionPeriod || "",
  coverageType: variant.coverageType || "",
  extendedWarrantyPrice: variant.extendedWarrantyPrice === "" ? null : variant.extendedWarrantyPrice,
  lifetimeDefination: variant.lifetimeDefination || "",
  coverageOf: variant.coverageOf || "",
  whatNotCovered: variant.whatNotCovered || "",
  maxClaims: variant.maxClaims === "" ? null : variant.maxClaims,
  replacementOnceOnly: toBoolean(variant.replacementOnceOnly),
});

exports.createProduct = async (req, res, next) => {
  try {
    const { Product: ProductModel, Brand: BrandModel, Category: CategoryModel, Subcategory: SubcategoryModel, HSN: HSNModel } = await getAutoModels(req);
    const {
      productName,
      description,
      category,
      subCategory,
      brand,
      itemBarcode,
      hsn,
      purchasePrice,
      mrp,
      modelNo,
      sellingPrice,
      tax,
      size,
      color,
      expiryDate,
      unit,
      openingQuantity,
      minStockToMaintain,
      discountAmount,
      // discountPercent,
      discountType,
      lot_pricing,
      lotNumber,
      productType,
    } = req.body;

    // ✅ LOT DETAILS
    let lotDetails = {};
    if (req.body.lotDetails) {
      lotDetails =
        typeof req.body.lotDetails === "string"
          ? JSON.parse(req.body.lotDetails)
          : req.body.lotDetails;
    }

    // ✅ VARIANTS PROCESSING
    let variants = [];
    if (req.body.variants) {
      try {
        variants =
          typeof req.body.variants === "string"
            ? JSON.parse(req.body.variants)
            : req.body.variants;
      } catch (e) {
        // console.error("Error parsing variants:", e);
        variants = [];
      }
    }

    if (description && description.length > 30) {
      return next(ApiError.badRequest("Description must be under 30 characters."));
    }

    // ✅ SERIAL NUMBERS PROCESSING
    let serialNumbers = [];
    if (req.body.serialNumbers) {
      try {
        serialNumbers =
          typeof req.body.serialNumbers === "string"
            ? JSON.parse(req.body.serialNumbers)
            : req.body.serialNumbers;
      } catch (e) {
        serialNumbers = [];
      }
    }

    // ✅ IMAGES UPLOAD
    let allUploadedImages = [];
    if (req.files?.length) {
      const uploads = await Promise.all(
        req.files.map((file) =>
          cloudinary.uploader.upload(file.path, {
            folder: "product_images",
          }),
        ),
      );
      allUploadedImages = uploads.map((img) => ({
        url: img.secure_url,
        public_id: img.public_id,
      }));
    }

    // ✅ CONTROLLER-LEVEL VALIDATIONS
    if (!productName || String(productName).trim().length === 0) {
      return next(ApiError.badRequest("Product Name is required"));
    }
    if (typeof description === "string") {
      const words = description.trim().split(/\s+/).filter(Boolean);
      if (words.length > 30) {
        return next(ApiError.badRequest("Description must be 30 words or fewer"));
      }
    }
    // lot_pricing-specific validations
    // - If lot_pricing is true, lotNumber should be provided (either top-level or in first variant)
    if (String(lot_pricing) === "true" || lot_pricing === true) {
      // Re-parse variants just to be sure if not already correctly parsed
      let lotNo = lotNumber;
      if (!lotNo && req.body.variants) {
        try {
          const v = typeof req.body.variants === "string" ? JSON.parse(req.body.variants) : req.body.variants;
          if (Array.isArray(v) && v.length > 0) {
            lotNo = v[0].lotNumber;
          }
        } catch (e) { }
      }

      // if (!lotNo || String(lotNo).trim().length === 0) {
      //   return next(ApiError.badRequest("Lot Number is required when using Lot / Batch"));
      // }
    }

    const normalizedTopBarcode = itemBarcode ? String(itemBarcode).trim() : "";
    const barcodesInRequest = new Set();

    // ✅ SAVE PRODUCT
    // Modified to save all variants within a single Product document
    const productData = {
      productName,
      description: req.body.description || "",
      category,
      subcategory: subCategory,
      hsn,
      brand,
      lot_pricing: lot_pricing || false,
      manufacturingDate: req.body.manufacturingDate || null,
      expiryDate,
      images: allUploadedImages,
      // Warranty
      warrantyType: req.body.warrantyType || null,
      warrantyPeriod: req.body.warrantyPeriod || null,
      coverageScope: req.body.coverageScope || null,
      serviceMode: req.body.serviceMode || null,
      maxClaimsAllowed: req.body.maxClaimsAllowed || null,
      inspectionRequired: req.body.inspectionRequired === "true" || req.body.inspectionRequired === true ? true : false,
      warrantyStartsFrom: req.body.warrantyStartsFrom || null,
      linkedto: req.body.linkedto || null,
      extensionPeriod: req.body.extensionPeriod || null,
      coverageType: req.body.coverageType || null,
      extendedWarrantyPrice: req.body.extendedWarrantyPrice || null,
      lifetimeDefination: req.body.lifetimeDefination || null,
      coverageOf: req.body.coverageOf || null,
      whatNotCovered: req.body.whatNotCovered || null,
      maxClaims: req.body.maxClaims || null,
      replacementOnceOnly: req.body.replacementOnceOnly === "true" || req.body.replacementOnceOnly === true ? true : false,
      lotDetails,
      variants: []
    };

    const normalizedProductType = productType === "Variant" ? "Variant" : "Single";
    productData.productType = normalizedProductType;
    productData.dualUnit = toBoolean(req.body.dualUnit);
    productData.secondaryUnit = productData.dualUnit ? (req.body.secondaryUnit || "") : "";
    productData.secondaryUnitQuantity = productData.dualUnit
      ? Number(req.body.secondaryUnitQuantity || 0)
      : 0;

    if (normalizedProductType === "Single" && variants.length > 1) {
      variants = variants.slice(0, 1);
    }

    if (variants.length > 0) {
      let imageIndex = 0;
      let variantIndex = 0;
      for (const variant of variants) {
        const count = variant.imageCount || 0;
        const variantImages = allUploadedImages.slice(imageIndex, imageIndex + count);
        imageIndex += count;

        let barcode = variant && variant.barcode ? String(variant.barcode).trim() : "";
        if (!barcode && variantIndex === 0 && normalizedTopBarcode) {
          barcode = normalizedTopBarcode;
        }

        if (barcode) {
          if (barcodesInRequest.has(barcode)) {
            return next(ApiError.badRequest("Duplicate barcode found in variants"));
          }
          const exists = await ProductModel.exists({
            isDelete: { $ne: true },
            $or: [{ itemBarcode: barcode }, { "variants.barcode": barcode }],
          });
          if (exists) {
            return next(ApiError.badRequest("Barcode already exists"));
          }
          barcodesInRequest.add(barcode);
        } else {
          let generated = await generateUniqueBarcode(ProductModel);
          while (generated && barcodesInRequest.has(generated)) {
            generated = await generateUniqueBarcode(ProductModel);
          }
          if (!generated) {
            return next(ApiError.internal("Unable to generate unique barcode"));
          }
          barcode = generated;
          barcodesInRequest.add(barcode);
        }

        productData.variants.push({
          itemBarcode: barcode,
          lotNumber: variant.lotNumber || "",
          modelNo: variant.modelNo || "",
          serialNumbers: variant.serialNumbers || [],
          purchasePrice: normalizePurchasePrice(
            variant.purchasePrice,
            variant.tax,
            variant.purchasePriceTaxType,
          ),
          purchasePriceTaxType: variant.purchasePriceTaxType === "withgst" ? "withgst" : "withoutgst",
          mrp: variant.mrp,
          sellingPrice: variant.sellingPrice,
          tax: variant.tax,
          size: variant.size,
          color: variant.color,
          openingQuantity: variant.openingQuantity || 0,
          stockQuantity: variant.openingQuantity || 0,
          minStockToMaintain: variant.minStockToMaintain,
          discountAmount: variant.discountAmount,
          discountType: variant.discountType,
          manufacturingDate: variant.manufacturingDate || null,
          expiryDate: variant.expiryDate || null,
          unit: variant.unit,
          gst: variant.purchasePriceTaxType === "withgst",
          ...buildWarrantyFields(variant),
          images: variantImages,
        });
        variantIndex += 1;
      }
    }

    productData.itemBarcode =
      (productData.variants && productData.variants[0] && productData.variants[0].barcode)
        ? productData.variants[0].barcode
        : normalizedTopBarcode;

    productData.checkedExpiry = req.body.checkedExpiry === "true" || req.body.checkedExpiry === true;
    productData.checkedSerial = req.body.checkedSerial === "true" || req.body.checkedSerial === true;
    productData.checkedBatch = req.body.checkedBatch === "true" || req.body.checkedBatch === true;
    productData.checkedWarranty = req.body.checkedWarranty === "true" || req.body.checkedWarranty === true;

    const product = new ProductModel(productData);
    const saved = await product.save();
    res.status(201).json(saved);
  } catch (err) {
    // console.error("Error creating product:", err);
    return next(ApiError.internal("Error creating product"));
  }
};

exports.getAllProducts = async (req, res, next) => {
  try {

    const { Product: ProductModel, Brand: BrandModel, Category: CategoryModel, Subcategory: SubcategoryModel, HSN: HSNModel } = await getAutoModels(req);
    const filter = { isDelete: { $ne: true } };

    if (req.query.brand) filter.brand = req.query.brand;
    if (req.query.category) filter.category = req.query.category;
    if (req.query.subcategory) filter.subcategory = req.query.subcategory;
    if (req.query.hsn) filter.hsn = req.query.hsn;

    if (req.query.search) {
      const escapeRegExp = (s) => String(s).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const q = String(req.query.search || "").trim();
      const re = new RegExp(escapeRegExp(q), "i");

      const [matchingBrands, matchingCategories, matchingSubcategories, matchingHsns] =
        await Promise.all([
          BrandModel.find({ brandName: re }).select("_id").lean(),
          CategoryModel.find({ categoryName: re, isDelete: { $ne: true } }).select("_id").lean(),
          SubcategoryModel.find({ name: re, isDelete: { $ne: true } }).select("_id").lean(),
          HSNModel.find({
            $or: [{ hsnCode: re }, { description: re }],
          })
            .select("_id")
            .lean(),
        ]);

      const brandIds = matchingBrands.map((b) => b._id);
      const categoryIds = matchingCategories.map((c) => c._id);
      const subcategoryIds = matchingSubcategories.map((s) => s._id);
      const hsnIds = matchingHsns.map((h) => h._id);

      const or = [
        { productName: re },
        { description: re },
        { itemBarcode: re },
        { "variants.barcode": re },
        { unit: re },
        { size: re },
        { color: re },
      ];
      if (brandIds.length) or.push({ brand: { $in: brandIds } });
      if (categoryIds.length) or.push({ category: { $in: categoryIds } });
      if (subcategoryIds.length) or.push({ subcategory: { $in: subcategoryIds } });
      if (hsnIds.length) or.push({ hsn: { $in: hsnIds } });

      filter.$or = or;
    }

    // const page = parseInt(req.query.page) || 1;
    // const limit = parseInt(req.query.limit) || 100000;
    // const skip = (page - 1) * limit;

    const [products, total] = await Promise.all([
      ProductModel.find(filter)
        .populate("category", "categoryName")
        .populate("subcategory", "name")
        .populate("brand", "brandName")
        .populate("hsn", "hsnCode description")
        .sort({ createdAt: -1 })
        // .skip(skip)
        // .limit(limit)
        .lean(), // ✅ IMPORTANT
      ProductModel.countDocuments(filter),
    ]);

    const formattedProducts = products.map((p) => {
      const firstVariant = p.variants && p.variants.length > 0 ? p.variants[0] : {};
      const totalStock = (p.variants && p.variants.length > 0)
        ? (p.variants || []).reduce((sum, v) => sum + (v.stockQuantity || 0), 0)
        : (p.legacy_stockQuantity || 0);
      const totalOpening = (p.variants && p.variants.length > 0)
        ? (p.variants || []).reduce((sum, v) => sum + (v.openingQuantity || 0), 0)
        : (p.legacy_stockQuantity || 0);

      return {
        _id: p._id,
        productName: p.productName,
        category: p.category,
        subcategory: p.subcategory,
        brand: p.brand || null,
        description: p.description || "",
        itemBarcode: p.itemBarcode || "",
        hsn: p.hsn,
        lot_pricing: p.lot_pricing || false,
        lotDetails: p.lotDetails || {},
        // Derived from variants
        lotNumber: firstVariant.lotNumber || "",
        modelNo: firstVariant.modelNo || "",
        serialno: firstVariant.serialNumbers || [],
        unit: firstVariant.unit || p.legacy_unit || "",
        purchasePrice: firstVariant.purchasePrice || p.legacy_purchasePrice || 0,
        tax: firstVariant.tax || "",
        openingQuantity: totalOpening,
        stockQuantity: totalStock,
        sellingPrice: firstVariant.sellingPrice || p.legacy_sellingPrice || 0,
        mrp: firstVariant.mrp || 0,
        size: firstVariant.size || "",
        color: firstVariant.color || "",
        minStockToMaintain: firstVariant.minStockToMaintain || 0,
        discountType: firstVariant.discountType || "",
        discountAmount: firstVariant.discountAmount || 0,
        expiryDate: firstVariant.expiryDate || "",
        warrantyPeriod: p.warrantyPeriod || 0,
        images: p.images || [],
        variants: p.variants || [],
        dualUnit: p.dualUnit || false,
        secondaryUnit: p.secondaryUnit || "",
        secondaryUnitQuantity: p.secondaryUnitQuantity ?? null,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });

    res.status(200).json({
      products: formattedProducts,
      total,
      // page,
      // limit,
    });
  } catch (err) {
    return next(ApiError.internal("Failed to load all products"));
  }
};

exports.searchProductsByName = async (req, res, next) => {
  try {

    const { Product: ProductModel } = await getAutoModels(req);
    const { name } = req.query;
    // console.log("Search query received:", name);

    const q = String(name || "").trim();
    const query = q
      ? {
        isDelete: { $ne: true },
        $or: [
          { productName: { $regex: q, $options: "i" } },
          { itemBarcode: { $regex: q, $options: "i" } },
          { "variants.barcode": { $regex: q, $options: "i" } },
        ],
      }
      : { isDelete: { $ne: true } };

    const products = await ProductModel.find(query)
      .populate("category")
      .populate("subcategory")
      .populate("brand")
      .populate("hsn")
      // .populate("supplier")
      .sort({ createdAt: -1 });

    // Add hsnCode and availableQty logic for frontend
    const productsWithDetails = products.map((prod) => {
      let hsnCode = "";
      if (prod.hsn) {
        if (typeof prod.hsn === "object" && prod.hsn !== null) {
          hsnCode =
            prod.hsn.code ||
            prod.hsn.hsnCode ||
            prod.hsn.name ||
            prod.hsn._id ||
            "";
        } else {
          hsnCode = prod.hsn;
        }
      } else if (prod.hsnCode) {
        hsnCode = prod.hsnCode;
      }
      const firstVariant = prod.variants && prod.variants.length > 0 ? prod.variants[0] : {};
      const availableQty = (prod.variants && prod.variants.length > 0)
        ? (prod.variants || []).reduce((sum, v) => sum + (v.stockQuantity || 0), 0)
        : (prod.legacy_stockQuantity || 0);
      const availableStock = availableQty;
      return { ...prod._doc, hsnCode, availableQty, availableStock, lotNumber: firstVariant.lotNumber || "" };
    });
    res.status(200).json(productsWithDetails);
  } catch (err) {
    return next(ApiError.internal("Failed to search products"));
  }
};

exports.getProductStock = async (req, res, next) => {
  try {
    const { Product: ProductModel } = await getAutoModels(req);
    // Pagination params
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await ProductModel.countDocuments({ isDelete: { $ne: true } });
    const products = await ProductModel.find({ isDelete: { $ne: true } })
      .populate("brand")
      .populate("category")
      .populate("subcategory")
      .populate("hsn")
      // .populate("supplier")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // Helper to calculate available stock for a product
    const calculateAvailableStock = (prod) => {
      const qty = Number(prod.quantity) || 0;
      let newQuantitySum = 0;
      if (Array.isArray(prod.newQuantity)) {
        newQuantitySum = prod.newQuantity.reduce((acc, n) => {
          const num = Number(n);
          return acc + (isNaN(num) ? 0 : num);
        }, 0);
      } else if (typeof prod.newQuantity === "number") {
        newQuantitySum = Number(prod.newQuantity);
      }
      return qty + newQuantitySum;
    };

    const productsWithStock = products.map((prod) => {
      let hsnCode = "";
      if (prod.hsn) {
        if (typeof prod.hsn === "object" && prod.hsn !== null) {
          hsnCode =
            prod.hsn.code ||
            prod.hsn.hsnCode ||
            prod.hsn.name ||
            prod.hsn._id ||
            "";
        } else {
          hsnCode = prod.hsn;
        }
      } else if (prod.hsnCode) {
        hsnCode = prod.hsnCode;
      }

      const availableStock = (prod.variants && prod.variants.length > 0)
        ? prod.variants.reduce((sum, v) => sum + (v.stockQuantity || 0), 0)
        : (prod.legacy_stockQuantity || 0);
      const firstVariant = prod.variants && prod.variants.length > 0 ? prod.variants[0] : {};
      const purchasePrice = Number(firstVariant.purchasePrice || prod.legacy_purchasePrice) || 0;
      const stockValue = availableStock * purchasePrice;
      let warehouseName = "";
      if (prod.warehouse) {
        if (typeof prod.warehouse === "object" && prod.warehouse !== null) {
          warehouseName =
            prod.warehouse.name ||
            prod.warehouse.warehouseName ||
            prod.warehouse._id ||
            "";
        } else {
          warehouseName = prod.warehouse;
        }
      }

      let image = "";
      if (Array.isArray(prod.images) && prod.images.length > 0) {
        image = prod.images[0].url;
      }
      return {
        _id: prod._id,
        productName: prod.productName,
        hsnCode,
        availableStock,
        unit: firstVariant.unit || prod.legacy_unit || "",
        purchasePrice,
        stockValue,
        warehouseName,
        image,
      };
    });
    res.status(200).json({
      products: productsWithStock,
      total,
      page,
      limit,
    });
  } catch (err) {
    return next(ApiError.internal("Failed to fetch product stock"));
  }
};

exports.getPurchaseReturnStock = async (req, res, next) => {
  try {
    const { Product: ProductModel } = await getAutoModels(req);
    const products = await ProductModel.find({ isDelete: { $ne: true } })
      .populate("brand")
      .populate("category")
      .populate("subcategory")
      .populate("hsn")
      .populate("supplier")
      .sort({ createdAt: -1 });

    const productsWithReturnStock = products.map((prod) => {
      let hsnCode = "";
      if (prod.hsn) {
        if (typeof prod.hsn === "object" && prod.hsn !== null) {
          hsnCode =
            prod.hsn.code ||
            prod.hsn.hsnCode ||
            prod.hsn.name ||
            prod.hsn._id ||
            "";
        } else {
          hsnCode = prod.hsn;
        }
      } else if (prod.hsnCode) {
        hsnCode = prod.hsnCode;
      }
      // Calculate availableReturnStock as purchaseReturnQuantity - sum(newPurchaseReturnQuantity)
      const qty = Number(prod.purchaseReturnQuantity) || 0;
      let newQuantitySum = 0;
      if (Array.isArray(prod.newPurchaseReturnQuantity)) {
        newQuantitySum = prod.newPurchaseReturnQuantity.reduce((acc, n) => {
          const num = Number(n);
          return acc + (isNaN(num) ? 0 : num);
        }, 0);
      } else if (typeof prod.newPurchaseReturnQuantity === "number") {
        newQuantitySum = Number(prod.newPurchaseReturnQuantity);
      }
      const availableReturnStock = qty - newQuantitySum;
      const purchasePrice = Number(prod.purchasePrice) || 0;
      const stockValue = availableReturnStock * purchasePrice;
      return {
        _id: prod._id,
        productName: prod.productName,
        hsnCode,
        availableReturnStock,
        unit: prod.unit,
        purchasePrice,
        stockValue,
      };
    });
    res.status(200).json(productsWithReturnStock);
  } catch (err) {
    return next(ApiError.internal("Failed to fetch purchase return stock"));
  }
};

exports.getProductById = async (req, res, next) => {
  try {
    const { Product: ProductModel } = await getAutoModels(req);
    const product = await ProductModel.findOne({
      _id: req.params.id,
      isDelete: { $ne: true },
    })
      .populate("category")
      .populate("subcategory")
      .populate("brand")
      .populate("hsn");
    if (!product) return next(ApiError.notFound("Product not found"));
    res.status(200).json(product);
  } catch (err) {
    return next(ApiError.internal("Product Not Found by this id"));
  }
};

exports.duplicateProduct = async (req, res, next) => {
  try {
    const { Product: ProductModel } = await getAutoModels(req);
    const original = await ProductModel.findOne({
      _id: req.params.id,
      isDelete: { $ne: true },
    });

    if (!original) return next(new Error("Product not found"));

    const newBarcode = await generateUniqueBarcode(ProductModel);
    if (!newBarcode) return next(new Error("Unable to generate unique barcode"));

    const data = original.toObject();
    delete data._id;
    delete data.__v;
    delete data.createdAt;
    delete data.updatedAt;
    delete data.id;
    data.itemBarcode = newBarcode;

    if (Array.isArray(data.variants) && data.variants.length > 0) {
      const barcodesInRequest = new Set([newBarcode]);
      let idx = 0;
      for (const v of data.variants) {
        delete v._id;
        delete v.id;
        if (idx === 0) {
          v.barcode = newBarcode;
        } else {
          let generated = await generateUniqueBarcode(ProductModel);
          while (generated && barcodesInRequest.has(generated)) {
            generated = await generateUniqueBarcode(ProductModel);
          }
          if (!generated) return next(new Error("Unable to generate unique barcode"));
          v.barcode = generated;
        }
        barcodesInRequest.add(v.barcode);
        idx += 1;
      }
    }

    const duplicated = await ProductModel.create(data);

    // await createAuditLog({
    //   user: req.user,
    //   module: "Product",
    //   action: "CREATE",
    //   description: `Duplicated product: ${duplicated.productName}`,
    //   oldData: original,
    //   newData: duplicated,
    //   req,
    // });

    return res.status(201).json(duplicated);
  } catch (err) {
    return next(new Error("Error: " + err));
  }
};

exports.getProductBarcodeDetails = async (req, res, next) => {
  try {
    const { Product: ProductModel } = await getAutoModels(req);
    const product = await ProductModel.findOne({
      _id: req.params.id,
      isDelete: { $ne: true },
    })
      .populate("category")
      .populate("subcategory")
      .populate("hsn");
    if (!product) return next(ApiError.notFound("Product not found"));

    const qty = Number(product.openingQuantity) || 0;
    let newQuantitySum = 0;
    if (Array.isArray(product.newQuantity)) {
      newQuantitySum = product.newQuantity.reduce(
        (acc, n) => acc + (isNaN(Number(n)) ? 0 : Number(n)),
        0,
      );
    } else if (typeof product.newQuantity === "number") {
      newQuantitySum = Number(product.newQuantity);
    }
    const availableQty = qty + newQuantitySum;

    const result = {
      _id: product._id,
      productName: product.productName,
      sellingPrice: Number(product.sellingPrice) || 0,
      unit: product.unit || "pcs",
      itemBarcode: product.itemBarcode || null,
      availableQty,
      images: product.images || [],
    };

    res.status(200).json(result);
  } catch (err) {
    return next(ApiError.internal("Failed to fetch product barcode details"));
  }
};

exports.getProductByBarcode = async (req, res, next) => {
  try {
    const { Product: ProductModel } = await getAutoModels(req);
    let code = req.params.code;
    if (!code) return next(ApiError.badRequest("Barcode is required"));

    // Normalize: trim and try to be tolerant to common variations (whitespace, non-digits,
    // 12 vs 13-digit EAN prefix differences). Many scanners/paste sources may include\n+    // newlines or stray chars.
    code = String(code).trim();

    const tryFind = async (candidate) => {
      if (!candidate) return null;
      return await ProductModel.findOne({
        isDelete: { $ne: true },
        $or: [{ itemBarcode: candidate }, { "variants.barcode": candidate }],
      })
        .populate("category")
        .populate("subcategory")
        .populate("hsn");
    };

    const candidates = [];
    const pushCandidate = (c) => {
      if (!c) return;
      const s = String(c).trim();
      if (!s) return;
      if (!candidates.includes(s)) candidates.push(s);
    };

    pushCandidate(code);
    const digits = (code.match(/\d+/g) || []).join("");
    pushCandidate(digits);

    const numeric = String(code).replace(/\D/g, "");
    if (numeric.length === 12) {
      pushCandidate(numeric);
      pushCandidate("0" + numeric);
    } else if (numeric.length === 13) {
      pushCandidate(numeric);
      if (numeric.startsWith("0")) pushCandidate(numeric.slice(1));
    }

    let product = null;
    let matchedBarcode = null;
    for (const candidate of candidates) {
      product = await tryFind(candidate);
      if (product) {
        matchedBarcode = candidate;
        break;
      }
    }

    if (!product)
      return next(ApiError.notFound("Product not found for given barcode"));

    // Calculate available stock similar to other endpoints
    const qty = Number(product.openingQuantity) || 0;
    let newQuantitySum = 0;
    if (Array.isArray(product.newQuantity)) {
      newQuantitySum = product.newQuantity.reduce(
        (acc, n) => acc + (isNaN(Number(n)) ? 0 : Number(n)),
        0,
      );
    } else if (typeof product.newQuantity === "number") {
      newQuantitySum = Number(product.newQuantity);
    }
    const availableQty = qty + newQuantitySum;

    const matchedVariant = matchedBarcode
      ? (Array.isArray(product.variants)
        ? product.variants.find((v) => String(v.barcode || "").trim() === matchedBarcode)
        : null)
      : null;

    res.status(200).json({ ...product._doc, availableQty, matchedBarcode, matchedVariant });
  } catch (err) {
    return next(ApiError.internal("Failed to fetch product by barcode"));
  }
};

exports.generateBarcode = async (req, res, next) => {
  try {
    const { Product: ProductModel } = await getAutoModels(req);
    const { productId, variantId } = req.body || {};

    if (variantId && !productId) {
      return next(ApiError.badRequest("productId is required when variantId is provided"));
    }

    const candidate = await generateUniqueBarcode(ProductModel);
    if (!candidate) {
      return next(ApiError.internal("Failed to generate unique barcode"));
    }

    let updatedProduct = null;
    if (productId && variantId) {
      updatedProduct = await ProductModel.findOneAndUpdate(
        { _id: productId, "variants._id": variantId },
        { $set: { "variants.$.barcode": candidate } },
        { new: true },
      );
      if (!updatedProduct) {
        return next(ApiError.notFound("Product/Variant not found"));
      }
    } else if (productId) {
      updatedProduct = await ProductModel.findByIdAndUpdate(
        productId,
        { itemBarcode: candidate },
        { new: true },
      );
    }

    return res.status(200).json({ barcode: candidate, product: updatedProduct });
  } catch (err) {
    return next(ApiError.internal("Failed to generate unique barcode"));
  }
};

exports.updateProduct = async (req, res, next) => {
  try {
    const { Product: ProductModel } = await getAutoModels(req);
    const {
      productName,
      sku,
      brand,
      category,
      subcategory,
      // supplier,
      // itemBarcode,
      store,
      warehouse,
      purchasePrice,
      sellingPrice,
      wholesalePrice,
      retailPrice,
      quantity,
      unit,
      taxType,
      tax,
      discountType,
      discountAmount,
      minStockToMaintain,
      description,
      seoTitle,
      seoDescription,
      hsn,
      variants: variantsRaw,
      lot_pricing,
      lotNumber,
      stockQuantity,
    } = req.body;

    // lot_pricing-specific validations
    if (String(lot_pricing) === "true" || lot_pricing === true) {
      // Check variants array if it exists
      let firstLotNo = lotNumber;
      if (!firstLotNo && variantsRaw) {
        try {
          const v = typeof variantsRaw === "string" ? JSON.parse(variantsRaw) : variantsRaw;
          if (Array.isArray(v) && v.length > 0) {
            firstLotNo = v[0].lotNumber;
          }
        } catch (e) { }
      }
      // if (!firstLotNo || String(firstLotNo).trim().length === 0) {
      //   return next(ApiError.badRequest("Lot Number is required when using Lot / Batch"));
      // }
    }

    const oldProduct = await ProductModel.findById(req.params.id);
    if (!oldProduct) return next(ApiError.notFound("Product not found"));

    let variants = [];
    if (typeof variantsRaw !== "undefined") {
      try {
        if (typeof variantsRaw === "string") {
          variants = JSON.parse(variantsRaw);
        } else if (Array.isArray(variantsRaw)) {
          variants = variantsRaw;
        } else if (typeof variantsRaw === "object" && variantsRaw !== null) {
          variants = [variantsRaw];
        }
      } catch (e) {
        variants = [];
      }
    }
    let lotDetails = {};
    if (typeof req.body.lotDetails !== "undefined") {
      try {
        if (typeof req.body.lotDetails === "string") {
          lotDetails = JSON.parse(req.body.lotDetails);
        } else if (
          typeof req.body.lotDetails === "object" &&
          req.body.lotDetails !== null
        ) {
          lotDetails = req.body.lotDetails;
        }
      } catch (e) {
        lotDetails = {};
      }
    }
    if (
      !lotDetails ||
      typeof lotDetails !== "object" ||
      Array.isArray(lotDetails)
    ) {
      lotDetails = {};
    }
    // Upload new images if provided
    let newImages = [];
    if (req.files && req.files.length > 0) {
      const uploadedImages = await Promise.all(
        req.files.map((file) =>
          cloudinary.uploader.upload(file.path, { folder: "product_images" }),
        ),
      );
      newImages = uploadedImages.map((img) => ({
        url: img.secure_url,
        public_id: img.public_id,
      }));
    }

    // Merge existing images from frontend
    let existingImages = [];
    if (req.body.existingImages) {
      try {
        const parsed = JSON.parse(req.body.existingImages);
        existingImages = parsed
          .filter(img => img && (typeof img === "string" || img.url))
          .map((img) => {
            if (typeof img === "string") {
              return { url: img, public_id: "" };
            } else {
              return { url: img.url, public_id: img.public_id || "" };
            }
          });
      } catch (e) {
        existingImages = [];
      }
    }

    // Logic to handle discountType and discountValue for update
    let updateData = { ...req.body };
    delete updateData.images;
    delete updateData.existingImages; // We'll handle this manually
    updateData.itemBarcode = oldProduct.itemBarcode || updateData.itemBarcode || "";

    // Handle variants if provided
    if (req.body.variants) {
      try {
        const variantsArr = typeof req.body.variants === "string"
          ? JSON.parse(req.body.variants)
          : req.body.variants;

        if (Array.isArray(variantsArr)) {
          const barcodesInRequest = new Set();
          let variantImageIndex = 0;
          const nextVariants = [];
          const oldVariants = Array.isArray(oldProduct.variants) ? oldProduct.variants : [];

          for (const [variantIndex, v] of variantsArr.entries()) {
            const count = parseInt(v.imageCount, 10) || 0;
            const newVariantImages = newImages.slice(variantImageIndex, variantImageIndex + count);
            variantImageIndex += count;

            const existingVariantImages = (Array.isArray(v.images) ? v.images : [])
              .filter(img => img && img.url)
              .map(img => ({
                url: img.url,
                public_id: img.public_id || ""
              }));

            let existingVariant = null;
            if (v && v._id && oldProduct.variants && typeof oldProduct.variants.id === "function") {
              existingVariant = oldProduct.variants.id(v._id);
            }
            if (!existingVariant && oldVariants[variantIndex]) {
              existingVariant = oldVariants[variantIndex];
            }

            let barcode = existingVariant && existingVariant.barcode
              ? String(existingVariant.barcode).trim()
              : "";

            if (!barcode && v && v.barcode) {
              barcode = String(v.barcode).trim();
            }

            if (barcode) {
              if (barcodesInRequest.has(barcode)) {
                return next(ApiError.badRequest("Duplicate barcode found in variants"));
              }
              const exists = await ProductModel.exists({
                _id: { $ne: req.params.id },
                isDelete: { $ne: true },
                $or: [{ itemBarcode: barcode }, { "variants.itemBarcode": barcode }],
              });
              if (exists) {
                return next(ApiError.badRequest("Barcode already exists"));
              }
              barcodesInRequest.add(barcode);
            } else {
              let generated = await generateUniqueBarcode(ProductModel);
              while (generated && barcodesInRequest.has(generated)) {
                generated = await generateUniqueBarcode(ProductModel);
              }
              if (!generated) {
                return next(ApiError.internal("Unable to generate unique barcode"));
              }
              barcode = generated;
              barcodesInRequest.add(barcode);
            }

            nextVariants.push({
              ...v,
              _id: existingVariant && existingVariant._id ? existingVariant._id : v._id,
              barcode,
              serialNumbers: v.serialNumbers || [],
              openingQuantity: v.openingQuantity || 0,
              stockQuantity: v.stockQuantity || 0,
              purchasePrice: normalizePurchasePrice(
                v.purchasePrice,
                v.tax,
                v.purchasePriceTaxType,
              ),
              purchasePriceTaxType: v.purchasePriceTaxType === "withgst" ? "withgst" : "withoutgst",
              gst: v.purchasePriceTaxType === "withgst",
              ...buildWarrantyFields(v),
              images: [...existingVariantImages, ...newVariantImages]
            });
          }

          updateData.variants = nextVariants;
          if (updateData.variants && updateData.variants.length > 0) {
            updateData.itemBarcode = updateData.variants[0].barcode || oldProduct.itemBarcode || "";
          }
        }
      } catch (e) {
        console.error("Error parsing variants for update:", e);
      }
    }

    // DERIVE GLOBAL IMAGES FROM VARIANTS IF VARIANTS EXIST
    // This ensures that variant images are always reflected in the global array
    let allImages = [];
    if (updateData.variants && updateData.variants.length > 0) {
      // Flatten all images from all variants
      const variantImages = updateData.variants.flatMap(v => v.images || []);
      // Remove duplicates based on url/public_id if necessary, but flatMap is usually what's wanted
      allImages = variantImages;
    } else {
      // Fallback to global images if no variants
      allImages = [...existingImages, ...newImages];
    }

    // REMOVE REDUNDANT TOP-LEVEL FIELDS
    const redundantFields = [
      "lotNumber", "modelNo", "serialno", "serialNumbers", "unit", "purchasePrice", "tax",
      "openingQuantity", "stockQuantity", "sellingPrice", "mrp", "size", "color",
      "minStockToMaintain", "discountAmount", "discountType", "discountValue"
    ];
    redundantFields.forEach(field => delete updateData[field]);
    updateData.productType = req.body.productType === "Variant" ? "Variant" : "Single";
    if (updateData.productType === "Single" && Array.isArray(updateData.variants)) {
      updateData.variants = updateData.variants.slice(0, 1);
    }
    updateData.dualUnit = toBoolean(req.body.dualUnit);
    updateData.secondaryUnit = updateData.dualUnit ? (req.body.secondaryUnit || "") : "";
    updateData.secondaryUnitQuantity = updateData.dualUnit
      ? Number(req.body.secondaryUnitQuantity || 0)
      : 0;
    if (req.body.subCategory) {
      updateData.subcategory = req.body.subCategory;
      delete updateData.subCategory;
    }

    if (typeof req.body.checkedExpiry !== "undefined") {
      updateData.checkedExpiry = req.body.checkedExpiry === "true" || req.body.checkedExpiry === true;
    }
    if (typeof req.body.checkedSerial !== "undefined") {
      updateData.checkedSerial = req.body.checkedSerial === "true" || req.body.checkedSerial === true;
    }
    if (typeof req.body.checkedBatch !== "undefined") {
      updateData.checkedBatch = req.body.checkedBatch === "true" || req.body.checkedBatch === true;
    }
    if (typeof req.body.checkedWarranty !== "undefined") {
      updateData.checkedWarranty = req.body.checkedWarranty === "true" || req.body.checkedWarranty === true;
    }

    // Clean up empty ObjectId fields to prevent BSONError
    if (updateData.hsn === "" || updateData.hsn === "null" || updateData.hsn === "undefined") {
      delete updateData.hsn;
    }
    if (updateData.category === "" || updateData.category === "null" || updateData.category === "undefined") {
      delete updateData.category;
    }
    if (updateData.subcategory === "" || updateData.subcategory === "null" || updateData.subcategory === "undefined") {
      delete updateData.subcategory;
    }
    if (updateData.brand === "" || updateData.brand === "null" || updateData.brand === "undefined") {
      delete updateData.brand;
    }
    if (updateData.warehouse === "" || updateData.warehouse === "null" || updateData.warehouse === "undefined") {
      delete updateData.warehouse;
    }

    const updatedProduct = await ProductModel.findByIdAndUpdate(
      req.params.id,
      {
        ...updateData,
        images: allImages,
        lotDetails,
      },
      { new: true },
    );

    if (!updatedProduct)
      return next(ApiError.notFound("Product not found"));
    // Log the update
    await createAuditLog({
      user: req.user,
      module: "Product",
      action: "UPDATE",
      description: `Updated product: ${updatedProduct.productName}`,
      oldData: oldProduct,
      newData: updatedProduct,
      req,
    });

    res.status(200).json(updatedProduct);
  } catch (err) {
    // return next(ApiError.badRequest(err.message));
    return next(ApiError.internal("Failed to update product"));
  }
};

exports.deleteProductImage = async (req, res, next) => {
  try {
    const { Product: ProductModel } = await getAutoModels(req);
    const { id } = req.params;
    const { public_id } = req.body;
    if (!public_id)
      return next(ApiError.badRequest("Public id is required"));
    // delete from cloudinary
    await cloudinary.uploader.destroy(public_id);
    // remove from mongodb
    const updatedProduct = await ProductModel.findByIdAndUpdate(
      id,
      { $pull: { images: { public_id } } },
      { new: true },
    );
    if (!updatedProduct)
      return next(ApiError.notFound("Product not found"));

    res
      .status(200)
      .json({ message: "Image deleted", images: updatedProduct.images });
  } catch (err) {
    return next(ApiError.internal("Failed to delete product image"));
  }
};

exports.deleteProduct = async (req, res, next) => {
  try {
    const { Product: ProductModel } = await getAutoModels(req);
    // console.log("Attempting to soft delete product:", req.params.id);
    const product = await ProductModel.findById(req.params.id);
    if (!product) return next(ApiError.notFound("Product not found"));

    product.isDelete = true;
    const deleted = await product.save();

    // console.log("Soft delete result:", deleted);

    // Log the deletion
    await createAuditLog({
      user: req.user,
      module: "Product",
      action: "DELETE",
      description: `Soft deleted product: ${deleted.productName}`,
      oldData: deleted,
      req,
    });
    res.status(200).json({ message: "Product deleted successfully" });
  } catch (err) {
    return next(ApiError.internal("Failed to delete product"));
  }
};

exports.importProducts = async (req, res, next) => {
  try {
    const { Product: ProductModel } = await getAutoModels(req);
    if (!req.file) return next(ApiError.badRequest("File is required"));

    const workbook = xlsx.readFile(req.file.path);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const data = xlsx.utils.sheet_to_json(sheet);

    const importedProducts = [];

    for (const row of data) {
      const product = new Product({
        productName: row.productName,
        sku: row.sku,
        brand: row.brand, // Make sure this is an ObjectId if using ref
        category: row.category,
        subcategory: row.subcategory,
        // supplier: row.supplier,
        // itemBarcode: row.itemBarcode,
        store: row.store,
        // warehouse: row.warehouse,
        purchasePrice: row.purchasePrice,
        sellingPrice: row.sellingPrice,
        wholesalePrice: row.wholesalePrice,
        retailPrice: row.retailPrice,
        quantity: row.quantity,
        unit: row.unit,
        taxType: row.taxType,
        tax: row.tax,
        discountType: row.discountType,
        discountValue: row.discountValue,
        quantityAlert: row.quantityAlert,
        description: row.description,
        seoTitle: row.seoTitle,
        seoDescription: row.seoDescription,
        variants: row.variants ? JSON.parse(row.variants) : {},
        itemType: row.itemType,
        isAdvanced: row.isAdvanced,
        trackType: row.trackType,
        isReturnable: row.isReturnable,
        leadTime: row.leadTime,
        reorderLevel: row.reorderLevel,
        initialStock: row.initialStock,
        serialNumber: row.serialNumber,
        batchNumber: row.batchNumber,
        returnable: row.returnable,
        expirationDate: row.expirationDate
          ? new Date(row.expirationDate)
          : null,
      });
      const saved = await product.save();
      importedProducts.push(saved);
    }

    res
      .status(201)
      .json({ message: "Products imported", count: importedProducts.length });
  } catch (error) {
    return next(ApiError.internal("Failed to import products"));
  }
};

exports.getUpcomingExpiryProducts = async (req, res, next) => {
  try {
    const { Product: ProductModel } = await getAutoModels(req);
    const today = new Date();
    const tenDaysLater = new Date();
    tenDaysLater.setDate(today.getDate() + 10);
    // Find products with expirationDate between today and tenDaysLater
    const products = await ProductModel.find({
      expirationDate: { $gte: today, $lte: tenDaysLater },
      isDelete: { $ne: true },
    })
      .populate("brand")
      .populate("category")
      .populate("subcategory")
      .populate("hsn")
      // .populate("supplier")
      .populate("warehouse")
      .sort({ expirationDate: 1 });
    res.status(200).json(products);
  } catch (err) {
    return next(ApiError.internal("Failed to fetch upcoming expiry products"));
  }
};

exports.updateOpeningQuantityBulk = async (req, res, next) => {
  try {
    const { Product: ProductModel } = await getAutoModels(req);
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return next(ApiError.badRequest("Items array is required"));
    }
    const results = [];
    for (const it of items) {
      const productId = it && it.productId;
      const qty = Number(it && it.quantity);
      if (!productId || !Number.isFinite(qty) || qty <= 0) {
        results.push({
          productId,
          status: "skipped",
          reason: "Invalid productId or quantity",
        });
        continue;
      }
      const product = await ProductModel.findById(productId);
      if (!product) {
        results.push({
          productId,
          status: "skipped",
          reason: "Product not found",
        });
        continue;
      }
      const currentOpening = Number(product.openingQuantity || 0);
      const newOpening = Math.max(0, currentOpening - qty);
      await ProductModel.findByIdAndUpdate(productId, {
        $set: { openingQuantity: newOpening },
      });
      results.push({
        productId,
        status: "updated",
        previousOpeningQuantity: currentOpening,
        quantityDeducted: qty,
        newOpeningQuantity: newOpening,
      });
    }
    res.status(200).json({
      success: true,
      message: "Opening quantities updated",
      updatedCount: results.filter((r) => r.status === "updated").length,
      results,
    });
  } catch (err) {
    return next(ApiError.internal("Failed to update opening quantities"));
  }
};

exports.getAllExistingProducts = async (req, res, next) => {
  try {
    const { Product: ProductModel } = await getAutoModels(req);

    const products = await ProductModel.find()
      .populate("category")
      .populate("subcategory")
      .populate("brand")
      .populate("hsn");

    res.status(200).json({
      products,
      total: products.length,
    });
  } catch (err) {
    return next(ApiError.internal("Failed to fetch all existing products"));
  }
};

exports.getDeletedProducts = async (req, res, next) => {
  try {
    const { Product: ProductModel } = await getAutoModels(req);

    const products = await ProductModel.find({
      isDelete: true,
    })
      .populate("category")
      .populate("subcategory")
      .populate("brand")
      .populate("hsn");

    res.status(200).json(products);
  } catch (err) {
    return next(ApiError.internal("Failed to fetch deleted products"));
  }
};

exports.restoreProduct = async (req, res, next) => {
  try {
    const { Product: ProductModel } = await getAutoModels(req);
    const product = await ProductModel.findById(req.params.id);
    if (!product) return next(ApiError.notFound("Product not found"));

    product.isDelete = false;
    await product.save();

    res.status(200).json({ message: "Product restored successfully" });
  } catch (err) {
    return next(ApiError.internal("Failed to restore product"));
  }
};
