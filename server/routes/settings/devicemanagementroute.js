const express = require('express')
const {getUserDevices, deleteDevice} = require('../../controllers/settings/devicemanagementcontroller')
const { authMiddleware } = require('../../middleware/auth')

const devicemanagementrouter = express.Router();
// get devices by userId
devicemanagementrouter.get('/:userId', authMiddleware, getUserDevices)

// Delete device by device ID
devicemanagementrouter.delete('/:id', authMiddleware, deleteDevice)

module.exports = devicemanagementrouter;