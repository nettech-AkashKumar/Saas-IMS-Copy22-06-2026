const { getAutoModels } = require('../utils/SaaS/autoModelInitializer');

exports.createRewardSystem = async (req, res) => {
  try {
    const { RewardSystem: RewardSystemModel } = await getAutoModels(req);
    const {
      rewardType,
      offerName,
      amountForPoint,
      minPurchase,
      deadline,
      pointValue,
      maxEligibleAmount,
      minInvoiceValue,
    } = req.body;

    // Validate all required fields
    if (
      !rewardType ||
      !offerName ||
      !amountForPoint ||
      !minPurchase ||
      !deadline ||
      !pointValue ||
      !maxEligibleAmount ||
      !minInvoiceValue
    ) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required in both Reward and Redeem setups.',
      });
    }

    const newReward = new RewardSystemModel({
      rewardType,
      offerName: offerName.trim(),
      amountForPoint: Number(amountForPoint),
      minPurchase: Number(minPurchase),
      deadline: new Date(deadline),
      pointValue: Number(pointValue),
      maxEligibleAmount: Number(maxEligibleAmount),
      minInvoiceValue: Number(minInvoiceValue),
      status: 'active',
      // createdBy: req.user?._id || null,
    });

    await newReward.save();

    res.status(201).json({
      success: true,
      message: 'Reward system created successfully',
      data: newReward,
    });
  } catch (error) {
    // console.error('Create reward error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getAllRewardSystems = async (req, res) => {
  try {
    const { RewardSystem: RewardSystemModel } = await getAutoModels(req);
    const rewards = await RewardSystemModel.find()
      .sort({ createdAt: -1 });

    res.json(rewards);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.updateRewardSystem = async (req, res) => {
  try {
    const { RewardSystem: RewardSystemModel } = await getAutoModels(req);
    const { id } = req.params;
    const allowedFields = [
      'rewardType',
      'offerName',
      'amountForPoint',
      'minPurchase',
      'deadline',
      'pointValue',
      'maxEligibleAmount',
      'minInvoiceValue',
      'status',
    ];

    const updateData = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) {
        updateData[field] = req.body[field];
      }
    });

    if (updateData.offerName) updateData.offerName = updateData.offerName.trim();
    ['amountForPoint', 'minPurchase', 'pointValue', 'maxEligibleAmount', 'minInvoiceValue'].forEach((field) => {
      if (updateData[field] !== undefined) updateData[field] = Number(updateData[field]);
    });
    if (updateData.deadline) updateData.deadline = new Date(updateData.deadline);

    const updatedReward = await RewardSystemModel.findOneAndUpdate(
      { _id: id, isDelete: { $ne: true } },
      updateData,
      { new: true, runValidators: true }
    );

    if (!updatedReward) {
      return res.status(404).json({ success: false, message: 'Reward system not found' });
    }

    res.json({
      success: true,
      message: 'Reward system updated successfully',
      data: updatedReward,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.deleteRewardSystem = async (req, res) => {
  try {
    const { RewardSystem: RewardSystemModel } = await getAutoModels(req);
    const deletedReward = await RewardSystemModel.findOneAndUpdate(
      { _id: req.params.id, isDelete: { $ne: true } },
      { isDelete: true },
      { new: true }
    );

    if (!deletedReward) {
      return res.status(404).json({ success: false, message: 'Reward system not found' });
    }

    res.json({
      success: true,
      message: 'Reward system deleted successfully',
      data: deletedReward,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getActiveRewardSystems = async (req, res) => {
  try {
    const { RewardSystem: RewardSystemModel } = await getAutoModels(req);
    const rewards = await RewardSystemModel.find({ isDelete: { $ne: true } })
      .sort({ createdAt: -1 });

    res.json(rewards);
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.getDeletedRewardSystems = async (req, res) => {
  try {
    const { RewardSystem: RewardSystemModel } = await getAutoModels(req);
    const rewards = await RewardSystemModel.find({ isDelete: true })
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      rewards,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};

exports.restoreRewardSystem = async (req, res) => {
  try {
    const { RewardSystem: RewardSystemModel } = await getAutoModels(req);
    const restoredReward = await RewardSystemModel.findOneAndUpdate(
      { _id: req.params.id, isDelete: true },
      { isDelete: false },
      { new: true }
    );

    if (!restoredReward) {
      return res.status(404).json({ success: false, message: 'Reward system not found' });
    }

    res.json({
      success: true,
      message: 'Reward system restored successfully',
      data: restoredReward,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error' });
  }
};