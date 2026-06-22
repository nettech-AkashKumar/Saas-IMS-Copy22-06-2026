// const mongoose = require('mongoose');

// const notificationSchema = new mongoose.Schema({
//   recipient: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Users',
//     required: true
//   },
//   sender: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Users',
//     required: true
//   },
//   message: {
//     type: String,
//     required: true
//   },
//   type: {
//     type: String,
//     enum: ['message', 'system'],
//     default: 'message'
//   },
//   read: {
//     type: Boolean,
//     default: false
//   },
//   timestamp: {
//     type: Date,
//     default: Date.now
//   },
//   conversationId: {
//     type: mongoose.Schema.Types.ObjectId,
//     ref: 'Message'
//   }
// }, {
//   timestamps: true
// });

// // Index for efficient queries
// notificationSchema.index({ recipient: 1, read: 1 });
// notificationSchema.index({ recipient: 1, timestamp: -1 });

// // ✅ Connection-scoped model factory
// const getNotificationModel = (conn) => {
//   if (!conn) {
//     return mongoose.models.Notification || mongoose.model('Notification', notificationSchema);
//   }
//   return conn.models.Notification || conn.model('Notification', notificationSchema);
// };

// const forMaster = (conn) => {
//   return getNotificationModel(conn);
// };

// const forTenant = (conn) => {
//   return getNotificationModel(conn);
// };

// const NotificationModel = getNotificationModel();
// NotificationModel.forMaster = forMaster;
// NotificationModel.forTenant = forTenant;

// module.exports = NotificationModel;
// module.exports.forMaster = forMaster;
// module.exports.forTenant = forTenant;
const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Users",
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    type: {
      type: String,
      enum: ["message", "system"],
      default: "message",
    },
    read: {
      type: Boolean,
      default: false,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Message",
    },
  },
  {
    timestamps: true,
  }
);

// ✅ Indexes
notificationSchema.index({ recipient: 1, read: 1 });
notificationSchema.index({ recipient: 1, timestamp: -1 });

// ✅ STRICT connection-based model (NO default mongoose usage)
const getNotificationModel = (conn) => {
  if (!conn) {
    throw new Error("❌ DB connection required for Notification model");
  }

  return (
    conn.models.Notification ||
    conn.model("Notification", notificationSchema)
  );
};

// ✅ Export ONLY factories
module.exports = {
  forMaster: getNotificationModel,
  forTenant: getNotificationModel,
};