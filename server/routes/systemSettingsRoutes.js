const express = require('express');
const router = express.Router();
const systemSettingsController = require('../controllers/systemSettingsController.js');
const { authMiddleware } = require("../middleware/auth.js");

router.get('/', authMiddleware, systemSettingsController.getSystemSettings);
router.post('/', authMiddleware, systemSettingsController.createSystemSettings);

module.exports = router;