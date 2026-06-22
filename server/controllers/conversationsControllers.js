const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");

exports.getConversations = async (req, res) => {
  try {
    const { Message: MessageModel } = await getAutoModels(req);
    const userId = req.params.userId;
    // console.log("Fetching conversations for user ID:", userId);

    const conversations = await MessageModel.find({
      participants: { $in: [userId] }
    })
      .populate("participants", "_id name email profileImage") // Fixed field names
      .populate("messages.from", "_id name email profileImage") // Also populate message sender details
      .sort({ 'lastMessage.timestamp': -1 }); // Sort by most recent first

    // console.log("Found conversations:", conversations.length);
    res.status(200).json(conversations);
  } catch (err) {
    // console.error("❌ Error fetching conversations:", err.message);
    res.status(500).json({ message: "Failed to fetch conversations" });
  }
}; 