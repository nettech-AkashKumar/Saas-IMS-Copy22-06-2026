const express = require("express")
const localizationrouter = express.Router();
const { sendLocalization, getLocalization } = require("../../controllers/settings/Localizationcontroller")
const { authMiddleware } = require("../../middleware/auth")

localizationrouter.post('/update', authMiddleware, sendLocalization)
localizationrouter.get('/get', authMiddleware, getLocalization)

module.exports = localizationrouter;