const cloudinary = require("cloudinary").v2;
require("dotenv").config();

const cloudName =
  process.env.CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
const apiKey =
  process.env.CLOUD_API_KEY || process.env.CLOUDINARY_API_KEY;
const apiSecret =
  process.env.CLOUD_API_SECRET || process.env.CLOUDINARY_API_SECRET;

cloudinary.config({
  cloud_name: cloudName,
  api_key: apiKey,
  api_secret: apiSecret,
});

module.exports = cloudinary; // ✅ Export directly

