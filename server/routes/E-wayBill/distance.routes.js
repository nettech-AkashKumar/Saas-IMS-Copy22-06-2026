const express = require("express");
const router = express.Router();

const tenantMiddleware = require("../../middleware/SaaS/tenant.middleware");

const {
  getDistanceController,
} = require("../../controllers/E-wayBill/distance.controller");

router.use(tenantMiddleware);

router.get("/distance", getDistanceController);

module.exports = router;