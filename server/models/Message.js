const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  participants: [{
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Users',
    required: true
  }],
  messages: [{
    _id: { type: mongoose.Schema.Types.ObjectId, auto: true },
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'Users', required: true },
    message: { type: String, required: true },
    timestamp: { type: Date, default: Date.now },
    read: { type: Boolean, default: false },
    isDeleted: { type: Boolean, default: false },
    fileUrl: { type: String },
    fileType: { type: String },
    fileName: { type: String },
    clearedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }],
    replyTo: {
      message: { type: String },
      timestamp: { type: Date },
      from: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
      username: { type: String }
    }
  }],
  lastMessage: {
    from: { type: mongoose.Schema.Types.ObjectId, ref: 'Users' },
    message: { type: String },
    timestamp: { type: Date, default: Date.now },
    clearedBy: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Users' }]
  }
}, { timestamps: true });

// Create a compound index to ensure only one document per user pair
// MessageSchema.index({ participants: 1 }, { unique: true });

// ✅ Connection-scoped model factory
const getMessageModel = (conn) => {
  if (!conn) {
    return mongoose.models.Message || mongoose.model('Message', MessageSchema);
  }
  return conn.models.Message || conn.model('Message', MessageSchema);
};

const forMaster = (conn) => {
  return getMessageModel(conn);
};

const forTenant = (conn) => {
  return getMessageModel(conn);
};

const MessageModel = getMessageModel();
MessageModel.forMaster = forMaster;
MessageModel.forTenant = forTenant;

module.exports = MessageModel;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;