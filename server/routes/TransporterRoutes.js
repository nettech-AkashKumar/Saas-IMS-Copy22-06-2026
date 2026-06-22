const express = require("express");
const router = express.Router();

const { authMiddleware } = require("../middleware/auth.js");
const transporter = require("../controllers/TransporterController.js");

const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });

const uploadFields = upload.fields([
  { name: "doc1", maxCount: 1 },
  { name: "doc2", maxCount: 1 },
  { name: "doc3", maxCount: 1 },
]);

router.post("/add",authMiddleware,uploadFields,transporter.createTransporter);
router.get("/get",authMiddleware,transporter.getAllTransporters);
router.get("/active-transporters", authMiddleware, transporter.getActiveTransporters);
router.get("/deleted", authMiddleware, transporter.getDeletedTransporters);
router.patch("/restore/:id", authMiddleware, transporter.restoreTransporter);
router.put("/update/:id",authMiddleware,uploadFields,transporter.updateTransporter);
router.put("/update-status/:id",authMiddleware,transporter.updateTransporterStatus);
router.delete("/delete/:id",authMiddleware,transporter.deleteTransporter);

module.exports = router;