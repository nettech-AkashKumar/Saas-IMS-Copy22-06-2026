const {
  getDistanceService,
} = require("../../services/distance.service");

exports.getDistanceController = async (req, res) => {
  try {
    const { from, to } = req.query;

    if (!from || !to) {
      return res.status(400).json({
        success: false,
        message: "from and to pincode required",
      });
    }

    const result = await getDistanceService(from, to);

    return res.status(200).json({
      success: true,
      distance: result,
    });

  } catch (err) {
    console.log("DISTANCE ERROR 👉", err.response?.data || err.message);

    return res.status(500).json({
      success: false,
      message: err.response?.data || err.message,
    });
  }
};