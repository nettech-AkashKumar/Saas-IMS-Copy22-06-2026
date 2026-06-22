const express = require("express");
const router = express.Router();
const bagController = require("../controllers/bagController");
const upload = require("../config/upload");
const { authMiddleware } = require("../middleware/auth");

router.post("/add", authMiddleware, upload.single("image"), bagController.addBag);
router.post("/delete", authMiddleware, bagController.deleteBags);
router.get("/get", authMiddleware, bagController.getBags);

module.exports = router;
