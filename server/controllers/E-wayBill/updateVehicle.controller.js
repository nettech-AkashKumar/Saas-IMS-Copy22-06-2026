const updateVehicle = require("../../services/mastersIndia.service");
const EWB = require("../../models/E-wayBill/ewb.model");

const updateVehicleController = async (req, res) => {
  try {
    const payload = req.body;

    const response = await updateVehicle(payload);

    // update mongo
    await EWB.findOneAndUpdate(
      { ewbNo: payload.ewbNo },
      {
        vehicleNo: payload.vehicleNo,
        fromPlace: payload.fromPlace,
        fromState: payload.fromState,
        reasonCode: payload.reasonCode,
        reasonRem: payload.reasonRem,
        transDocNo: payload.transDocNo,
      }
    );

    res.status(200).json({
      success: true,
      message: "Vehicle Updated Successfully",
      data: response,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: "Vehicle Update Failed",
      error,
    });
  }
};

module.exports = updateVehicleController;