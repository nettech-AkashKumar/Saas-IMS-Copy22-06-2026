const express = require("express");
const router = express.Router();
const {
  createProduct,
  getAllProducts,
  getProductById,
  getProductBarcodeDetails,
  updateProduct,
  deleteProductImage,
  deleteProduct,
  searchProductsByName,
  importProducts,
  getProductStock,
  getUpcomingExpiryProducts,
  getPurchaseReturnStock,
  getProductByBarcode,
  generateBarcode,
  updateOpeningQuantityBulk,
  duplicateProduct,
  getAllExistingProducts,
  getDeletedProducts,
  restoreProduct,
} = require("../controllers/productController");

const upload = require("../middleware/Multer/multer");
const { authMiddleware } = require("../middleware/auth.js")
const validateProductsListQuery = require("../middleware/validateProductsListQuery");
const path = require("path");

router.get("/stock", authMiddleware, getProductStock);
router.get("/upcoming-expiry", authMiddleware, getUpcomingExpiryProducts);
router.get("/search", authMiddleware, searchProductsByName); // ✅ must come before /products/:id
router.get("/all-existing-products", authMiddleware, getAllExistingProducts);
router.get("/deleted", authMiddleware, getDeletedProducts);
router.get('/barcode/:code', authMiddleware, getProductByBarcode);
router.post('/generate-barcode', authMiddleware, generateBarcode);
router.get('/preview/:id', authMiddleware, getProductBarcodeDetails);
router.post("/create", upload.array("images", 10), authMiddleware, createProduct);
router.post("/import", upload.single("file"), authMiddleware, importProducts);
router.get("/", authMiddleware, validateProductsListQuery, getAllProducts);         // Read All
router.patch("/restore/:id", authMiddleware, restoreProduct);
router.post("/:id/duplicate", authMiddleware, duplicateProduct);
router.get("/:id", authMiddleware, getProductById);      // Read Single
router.put("/:id", upload.array("images", 10), authMiddleware, updateProduct);
router.delete("/:id", authMiddleware, deleteProductImage)// Update
router.delete("/pro/:id", authMiddleware, deleteProduct);    // Delete
router.post("/update-opening-quantity", authMiddleware, updateOpeningQuantityBulk);

module.exports = router;
