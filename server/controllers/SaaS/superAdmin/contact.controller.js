const ContactMessage = require("../../../models/contactMessageModel");
const connectMasterDB = require("../../../config/SaaS/masterDb");
const nodemailer = require("nodemailer");

const submitContact = async (req, res, next) => {
  try {
    const { name, email, phone, product, message } = req.body;

    if (!name || !email || !message) {
      return res.status(400).json({ success: false, message: "Missing required fields" });
    }

    const ip = req.ip || req.headers["x-forwarded-for"] || req.connection?.remoteAddress || "";
    const userAgent = req.get("User-Agent") || "";

    const masterConn = await connectMasterDB();
    const Contact = ContactMessage.forMaster(masterConn);

    const contact = new Contact({ name, email, phone, product, message, ip, userAgent });
    await contact.save();

    // Send notification email to super admin
    const smtpUser = process.env.EMAIL_USER || process.env.MAIL_USER;
    const smtpPass = process.env.EMAIL_PASS || process.env.MAIL_PASS;
    const toAddress = process.env.SUPER_ADMIN_EMAIL || smtpUser;

    if (smtpUser && smtpPass && toAddress) {
      try {
        const transporter = nodemailer.createTransport({
          host: "smtp.gmail.com",
          port: 465,
          secure: true,
          auth: { user: smtpUser, pass: smtpPass },
        });

        const html = `
          <h3>New contact form submission</h3>
          <p><strong>Name:</strong> ${name}</p>
          <p><strong>Email:</strong> ${email}</p>
          <p><strong>Phone:</strong> ${phone || "-"}</p>
          <p><strong>Product:</strong> ${product || "-"}</p>
          <p><strong>Message:</strong><br/>${message}</p>
          <p><small>IP: ${ip} | User-Agent: ${userAgent}</small></p>
        `;

        await transporter.sendMail({
          from: smtpUser,
          to: toAddress,
          subject: `Website Contact: ${name}`,
          html,
        });
      } catch (mailErr) {
        // Log but don't fail the request
        console.warn("Contact email send failed:", mailErr.message || mailErr);
      }
    }

    res.status(201).json({ success: true, data: contact });
  } catch (error) {
    next(error);
  }
};

const getContactMessages = async (req, res, next) => {
  try {
    const masterConn = await connectMasterDB();
    const Contact = ContactMessage.forMaster(masterConn);
    const messages = await Contact.find().sort({ createdAt: -1 }).limit(1000);
    res.status(200).json({ success: true, data: messages });
  } catch (error) {
    next(error);
  }
};

module.exports = { submitContact, getContactMessages };
