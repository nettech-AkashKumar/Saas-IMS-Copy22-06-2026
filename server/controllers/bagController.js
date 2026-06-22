const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");

// Add a new bag
exports.addBag = async (req, res) => {
  try {
    const {Bag: BagModel} = await getAutoModels(req);
    const { name, price } = req.body;
    let image = req.body.image;

    if (req.file) {
      image = req.file.path;
    }

    if (!name || !price) {
      return res.status(400).json({ message: "Name and price are required" });
    }

    const newBag = new BagModel({
      name,
      price,
      image,
    });

    await newBag.save();

    res.status(201).json({ message: "Bag added successfully", data: newBag });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Delete bags
exports.deleteBags = async (req, res) => {
  try {
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ message: "No bag IDs provided" });
    }

    const {Bag: BagModel} = await getAutoModels(req);
    await BagModel.deleteMany({ _id: { $in: ids } });

    res.status(200).json({ message: "Bags deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};

// Get all bags
exports.getBags = async (req, res) => {
  try {
    const {Bag: BagModel} = await getAutoModels(req);
    const bags = await BagModel.find().sort({ createdAt: -1 });
    res.status(200).json({ data: bags });
  } catch (error) {
    res.status(500).json({ message: "Internal server error" });
  }
};
