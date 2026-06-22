const express = require("express");
const router = express.Router();
const { authMiddleware } = require("../middleware/auth");
const multer = require("multer");
const {
  getPaginatedExpenses,
  getExpenseSummary,
  createExpense,
  getAllExpenses,
  getExpenseById,
  updateExpense,
  deleteExpense,
  getDeletedExpenses,
  restoreExpense,
  getActiveExpenses,
} = require('../controllers/expenseController');
const cloudinary = require("../utils/cloudinary/cloudinary.js");

// Multer setup
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) => cb(null, Date.now() + "-" + file.originalname),
});
const upload = multer({ storage });

router.get("/", authMiddleware, getAllExpenses);
router.get("/deleted", authMiddleware, getDeletedExpenses);
router.get("/active-expenses", authMiddleware, getActiveExpenses);
router.get("/paginated", authMiddleware, getPaginatedExpenses);
router.patch("/restore/:id", authMiddleware, restoreExpense);
router.get("/:id", authMiddleware, getExpenseById);
router.get("/summary", authMiddleware, getExpenseSummary);
router.post("/", authMiddleware, upload.array("receipt", 5), createExpense);
router.put("/:id", authMiddleware, upload.single("receipt"), updateExpense);
router.delete("/:id", authMiddleware, deleteExpense);

module.exports = router;