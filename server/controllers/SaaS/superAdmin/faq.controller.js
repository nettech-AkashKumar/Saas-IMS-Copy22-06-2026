const connectMasterDB = require("../../../config/SaaS/masterDb");
const FAQModel = require("../../../models/SaaS/master/FAQ");

const DEFAULT_FAQS = [
  {
    question: "What is Inventory Management System?",
    answer: "An Inventory Management System (IMS) is a software solution designed to track, manage, and optimize your inventory levels. It helps you monitor stock, manage purchases and sales, and generate insightful reports.",
    category: "general",
    displayOrder: 1,
  },
  {
    question: "How do I get started?",
    answer: "Getting started is easy! Sign up for an account, set up your products and customers, and start creating invoices. We provide comprehensive guides and customer support to help you.",
    category: "general",
    displayOrder: 2,
  },
  {
    question: "What are the system requirements?",
    answer: "Our system runs on any modern web browser (Chrome, Firefox, Safari, Edge). An internet connection is required. We support both desktop and mobile access.",
    category: "technical",
    displayOrder: 3,
  },
];

const getFAQModel = async () => {
  const masterDB = await connectMasterDB();
  return FAQModel(masterDB);
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

// ================= ENSURE DEFAULT FAQS =================
const ensureDefaultFAQs = async () => {
  const FAQ = await getFAQModel();
  const count = await FAQ.countDocuments();

  if (count === 0) {
    const inserted = await FAQ.insertMany(DEFAULT_FAQS);
    // Convert to plain objects
    return inserted.map((doc) => (doc.toObject ? doc.toObject() : doc));
  }
  return [];
};

// ================= GET ALL FAQS (PUBLIC) =================
exports.getPublicFAQs = async (req, res, next) => {
  try {
    await ensureDefaultFAQs();

    const FAQ = await getFAQModel();
    const faqs = await FAQ.find({ isActive: true })
      .sort({ displayOrder: 1 })
      .lean();

    res.json(faqs || []);
  } catch (error) {
    console.error("❌ FAQ Controller Error:", error);
    next(error);
  }
};

// ================= GET ALL FAQS (ADMIN) =================
exports.getAllFAQs = async (req, res, next) => {
  try {
    await ensureDefaultFAQs();

    const FAQ = await getFAQModel();
    const faqs = await FAQ.find({})
      .sort({ displayOrder: 1 })
      .lean();

    res.json(faqs || []);
  } catch (error) {
    console.error("❌ FAQ Controller Error (getAllFAQs):", error);
    next(error);
  }
};

// ================= UPDATE FAQS (BULK UPDATE) =================
/**
 * This endpoint handles the bulk update of FAQs from the frontend
 * The frontend sends an array of FAQs, and we replace all FAQs with this data
 */
exports.updateFAQs = async (req, res, next) => {
  try {
    const { faqs } = req.body;

    if (!Array.isArray(faqs)) {
      return res.status(400).json({ message: "FAQs must be an array" });
    }

    const FAQ = await getFAQModel();

    // Clear existing FAQs
    await FAQ.deleteMany({});

    // Insert new FAQs with proper defaults
    const faqsToInsert = faqs.map((faq, index) => ({
      question: faq.question,
      answer: faq.answer,
      category: faq.category || "general",
      displayOrder: index + 1,
      isActive: faq.isActive !== false,
    }));

    const result = await FAQ.insertMany(faqsToInsert);

    // Broadcast update via Socket.io
    emitCMSUpdate(req, "faqs", "update", result);

    res.json({
      message: "FAQs updated successfully",
      data: result,
    });
  } catch (error) {
    next(error);
  }
};

// ================= CREATE SINGLE FAQ =================
exports.createFAQ = async (req, res, next) => {
  try {
    const { question, answer, category, displayOrder } = req.body;

    if (!question || !answer) {
      return res.status(400).json({
        message: "Question and answer are required",
      });
    }

    const FAQ = await getFAQModel();

    const newFAQ = await FAQ.create({
      question,
      answer,
      category: category || "general",
      displayOrder: displayOrder || Date.now(),
      isActive: true,
    });

    emitCMSUpdate(req, "faqs", "create", newFAQ);

    res.status(201).json({
      message: "FAQ created successfully",
      data: newFAQ,
    });
  } catch (error) {
    next(error);
  }
};

// ================= UPDATE SINGLE FAQ =================
exports.updateFAQ = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { question, answer, category, displayOrder, isActive } = req.body;

    const FAQ = await getFAQModel();

    const updatedFAQ = await FAQ.findByIdAndUpdate(
      id,
      {
        question,
        answer,
        category: category || "general",
        displayOrder,
        isActive: isActive !== false,
      },
      { new: true, runValidators: true }
    );

    if (!updatedFAQ) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    emitCMSUpdate(req, "faqs", "update", updatedFAQ);

    res.json({
      message: "FAQ updated successfully",
      data: updatedFAQ,
    });
  } catch (error) {
    next(error);
  }
};

// ================= DELETE FAQ =================
exports.deleteFAQ = async (req, res, next) => {
  try {
    const { id } = req.params;

    const FAQ = await getFAQModel();

    const deletedFAQ = await FAQ.findByIdAndDelete(id);

    if (!deletedFAQ) {
      return res.status(404).json({ message: "FAQ not found" });
    }

    emitCMSUpdate(req, "faqs", "delete", { id });

    res.json({
      message: "FAQ deleted successfully",
      data: deletedFAQ,
    });
  } catch (error) {
    next(error);
  }
};
