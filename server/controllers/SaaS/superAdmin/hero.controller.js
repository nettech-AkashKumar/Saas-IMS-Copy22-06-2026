const fs = require("fs");
const path = require("path");
const bcrypt = require("bcryptjs");
const cloudinary = require("../../../utils/cloudinary/cloudinary");
const connectMasterDB = require("../../../config/SaaS/masterDb");
const HeroContentModel = require("../../../models/SaaS/master/HeroContent");

const DEFAULT_HERO_CONTENT = {
  title: "Track Stock.\nGenerate Bills.\nGrow Your Business.",
  subtitle:
    "A complete inventory and billing suite built to keep your store efficient, compliant, and growing.",
  features: [
    { title: "Unified Control", description: "Manage purchases, sales, and stock from one dashboard." },
    { title: "Real Time Updates", description: "Always know what is in stock with no surprises." },
    { title: "Built In Automation", description: "From billing to reporting, everything runs smoothly." },
    { title: "GST Compliant Invoicing", description: "Stay tax ready and audit safe." },
  ],
  primaryText: "Contact Us",
  primaryUrl: "#contact",
  secondaryText: "Get A Demo",
  secondaryUrl: "#demo",
  imageUrl: "",
  imageUrls: [],
  imageAlt: "POS Software",
  templateType: "modern",
};

const getHeroModel = async () => {
  const masterDB = await connectMasterDB();
  return HeroContentModel(masterDB);
};

const emitCMSUpdate = (req, section, action, data = null) => {
  const io = req.app.get("io");
  if (!io) return;

  io.to("website").emit("cms-updated", {
    section,
    action,
    data,
    timestamp: new Date(),
  });
};

// ================= ENSURE DEFAULT =================

const ensureHeroDocument = async () => {
  const HeroContent = await getHeroModel();
  let hero = await HeroContent.findOne({}).lean();

  if (!hero) {
    hero = await HeroContent.create({
      ...DEFAULT_HERO_CONTENT,
      name: "Default Hero",
      isActive: true,
    });
  }

  return hero;
};

// ================= PUBLIC ACTIVE HERO =================

exports.getPublicwebsite = async (req, res, next) => {
  try {
    const HeroContent = await getHeroModel();
    const hero = await HeroContent.findOne({ isActive: true }).lean();

    if (!hero) {
      return res.json({
        ...DEFAULT_HERO_CONTENT,
        name: "Default Hero",
        isActive: true,
      });
    }

    res.json(hero);
  } catch (error) {
    next(error);
  }
};

// ================= GET SINGLE (ADMIN) =================

exports.getHeroContent = async (req, res, next) => {
  try {
    const hero = await ensureHeroDocument();
    res.json(hero);
  } catch (error) {
    next(error);
  }
};

// ================= GET ALL HERO SECTIONS =================

exports.getAllHeroContents = async (req, res, next) => {
  try {
    const HeroContent = await getHeroModel();
    const heroes = await HeroContent.find({})
      .sort({ createdAt: -1 })
      .lean();

    res.json(heroes);
  } catch (error) {
    next(error);
  }
};

// ================= GET HERO BY TEMPLATE TYPE =================

exports.getHeroByTemplateType = async (req, res, next) => {
  try {
    const { templateType } = req.params;
    const HeroContent = await getHeroModel();
    
    let hero = await HeroContent.findOne({ templateType }).lean();
    
    if (!hero) {
      // Create default hero for this template type if it doesn't exist
      hero = await HeroContent.create({
        ...DEFAULT_HERO_CONTENT,
        templateType,
        name: `${templateType.charAt(0).toUpperCase() + templateType.slice(1)} Hero`,
        isActive: false,
      });
    }

    res.json(hero);
  } catch (error) {
    next(error);
  }
};

// ================= CREATE HERO =================

exports.createHeroContent = async (req, res, next) => {
  try {
    const HeroContent = await getHeroModel();

    if (!req.body.name) {
      return res.status(400).json({ message: "Hero name is required" });
    }

    if (req.body.isActive) {
      await HeroContent.updateMany({}, { $set: { isActive: false } });
    }

    const hero = await HeroContent.create(req.body);

    res.status(201).json(hero);

    emitCMSUpdate(req, "hero", "create", hero);

  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({ message: "Hero name must be unique" });
    }
    next(error);
  }
};

// ================= UPDATE HERO =================

exports.updateHeroContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const HeroContent = await getHeroModel();

    const updateFields = { ...req.body };

    if (updateFields.features && typeof updateFields.features === "string") {
      try {
        updateFields.features = JSON.parse(updateFields.features);
      } catch {
        updateFields.features = [];
      }
    }

    if (updateFields.isActive) {
      await HeroContent.updateMany(
        { _id: { $ne: id } },
        { $set: { isActive: false } }
      );
    }

    const hero = await HeroContent.findByIdAndUpdate(
      id,
      { $set: updateFields },
      { new: true }
    ).lean();

    if (!hero) {
      return res.status(404).json({ message: "Hero not found" });
    }

    res.json(hero);

    emitCMSUpdate(req, "hero", "update", hero);

  } catch (error) {
    next(error);
  }
};

// ================= UPLOAD HERO IMAGE =================

exports.uploadHeroImage = async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "No image uploaded" });
    }

    const { id } = req.params;
    let imageUrl = "";

    const HeroContent = await getHeroModel();

    const cloudinaryCloudName =
      process.env.CLOUD_NAME || process.env.CLOUDINARY_CLOUD_NAME;
    const cloudinaryApiKey =
      process.env.CLOUD_API_KEY || process.env.CLOUDINARY_API_KEY;
    const cloudinaryApiSecret =
      process.env.CLOUD_API_SECRET || process.env.CLOUDINARY_API_SECRET;

    const isCloudinaryConfigured =
      cloudinaryCloudName && cloudinaryApiKey && cloudinaryApiSecret;

    if (isCloudinaryConfigured) {
      const uploadResult = await new Promise((resolve, reject) => {
        const stream = cloudinary.uploader.upload_stream(
          {
            folder: "hero_images",
            resource_type: "image",
          },
          (error, result) => {
            if (error) return reject(error);
            resolve(result);
          },
        );

        stream.end(req.file.buffer);
      });

      imageUrl = uploadResult.secure_url;
    } else {
      const uploadDir = path.join(__dirname, "../../../../uploads/hero");
      fs.mkdirSync(uploadDir, { recursive: true });

      const filename = `hero-${Date.now()}${path.extname(req.file.originalname)}`;
      const filepath = path.join(uploadDir, filename);

      fs.writeFileSync(filepath, req.file.buffer);

      imageUrl = `${req.protocol}://${req.get("host")}/uploads/hero/${filename}`;
    }

    const hero = await HeroContent.findById(id);
    if (!hero) {
      return res.status(404).json({ message: "Hero not found" });
    }

    const slot = req.body.slot || req.query.slot || "default";
    const updatedImageUrls = Array.isArray(hero.imageUrls) ? [...hero.imageUrls] : [];
    const existingIndex = updatedImageUrls.findIndex((item) => item.slot === slot);

    if (existingIndex !== -1) {
      updatedImageUrls[existingIndex].url = imageUrl;
    } else {
      updatedImageUrls.push({ slot, url: imageUrl });
    }

    hero.imageUrls = updatedImageUrls;
    if (slot === "default") {
      hero.imageUrl = imageUrl;
    }

    await hero.save();

    res.json({ message: "Image uploaded", hero: hero.toObject() });

    emitCMSUpdate(req, "hero", "update", hero);

  } catch (error) {
    next(error);
  }
};

// ================= DELETE HERO =================

exports.deleteHeroContent = async (req, res, next) => {
  try {
    const { id } = req.params;
    const HeroContent = await getHeroModel();

    const hero = await HeroContent.findByIdAndDelete(id).lean();

    if (!hero) {
      return res.status(404).json({ message: "Hero not found" });
    }

    res.json({ message: "Deleted successfully" });

    emitCMSUpdate(req, "hero", "delete");

  } catch (error) {
    next(error);
  }
};

// ================= VERIFY WEBSITE PASSWORD =================

exports.verifyWebsitePassword = async (req, res, next) => {
  try {
    const { password } = req.body;

    if (!password) {
      return res.status(400).json({ message: "Password required" });
    }

    const masterConn = await connectMasterDB();
    const SuperAdminModel = require("../../../models/SaaS/master/SuperAdmin");
    const SuperAdmin = SuperAdminModel(masterConn);

    const admin = await SuperAdmin.findOne({}).lean();

    if (!admin) {
      return res.status(500).json({ message: "Super admin not found" });
    }

    const isMatch = await bcrypt.compare(password, admin.password);

    if (!isMatch) {
      return res.status(401).json({ message: "Invalid password" });
    }

    res.json({ verified: true });

  } catch (error) {
    next(error);
  }
};




// main code working
// const fs = require("fs");
// const path = require("path");
// const cloudinary = require("../../../utils/cloudinary/cloudinary");
// const connectMasterDB = require("../../../config/SaaS/masterDb");
// const HeroContentModel = require("../../../models/SaaS/master/HeroContent");

// const DEFAULT_HERO_CONTENT = {
//   title: "Track Stock.\nGenerate Bills.\nGrow Your Business.",
//   subtitle:
//     "A complete inventory and billing suite built to keep your store efficient, compliant, and growing.",
//   features: [
//     {
//       title: "Unified Control",
//       description: "Manage purchases, sales, and stock from one dashboard.",
//     },
//     {
//       title: "Real Time Updates",
//       description: "Always know what is in stock with no surprises.",
//     },
//     {
//       title: "Built In Automation",
//       description: "From billing to reporting, everything runs smoothly.",
//     },
//     {
//       title: "GST Compliant Invoicing",
//       description: "Stay tax ready and audit safe.",
//     },
//   ],
//   primaryText: "Contact Us",
//   primaryUrl: "#contact",
//   secondaryText: "Get A Demo",
//   secondaryUrl: "#demo",
//   imageUrl: "",
//   imageAlt: "POS Software",
// };

// const getHeroModel = async () => {
//   const masterDB = await connectMasterDB();
//   return HeroContentModel(masterDB);
// };

// const ensureHeroDocument = async () => {
//   const HeroContent = await getHeroModel();
//   let hero = await HeroContent.findOne({}).lean();
//   if (!hero) {
//     hero = await HeroContent.create({
//       ...DEFAULT_HERO_CONTENT,
//       name: "Default Hero",
//       isActive: true,
//     });
//   }
//   return hero;
// };

// exports.getHeroContent = async (req, res, next) => {
//   try {
//     const hero = await ensureHeroDocument();
//     res.json(hero);
//   } catch (error) {
//     next(error);
//   }
// };

// // Get only active hero for public website
// exports.getPublicwebsite = async (req, res, next) => {
//   try {
//     const HeroContent = await getHeroModel();
//     const hero = await HeroContent.findOne({ isActive: true }).lean();
    
//     if (!hero) {
//       // Return default hero if none are active
//       return res.json({
//         ...DEFAULT_HERO_CONTENT,
//         name: "Default Hero",
//         isActive: true,
//       });
//     }
    
//     res.json(hero);
//   } catch (error) {
//     next(error);
//   }
// };

// // Get all hero sections
// exports.getAllHeroContents = async (req, res, next) => {
//   try {
//     const HeroContent = await getHeroModel();
//     const heroes = await HeroContent.find({}).sort({ createdAt: -1 }).lean();
//     res.json(heroes);
//   } catch (error) {
//     next(error);
//   }
// };

// // Create new hero section
// exports.createHeroContent = async (req, res, next) => {
//   try {
//     const {
//       name,
//       title,
//       subtitle,
//       features,
//       primaryText,
//       primaryUrl,
//       secondaryText,
//       secondaryUrl,
//       imageAlt,
//       isActive,
//     } = req.body;

//     if (!name) {
//       return res.status(400).json({ message: "Hero name is required" });
//     }

//     const HeroContent = await getHeroModel();

//     // If this is set as active, deactivate all others
//     if (isActive) {
//       await HeroContent.updateMany({}, { $set: { isActive: false } });
//     }

//     const newHero = await HeroContent.create({
//       name,
//       title: title || "",
//       subtitle: subtitle || "",
//       features: features || [],
//       primaryText: primaryText || "Contact Us",
//       primaryUrl: primaryUrl || "#contact",
//       secondaryText: secondaryText || "Get A Demo",
//       secondaryUrl: secondaryUrl || "#demo",
//       imageAlt: imageAlt || "POS Software",
//       isActive: isActive || false,
//     });

//     res.status(201).json(newHero);
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(400).json({ message: "Hero name must be unique" });
//     }
//     next(error);
//   }
// };

// exports.updateHeroContent = async (req, res, next) => {
//   try {
//     const { id } = req.params;
//     const {
//       name,
//       title,
//       subtitle,
//       features,
//       primaryText,
//       primaryUrl,
//       secondaryText,
//       secondaryUrl,
//       imageAlt,
//       isActive,
//     } = req.body;

//     const updateFields = {};
//     if (name !== undefined) updateFields.name = name;
//     if (title !== undefined) updateFields.title = title;
//     if (subtitle !== undefined) updateFields.subtitle = subtitle;
//     if (primaryText !== undefined) updateFields.primaryText = primaryText;
//     if (primaryUrl !== undefined) updateFields.primaryUrl = primaryUrl;
//     if (secondaryText !== undefined) updateFields.secondaryText = secondaryText;
//     if (secondaryUrl !== undefined) updateFields.secondaryUrl = secondaryUrl;
//     if (imageAlt !== undefined) updateFields.imageAlt = imageAlt;
//     if (isActive !== undefined) updateFields.isActive = isActive;

//     if (features !== undefined) {
//       if (typeof features === "string") {
//         try {
//           updateFields.features = JSON.parse(features);
//         } catch {
//           updateFields.features = [];
//         }
//       } else {
//         updateFields.features = features;
//       }
//     }

//     const HeroContent = await getHeroModel();

//     // If setting as active, deactivate all others
//     if (isActive) {
//       await HeroContent.updateMany({ _id: { $ne: id } }, { $set: { isActive: false } });
//     }

//     const hero = await HeroContent.findByIdAndUpdate(
//       id,
//       { $set: updateFields },
//       { new: true }
//     ).lean();

//     if (!hero) {
//       return res.status(404).json({ message: "Hero section not found" });
//     }

//     res.json(hero);
//   } catch (error) {
//     if (error.code === 11000) {
//       return res.status(400).json({ message: "Hero name must be unique" });
//     }
//     next(error);
//   }
// };

// exports.uploadHeroImage = async (req, res, next) => {
//   try {
//     if (!req.file) {
//       return res.status(400).json({ message: "No image file uploaded" });
//     }

//     const { id } = req.params;
//     const file = req.file;
//     let imageUrl = "";

//     const isCloudinaryConfigured =
//       process.env.CLOUD_NAME && process.env.CLOUD_API_KEY && process.env.CLOUD_API_SECRET;

//     if (isCloudinaryConfigured) {
//       const base64Data = file.buffer.toString("base64");
//       const dataUri = `data:${file.mimetype};base64,${base64Data}`;
//       const uploadResult = await cloudinary.uploader.upload(dataUri, {
//         folder: "hero_images",
//         resource_type: "image",
//       });
//       imageUrl = uploadResult.secure_url;
//     } else {
//       const uploadsDir = path.join(__dirname, "../../../../uploads/hero");
//       fs.mkdirSync(uploadsDir, { recursive: true });
//       const filename = `hero-${Date.now()}${path.extname(file.originalname)}`;
//       const filepath = path.join(uploadsDir, filename);
//       fs.writeFileSync(filepath, file.buffer);
//       imageUrl = `${req.protocol}://${req.get("host")}/uploads/hero/${filename}`;
//     }

//     const HeroContent = await getHeroModel();
//     const hero = await HeroContent.findByIdAndUpdate(
//       id,
//       { $set: { imageUrl } },
//       { new: true }
//     ).lean();

//     if (!hero) {
//       return res.status(404).json({ message: "Hero section not found" });
//     }

//     res.json({ message: "Hero image uploaded successfully", imageUrl, hero });
//   } catch (error) {
//     next(error);
//   }
// };

// // Delete hero section
// exports.deleteHeroContent = async (req, res, next) => {
//   try {
//     const { id } = req.params;

//     const HeroContent = await getHeroModel();
//     const hero = await HeroContent.findByIdAndDelete(id).lean();

//     if (!hero) {
//       return res.status(404).json({ message: "Hero section not found" });
//     }

//     res.json({ message: "Hero section deleted successfully", hero });
//   } catch (error) {
//     next(error);
//   }
// };

// // Verify super admin password for public website access
// exports.verifyWebsitePassword = async (req, res, next) => {
//   try {
//     const bcrypt = require("bcryptjs");
//     const { password } = req.body;

//     if (!password) {
//       return res.status(400).json({ message: "Password is required" });
//     }

//     const masterConn = await connectMasterDB();
//     const SuperAdminModel = require("../../../models/SaaS/master/SuperAdmin");
//     const SuperAdmin = SuperAdminModel(masterConn);

//     // Get the first super admin (or you can have a specific one)
//     const admin = await SuperAdmin.findOne({}).lean();

//     if (!admin) {
//       return res.status(500).json({ message: "Super admin not found" });
//     }

//     const isMatch = await bcrypt.compare(password, admin.password);

//     if (!isMatch) {
//       return res.status(401).json({ message: "Invalid password" });
//     }

//     res.json({ message: "Password verified successfully", verified: true });
//   } catch (error) {
//     next(error);
//   }
// };
