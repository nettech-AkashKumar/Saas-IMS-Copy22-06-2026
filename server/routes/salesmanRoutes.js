const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const salesmanController = require("../controllers/salesmanController");
const { authMiddleware } = require("../middleware/auth");

const salesmanUpload = upload.fields([{ name: "salesmanImage", maxCount: 1 }]);

router.get("/get", authMiddleware, salesmanController.getSalesman);
router.post("/add", authMiddleware, salesmanUpload, salesmanController.addSalesman);
router.get("/active-salesman", authMiddleware, salesmanController.getActiveSalesman);
router.get("/deleted", authMiddleware, salesmanController.getDeletedSalesman);
router.patch("/restore/:id", authMiddleware, salesmanController.restoreSalesman);
router.put("/update/:id", authMiddleware, salesmanUpload, salesmanController.updateSalesman);
router.delete("/delete/:id", authMiddleware, salesmanController.deleteSalesman);

module.exports = router;