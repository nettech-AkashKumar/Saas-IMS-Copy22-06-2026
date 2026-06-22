const express = require("express");
const router = express.Router();

const tenantMiddleware =
  require("../../middleware/SaaS/tenant.middleware");

const {
  generateEWBController,
  cancelEwayBill,
  getAllEWB,
  getEWBById,
  getEWBByNumber,
  getEWBDetailsController,
  updateVehicleController,
  extendValidityController,
  updateTransporterController,
} = require("../../controllers/E-wayBill/ewb.controller");

router.use(tenantMiddleware);

// POST
router.post(
  "/generate",
  generateEWBController
);

router.post(
  "/cancel",
  cancelEwayBill
);

router.post(
  "/vehicle/update",
  updateVehicleController
);

router.post(
  "/extend-validity",
  extendValidityController
);

router.post(
  "/transporter/update",
  updateTransporterController
);

// GET
router.get("/all", getAllEWB);

router.get(
  "/number/:ewayBillNo",
  getEWBByNumber
);

// IMPORTANT: put before /:id
router.get(
  "/details/:ewayBillNo",
  getEWBDetailsController
);

router.get(
  "/:id",
  getEWBById
);


module.exports = router;