const NotesTerms = require("../../models/settings/notesTermsModel");

const resolveNotesTermsModel = (req) => {
  if (req?.db && typeof NotesTerms?.forTenant === "function") {
    return NotesTerms.forTenant(req.db);
  }
  return NotesTerms;
};

exports.getNotesTermsSettings = async (req, res) => {
  try {
    const NotesTermsModel = resolveNotesTermsModel(req);
    const settings = await NotesTermsModel.findOne();

    return res.status(200).json({
      success: true,
      data: settings || {},
    });
  } catch (error) {
    console.error("Error fetching notes & terms:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch notes & terms",
    });
  }
};


exports.updateNotesTermsSettings = async (req, res) => {
  try {
    const NotesTermsModel = resolveNotesTermsModel(req);
    const {
      footerLine1,
      footerLine2,
      notesText,
      termsText,
      loyaltyMessage,
    } = req.body;

    let settings = await NotesTermsModel.findOne();

    if (!settings) {
      // First time → create
      settings = new NotesTermsModel({
        footerLine1,
        footerLine2,
        notesText,
        termsText,
        loyaltyMessage,
      });
    } else {
      // Update existing
      if (footerLine1 !== undefined) settings.footerLine1 = footerLine1;
      if (footerLine2 !== undefined) settings.footerLine2 = footerLine2;
      if (notesText !== undefined) settings.notesText = notesText;
      if (termsText !== undefined) settings.termsText = termsText;
      if (loyaltyMessage !== undefined)
        settings.loyaltyMessage = loyaltyMessage;
    }

    await settings.save();

    res.status(200).json({
      success: true,
      message: "Notes & terms updated successfully",
      data: settings,
    });
  } catch (error) {
    console.error("Error updating notes & terms:", error);
    res.status(500).json({
      success: false,
      message: "Failed to update notes & terms",
    });
  }
};
