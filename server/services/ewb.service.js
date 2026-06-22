const axios = require("axios");

let cachedToken = null;
let tokenTime = null;

const TOKEN_EXPIRY =
  5 * 60 * 60 * 1000;

// ==========================
// GET TOKEN
// ==========================
const getEWBToken = async () => {
  try {
    if (
      cachedToken &&
      tokenTime &&
      Date.now() - tokenTime <
        TOKEN_EXPIRY
    ) {
      return cachedToken;
    }

    console.log(
      "🔐 Generating new EWB token..."
    );

    const res =
      await axios.post(
        process.env.EWB_LOGIN_URL,
        {
          username:
            process.env
              .EWB_USERNAME,
          password:
            process.env
              .EWB_PASSWORD,
        },
        {
          headers: {
            "Content-Type":
              "application/json",
          },
        }
      );

    const token =
      res.data.token;

    if (!token) {
      throw new Error(
        "Token not received"
      );
    }

    cachedToken = token;
    tokenTime = Date.now();

    console.log(
      "✅ Token Generated"
    );

    return token;

  } catch (err) {
    console.log(
      "❌ LOGIN ERROR 👉",
      err.response?.data ||
        err.message
    );
    throw err;
  }
};

// ==========================
// GENERATE EWB
// ==========================
const generateEWBService =
  async (payload) => {
    const token =
      await getEWBToken();

    const res =
      await axios.post(
        process.env.EWB_API_URL,
        payload,
        {
          headers: {
            Authorization: `JWT ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

    return res.data.results;
  };

// ==========================
// CANCEL EWB
// ==========================
const cancelEWB =
  async (payload) => {
    const token =
      await getEWBToken();

    const res =
      await axios.post(
        process.env
          .EWB_CANCEL_URL,
        payload,
        {
          headers: {
            Authorization: `JWT ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

    return res.data.results;
  };

// ==========================
// UPDATE VEHICLE
// ==========================
const updateVehicleService =
  async (payload) => {
    const token =
      await getEWBToken();

    const res =
      await axios.post(
        process.env
          .EWB_UPDATE_VEHICLE_URL,
        payload,
        {
          headers: {
            Authorization: `JWT ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

    return res.data.results;
  };

// ==========================
// GET EWB DETAILS
// ==========================
const getEwayBillDetails = async (gstin, ewayBillNo) => {
  try {
    const token = await getEWBToken();

    console.log("DETAIL URL =>",
      `${process.env.EWB_DETAILS_URL}?action=GetEwayBill&gstin=${gstin}&eway_bill_number=${ewayBillNo}`
    );

    const res = await axios.get(
      `${process.env.EWB_DETAILS_URL}?action=GetEwayBill&gstin=${gstin}&eway_bill_number=${ewayBillNo}`,
      {
        headers: {
          Authorization: `JWT ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    console.log("DETAIL RESPONSE =>", res.data);

    return res.data.results;

  } catch (err) {
    console.log(
      "DETAIL ERROR =>",
      err.response?.data || err.message
    );
    throw err;
  }
};
const extendEWBValidity = async (
  payload
) => {
  const token =
    await getEWBToken();

  const res =
    await axios.post(
      process.env
        .EWB_EXTEND_VALIDITY_URL,
      payload,
      {
        headers: {
          Authorization: `JWT ${token}`,
          "Content-Type":
            "application/json",
        },
      }
    );

  return res.data.results;
};  

// ==========================
// UPDATE TRANSPORTER
// ==========================
const updateTransporterService =
  async (payload) => {
    const token =
      await getEWBToken();

    const res =
      await axios.post(
        process.env
          .EWB_UPDATE_TRANSPORTER_URL,
        payload,
        {
          headers: {
            Authorization: `JWT ${token}`,
            "Content-Type":
              "application/json",
          },
        }
      );

    return res.data.results;
  };

const getEWBDetails = async (
  ewayBillNo
) => {

  try {

    const token =
      await getAuthToken();

    const response =
      await axios.get(

        `${process.env.EWB_GET_DETAILS_URL}?eway_bill_number=${ewayBillNo}`,

        {
          headers: {

            Authorization:
              `JWT ${token}`,

            "Content-Type":
              "application/json"

          }
        }

      );

    return response.data;

  } catch (error) {

    console.log(
      "GET DETAILS ERROR 👉",
      error.response?.data ||
      error.message
    );

    throw (
      error.response?.data ||
      error.message
    );
  }
};


module.exports = {
  getEWBToken,
  generateEWBService,
  cancelEWB,
  updateVehicleService,
  getEwayBillDetails,
  extendEWBValidity,
  updateTransporterService,
};