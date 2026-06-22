const mongoose = require("mongoose");

const HeroContentSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, unique: true }, // Unique identifier for each hero section
    title: { type: String, default: "" },
    subtitle: { type: String, default: "" },
    features: [
      {
        title: { type: String, default: "" },
        description: { type: String, default: "" },
      },
    ],
    primaryText: { type: String, default: "Contact Us" },
    primaryUrl: { type: String, default: "#contact" },
    secondaryText: { type: String, default: "Get A Demo" },
    secondaryUrl: { type: String, default: "#demo" },
    imageUrl: { type: String, default: "" },
    imageUrls: [
      {
        slot: { type: String, default: "default" },
        url: { type: String, default: "" },
      },
    ],
    imageAlt: { type: String, default: "POS Software" },
    templateType: {
      type: String,
      enum: ["modern", "classic"],
      default: "modern",
    },
    isActive: { type: Boolean, default: false }, // To mark which hero is currently active
  },
  { timestamps: true }
);

module.exports = (conn) =>
  conn.models.HeroContent || conn.model("HeroContent", HeroContentSchema, "herocontents");
