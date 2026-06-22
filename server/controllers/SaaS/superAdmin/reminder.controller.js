const connectMasterDB = require("../../../config/SaaS/masterDb");
const CompanyModel = require("../../../models/SaaS/master/Company.model");
const SuperAdminModel = require("../../../models/SaaS/master/SuperAdmin");
const ReminderTemplateModel = require("../../../models/SaaS/master/ReminderTemplate.model");
const ReminderSendLogModel = require("../../../models/SaaS/master/ReminderSendLog.model");
const { uploadToCloudinary } = require("../../../config/cloudinary/cloudinaryFileUpload");
const fs = require("fs");
const os = require("os");
const path = require("path");
const { sendMail } = require("../../../utils/SaaS/sendMail");
const { createReminderEmailHtml } = require("../../../utils/SaaS/remindEmailTemplate");

const getAdminMeta = async (masterDB, req) => {
  const SuperAdmin = SuperAdminModel(masterDB);
  const adminId = req.admin?.adminId;
  if (!adminId) {
    return { id: null, name: "Super Admin", email: "" };
  }

  const admin = await SuperAdmin.findById(adminId).lean();
  if (!admin) {
    return { id: adminId, name: "Super Admin", email: "" };
  }

  return {
    id: admin._id,
    name: admin.name || "Super Admin",
    email: admin.email || "",
  };
};

exports.createReminderTemplate = async (req, res, next) => {
  try {
    const { title, image, description } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "Title is required" });
    }

    if (!description || !String(description).trim()) {
      return res.status(400).json({ message: "Description is required" });
    }

    const masterDB = await connectMasterDB();
    const ReminderTemplate = ReminderTemplateModel(masterDB);
    const adminMeta = await getAdminMeta(masterDB, req);

    let imageUrl = String(image || "").trim();
    const isBase64Image = /^data:image\/[a-zA-Z]+;base64,/.test(imageUrl);

    if (isBase64Image) {
      const base64Data = imageUrl.split(",")[1] || "";
      const imageBuffer = Buffer.from(base64Data, "base64");
      const maxSizeBytes = 10 * 1024 * 1024;

      if (imageBuffer.length > maxSizeBytes) {
        return res.status(400).json({
          message: "Image size must be 10MB or less.",
        });
      }

      const extensionMatch = imageUrl.match(/^data:image\/([^;]+);base64,/);
      const extension = extensionMatch ? extensionMatch[1].replace(/[^a-zA-Z0-9]/g, "") : "jpg";
      const tempFileName = `reminder-upload-${Date.now()}.${extension}`;
      const tempFilePath = path.join(os.tmpdir(), tempFileName);

      await fs.promises.writeFile(tempFilePath, imageBuffer);
      const uploadResult = await uploadToCloudinary(tempFilePath, "reminder_templates");
      imageUrl = uploadResult?.url || imageUrl;
    }

    const template = await ReminderTemplate.create({
      title: String(title).trim(),
      image: imageUrl,
      description: String(description).trim(),
      createdById: adminMeta.id,
      createdByName: adminMeta.name,
      createdByEmail: adminMeta.email,
    });

    res.status(201).json({
      message: "Template created successfully",
      template,
    });
  } catch (err) {
    next(err);
  }
};

exports.getReminderTemplates = async (req, res, next) => {
  try {
    const masterDB = await connectMasterDB();
    const ReminderTemplate = ReminderTemplateModel(masterDB);

    const templates = await ReminderTemplate.find({})
      .sort({ createdAt: -1 })
      .lean();

    res.json({
      total: templates.length,
      templates,
    });
  } catch (err) {
    next(err);
  }
};

exports.getReminderTemplateById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const masterDB = await connectMasterDB();
    const ReminderTemplate = ReminderTemplateModel(masterDB);
    const template = await ReminderTemplate.findById(id).lean();

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.json({ template });
  } catch (err) {
    next(err);
  }
};

exports.updateReminderTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { title, description, image } = req.body;

    if (!title || !String(title).trim()) {
      return res.status(400).json({ message: "Title is required" });
    }
    if (!description || !String(description).trim()) {
      return res.status(400).json({ message: "Description is required" });
    }

    const masterDB = await connectMasterDB();
    const ReminderTemplate = ReminderTemplateModel(masterDB);

    const template = await ReminderTemplate.findById(id);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    let imageUrl = template.image || "";
    const providedImage = String(image || "").trim();
    const isBase64Image = /^data:image\/[a-zA-Z]+;base64,/.test(providedImage);

    if (isBase64Image) {
      const base64Data = providedImage.split(",")[1] || "";
      const imageBuffer = Buffer.from(base64Data, "base64");
      const maxSizeBytes = 10 * 1024 * 1024;

      if (imageBuffer.length > maxSizeBytes) {
        return res.status(400).json({
          message: "Image size must be 10MB or less.",
        });
      }

      const extensionMatch = providedImage.match(/^data:image\/([^;]+);base64,/);
      const extension = extensionMatch ? extensionMatch[1].replace(/[^a-zA-Z0-9]/g, "") : "jpg";
      const tempFileName = `reminder-upload-${Date.now()}.${extension}`;
      const tempFilePath = path.join(os.tmpdir(), tempFileName);

      await fs.promises.writeFile(tempFilePath, imageBuffer);
      const uploadResult = await uploadToCloudinary(tempFilePath, "reminder_templates");
      imageUrl = uploadResult?.url || imageUrl;
    } else if (providedImage) {
      imageUrl = providedImage;
    }

    template.title = String(title).trim();
    template.description = String(description).trim();
    template.image = imageUrl;

    await template.save();

    res.json({
      message: "Template updated successfully",
      template,
    });
  } catch (err) {
    next(err);
  }
};

exports.deleteReminderTemplate = async (req, res, next) => {
  try {
    const { id } = req.params;
    const masterDB = await connectMasterDB();
    const ReminderTemplate = ReminderTemplateModel(masterDB);

    const template = await ReminderTemplate.findByIdAndDelete(id);
    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    res.json({ message: "Template deleted successfully" });
  } catch (err) {
    next(err);
  }
};

exports.sendReminderToCompany = async (req, res, next) => {
  try {
    const { companyId, templateId } = req.body;

    if (!companyId) {
      return res.status(400).json({ message: "companyId is required" });
    }

    if (!templateId) {
      return res.status(400).json({ message: "templateId is required" });
    }

    const masterDB = await connectMasterDB();
    const Company = CompanyModel(masterDB);
    const ReminderTemplate = ReminderTemplateModel(masterDB);
    const ReminderSendLog = ReminderSendLogModel(masterDB);

    const [company, template, adminMeta] = await Promise.all([
      Company.findById(companyId).lean(),
      ReminderTemplate.findById(templateId),
      getAdminMeta(masterDB, req),
    ]);

    if (!company) {
      return res.status(404).json({ message: "Company not found" });
    }

    if (!company.adminEmail) {
      return res.status(400).json({ message: "Company admin email not found" });
    }

    if (!template) {
      return res.status(404).json({ message: "Template not found" });
    }

    const sendDate = new Date();

    const html = createReminderEmailHtml({
      title: template.title,
      description: template.description,
      imageUrl: template.image,
      adminName: adminMeta.name,
      adminEmail: adminMeta.email,
      companyName: company.companyName,
      sendDate,
    });

    await sendMail({
      to: company.adminEmail,
      subject: `Reminder: ${template.title}`,
      html,
    });

    template.lastSentByName = adminMeta.name;
    template.lastSentByEmail = adminMeta.email;
    template.lastSentAt = sendDate;
    template.sendCount = Number(template.sendCount || 0) + 1;
    await Promise.all([
      template.save(),
      ReminderSendLog.findOneAndUpdate(
        { companyId: company._id },
        {
          $set: {
            companyId: company._id,
            companyName: company.companyName || "",
            companyAdminEmail: company.adminEmail || "",
          },
          $push: {
            logs: {
              templateId: template._id,
              templateTitle: template.title || "",
              sentByName: adminMeta.name || "",
              sentByEmail: adminMeta.email || "",
              sentAt: sendDate,
            },
          },
        },
        { upsert: true, new: true },
      ),
    ]);

    res.json({
      message: "Reminder sent successfully",
      sendDate,
      company: {
        id: company._id,
        companyName: company.companyName,
        adminEmail: company.adminEmail,
      },
      template: {
        id: template._id,
        title: template.title,
        lastSentByName: template.lastSentByName,
        lastSentByEmail: template.lastSentByEmail,
        lastSentAt: template.lastSentAt,
        sendCount: template.sendCount,
      },
    });
  } catch (err) {
    next(err);
  }
};

exports.getReminderCompanyStatus = async (req, res, next) => {
  try {
    const masterDB = await connectMasterDB();
    const ReminderSendLog = ReminderSendLogModel(masterDB);

    const rows = await ReminderSendLog.find({}).lean();

    const companyLogs = rows
      .map((row) => {
        const logs = Array.isArray(row.logs) ? row.logs : [];

        // Backward compatible with earlier single-record structure.
        if (!logs.length && row.templateId) {
          const legacyLogs = [
            {
              templateId: row.templateId,
              templateTitle: row.templateTitle || "",
              sentAt: row.sentAt || null,
              sentByName: row.sentByName || "",
              sentByEmail: row.sentByEmail || "",
            },
          ];
          return {
            companyId: row.companyId,
            logs: legacyLogs,
            latest: legacyLogs[0],
            totalSends: 1,
          };
        }

        if (!logs.length) return null;

        const sortedLogs = [...logs].sort(
          (a, b) => new Date(b.sentAt || 0).getTime() - new Date(a.sentAt || 0).getTime(),
        );

        const latest = sortedLogs.reduce((best, item) => {
          if (!best) return item;
          const bestTime = new Date(best.sentAt || 0).getTime();
          const itemTime = new Date(item.sentAt || 0).getTime();
          return itemTime > bestTime ? item : best;
        }, null);

        return {
          companyId: row.companyId,
          logs: sortedLogs,
          latest,
          totalSends: sortedLogs.length,
        };
      })
      .filter(Boolean);

    res.json({
      total: companyLogs.length,
      data: companyLogs,
    });
  } catch (err) {
    next(err);
  }
};
