const express = require("express");
const { authMiddleware } = require("../middleware/auth.js");
const {
  createWarehouse,
  getAllWarehouses,
  getActiveWarehouses,
  getWarehouseById,
  updateWarehouse,
  deleteWarehouse,
  assignProductToLocation,
  getProductAllocation,
  getAllocatedProductsByWarehouse,
  createTransfer,
  getTransfers,
  deleteZone,
  deleteRack,
  deleteShelf,
  deleteBin,
  stockOutProduct,
} = require("../controllers/warehouseControllers.js");
const tenantDbMiddleware = require("../middleware/SaaS/tenantResolver.js");
const router = express.Router();

// ✅ Static POST routes first
router.post("/", authMiddleware, tenantDbMiddleware, createWarehouse);
router.post(
  "/assign-product",
  authMiddleware,
  tenantDbMiddleware,
  assignProductToLocation,
);

router.post("/transfer", authMiddleware, tenantDbMiddleware, createTransfer);
router.post("/stock-out", authMiddleware, tenantDbMiddleware, stockOutProduct);

// ✅ Static GET routes
router.get("/", authMiddleware, tenantDbMiddleware, getAllWarehouses);
router.get("/active", authMiddleware, tenantDbMiddleware, getActiveWarehouses);
router.get("/product-allocation", authMiddleware, tenantDbMiddleware, getProductAllocation);
router.get("/transfer", authMiddleware, tenantDbMiddleware, getTransfers);

// ✅ Dynamic :id GET routes (must come after all static GET routes)
router.get( "/:id/allocated-products", authMiddleware, tenantDbMiddleware, getAllocatedProductsByWarehouse,);
router.get("/:id", authMiddleware, tenantDbMiddleware, getWarehouseById);

// ✅ Dynamic :id PATCH/DELETE routes
router.patch("/:id", authMiddleware, tenantDbMiddleware, updateWarehouse);
router.delete("/:id", authMiddleware, tenantDbMiddleware, deleteWarehouse);
router.delete(
  "/:id/zones/:zoneId",
  authMiddleware,
  tenantDbMiddleware,
  deleteZone,
);
router.delete(
  "/:id/zones/:zoneId/racks/:rackId",
  authMiddleware,
  tenantDbMiddleware,
  deleteRack,
);
router.delete(
  "/:id/zones/:zoneId/racks/:rackId/shelves/:shelfId",
  authMiddleware,
  tenantDbMiddleware,
  deleteShelf,
);
router.delete(
  "/:id/zones/:zoneId/racks/:rackId/shelves/:shelfId/bins/:binId",
  authMiddleware,
  tenantDbMiddleware,
  deleteBin,
);

module.exports = router;
