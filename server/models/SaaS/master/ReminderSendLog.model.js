const mongoose = require("mongoose");

const ReminderSendLogSchema = new mongoose.Schema(
  {
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Company",
      required: true,
      index: true,
    },
    companyName: { type: String, default: "" },
    companyAdminEmail: { type: String, default: "" },
    logs: [
      {
        templateId: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "ReminderTemplate",
          required: true,
        },
        templateTitle: { type: String, default: "" },
        sentByName: { type: String, default: "" },
        sentByEmail: { type: String, default: "" },
        sentAt: { type: Date, default: Date.now },
      },
    ],
  },
  { timestamps: true },
);

module.exports = (conn) =>
  conn.models.ReminderSendLog ||
  conn.model("ReminderSendLog", ReminderSendLogSchema, "reminder_send_logs");
