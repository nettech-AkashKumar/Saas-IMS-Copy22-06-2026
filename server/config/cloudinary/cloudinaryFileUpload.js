const cloudinary = require("cloudinary").v2;
const fs = require("fs");
const dotenv = require("dotenv");

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const removeLocalFile = (filePath) => {
  if (filePath && fs.existsSync(filePath)) {
    fs.unlinkSync(filePath);
  }
};

const uploadToCloudinary = async (localFilePath, folder = "documents") => {
  try {
    if (!localFilePath) {
      throw new Error("File path is required");
    }

    // Check if Cloudinary credentials are configured
    const missingVars = [];
    if (!process.env.CLOUDINARY_CLOUD_NAME) missingVars.push("CLOUDINARY_CLOUD_NAME");
    if (!process.env.CLOUDINARY_API_KEY) missingVars.push("CLOUDINARY_API_KEY");
    if (!process.env.CLOUDINARY_API_SECRET) missingVars.push("CLOUDINARY_API_SECRET");

    if (missingVars.length) {
      throw new Error(
        `Cloudinary credentials are not configured. Missing: ${missingVars.join(", ")}. Please set them in your backend environment variables.`,
      );
    }

    // Check if file exists
    if (!fs.existsSync(localFilePath)) {
      throw new Error(`File not found at path: ${localFilePath}`);
    }

    const result = await cloudinary.uploader.upload(localFilePath, {
      folder,
      resource_type: "auto",
    });

    removeLocalFile(localFilePath);

    return {
      url: result.secure_url,
      publicId: result.public_id,
    };
  } catch (error) {
    removeLocalFile(localFilePath);
    console.error("Cloudinary upload error:", error.message || error);

    // Re-throw with detailed error message
    throw new Error(
      error.message || "Failed to upload file to Cloudinary. This might be due to invalid credentials or network issues."
    );
  }
};

const removeCloudinaryImage = async (publicId) => {
  try {
    if (!publicId) return null;
    return await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error("Cloudinary delete error:", error);
    return null;
  }
};

module.exports = {
  uploadToCloudinary,
  removeCloudinaryImage,
};
