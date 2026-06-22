const express = require("express");
const router = express.Router();
const multer = require("multer");
const storage = multer.memoryStorage();
const upload = multer({ storage });
const vehicleController = require("../controllers/vehicleController");
const { authMiddleware } = require("../middleware/auth");

const vehicleUpload = upload.fields([
    { name: "vehicleImage", maxCount: 1 },
    { name: "polutionPaper", maxCount: 1 },
    { name: "ownerCard", maxCount: 1 },
]);

router.get("/get", authMiddleware, vehicleController.getVehicle);
router.post("/add", authMiddleware, vehicleUpload, vehicleController.addVehicle);
router.get("/active-vehicles", authMiddleware, vehicleController.getActiveVehicle);
router.get("/deleted", authMiddleware, vehicleController.getDeletedVehicle);
router.patch("/restore/:id", authMiddleware, vehicleController.restoreVehicle);
router.put("/update/:id", authMiddleware, vehicleUpload, vehicleController.updateVehicle);
router.delete("/delete/:id", authMiddleware, vehicleController.deleteVehicle);

module.exports = router;
