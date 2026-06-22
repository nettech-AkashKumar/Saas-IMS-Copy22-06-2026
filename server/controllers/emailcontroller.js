const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");
const nodemailer = require("nodemailer");
const fs = require("fs");
const path = require("path");
const axios = require("axios");
const mime = require("mime-types");

const sendEmail = async (req, res, next) => {
  try {
    const { User: UserModel, Email: EmailModel } = await getAutoModels(req);
    let { to, cc = [], bcc = [], subject, body } = req.body;

    // Ensure all are arrays
    to = Array.isArray(to) ? to : [to].filter(Boolean);
    cc = Array.isArray(cc) ? cc : [cc].filter(Boolean);
    bcc = Array.isArray(bcc) ? bcc : [bcc].filter(Boolean);

    const normalizedAttachments = req.files?.attachments
      ? req.files.attachments.map((file) => file.path) // Cloudinary URL
      : [];

    const normalizedImages = req.files?.images
      ? req.files.images.map((file) => file.path) // Cloudinary URL
      : [];

    const senderEmail = req.user.email.toLowerCase();
    const existingUser = await UserModel.findOne({ email: senderEmail });
    const sender = existingUser
      ? {
        email: existingUser.email,
        name: existingUser.name || "Unknown",
        profileImage: existingUser.profileImage,
      }
      : {
        email: senderEmail,
        name: "Unknown",
        profileImage: null,
      };

    const transporter = nodemailer.createTransport({
      host: "smtp.gmail.com",
      port: 465,
      secure: true,
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS, // app password
      },
    });

    // 🔥 Convert Cloudinary files into real buffers for attachments
    const fetchFileBuffer = async (url) => {
      const response = await axios.get(url, { responseType: "arraybuffer" });
      return Buffer.from(response.data, "binary");
    };

    const attachments = [];

    // Process docs / PDFs / Excel
    for (const file of normalizedAttachments) {
      attachments.push({
        filename: file.split("/").pop(), // last part of URL
        content: await fetchFileBuffer(file),
      });
    }

    // Process images (still as URLs is fine, but buffer works too)
    for (const img of normalizedImages) {
      attachments.push({
        filename: img.split("/").pop(),
        content: await fetchFileBuffer(img),
      });
    }

    const mailOptions = {
      from: sender.email,
      to: Array.isArray(to) ? to.join(",") : to,
      cc: cc.length ? cc.join(",") : undefined,
      bcc: bcc.length ? bcc.join(",") : undefined,
      subject,
      html: `<div style="white-space: pre-wrap;">${body}</div>`,
      // attachments: [
      //   ...normalizedAttachments.map((file) => ({ path: file })),
      //   ...normalizedImages.map((img) => ({ path: img })),
      // ],
      attachments,
    };

    await transporter.sendMail(mailOptions);

    // Save email for sender (sent)
    const sentEmail = new EmailModel({
      to,
      cc,
      bcc,
      from: sender,
      subject,
      body,
      attachments: normalizedAttachments,
      image: normalizedImages,
      type: "sent",
      name: "You",
      starred: false,
      bin: false,
      date: new Date(),
    });
    await sentEmail.save();

    // Save email for each recipient (inbox), but skip the sender
    const recipients = [...(Array.isArray(to) ? to : [to]), ...cc, ...bcc];

    for (const recEmail of recipients) {
      if (recEmail.toLowerCase() === senderEmail) continue; // skip sender

      const user = await UserModel.findOne({ email: recEmail.toLowerCase() });
      const inboxEmail = new EmailModel({
        to: [recEmail],
        cc: [],
        bcc: [],
        from: sender,
        subject,
        body,
        attachments: normalizedAttachments,
        image: normalizedImages,
        type: "inbox",
        name: user ? user.name : "Unknown",
        starred: false,
        bin: false,
        isRead: false,
        date: new Date(),
      });

      await inboxEmail.save();
    }

    res.status(201).json({ success: true, message: "Email sent" });
  } catch (error) {
    next(error); // Pass error to global error handler
    // console.error("❌ sendEmail Error (full):", JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    res.status(500).json({
      error: error.message || "Unknown error occurred",
    });
  }
};

const receiveEmail = async (req, res, next) => {
  try {
    const { User: UserModel, Email: EmailModel } = await getAutoModels(req);
    const userEmail = req.user.email.toLowerCase();
    const emails = await EmailModel.find({
      type: "inbox",
      to: userEmail,
      deleted: false,
    }).sort({
      createdAt: -1,
    });
    const users = await UserModel.find().select("name email profileImage");
    const enrichRecipient = (emailAddr) => {
      if (!emailAddr) return null;
      const user = users.find(
        (u) => u.email.toLowerCase() === emailAddr.toLowerCase(),
      );
      return user
        ? {
          email: user.email,
          name: user.name,
          profileImage: user.profileImage,
        }
        : {
          email: emailAddr,
          name: "Unknown",
          profileImage: null,
        };
    };
    const formattedEmails = emails.map((email) => {
      return {
        ...email.toObject(),
        from: email.from?.email
          ? enrichRecipient(email.from.email)
          : {
            email: "unknown@example.com",
            name: "Unknown",
            profileImage: null,
          },
        to: email.to.map(enrichRecipient),
        cc: email.cc.map(enrichRecipient),
        bcc: email.bcc.map(enrichRecipient),
      };
    });
    res.status(200).json({ success: true, data: formattedEmails });
  } catch (error) {
    next(error); // Pass error to global error handler
    res.status(500).json({
      success: false,
      message: "Failed to fetch emails",
      error: error.message,
    });
  }
};

const getSentEmails = async (req, res, next) => {
  try {
    const { User: UserModel, Email: EmailModel } = await getAutoModels(req);
    const userEmail = req.user.email.toLowerCase();

    const emails = await EmailModel.find({
      type: "sent",
      "from.email": userEmail,
      deleted: false,
    }).sort({ createdAt: -1 });

    // fetch all users once
    const users = await UserModel.find().select("name email profileImage");

    const enrichRecipient = (emailAddr) => {
      if (!emailAddr) return null;
      const user = users.find(
        (u) => u.email.toLowerCase() === emailAddr.toLowerCase(),
      );
      return user
        ? {
          email: user.email,
          name: user.name,
          profileImage: user.profileImage,
        }
        : {
          email: emailAddr,
          name: "Unknown",
          profileImage: null,
        };
    };

    const formattedEmails = emails.map((email) => ({
      ...email.toObject(),
      from: email.from, // already normalized in sendEmail
      to: email.to.map(enrichRecipient),
      cc: email.cc.map(enrichRecipient),
      bcc: email.bcc.map(enrichRecipient),
    }));

    res.status(200).json({ success: true, data: formattedEmails });
  } catch (error) {
    next(error); // Pass error to global error handler
    res.status(500).json({ success: false, message: error.message });
  }
};

const getInboxCount = async (req, res, next) => {
  try {
    const { Email: EmailModel } = await getAutoModels(req);
    const userEmail = req.user.email.toLowerCase();

    const count = await EmailModel.countDocuments({
      type: "inbox",
      to: { $in: [userEmail] },
      deleted: false,
      isRead: false,
    });

    res.status(200).json({ success: true, count });
  } catch (error) {
    next(error); // Pass error to global error handler
  }
};

// Mark an email as read
const readInboxEmails = async (req, res, next) => {
  try {
    const { Email: EmailModel } = await getAutoModels(req);
    const emailId = req.params.id;
    const userEmail = req.user.email.toLowerCase();

    // console.log("🔹 readInboxEmails called for emailId:", emailId, "by user:", userEmail);

    const email = await EmailModel.findOneAndUpdate(
      { _id: emailId, to: { $in: [userEmail] } }, // simpler and safer than regex
      { $set: { isRead: true } },
      { new: true },
    );

    // console.log("Email isRead status:", email.isRead);

    if (!email) {
      //  console.log("Email not found or not for this user");
      return res
        .status(404)
        .json({ success: false, message: "Email not found" });
    }

    // console.log("✅ Email marked as read:", email._id, "isRead:", email.isRead);

    //  console.log("Email after marking as read:", email);

    res.status(200).json({ success: true, data: email });
  } catch (error) {
    next(error); // Pass error to global error handler
    // console.log(error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// backend/controllers/emailController.js
// const getStarredEmails = async (req, res, next) => {
//   try {
//     const userEmail = req.user.email.toLowerCase();

//     const emails = await EmailModal.find({
//       starred: true,
//       deleted: false,
//       $or: [
//         { type: "inbox", to: userEmail },
//         { type: "sent", "from.email": userEmail },
//       ],
//     }).sort({ createdAt: -1 });

//     res.status(200).json({ success: true, data: emails });
//   } catch (error) {
//     next(error); // Pass error to global error handler
//     res.status(500).json({
//       success: false,
//       message: "Failed to fetch starred emails",
//       error: error.message,
//     });
//   }
// };
const getStarredEmails = async (req, res, next) => {
  try {
    const { User: UserModel, Email: EmailModel } = await getAutoModels(req);
    const userEmail = req.user.email.toLowerCase();

    const emails = await EmailModel.find({
      starred: true,
      deleted: false,
      $or: [
        { type: "inbox", to: userEmail },
        { type: "sent", "from.email": userEmail },
      ],
    }).sort({ createdAt: -1 });

    // fetch all users once
    const users = await UserModel.find().select("name email profileImage");

    const enrichRecipient = (emailAddr) => {
      if (!emailAddr) return null;
      const user = users.find(
        (u) => u.email.toLowerCase() === emailAddr.toLowerCase(),
      );
      return user
        ? {
          email: user.email,
          name: user.name,
          profileImage: user.profileImage,
        }
        : {
          email: emailAddr,
          name: "Unknown",
          profileImage: null,
        };
    };

    const formattedEmails = emails.map((email) => {
      // Determine which name to show based on email type
      let displayFrom;

      if (email.type === "sent") {
        // For sent emails in starred, show the recipient (to)
        const firstRecipient = email.to?.[0];
        displayFrom = firstRecipient
          ? enrichRecipient(firstRecipient)
          : { name: "Unknown", email: "", profileImage: null };
      } else {
        // For inbox emails in starred, show the sender (from)
        displayFrom = email.from?.email
          ? enrichRecipient(email.from.email)
          : { name: "Unknown", email: "", profileImage: null };
      }

      return {
        ...email.toObject(),
        from: displayFrom,  // This will now show the correct name
        to: email.to.map(enrichRecipient),
        cc: email.cc.map(enrichRecipient),
        bcc: email.bcc.map(enrichRecipient),
      };
    });

    res.status(200).json({ success: true, data: formattedEmails });
  } catch (error) {
    next(error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch starred emails",
      error: error.message,
    });
  }
};

const starredEmail = async (req, res, next) => {
  try {
    const { Email: EmailModel } = await getAutoModels(req);
    const email = await EmailModel.findByIdAndUpdate(
      req.params.id,
      { starred: req.body.starred },
      { new: true },
    );
    res.status(200).json({ success: true, data: email });
  } catch (error) {
    next(error); // Pass error to global error handler
    res.status(500).json({
      success: false,
      message: "Failed to updated starred",
      error: error.message,
    });
  }
};

const deleteEmail = async (req, res, next) => {
  try {
    const { Email: EmailModel } = await getAutoModels(req);
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No IDs provided" });
    }
    const result = await EmailModel.updateMany(
      { _id: { $in: ids } },
      { $set: { deleted: true } },
    );

    if (result.deletedCount === 0) {
      return res
        .status(404)
        .json({ success: false, message: "No emails found" });
    }

    res.status(200).json({
      success: true,
      message: `${result.deletedCount} email(s) deleted`,
    });
  } catch (error) {
    next(error); // Pass error to global error handler
    res.status(500).json({
      success: false,
      message: "Failed to delete emails",
      error: error.message,
    });
  }
};

const getDeletedEmails = async (req, res, next) => {
  try {
    const { Email: EmailModel } = await getAutoModels(req);
    const deletedEmails = await EmailModel.find({ deleted: true });
    res.status(200).json({ success: true, data: deletedEmails });
  } catch (error) {
    next(error); // Pass error to global error handler
    res
      .status(500)
      .json({ success: false, message: "Failed to fetch deleted emails" });
  }
};

const permanentDeleteEmails = async (req, res, next) => {
  try {
    const { Email: EmailModel } = await getAutoModels(req);
    const { ids } = req.body;
    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ success: false, message: "No IDs provided" });
    }
    const result = await EmailModel.deleteMany({
      _id: { $in: ids },
      deleted: true,
    });
    res.status(200).json({
      success: true,
      message: `${result.deletedCount} email(s) permanently deleted`,
    });
  } catch (error) {
    next(error); // Pass error to global error handler
    res.status(500).json({
      success: false,
      message: "Faild to permanently delete",
      error: error.message,
    });
  }
};

module.exports = {
  sendEmail,
  receiveEmail,
  getSentEmails,
  getInboxCount,
  readInboxEmails,
  getStarredEmails,
  starredEmail,
  deleteEmail,
  getDeletedEmails,
  permanentDeleteEmails,
};
