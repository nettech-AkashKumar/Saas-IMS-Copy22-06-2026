const DeviceSession = require("../../models/settings/DeviceManagementmodal")


const getUserDevices = async (req, res, next) => {
    try {
        const devices = await DeviceSession.find({ userId: req.params.userId }).sort({ loginTime: -1 })
        res.json({ devices })
    } catch (error) {
        next(error); // Pass error to global error handler
        console.error("Error fetching devices:", error.message)
        res.status(500).json({ message: "Server error" })
    }
};


const deleteDevice = async (req, res, next) => {
    try {
    await DeviceSession.findByIdAndDelete(req.params.id)
    res.json({message:"Device deleted successfully"})
    } catch (error) {
        next(error); // Pass error to global error handler
        res.status(500).json({message:"Server error"})
    }
}

module.exports = { getUserDevices, deleteDevice };
