const xlsx = require('xlsx');
const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");

exports.getPaginatedHSN = async (req, res, next) => {
  const page = Math.max(parseInt(req.query.page) || 1, 1);
  const limit = Math.max(parseInt(req.query.limit) || 10, 1);
  const search = req.query.search ? req.query.search.trim() : '';

  try {
    const { HSN: HSNModel } = await getAutoModels(req);
    let query = { isDeleted: false };

    if (search) {
      const orConditions = [
        { hsnCode: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
      ];

      const searchAsNumber = Number(search);
      if (!isNaN(searchAsNumber)) {
        orConditions.push({ gstRate: { $eq: searchAsNumber } });
      }

      query = { $or: orConditions };
    }

    const [items, total] = await Promise.all([
      HSNModel.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .sort({ createdAt: -1 }),
      HSNModel.countDocuments(query)
    ]);

    res.json({ items, page, limit, total, pages: Math.ceil(total / limit) });
  } catch (err) {
    next(err);
  }
};

exports.getAllHSN = async (req, res, next) => {
  try {
    const { HSN: HSNModel } = await getAutoModels(req);
    const items = await HSNModel.find()
      .select("hsnCode description gstRate createdAt") // select fields needed
      .sort({ createdAt: -1 });

    res.json({ success: true, data: items });
  } catch (err) {
    // res.status(500).json({ success: false, message: err.message });
    next(err);
  }
};

exports.createHSN = async (req, res, next) => {
  const { hsnCode, description, gstRate } = req.body;
  try {
    const { HSN: HSNModel } = await getAutoModels(req);
    // Validate gstRate
    if (gstRate !== undefined && (isNaN(gstRate) || gstRate < 0)) {
      return res.status(400).json({ message: "GST Rate must be a non-negative number" }).sort({ createdAt: -1 });
    }
    
    const hsn = new HSNModel({ hsnCode, description, gstRate, isDeleted: false });
    await hsn.save();
    res.status(201).json(hsn);
  } catch (err) {
    // res.status(500).json({ error: err.message });
    next(err);
  }
};

exports.updateHSN = async (req, res, next) => {
  const { hsnCode, description, gstRate } = req.body;
  try {
    // Validate gstRate
    if (gstRate !== undefined && (isNaN(gstRate) || gstRate < 0)) {
      return res.status(400).json({ message: "GST Rate must be a non-negative number" });
    }
    const { HSN: HSNModel } = await getAutoModels(req);
    const updated = await HSNModel.findByIdAndUpdate(
      req.params.id,
      { hsnCode, description, gstRate, isDeleted: false },
      { new: true }
    );
    res.json(updated);
  } catch (err) {
    // res.status(500).json({ error: err.message });
    next(err);
  }
};

exports.deleteHSN = async (req, res, next) => {
  try {
    const { HSN: HSNModel } = await getAutoModels(req);
    await HSNModel.findByIdAndUpdate(
      req.params.id, 
      { isDeleted: true },
      { new: true }
    );
    res.json({ message: 'Deleted' });
  } catch (err) {
    // res.status(500).json({ error: err.message });
    next(err);
  }
};

exports.importHSN = async (req, res, next) => {
  try {
    const { HSN: HSNModel } = await getAutoModels(req);
    const { hsnItems } = req.body;

    if (!Array.isArray(hsnItems) || hsnItems.length === 0) {
      return res.status(400).json({ message: "No HSN data provided" });
    }

    const bulkOps = hsnItems
      .filter(item => item.hsnCode && item.description) // Validate data
      .map((item) => ({
        updateOne: {
          filter: { hsnCode: item.hsnCode },
          update: { $set: { hsnCode: item.hsnCode, description: item.description, gstRate: item.gstRate } },
          upsert: true,
        },
      }));

    if (bulkOps.length === 0) {
      return res.status(400).json({ message: "No valid HSN entries found" });
    }

    await HSNModel.bulkWrite(bulkOps);

    res.status(200).json({ message: `${bulkOps.length} HSN records imported.` });
  } catch (err) {
    // console.error("HSN import error:", err);
    // res.status(500).json({ message: "Import failed", error: err.message });
    next(err);
  }
};

exports.bulkImport = async (req, res, next) => {
  try {
    const { HSN: HSNModel } = await getAutoModels(req);
    const { hsnItems } = req.body;
    if (!Array.isArray(hsnItems) || hsnItems.length === 0) {
      return res.status(400).json({ message: "No HSN provided" });
    }

    const bulkOps = hsnItems.map((item) => ({
      updateOne: {
        //   filter: { name: item.name }, // Or match by code
        //   update: { $set: { name: item.name, code: item.code } },
        filter: { hsnCode: item.hsnCode },
        update: { $set: { hsnCode: item.hsnCode, description: item.description, gstRate: item.gstRate } },
        upsert: true, // 👈 create if not exists
      },
    }));

    await HSNModel.bulkWrite(bulkOps);

    res.status(200).json({ message: `${hsnItems.length} HSN processed successfully.` });
  } catch (err) {
    // res.status(500).json({ message: "Bulk import error", error: err.message });
    next(err);
  }
};

exports.exportHSN = async (req, res, next) => {
  try {
    const { HSN: HSNModel } = await getAutoModels(req);
    const data = await HSNModel.find();
    const exportData = data.map(item => ({
      HSNCode: item.hsnCode,
      Description: item.description,
      GSTRate: item.gstRate
    }));
    const ws = xlsx.utils.json_to_sheet(exportData);
    const wb = xlsx.utils.book_new();
    xlsx.utils.book_append_sheet(wb, ws, 'HSN');
    const buffer = xlsx.write(wb, { type: 'buffer', bookType: 'xlsx' });
    res.setHeader('Content-Disposition', 'attachment; filename=hsn.xlsx');
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.send(buffer);
  } catch (err) {
    // res.status(500).json({ error: err.message });
    next(err);
  }
};

exports.getDeletedHSN = async (req, res, next) => {
  try {
    const { HSN: HSNModel } = await getAutoModels(req);
    const deletedHSN = await HSNModel.find({ isDeleted: true });
    res.json(deletedHSN);
  } catch (err) {
    // res.status(500).json({ error: err.message });
    next(err);
  }
};

exports.restoreHSN = async (req, res, next) => {
  try {
    const { HSN: HSNModel } = await getAutoModels(req);
    await HSNModel.findByIdAndUpdate(
      req.params.id, 
      { isDeleted: false },
      { new: true }
    );
    res.json({ message: 'Restored' });
  } catch (err) {
    // res.status(500).json({ error: err.message });
    next(err);
  }
};