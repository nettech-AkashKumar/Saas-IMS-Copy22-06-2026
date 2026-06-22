const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const driverController = require("../controllers/driverController");
const { authMiddleware } = require("../middleware/auth");

const driverUpload = upload.fields([
    { name: "aadhaarCard", maxCount: 1 },
    { name: "panCard", maxCount: 1 },
    { name: "licenseCard", maxCount: 1 },
]);

router.get("/get", authMiddleware, driverController.getDriver);
router.post("/add", authMiddleware, driverUpload, driverController.addDriver);
router.get("/active-drivers", authMiddleware, driverController.getActiveDriver);
router.get("/deleted", authMiddleware, driverController.getDeletedDriver);
router.patch("/restore/:id", authMiddleware, driverController.restoreDriver);
router.put("/update/:id", authMiddleware, driverUpload, driverController.updateDriver);
router.delete("/delete/:id", authMiddleware, driverController.deleteDriver);

module.exports = router;
