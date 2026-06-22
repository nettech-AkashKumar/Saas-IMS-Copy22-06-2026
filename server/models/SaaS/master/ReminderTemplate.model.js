const mongoose = require("mongoose");

const ReminderTemplateSchema = new mongoose.Schema(
  {
    title: { type: String, required: true, trim: true },
    image: { type: String, trim: true, default: "" },
    description: { type: String, required: true, trim: true },
    createdById: { type: mongoose.Schema.Types.ObjectId, ref: "SuperAdmin" },
    createdByName: { type: String, default: "Super Admin" },
    createdByEmail: { type: String, default: "" },
    lastSentByName: { type: String, default: "" },
    lastSentByEmail: { type: String, default: "" },
    lastSentAt: { type: Date },
    sendCount: { type: Number, default: 0 },
  },
  { timestamps: true },
);

module.exports = (conn) =>
  conn.models.ReminderTemplate ||
  conn.model("ReminderTemplate", ReminderTemplateSchema, "reminder_templates");
