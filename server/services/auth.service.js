// const axios = require("axios");

// let cachedToken = null;

// let tokenTime = null;

// const TOKEN_EXPIRY = 5 * 60 * 60 * 1000;

// exports.getEWBToken = async () => {

//   try {

//     if (
//       cachedToken &&
//       tokenTime &&
//       Date.now() - tokenTime < TOKEN_EXPIRY
//     ) {
//       return cachedToken;
//     }

//     console.log("🔐 Generating new EWB token...");

//     const res = await axios.post(
//       process.env.EWB_LOGIN_URL,
//       {
//         username: process.env.EWB_USERNAME,
//         password: process.env.EWB_PASSWORD,
//       },
//       {
//         headers: {
//           "Content-Type": "application/json",
//         },
//       }
//     );

//     const token = res.data.token;

//     if (!token) {
//       throw new Error("Token not received");
//     }

//     cachedToken = token;

//     tokenTime = Date.now();

//     console.log("✅ Token Generated");

//     return token;

//   } catch (err) {

//     console.log(
//       "❌ LOGIN ERROR 👉",
//       err.response?.data || err.message
//     );

//     throw err;
//   }
// };