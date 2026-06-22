const express = require("express");
const router = express.Router();
const { errorPing } = require("../controllers/errorController");

router.get("/ping", errorPing);

module.exports = router;
