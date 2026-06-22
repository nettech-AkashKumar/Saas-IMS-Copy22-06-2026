const express = require('express');
const router = express.Router();
const customerController = require('../controllers/customerController');
const  {authMiddleware}=require("../middleware/auth.js");


// Existing customer routes
router.post('/', authMiddleware, customerController.createCustomer);
router.get('/', authMiddleware, customerController.getAllCustomers);
router.get('/filter/dues-advance', authMiddleware, customerController.getFilteredCustomersByType);

router.get('/active-customers', authMiddleware, customerController.getActiveCustomers);
router.get('/deleted', authMiddleware, customerController.getDeletedCustomers);
router.patch('/restore/:id', authMiddleware, customerController.restoreCustomer);

router.get('/:id', authMiddleware, customerController.getCustomerById);
router.put('/:id', authMiddleware, customerController.updateCustomer);
router.delete('/:id', authMiddleware, customerController.deleteCustomer);
router.get("/:id/statistics", authMiddleware, customerController.getCustomerStatistics);

// Add these new loyalty-related routes
router.get("/:id/points", authMiddleware, customerController.getCustomerPoints);
router.post("/:id/add-points", authMiddleware, customerController.addManualPoints);
router.post("/:id/redeem-points", authMiddleware, customerController.redeemPoints);
router.get("/:id/points-history", authMiddleware, customerController.getPointsHistory);
router.post("/:id/recalculate-due", authMiddleware, customerController.recalculateCustomerDue);
router.get("/:id/points", authMiddleware, customerController.getCustomerPoints);

module.exports = router;
