const axios = require("axios");
const { getEWBToken } = require("./ewb.service");

exports.getDistanceService = async (from, to) => {
  try {
    const token = await getEWBToken();

    const res = await axios.get(
      `${process.env.EWB_DISTANCE_URL}?fromPincode=${from}&toPincode=${to}`,
      {
        headers: {
          Authorization: `JWT ${token}`,
        },
      }
    );

    return res.data.results.distance;

  } catch (err) {
    throw err;
  }
};