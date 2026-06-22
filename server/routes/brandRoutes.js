const express = require("express");
const router = express.Router();
const brandController = require("../controllers/brandController");
const upload = require("../middleware/Multer/multer");
const { verifyToken } = require("../middleware/Authentication/verifyToken");
const { checkPermission } = require("../middleware/permission/checkPermission");
const { authMiddleware } = require("../middleware/auth.js")

router.post("/addBrands", authMiddleware, verifyToken, checkPermission("Brand", "write"), upload.array("image", 5), brandController.addBrand);
router.get("/getBrands", authMiddleware, verifyToken, checkPermission("Brand", "read"), brandController.getBrands);
router.get("/active-brands", authMiddleware, verifyToken, checkPermission("Brand", "read"), brandController.getActiveBrands);
router.put("/editBrands/:id", authMiddleware, verifyToken, checkPermission("Brand", "update"), upload.array("image", 5), brandController.updateBrand);
router.delete("/deleteBrand/:id", authMiddleware, verifyToken, checkPermission("Brand", "delete"), brandController.deleteBrand);
router.get("/deleted", authMiddleware, verifyToken, checkPermission("Brand", "read"), brandController.getDeletedBrands);
router.patch("/restore/:id", authMiddleware, verifyToken, checkPermission("Brand", "update"), brandController.restoreBrand);

module.exports = router;
