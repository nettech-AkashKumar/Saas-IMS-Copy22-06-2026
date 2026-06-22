const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const brokerController = require("../controllers/brokerController");
const { authMiddleware } = require("../middleware/auth");

const brokerUpload = upload.fields([{ name: "brokerImage", maxCount: 1 }]);

router.get("/get", authMiddleware, brokerController.getBroker);
router.post("/add", authMiddleware, brokerUpload, brokerController.addBroker);
router.get("/active-brokers", authMiddleware, brokerController.getActiveBrokers);
router.get("/deleted", authMiddleware, brokerController.getDeletedBrokers);
router.patch("/restore/:id", authMiddleware, brokerController.restoreBroker);
router.put("/update/:id", authMiddleware, brokerUpload, brokerController.updateBroker);
router.delete("/delete/:id", authMiddleware, brokerController.deleteBroker);

module.exports = router;
