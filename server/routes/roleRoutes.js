// routes/roleRoutes.js
const express = require('express');
const router = express.Router();
const roleController = require('../controllers/roleController');
const { authMiddleware } = require("../middleware/auth.js");

// Role CRUD operations
router.post('/create', authMiddleware, roleController.createRole);
router.get('/getRole', authMiddleware, roleController.getAllRoles);
router.get('/roleById/:id', authMiddleware, roleController.getRoleById);
router.put('/update/:id', authMiddleware, roleController.updateRole);
router.delete('/delete/:id', authMiddleware, roleController.deleteRole);

// Role status management
router.put('/update-status/:id', authMiddleware, roleController.updateRoleStatus);

// Active roles (for dropdowns)
router.get('/getRole/active', authMiddleware, roleController.getActiveRoles);

// Member count
router.get('/member-count/:id', authMiddleware, roleController.getRoleMemberCount);

// Duplicate role
router.post('/duplicate/:id', authMiddleware, roleController.duplicateRole);
router.post('/assign-permissions',authMiddleware, roleController.assignPermissions);

module.exports = router;
