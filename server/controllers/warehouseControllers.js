const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");
const { Parser } = require("json2csv");
const PDFDocument = require("pdfkit");
const mongoose = require("mongoose"); // Ensure mongoose is imported
const getModels = async (req) => await getAutoModels(req);

const generateCode = (prefix = "") => {
  const rand = Math.random().toString(36).slice(2, 8).toUpperCase();
  const ts = Date.now().toString(36).toUpperCase().slice(-4);
  return `${prefix}${rand}${ts}`;
};

const attachQRCodes = (warehouseCode, zones = []) => {
  return zones.map((zone) => {
    zone.racks = (zone.racks || []).map((rack) => {
      // Rack QR = unique generated code
      if (!rack.rackQRCode) {
        rack.rackQRCode = generateCode(`${warehouseCode}-${zone.zoneCode}-RK-`);
      }

      rack.shelves = (rack.shelves || []).map((shelf) => {
        if (!shelf.shelfQRCode) {
          shelf.shelfQRCode = generateCode(
            `${warehouseCode}-${zone.zoneCode}-SH-`,
          );
        }

        shelf.bins = (shelf.bins || []).map((bin) => {
          if (!bin.binQRCode) {
            bin.binQRCode = generateCode(
              `${warehouseCode}-${zone.zoneCode}-BN-`,
            );
          }
          return bin;
        });

        return shelf;
      });

      return rack;
    });

    return zone;
  });
};

// exports.createWarehouse = async (req, res) => {
//   try {
//     const { Warehouse } = await getModels(req);
//     const data = {
//       ...req.body,
//       contactPerson: req.body.warehouseManager, // map it
//     };

//     delete data.warehouseManager; // optional

//     const layout = req.body.layout;
//     const zonesInput = layout?.zones;
//     const rows = layout?.rows;
//     const columns = layout?.columns;
//     const width = layout?.width;

//     // Layout is optional for this endpoint. Only validate if layout is provided.
//     if (layout) {
//       if (
//         rows === undefined ||
//         columns === undefined ||
//         width === undefined ||
//         zonesInput === undefined
//       ) {
//         return res
//           .status(400)
//           .json({ success: false, message: "Missing layout parameters" });
//       }
//       if (typeof zonesInput !== "number" || zonesInput <= 0) {
//         return res
//           .status(400)
//           .json({ success: false, message: "Zones must be a positive number" });
//       }

//       data.layout = {
//         rows: rows,
//         columns: columns,
//         width: width,
//         zones: zonesInput, // Store as number
//       };

//       // Initialize blocks array with zone objects
//       data.blocks = [];
//       for (let zoneIdx = 1; zoneIdx <= zonesInput; zoneIdx++) {
//       const zoneName = `Zone${zoneIdx}`;
//       const cells = [];
//       let cellNumber = 1;
//       for (let row = 1; row <= rows; row++) {
//         for (let col = 1; col <= columns; col++) {
//           cells.push({
//             name: String(cellNumber), // e.g., "1", "2", ..., "15"
//             items: [],
//           });
//           cellNumber++;
//         }
//       }
//       data.blocks.push({
//         zone: zoneName,
//         cells: cells,
//       });
//       }
//     }
//     // Create and save the warehouse
//     const warehouse = await Warehouse.create(data);
//     res.status(201).json({ success: true, warehouse });
//   } catch (err) {
//     res.status(500).json({ success: false, message: err.message });
//   }
// };

exports.createWarehouse = async (req, res) => {
  try {
    const { Warehouse } = await getModels(req);

    const warehouseData = {
      warehouseName: req.body.warehouseName,
      warehouseCode: req.body.warehouseCode,
      warehouseOwner: req.body.warehouseOwner,

      contactPerson: req.body.warehouseManager,

      phone: req.body.phone,
      email: req.body.email,
      phoneWork: req.body.phoneWork,

      address: req.body.address,

      country: req.body.country,
      state: req.body.state,
      city: req.body.city,

      pinCode: req.body.pinCode,

      status: req.body.status || "Active",

      space: req.body.space,
      items: req.body.items,
      itemSize: req.body.itemSize,

      capacityEstimate: req.body.capacityEstimate,

      // NEW HIERARCHY
      zones: req.body.zones || [],
    };

    const warehouse = await Warehouse.create(warehouseData);

    res.status(201).json({
      success: true,
      warehouse,
    });
  } catch (err) {
    console.log(err);

    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getAllWarehouses = async (req, res) => {
  try {
    const { Warehouse } = await getModels(req);

    const wh = await Warehouse.find();

    res.json({
      success: true,
      data: wh,
    });
  } catch (err) {
    res.status(500).json({
      success: false,
      message: err.message,
    });
  }
};

exports.getActiveWarehouses = async (req, res) => {
  try {
    const { Warehouse } = await getModels(req);
    const activeWarehouses = await Warehouse.find({ status: "Active" });

    res.json({ success: true, data: activeWarehouses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getWarehouseById = async (req, res) => {
  try {
    const { Warehouse } = await getModels(req);
    const query =
      req.query.includeInactive === "true"
        ? { _id: req.params.id }
        : { _id: req.params.id, status: "Active" };
    const warehouse = await Warehouse.findOne(query);
    // Removed populate for contactPerson/country/state/city because these fields are stored as strings in the warehouse schema
    if (!warehouse)
      return res.status(404).json({ success: false, message: "Not found" });
    res.json({ success: true, warehouse });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.exportRackLayoutCSV = async (req, res) => {
  try {
    const { Warehouse } = await getModels(req);
    const warehouse = await Warehouse.findById(req.params.id);
    const flatRacks = warehouse.racks.flatMap((rack) =>
      rack.levels.map((level) => ({
        warehouseName: warehouse.warehouseName,
        rackLabel: rack.rackLabel,
        level: level.level,
        barcode: level.barcode,
        rackCapacity: rack.capacity,
      })),
    );
    const parser = new Parser();
    const csv = parser.parse(flatRacks);
    res.header("Content-Type", "text/csv");
    res.attachment(`${warehouse.warehouseName}_rack_layout.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.exportRackLayoutPDF = async (req, res) => {
  try {
    const { Warehouse } = await getModels(req);
    const warehouse = await Warehouse.findById(req.params.id);
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=\"${warehouse.warehouseName}_rack_layout.pdf\"`,
    );
    doc.text(`Rack Layout for ${warehouse.warehouseName}`, { underline: true });
    warehouse.racks.forEach((r) => {
      doc.text(`Rack: ${r.rackLabel}`);
      r.levels.forEach((l) => doc.text(` - Level ${l.level}: ${l.barcode}`));
      doc.moveDown();
    });
    doc.end();
    doc.pipe(res);
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.updateWarehouse = async (req, res) => {
  try {
    const { Warehouse } = await getModels(req);

    const existing = await Warehouse.findById(req.params.id);

    if (!existing) {
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });
    }

    if (req.body.zones) {
      req.body.zones = attachQRCodes(existing.warehouseCode, req.body.zones);
    }

    const wh = await Warehouse.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
    });
    res.json({ success: true, warehouse: wh });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.deleteWarehouse = async (req, res) => {
  try {
    const { Warehouse } = await getModels(req);
    await Warehouse.findByIdAndDelete(req.params.id);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.mergeRacks = async (req, res) => {
  const { Warehouse } = await getModels(req);
  const { rackLabels } = req.body;
  const wh = await Warehouse.findById(req.params.id);
  const toMerge = wh.racks.filter((r) => rackLabels.includes(r.rackLabel));
  if (toMerge.length < 2) return res.status(400).json({ success: false });
  const merged = {
    rackLabel: rackLabels.join("+"),
    shelfLevels: Math.max(...toMerge.map((r) => r.shelfLevels)),
    capacity: toMerge.reduce((s, r) => s + r.capacity, 0),
    levels: [].concat(...toMerge.map((r) => r.levels)),
  };
  wh.racks = [
    ...wh.racks.filter((r) => !rackLabels.includes(r.rackLabel)),
    merged,
  ];
  await wh.save();
  res.json({ success: true, racks: wh.racks });
};

exports.updateRack = async (req, res) => {
  try {
    const { Warehouse } = await getModels(req);
    const { zoneId, zoneName, rack } = req.body;

    const wh = await Warehouse.findById(req.params.id);

    if (!wh) {
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });
    }

    // =========================
    // FIND ZONE
    // =========================

    let zone = null;

    if (zoneId) {
      zone = wh.zones.find((z) => z._id?.toString() === zoneId.toString());
    }

    if (!zone && zoneName) {
      zone = wh.zones.find((z) => z.zoneName === zoneName);
    }

    // Fallback: auto-drill if only 1 zone
    if (!zone && wh.zones?.length === 1) {
      zone = wh.zones[0];
    }

    if (!zone) {
      return res
        .status(404)
        .json({ success: false, message: "Zone not found" });
    }

    // =========================
    // FIND RACK IN ZONE
    // =========================

    const rackIndex = zone.racks.findIndex(
      (r) =>
        r._id?.toString() === rack._id?.toString() ||
        r.rackCode === rack.rackCode ||
        r.rackName === rack.rackName,
    );

    if (rackIndex === -1) {
      return res
        .status(404)
        .json({ success: false, message: "Rack not found in zone" });
    }

    // =========================
    // DEEP MERGE: preserve existing shelves/bins/products
    // unless explicitly overridden in the request
    // =========================

    const existingRack = zone.racks[rackIndex];

    const updatedRack = {
      ...(existingRack.toObject ? existingRack.toObject() : existingRack),
      ...rack,
      shelves: rack.shelves
        ? rack.shelves.map((incomingShelf) => {
            // Try to match existing shelf to preserve bins and products
            const existingShelf = existingRack.shelves?.find(
              (s) =>
                s._id?.toString() === incomingShelf._id?.toString() ||
                s.shelfName === incomingShelf.shelfName,
            );

            return {
              ...(existingShelf?.toObject
                ? existingShelf.toObject()
                : existingShelf || {}),
              ...incomingShelf,
              bins: incomingShelf.bins
                ? incomingShelf.bins.map((incomingBin) => {
                    // Try to match existing bin to preserve products
                    const existingBin = existingShelf?.bins?.find((b) =>
                      typeof b === "string"
                        ? b === incomingBin.binName
                        : b._id?.toString() === incomingBin._id?.toString() ||
                          b.binName === incomingBin.binName,
                    );

                    return {
                      ...(existingBin?.toObject
                        ? existingBin.toObject()
                        : typeof existingBin === "string"
                          ? { binName: existingBin, products: [] }
                          : existingBin || {}),
                      ...incomingBin,
                    };
                  })
                : existingShelf?.bins || [],
            };
          })
        : existingRack.shelves,
    };

    zone.racks[rackIndex] = updatedRack;

    await wh.save();

    return res.status(200).json({
      success: true,
      message: "Rack updated successfully",
      rack: zone.racks[rackIndex],
    });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ success: false, message: err.message });
  }
};

exports.toggleFavoriteWarehouse = async (req, res) => {
  try {
    const { Warehouse } = await getModels(req);
    const warehouse = await Warehouse.findById(req.params.id);
    if (!warehouse)
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });
    warehouse.isFavorite = !warehouse.isFavorite;
    await warehouse.save();
    res.json({ success: true, warehouse });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.getFavoriteWarehouses = async (req, res) => {
  try {
    const { Warehouse } = await getModels(req);
    const favoriteWarehouses = await Warehouse.find({ isFavorite: true });
    res.json({ success: true, data: favoriteWarehouses });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.zoneproducts = async (req, res) => {
  const { id, zone, cellIndex } = req.params;
  const { productId, productName, sku, quantity } = req.body;

  try {
    const { Warehouse, Product } = await getModels(req);
    // Validate inputs
    // console.log("Request params:", { id, zone, cellIndex });
    // console.log("Request body:", { productId, productName, sku, quantity });

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: "Invalid warehouse ID" });
    }
    if (!mongoose.Types.ObjectId.isValid(productId)) {
      return res.status(400).json({ message: "Invalid product ID" });
    }
    if (isNaN(cellIndex) || cellIndex < 0) {
      return res.status(400).json({ message: "Invalid cell index" });
    }

    // Find the warehouse
    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }
    // console.log("Warehouse found:", warehouse);

    // Find the zone
    const zoneObj = warehouse.blocks.find((z) => z.zone === zone);
    if (!zoneObj) {
      return res.status(404).json({ message: "Zone not found" });
    }
    // console.log("Zone found:", zoneObj);

    // Validate cell index
    // console.log("Cells in zone:", zoneObj.cells);
    if (cellIndex >= zoneObj.cells.length) {
      return res.status(400).json({ message: "Cell index out of bounds" });
    }

    // Check if product exists and get full product details
    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ message: "Product not found" });
    }
    // console.log("Product found:", product);

    // Create item object with full product details
    const itemToAdd = {
      productId: productId,
      productName: productName || product.productName,
      sku: sku || product.sku,
      quantity: quantity || 1,
      barcode: product.barcode || `BARCODE-${productId}`,
      assignedAt: new Date(),
    };

    // Update the cell with the complete product information
    // console.log("Cell before update:", zoneObj.cells[cellIndex]);
    zoneObj.cells[cellIndex].items.push(itemToAdd);
    // console.log("Cell after update:", zoneObj.cells[cellIndex]);
    // console.log("Item added:", itemToAdd);

    // Optionally update the product field (if you want to keep it for backward compatibility)
    zoneObj.cells[cellIndex].product = productId;

    // Save the updated warehouse
    await warehouse.validate(); // Validate before saving
    await warehouse.save();
    // console.log("Warehouse saved successfully");

    res
      .status(200)
      .json({ success: true, data: warehouse, addedItem: itemToAdd });
  } catch (error) {
    // console.error("Error assigning product to cell:", error);
    if (error.name === "ValidationError") {
      return res
        .status(400)
        .json({ message: "Validation error", errors: error.errors });
    }
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

exports.removeitem = async (req, res) => {
  try {
    const { Warehouse } = await getModels(req);
    const { id, zone, cellIndex } = req.params;
    const { productId, barcode } = req.body;

    // console.log("=== REMOVE REQUEST RECEIVED ===");
    // console.log("Request params:", { id, zone, cellIndex });
    // console.log("Request body:", { productId, barcode });
    // console.log("ProductId type:", typeof productId, "Value:", productId);
    // console.log("Barcode type:", typeof barcode, "Value:", barcode);

    const warehouse = await Warehouse.findById(id);
    if (!warehouse) {
      return res.status(404).json({ message: "Warehouse not found" });
    }

    const zoneData = warehouse.blocks.find((b) => b.zone === zone);
    if (!zoneData) {
      return res.status(404).json({ message: "Zone not found" });
    }

    const cell = zoneData.cells[cellIndex];
    if (!cell) {
      return res.status(404).json({ message: "Cell not found" });
    }

    // console.log("Cell items before removal:", cell.items);
    // console.log("Looking for item with productId:", productId, "and barcode:", barcode);

    // Count items before removal
    const itemsBeforeRemoval = cell.items.length;

    // Remove item matching productId only (since we only store productId now)
    cell.items = cell.items.filter((item) => {
      const productIdMatch = item.productId.toString() === productId;
      // console.log(`Item comparison: - Item productId: ${item.productId} (${typeof item.productId}) vs Request: ${productId} (${typeof productId}) = ${productIdMatch}`);
      return !productIdMatch; // Remove the item if productId matches
    });

    // console.log("Cell items after removal:", cell.items);
    // console.log(`Removed ${itemsBeforeRemoval - cell.items.length} items`);

    // Clear product if no items remain
    if (cell.items.length === 0) {
      cell.product = null;
    }

    await warehouse.save();
    res.status(200).json({
      message: "Item removed successfully",
      removedCount: itemsBeforeRemoval - cell.items.length,
      remainingItems: cell.items.length,
    });
  } catch (err) {
    // console.error("Error in removeitem:", err);
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

exports.assignProductToLocation = async (req, res) => {
  try {
    const { Warehouse, Product } = await getModels(req);

    const { warehouseId, zoneName, rackName, shelfName, binName, products } =
      req.body;

    const warehouse = await Warehouse.findById(warehouseId);
    const allWarehouses = await Warehouse.find();

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    // =========================
    // CALCULATE ASSIGNED QTY
    // =========================

    const getAssignedQuantity = (productId) => {
      let assignedQty = 0;

      allWarehouses.forEach((wh) => {
        wh.zones?.forEach((zone) => {
          zone.products?.forEach((p) => {
            if (p.productId?.toString() === productId.toString()) {
              assignedQty += Number(p.quantity || 0);
            }
          });

          zone.racks?.forEach((rack) => {
            rack.products?.forEach((p) => {
              if (p.productId?.toString() === productId.toString()) {
                assignedQty += Number(p.quantity || 0);
              }
            });

            rack.shelves?.forEach((shelf) => {
              shelf.products?.forEach((p) => {
                if (p.productId?.toString() === productId.toString()) {
                  assignedQty += Number(p.quantity || 0);
                }
              });

              shelf.bins?.forEach((bin) => {
                bin.products?.forEach((p) => {
                  if (p.productId?.toString() === productId.toString()) {
                    assignedQty += Number(p.quantity || 0);
                  }
                });
              });
            });
          });
        });
      });

      return assignedQty;
    };

    // =========================
    // VALIDATE PRODUCTS
    // =========================

    for (const item of products) {
      const dbProduct = await Product.findById(item.productId);

      if (!dbProduct) {
        return res.status(404).json({
          success: false,
          message: "Product not found",
        });
      }

      const totalQty = Number(
        dbProduct.stockQuantity || dbProduct.openingQuantity || 0,
      );

      const assignedQty = getAssignedQuantity(item.productId);
      const availableQty = totalQty - assignedQty;

      if (Number(item.quantity) > availableQty) {
        return res.status(400).json({
          success: false,
          message: `${dbProduct.productName} only ${availableQty} quantity available`,
        });
      }
    }

    // =========================
    // FIND ZONE
    // =========================

    const zone = warehouse.zones.find((z) => z.zoneName === zoneName);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: "Zone not found",
      });
    }

    // =========================
    // AUTO-DRILL TO DEEPEST LOCATION
    // =========================

    let effectiveRackName = rackName;
    let effectiveShelfName = shelfName;
    let effectiveBinName = binName;

    if (!effectiveRackName && zone.racks?.length === 1) {
      const autoRack = zone.racks[0];
      effectiveRackName = autoRack.rackName;

      if (!effectiveShelfName && autoRack.shelves?.length === 1) {
        const autoShelf = autoRack.shelves[0];
        effectiveShelfName = autoShelf.shelfName;

        if (!effectiveBinName && autoShelf.bins?.length === 1) {
          const autoBin = autoShelf.bins[0];
          effectiveBinName =
            typeof autoBin === "string" ? autoBin : autoBin.binName;
        }
      }
    }

    // =========================
    // ZONE LEVEL
    // =========================

    if (!effectiveRackName) {
      if (!zone.products) zone.products = [];

      for (const product of products) {
        zone.products.push({
          productId: product.productId,
          quantity: Number(product.quantity),
          unit: product.unit,
          date: new Date(),
        });
      }

      await warehouse.save();

      for (const product of products) {
        const finalAssignedQty = getAssignedQuantity(product.productId);
        await Product.findByIdAndUpdate(product.productId, {
          assignedQuantity: finalAssignedQty,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Products assigned to zone",
        warehouse,
      });
    }

    // =========================
    // FIND RACK
    // =========================

    const rack = zone.racks.find((r) => r.rackName === effectiveRackName);

    if (!rack) {
      return res.status(404).json({
        success: false,
        message: "Rack not found",
      });
    }

    // =========================
    // RACK LEVEL
    // =========================

    if (!effectiveShelfName) {
      if (!rack.products) rack.products = [];

      for (const product of products) {
        rack.products.push({
          productId: product.productId,
          quantity: Number(product.quantity),
          unit: product.unit,
          date: new Date(),
        });
      }

      await warehouse.save();

      for (const product of products) {
        const finalAssignedQty = getAssignedQuantity(product.productId);
        await Product.findByIdAndUpdate(product.productId, {
          assignedQuantity: finalAssignedQty,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Products assigned to rack",
        warehouse,
      });
    }

    // =========================
    // FIND SHELF
    // =========================

    const shelf = rack.shelves.find((s) => s.shelfName === effectiveShelfName);

    if (!shelf) {
      return res.status(404).json({
        success: false,
        message: "Shelf not found",
      });
    }

    // =========================
    // SHELF LEVEL
    // =========================

    if (!effectiveBinName) {
      if (!shelf.products) shelf.products = [];

      for (const product of products) {
        shelf.products.push({
          productId: product.productId,
          quantity: Number(product.quantity),
          unit: product.unit,
          date: new Date(),
        });
      }

      await warehouse.save();

      for (const product of products) {
        const finalAssignedQty = getAssignedQuantity(product.productId);
        await Product.findByIdAndUpdate(product.productId, {
          assignedQuantity: finalAssignedQty,
        });
      }

      return res.status(200).json({
        success: true,
        message: "Products assigned to shelf",
        warehouse,
      });
    }

    // =========================
    // BIN LEVEL
    // =========================

    let binIndex = shelf.bins.findIndex((b) =>
      typeof b === "string"
        ? b === effectiveBinName
        : b.binName === effectiveBinName,
    );

    let bin = shelf.bins[binIndex];

    if (!bin) {
      bin = { binName: effectiveBinName, products: [] };
      shelf.bins.push(bin);
    } else if (typeof bin === "string") {
      shelf.bins[binIndex] = { binName: bin, products: [] };
      bin = shelf.bins[binIndex];
    }

    for (const product of products) {
      bin.products.push({
        productId: product.productId,
        quantity: Number(product.quantity),
        unit: product.unit,
        date: new Date(),
      });
    }

    await warehouse.save();

    for (const product of products) {
      const finalAssignedQty = getAssignedQuantity(product.productId);
      await Product.findByIdAndUpdate(product.productId, {
        assignedQuantity: finalAssignedQty,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Products assigned successfully",
      warehouse,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.assignProductToLocation = async (req, res) => {
  try {
    const { Warehouse, Product } = await getModels(req);

    const { warehouseId, zoneName, rackName, shelfName, binName, products } =
      req.body;

    const warehouse = await Warehouse.findById(warehouseId);
    if (!warehouse) {
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });
    }

    // =========================
    // HELPER: calculates assigned qty from a given warehouses list
    // =========================
    const getAssignedQuantity = (productId, warehousesList) => {
      let assignedQty = 0;
      warehousesList.forEach((wh) => {
        wh.zones?.forEach((zone) => {
          zone.products?.forEach((p) => {
            if (p.productId?.toString() === productId.toString())
              assignedQty += Number(p.quantity || 0);
          });
          zone.racks?.forEach((rack) => {
            rack.products?.forEach((p) => {
              if (p.productId?.toString() === productId.toString())
                assignedQty += Number(p.quantity || 0);
            });
            rack.shelves?.forEach((shelf) => {
              shelf.products?.forEach((p) => {
                if (p.productId?.toString() === productId.toString())
                  assignedQty += Number(p.quantity || 0);
              });
              shelf.bins?.forEach((bin) => {
                bin.products?.forEach((p) => {
                  if (p.productId?.toString() === productId.toString())
                    assignedQty += Number(p.quantity || 0);
                });
              });
            });
          });
        });
      });
      return assignedQty;
    };

    // =========================
    // VALIDATE — use fresh snapshot BEFORE save
    // =========================
    const allWarehousesBeforeSave = await Warehouse.find();

    for (const item of products) {
      const dbProduct = await Product.findById(item.productId);
      if (!dbProduct) {
        return res
          .status(404)
          .json({ success: false, message: "Product not found" });
      }

      const totalQty = Number(
        dbProduct.stockQuantity || dbProduct.openingQuantity || 0,
      );
      const assignedQty = getAssignedQuantity(
        item.productId,
        allWarehousesBeforeSave,
      );
      const availableQty = totalQty - assignedQty;

      if (Number(item.quantity) > availableQty) {
        return res.status(400).json({
          success: false,
          message: `${dbProduct.productName} only ${availableQty} quantity available`,
        });
      }
    }

    // =========================
    // FIND ZONE
    // =========================
    const zone = warehouse.zones.find((z) => z.zoneName === zoneName);
    if (!zone) {
      return res
        .status(404)
        .json({ success: false, message: "Zone not found" });
    }

    // =========================
    // AUTO-DRILL
    // =========================
    let effectiveRackName = rackName;
    let effectiveShelfName = shelfName;
    let effectiveBinName = binName;

    if (!effectiveRackName && zone.racks?.length === 1) {
      const autoRack = zone.racks[0];
      effectiveRackName = autoRack.rackName;
      if (!effectiveShelfName && autoRack.shelves?.length === 1) {
        const autoShelf = autoRack.shelves[0];
        effectiveShelfName = autoShelf.shelfName;
        if (!effectiveBinName && autoShelf.bins?.length === 1) {
          const autoBin = autoShelf.bins[0];
          effectiveBinName =
            typeof autoBin === "string" ? autoBin : autoBin.binName;
        }
      }
    }

    // =========================
    // ASSIGN TO CORRECT LEVEL
    // =========================
    if (!effectiveRackName) {
      // ZONE LEVEL
      if (!zone.products) zone.products = [];
      for (const product of products) {
        zone.products.push({
          productId: product.productId,
          quantity: Number(product.quantity),
          unit: product.unit,
        });
      }
    } else {
      const rack = zone.racks.find((r) => r.rackName === effectiveRackName);
      if (!rack)
        return res
          .status(404)
          .json({ success: false, message: "Rack not found" });

      if (!effectiveShelfName) {
        // RACK LEVEL
        if (!rack.products) rack.products = [];
        for (const product of products) {
          rack.products.push({
            productId: product.productId,
            quantity: Number(product.quantity),
            unit: product.unit,
          });
        }
      } else {
        const shelf = rack.shelves.find(
          (s) => s.shelfName === effectiveShelfName,
        );
        if (!shelf)
          return res
            .status(404)
            .json({ success: false, message: "Shelf not found" });

        if (!effectiveBinName) {
          // SHELF LEVEL
          if (!shelf.products) shelf.products = [];
          for (const product of products) {
            shelf.products.push({
              productId: product.productId,
              quantity: Number(product.quantity),
              unit: product.unit,
            });
          }
        } else {
          // BIN LEVEL
          let binIndex = shelf.bins.findIndex((b) =>
            typeof b === "string"
              ? b === effectiveBinName
              : b.binName === effectiveBinName,
          );
          let bin = shelf.bins[binIndex];
          if (!bin) {
            bin = { binName: effectiveBinName, products: [] };
            shelf.bins.push(bin);
            bin = shelf.bins[shelf.bins.length - 1];
          } else if (typeof bin === "string") {
            shelf.bins[binIndex] = { binName: bin, products: [] };
            bin = shelf.bins[binIndex];
          }
          for (const product of products) {
            bin.products.push({
              productId: product.productId,
              quantity: Number(product.quantity),
              unit: product.unit,
            });
          }
        }
      }
    }

    // =========================
    // ✅ SAVE FIRST
    // =========================
    await warehouse.save();

    // =========================
    // ✅ FETCH FRESH AFTER SAVE, then update assignedQuantity on Product
    // =========================
    const allWarehousesAfterSave = await Warehouse.find();

    for (const product of products) {
      const finalAssignedQty = getAssignedQuantity(
        product.productId,
        allWarehousesAfterSave,
      );
      await Product.findByIdAndUpdate(product.productId, {
        assignedQuantity: finalAssignedQty,
      });
    }

    return res.status(200).json({
      success: true,
      message: "Products assigned successfully",
      warehouse,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getProductAllocation = async (req, res) => {
  try {
    const { Warehouse, Product } = await getModels(req);
    const mongoose = require("mongoose");

    const warehouses = await Warehouse.find();

    // =============================================
    // STEP 1: Sum total assigned qty per product across ALL warehouses
    // =============================================
    const totalAssignedMap = {};

    for (const warehouse of warehouses) {
      for (const zone of warehouse.zones || []) {
        for (const p of zone.products || []) {
          const id = p.productId?.toString();
          if (id)
            totalAssignedMap[id] =
              (totalAssignedMap[id] || 0) + Number(p.quantity || 0);
        }
        for (const rack of zone.racks || []) {
          for (const p of rack.products || []) {
            const id = p.productId?.toString();
            if (id)
              totalAssignedMap[id] =
                (totalAssignedMap[id] || 0) + Number(p.quantity || 0);
          }
          for (const shelf of rack.shelves || []) {
            for (const p of shelf.products || []) {
              const id = p.productId?.toString();
              if (id)
                totalAssignedMap[id] =
                  (totalAssignedMap[id] || 0) + Number(p.quantity || 0);
            }
            for (const bin of shelf.bins || []) {
              for (const p of bin.products || []) {
                const id = p.productId?.toString();
                if (id)
                  totalAssignedMap[id] =
                    (totalAssignedMap[id] || 0) + Number(p.quantity || 0);
              }
            }
          }
        }
      }
    }

    // =============================================
    // STEP 2: Fetch product docs
    // =============================================
    const objectIds = [...new Set(Object.keys(totalAssignedMap))]
      .map((id) => {
        try {
          return new mongoose.Types.ObjectId(id);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    const productDocs = await Product.find({ _id: { $in: objectIds } });
    const productMap = {};
    for (const p of productDocs) productMap[p._id.toString()] = p;

    // =============================================
    // STEP 3: getAvailable = totalStock - totalAssignedAcrossAllWarehouses
    // =============================================
    const getAvailable = (productId) => {
      const dbProduct = productMap[productId?.toString()];
      if (!dbProduct) return 0;
      const totalStock = Number(
        dbProduct.stockQuantity || dbProduct.openingQuantity || 0,
      );
      const totalAssigned = totalAssignedMap[productId?.toString()] || 0;
      return totalStock - totalAssigned;
    };

    // =============================================
    // STEP 4: Build allocations
    // =============================================
    const allocations = [];

    for (const warehouse of warehouses) {
      for (const zone of warehouse.zones || []) {
        for (const product of zone.products || []) {
          const dbProduct = productMap[product.productId?.toString()];
          if (!dbProduct) continue;
          allocations.push({
            id: product.productId,
            product: dbProduct.productName,
            sku: dbProduct.productCode,
            warehouse: warehouse.warehouseName,
            zone: zone.zoneName,
            rack: rack.rackName || "-",
            shelf: shelf.shelfName,
            bins: bin.binName,
            locationCode: `${bin.binQRCode}`,
            allocatedQty: Number(product.quantity || 0), // ✅ quantity at THIS location
            available: getAvailable(product.productId), // ✅ remaining unallocated globally
            movementType: "Bin",
            image: dbProduct.images?.[0]?.url,
            date: product.date || null,
          });
        }

        for (const rack of zone.racks || []) {
          for (const product of rack.products || []) {
            const dbProduct = productMap[product.productId?.toString()];
            if (!dbProduct) continue;
            allocations.push({
              id: product.productId,
              product: dbProduct.productName,
              sku: dbProduct.productCode,
              warehouse: warehouse.warehouseName,
              zone: zone.zoneName,
              rack: rack.rackName || "-",
              shelf: "-",
              bins: "-",
              locationCode: `${warehouse.warehouseCode}-${zone.zoneCode}-${rack.rackCode}`,
              allocatedQty: Number(product.quantity || 0), // ✅ add this
              available: getAvailable(product.productId),
              movementType: "Rack",
              image: dbProduct.images?.[0]?.url,
              date: product.date || null,
            });
          }

          for (const shelf of rack.shelves || []) {
            for (const product of shelf.products || []) {
              const dbProduct = productMap[product.productId?.toString()];
              if (!dbProduct) continue;
              allocations.push({
                id: product.productId,
                product: dbProduct.productName,
                sku: dbProduct.productCode,
                warehouse: warehouse.warehouseName,
                zone: zone.zoneName,
                rack: rack.rackName || "-",
                shelf: shelf.shelfName,
                bins: "-",
                locationCode: `${warehouse.warehouseCode}-${zone.zoneCode}-${rack.rackCode}-${shelf.shelfCode || shelf.shelfName}`,
                allocatedQty: Number(product.quantity || 0), // ✅ add this
                available: getAvailable(product.productId),
                movementType: "Shelf",
                image: dbProduct.images?.[0]?.url,
                date: product.date || null,
              });
            }

            for (const bin of shelf.bins || []) {
              for (const product of bin.products || []) {
                const dbProduct = productMap[product.productId?.toString()];
                if (!dbProduct) continue;
                allocations.push({
                  id: product.productId,
                  product: dbProduct.productName,
                  sku: dbProduct.productCode,
                  warehouse: warehouse.warehouseName,
                  zone: zone.zoneName,
                  rack: rack.rackName || "-",
                  shelf: shelf.shelfName,
                  bins: bin.binName,
                  locationCode: `${bin.binQRCode}`,
                  allocatedQty: Number(product.quantity || 0), // ✅ add this
                  available: getAvailable(product.productId),
                  movementType: "Bin",
                  image: dbProduct.images?.[0]?.url,
                  date: product.date || null,
                });
              }
            }
          }
        }
      }
    }

    allocations.reverse();
    return res.status(200).json({ success: true, data: allocations });
  } catch (error) {
    console.log("Product Allocation ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

// ── DELETE ZONE ──
exports.deleteZone = async (req, res) => {
  try {
    const { Warehouse } = await getModels(req);
    const { id, zoneId } = req.params;

    const warehouse = await Warehouse.findById(id);
    if (!warehouse)
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });

    const before = warehouse.zones.length;

    // ✅ Match by _id OR zoneCode (in case _id is missing)
    warehouse.zones = warehouse.zones.filter(
      (z) => z._id?.toString() !== zoneId && z.zoneCode !== zoneId,
    );

    if (warehouse.zones.length === before)
      return res
        .status(404)
        .json({ success: false, message: "Zone not found" });

    await warehouse.save();
    res.json({ success: true, message: "Zone deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE RACK ──
exports.deleteRack = async (req, res) => {
  try {
    const { Warehouse } = await getModels(req);
    const { id, zoneId, rackId } = req.params;

    const warehouse = await Warehouse.findById(id);
    if (!warehouse)
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });

    // ✅ Match zone by _id OR zoneCode
    const zone = warehouse.zones.find(
      (z) => z._id?.toString() === zoneId || z.zoneCode === zoneId,
    );
    if (!zone)
      return res
        .status(404)
        .json({ success: false, message: "Zone not found" });

    const before = zone.racks.length;

    // ✅ Match rack by _id OR rackCode OR rackName
    zone.racks = zone.racks.filter(
      (r) =>
        r._id?.toString() !== rackId &&
        r.rackCode !== rackId &&
        r.rackName !== rackId,
    );

    if (zone.racks.length === before)
      return res
        .status(404)
        .json({ success: false, message: "Rack not found" });

    await warehouse.save();
    res.json({ success: true, message: "Rack deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE SHELF ──
exports.deleteShelf = async (req, res) => {
  try {
    const { Warehouse } = await getModels(req);
    const { id, zoneId, rackId, shelfId } = req.params;

    const warehouse = await Warehouse.findById(id);
    if (!warehouse)
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });

    // ✅ Match zone by _id OR zoneCode
    const zone = warehouse.zones.find(
      (z) => z._id?.toString() === zoneId || z.zoneCode === zoneId,
    );
    if (!zone)
      return res
        .status(404)
        .json({ success: false, message: "Zone not found" });

    // ✅ Match rack by _id OR rackCode OR rackName
    const rack = zone.racks.find(
      (r) =>
        r._id?.toString() === rackId ||
        r.rackCode === rackId ||
        r.rackName === rackId,
    );
    if (!rack)
      return res
        .status(404)
        .json({ success: false, message: "Rack not found" });

    const before = rack.shelves.length;

    // ✅ Match shelf by _id OR shelfName
    rack.shelves = rack.shelves.filter(
      (s) => s._id?.toString() !== shelfId && s.shelfName !== shelfId,
    );

    if (rack.shelves.length === before)
      return res
        .status(404)
        .json({ success: false, message: "Shelf not found" });

    await warehouse.save();
    res.json({ success: true, message: "Shelf deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

// ── DELETE BIN ──
exports.deleteBin = async (req, res) => {
  try {
    const { Warehouse } = await getModels(req);
    const { id, zoneId, rackId, shelfId, binId } = req.params;

    const warehouse = await Warehouse.findById(id);
    if (!warehouse)
      return res
        .status(404)
        .json({ success: false, message: "Warehouse not found" });

    // ✅ Match zone by _id OR zoneCode
    const zone = warehouse.zones.find(
      (z) => z._id?.toString() === zoneId || z.zoneCode === zoneId,
    );
    if (!zone)
      return res
        .status(404)
        .json({ success: false, message: "Zone not found" });

    // ✅ Match rack by _id OR rackCode OR rackName
    const rack = zone.racks.find(
      (r) =>
        r._id?.toString() === rackId ||
        r.rackCode === rackId ||
        r.rackName === rackId,
    );
    if (!rack)
      return res
        .status(404)
        .json({ success: false, message: "Rack not found" });

    // ✅ Match shelf by _id OR shelfName
    const shelf = rack.shelves.find(
      (s) => s._id?.toString() === shelfId || s.shelfName === shelfId,
    );
    if (!shelf)
      return res
        .status(404)
        .json({ success: false, message: "Shelf not found" });

    const before = shelf.bins.length;

    // ✅ Match bin by _id OR binName (since bins may not have _id)
    shelf.bins = shelf.bins.filter((b) =>
      typeof b === "string"
        ? b !== binId
        : b._id?.toString() !== binId && b.binName !== binId,
    );

    if (shelf.bins.length === before)
      return res.status(404).json({ success: false, message: "Bin not found" });

    await warehouse.save();
    res.json({ success: true, message: "Bin deleted successfully" });
  } catch (err) {
    res.status(500).json({ success: false, message: err.message });
  }
};

exports.stockOutProduct = async (req, res) => {
  try {
    const { Warehouse } = await getModels(req);

    const {
      warehouseName,
      zoneName,
      rackName,
      shelfName,
      binName,
      productId,
      quantity,
    } = req.body;

    const warehouse = await Warehouse.findOne({
      warehouseName,
    });

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    const zone = warehouse.zones.find((z) => z.zoneName === zoneName);

    if (!zone) {
      return res.status(404).json({
        success: false,
        message: "Zone not found",
      });
    }

    const rack = zone.racks.find((r) => r.rackName === rackName);

    const shelf = rack?.shelves.find((s) => s.shelfName === shelfName);

    const bin = shelf?.bins.find((b) => b.binName === binName);

    if (!bin) {
      return res.status(404).json({
        success: false,
        message: "Bin not found",
      });
    }

    const product = bin.products.find(
      (p) => p.productId.toString() === productId,
    );

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found",
      });
    }

    if (product.quantity < quantity) {
      return res.status(400).json({
        success: false,
        message: "Insufficient quantity",
      });
    }

    product.quantity -= Number(quantity);

    if (product.quantity <= 0) {
      bin.products = bin.products.filter(
        (p) => p.productId.toString() !== productId,
      );
    }

    await warehouse.save();

    return res.status(200).json({
      success: true,
      remainingQty: product.quantity,
      message: "Stock out successful",
    });
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getAllocatedProductsByWarehouse = async (req, res) => {
  try {
    const { Warehouse, Product } = await getModels(req);
    const mongoose = require("mongoose");

    const warehouseId = req.params.id;

    const warehouse = await Warehouse.findById(warehouseId).lean();

    if (!warehouse) {
      return res.status(404).json({
        success: false,
        message: "Warehouse not found",
      });
    }

    // ==========================================
    // Collect allocated quantity per product
    // ==========================================
    const productQtyMap = {};
    const productLocationMap = {};
    const productUnitMap = {};

    for (const zone of warehouse.zones || []) {
      for (const rack of zone.racks || []) {
        for (const shelf of rack.shelves || []) {
          for (const bin of shelf.bins || []) {
            for (const product of bin.products || []) {
              const productId = product.productId?.toString();

              if (!productId) continue;

              productQtyMap[productId] =
                (productQtyMap[productId] || 0) + Number(product.quantity || 0);

              if (!productLocationMap[productId]) {
                productLocationMap[productId] =
                  bin.binQRCode || bin.binName || "-";
              }
              if (!productUnitMap[productId]) {
                productUnitMap[productId] = product.unit || "-";
              }
            }
          }
        }
      }
    }

    const productIds = Object.keys(productQtyMap);

    if (productIds.length === 0) {
      return res.status(200).json({
        success: true,
        data: [],
        message: "No products found in this warehouse",
      });
    }

    const objectIds = productIds.map((id) => new mongoose.Types.ObjectId(id));

    const products = await Product.find({
      _id: { $in: objectIds },
    }).lean();

    // ==========================================
    // Merge product details + allocated qty
    // ==========================================
    const result = products.map((product) => ({
      ...product,

      allocatedQty: productQtyMap[product._id.toString()] || 0,

      availableQuantity: productQtyMap[product._id.toString()] || 0,
      locationCode: productLocationMap[product._id.toString()] || "-",
      unit: productUnitMap[product._id.toString()] || "-",
    }));

    return res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.log("❌ getAllocatedProductsByWarehouse ERROR:", error);

    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.createTransfer = async (req, res) => {
  try {
    const { Warehouse } = await getModels(req);
    const conn = Warehouse.db;

    // ✅ Define schema inline — no import needed
    const transferItemSchema = new mongoose.Schema(
      {
        productId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Product",
          required: true,
        },
        productName: String,
        locationCode: String,
        unit: { type: String, default: "Pcs" },
        totalQty: { type: Number, required: true },
        transferQty: { type: Number, required: true, min: 1 },
      },
      { _id: false },
    );

    const transferSchema = new mongoose.Schema(
      {
        transferNumber: { type: String, unique: true },
        sourceWarehouse: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Warehouse",
          required: true,
        },
        destinationWarehouse: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "Warehouse",
          required: true,
        },
        products: [transferItemSchema],
        vehicleNumber: { type: String, default: "" },
        contactPerson: { type: String, required: true },
        contactNumber: { type: String, default: "" },
        status: {
          type: String,
          enum: ["Pending", "In Transit", "Completed", "Cancelled"],
          default: "Pending",
        },
        notes: { type: String, default: "" },
      },
      { timestamps: true },
    );

    // ✅ Reuse existing model if already registered on this connection
    const Transfer =
      conn.models.Transfer || conn.model("Transfer", transferSchema);

    const {
      sourceWarehouse,
      destinationWarehouse,
      products,
      vehicleNumber,
      contactPerson,
      contactNumber,
    } = req.body;

    if (!sourceWarehouse)
      return res
        .status(400)
        .json({ success: false, message: "Source warehouse is required" });
    if (!destinationWarehouse)
      return res
        .status(400)
        .json({ success: false, message: "Destination warehouse is required" });
    if (!contactPerson)
      return res
        .status(400)
        .json({ success: false, message: "Contact person is required" });
    if (!products || products.length === 0)
      return res
        .status(400)
        .json({ success: false, message: "At least one product is required" });

    for (const p of products) {
      if (!p.transferQty || Number(p.transferQty) <= 0) {
        return res.status(400).json({
          success: false,
          message: `Transfer quantity must be greater than 0 for ${p.productName || "a product"}`,
        });
      }
    }

    const count = await Transfer.countDocuments();
    const transferNumber = `TRF-${String(count + 1).padStart(5, "0")}`;

    const transfer = await Transfer.create({
      transferNumber,
      sourceWarehouse,
      destinationWarehouse,
      products,
      vehicleNumber: vehicleNumber || "",
      contactPerson,
      contactNumber: contactNumber || "",
      status: "Pending",
    });

    return res.status(201).json({
      success: true,
      message: "Transfer created successfully",
      data: transfer,
    });
  } catch (error) {
    console.log("createTransfer ERROR:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
};

exports.getTransfers = async (req, res) => {
  try {
    const { Warehouse } = await getModels(req);
    const conn = Warehouse.db;

    const Transfer = conn.models.Transfer;

    const transfers = await Transfer.find()
      .populate("sourceWarehouse", "warehouseName")
      .populate("destinationWarehouse", "warehouseName")
      .sort({ createdAt: -1 });

    return res.status(200).json({
      success: true,
      data: transfers,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};