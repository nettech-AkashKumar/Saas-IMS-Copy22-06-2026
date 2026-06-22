const mongoose = require("mongoose");

const contactSchema = new mongoose.Schema(
  {
    name: { type: String },
    email: { type: String },
    phone: { type: String },
    product: { type: String },
    message: { type: String },
    ip: { type: String },
    userAgent: { type: String },
    isRead: { type: Boolean, default: false },
    date: { type: Date, default: Date.now },
  },
  { timestamps: true },
);

const getContactModel = (conn) => {
  if (!conn) {
    return mongoose.models.ContactMessage || mongoose.model("ContactMessage", contactSchema);
  }
  return conn.models.ContactMessage || conn.model("ContactMessage", contactSchema);
};

const forMaster = (conn) => getContactModel(conn);
const forTenant = (conn) => getContactModel(conn);

const ContactMessage = getContactModel();
ContactMessage.forMaster = forMaster;
ContactMessage.forTenant = forTenant;

module.exports = ContactMessage;
module.exports.forMaster = forMaster;
module.exports.forTenant = forTenant;
