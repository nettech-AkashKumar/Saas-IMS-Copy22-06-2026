const express = require("express");
const { submitContact } = require("../../controllers/SaaS/superAdmin/contact.controller");

const router = express.Router();

router.post("/", submitContact);

module.exports = router;
