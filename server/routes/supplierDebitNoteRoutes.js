const express = require("express");
const router = express.Router();
const debitNoteController = require("../controllers/supplierDebitNoteController");
const { authMiddleware } = require("../middleware/auth");

// Get all debit notes
router.get("/", authMiddleware, debitNoteController.getAllDebitNotes);

// Get debit note by ID
router.get("/:id", authMiddleware, debitNoteController.getDebitNoteById);

// Create new debit note
router.post("/", authMiddleware, debitNoteController.createDebitNote);

// Update debit note
router.put("/:id", authMiddleware, debitNoteController.updateDebitNote);

router.put("/:id/status", authMiddleware, debitNoteController.updateDebitNoteStatus);

// Delete debit note
router.delete("/:id", authMiddleware, debitNoteController.deleteDebitNote);

// Get debit notes by supplier
router.get(
  "/supplier/:supplierId",
  authMiddleware,
  debitNoteController.getDebitNotesBySupplier,
);

// Get debit notes by status
router.get("/status/:status", authMiddleware, debitNoteController.getDebitNotesByStatus);

// Get debit notes summary
router.get("/summary/overview", authMiddleware, debitNoteController.getDebitNotesSummary);

// Search debit notes
router.get("/search/all", authMiddleware, debitNoteController.searchDebitNotes);

// Cancel debit note
router.put("/:id/cancel", authMiddleware, debitNoteController.cancelDebitNote);

// Mark as settled
router.put("/:id/settle", authMiddleware, debitNoteController.markAsSettled);

// Get recent debit notes
router.get("/recent/all", authMiddleware, debitNoteController.getRecentDebitNotes);

// Get debit notes by purchase order
router.get(
  "/purchase-order/:poNumber",
  authMiddleware,
  debitNoteController.getDebitNotesByPurchaseOrder,
);

// Get remaining balance for a purchase order
router.get("/purchase-order/:poId/remaining-balance", 
  authMiddleware, 
  debitNoteController.getRemainingBalance
);

module.exports = router;
