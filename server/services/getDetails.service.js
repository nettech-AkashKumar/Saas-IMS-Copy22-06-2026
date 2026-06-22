const axios = require("axios");

const getAuthToken = require("./auth.service");

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

module.exports =
  getEWBDetails;