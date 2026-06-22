
// routes/hsnRoutes.js
const express = require('express');
const router = express.Router();
const multer = require('multer');
const {
    getPaginatedHSN,
    createHSN,
    updateHSN,
    deleteHSN,
    importHSN,
    exportHSN,
    bulkImportHSN,
    bulkImport,
    getAllHSN,
    getDeletedHSN,
    restoreHSN
} = require('../controllers/hsnControllers');
const { authMiddleware } = require("../middleware/auth.js");

const storage = multer.memoryStorage();
const upload = multer({ storage });
const { checkPermission } = require("../middleware/permission/checkPermission");

router.get('/paginated', authMiddleware, checkPermission("HSN", "read"), getPaginatedHSN);
router.post('/', authMiddleware, checkPermission("HSN", "write"), createHSN);
router.put('/:id', authMiddleware, checkPermission("HSN", "update"), updateHSN);
router.delete('/:id', authMiddleware, checkPermission("HSN", "delete"), deleteHSN);
// router.post('/import', upload.single('file'), importHSN);
router.post('/import-json', authMiddleware, checkPermission("HSN", "import"), importHSN);
router.post('/import', authMiddleware, checkPermission("HSN", "import"), bulkImport);
router.get('/export', authMiddleware, checkPermission("HSN", "export"), exportHSN);
router.get("/all", authMiddleware, checkPermission("HSN", "read"), getAllHSN);
router.get("/deleted", authMiddleware, checkPermission("HSN", "read"), getDeletedHSN);
router.patch("/restore/:id", authMiddleware, checkPermission("HSN", "update"), restoreHSN);

module.exports = router;
