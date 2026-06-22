const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");

const adjustProductStock = async (ProductModel, productId, delta) => {
  const product = await ProductModel.findById(productId);
  if (!product) return null;

  const variants = Array.isArray(product.variants) ? product.variants : [];
  if (variants.length > 0) {
    if (delta < 0) {
      let toRemove = Math.abs(delta);
      for (const v of variants) {
        if (toRemove <= 0) break;
        const current = Number(v.stockQuantity) || 0;
        if (current <= 0) continue;
        const dec = Math.min(current, toRemove);
        v.stockQuantity = current - dec;
        toRemove -= dec;
      }
    } else if (delta > 0) {
      const first = variants[0];
      const current = Number(first.stockQuantity) || 0;
      first.stockQuantity = current + delta;
    }

    await product.save();
    return product;
  }

  const currentLegacy = Number(product.legacy_stockQuantity) || 0;
  product.legacy_stockQuantity = Math.max(0, currentLegacy + delta);
  await product.save();
  return product;
};

exports.createDamage = async (req, res, next) => {
  try {
    const { DamageReturn: DamageReturnModel, Product: ProductModel } = await getAutoModels(req);
    const { category, product, quantity, remarks } = req.body;
    if (!category || !product) {
      return res.status(400).json({ message: "Category and product are required" });
    }
    const qty = Number(quantity);
    if (!Number.isFinite(qty) || qty <= 0) {
      return res.status(400).json({ message: "Quantity must be a positive number" });
    }

    const prod = await ProductModel.findById(product);
    if (!prod) return res.status(404).json({ message: "Product not found" });

    // Optional: ensure category matches product's category
    if (String(prod.category) !== String(category)) {
      return res.status(400).json({ message: "Selected product does not belong to selected category" });
    }

    const max = Number(prod.stockQuantity) || 0;
    if (qty > max) {
      return res.status(400).json({ message: `Quantity cannot exceed opening quantity (${max})` });
    }

    const doc = await DamageReturnModel.create({
      category,
      product,
      quantity: qty,
      remarks: remarks || "",
      createdBy: req.user?._id,
    });

    await adjustProductStock(ProductModel, product, -qty);

    res.status(201).json(doc);
  } catch (err) {
    next(err);
  }
};

exports.getDamages = async (req, res, next) => {
  try {
    const { DamageReturn: DamageReturnModel, Product: ProductModel, Category: CategoryModel } = await getAutoModels(req);
    const mongoose = require("mongoose");
    const { category, search } = req.query;
    const page = Math.max(1, parseInt(req.query.page) || 1);
    const limit = Math.max(1, parseInt(req.query.limit) || 10);
    const skip = (page - 1) * limit;

    const matchStage = {
      $or: [{ isDelete: false }, { isDelete: { $exists: false } }]
    };
    if (category) {
      try {
        matchStage.category = new mongoose.Types.ObjectId(category);
      } catch (e) { /* ignore invalid id */ }
    }

    const pipeline = [
      { $match: matchStage },
      {
        $lookup: {
          from: ProductModel.collection.name,
          localField: "product",
          foreignField: "_id",
          as: "product",
        },
      },
      { $unwind: "$product" },
    ];

    pipeline.push(
      {
        $lookup: {
          from: CategoryModel.collection.name,
          localField: "category",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      ...(search && search.trim()
        ? [
          {
            $match: {
              $or: [
                { "product.productName": { $regex: search.trim(), $options: "i" } },
                { "category.categoryName": { $regex: search.trim(), $options: "i" } },
                { remarks: { $regex: search.trim(), $options: "i" } },
              ],
            },
          },
        ]
        : []),
      { $sort: { createdAt: -1 } },
      {
        $facet: {
          items: [{ $skip: skip }, { $limit: limit }],
          totalCount: [{ $count: "count" }],
        },
      }
    );

    const result = await DamageReturnModel.aggregate(pipeline);
    const items = (result[0]?.items || []).map((doc) => ({
      _id: doc._id,
      product: {
        _id: doc.product._id,
        productName: doc.product.productName,
        unit: doc.product.unit || "",
        stockQuantity: doc.product.stockQuantity,
        images: doc.product.images,
      },
      category: {
        _id: doc.category._id,
        categoryName: doc.category.categoryName,
      },
      quantity: doc.quantity,
      remarks: doc.remarks || "",
      createdAt: doc.createdAt,
    }));
    const total = result[0]?.totalCount?.[0]?.count || 0;
    res.status(200).json({ items, total, page, limit });
  } catch (err) {
    next(err);
  }
};

exports.getDamageCategories = async (req, res, next) => {
  try {
    const { DamageReturn: DamageReturnModel, Category: CategoryModel } = await getAutoModels(req);
    const pipeline = [
      { $match: { $or: [{ isDelete: false }, { isDelete: { $exists: false } }] } },
      { $group: { _id: "$category" } },
      {
        $lookup: {
          from: CategoryModel.collection.name,
          localField: "_id",
          foreignField: "_id",
          as: "category",
        },
      },
      { $unwind: "$category" },
      {
        $match: {
          $or: [{ "category.isDelete": false }, { "category.isDelete": { $exists: false } }],
        },
      },
      { $sort: { "category.categoryName": 1 } },
      { $project: { _id: "$category._id", categoryName: "$category.categoryName" } },
    ];

    const categories = await DamageReturnModel.aggregate(pipeline);
    res.status(200).json(categories);
  } catch (err) {
    next(err);
  }
};

exports.deleteDamage = async (req, res, next) => {
  try {
    const { DamageReturn: DamageReturnModel, Product: ProductModel } = await getAutoModels(req);
    const { id } = req.params;
    const doc = await DamageReturnModel.findById(id);
    if (!doc) {
      return res.status(404).json({ message: "Damage report not found" });
    }
    if (doc.isDelete) {
      return res.status(200).json({ message: "Damage report already deleted", damage: doc });
    }
    const qty = Math.max(0, Number(doc.quantity) || 0);
    if (qty > 0 && doc.product) {
      await adjustProductStock(ProductModel, doc.product, qty);
    }
    doc.isDelete = true;
    await doc.save();
    res.status(200).json({ message: "Damage report deleted and stock restored", damage: doc });
  } catch (err) {
    next(err);
  }
};

exports.updateDamage = async (req, res, next) => {
  try {
    const { DamageReturn: DamageReturnModel, Product: ProductModel } = await getAutoModels(req);
    const { id } = req.params;
    const { quantity, remarks } = req.body;

    const damage = await DamageReturnModel.findById(id);
    if (!damage) {
      return res.status(404).json({ message: "Damage report not found" });
    }

    const newQty = Number(quantity);
    if (!Number.isFinite(newQty) || newQty < 0) {
      return res.status(400).json({ message: "Quantity must be a non-negative number" });
    }

    const oldQty = Number(damage.quantity) || 0;
    const diff = newQty - oldQty;

    if (diff !== 0) {
      const product = await ProductModel.findById(damage.product);
      if (!product) {
        return res.status(404).json({ message: "Associated product not found" });
      }

      if (diff > 0 && product.stockQuantity < diff) {
        return res.status(400).json({
          message: `Insufficient stock to increase damage quantity. Available: ${product.stockQuantity}`
        });
      }

      await adjustProductStock(ProductModel, damage.product, -diff);
    }

    damage.quantity = newQty;
    if (remarks !== undefined) damage.remarks = remarks;

    await damage.save();

    res.status(200).json(damage);
  } catch (err) {
    next(err);
  }
};
