const express = require('express');
const router = express.Router();
const {
  createPosSale,
  getPosSales,
  getPosSaleById,
  getSalesSummary,
  getPosSaleByInvoiceNumber
} = require('../controllers/posSaleController');
const { verifyToken } = require('../middleware/Authentication/verifyToken');
const { authMiddleware } = require("../middleware/auth.js")

// Apply authentication middleware to all routes
router.use(verifyToken);

// Create new POS sale
router.post('/create', authMiddleware, createPosSale);

// Get all POS sales with pagination
router.get('/transactions', authMiddleware, getPosSales);

// Get POS sale by invoice number
router.get('/by-invoice/:invoiceNumber', authMiddleware, getPosSaleByInvoiceNumber);

// Get single POS sale by ID
router.get('/:id', authMiddleware, getPosSaleById);

// Get sales summary/statistics
router.get('/summary/daily', authMiddleware, getSalesSummary);

module.exports = router; 
