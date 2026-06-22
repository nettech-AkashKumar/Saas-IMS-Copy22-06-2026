const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");

exports.addAssignTarget = async (req, res, next) => {
  try {
    const { AssignTarget: AssignTargetModel } = await getAutoModels(req);

    const {
      assignToTarget,
      assignToType,
      assignedToName,
      selectedSalesman,
      duration,
      targetMetric,
      targetValue,
      items,
      type,
      IncentiveValue,
    } = req.body;

    // if (!assignToTarget) {
    //   return res.status(400).json({
    //     message: "Select Broker is required",
    //   });
    // }

    const assignTarget = new AssignTargetModel({
      assignToType: assignToType || "Broker",
      assignToTarget: assignToTarget || null,
      assignedToName,
      selectedSalesman: selectedSalesman || null,
      duration,
      targetMetric,
      targetValue,
      items,
      type,
      IncentiveValue,
    });

    await assignTarget.save();

    await assignTarget.populate({
      path: "assignToTarget",
      select: "brokerName",
    });

    res.status(201).json({
      message: "Assign Target created successfully",
      assignTarget,
    });
  } catch (error) {
    next(error);
  }
};

exports.getAssignTarget = async (req, res, next) => {
  try {
    const { AssignTarget: AssignTargetModel } = await getAutoModels(req);

    const assignTargets = await AssignTargetModel.find()
      .populate("assignToTarget", "brokerName")
      .populate("selectedSalesman", "salesmanName")
      .populate("items", "productName")
      .sort({ createdAt: -1 });

    res.status(200).json({
      message: "Assign Target fetched successfully",
      assignTargets,
    });
  } catch (error) {
    next(error);
  }
};

exports.updateAssignTarget = async (req, res, next) => {
  try {
    const { AssignTarget: AssignTargetModel } = await getAutoModels(req);

    const existing = await AssignTargetModel.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({ message: "Assign Target not found" });
    }

    const payload = {
      ...req.body,
      assignToTarget: req.body.assignToTarget || null,
      selectedSalesman: req.body.selectedSalesman || null,
    };

    const updatedAssignTarget =
      await AssignTargetModel.findByIdAndUpdate(
        req.params.id,
        payload,
        { new: true }
      );

    res.status(200).json({
      message: "Assign Target updated successfully",
      updatedAssignTarget,
    });
  } catch (error) {
    next(error);
  }
};

exports.deleteAssignTarget = async (req, res, next) => {
  try {
    const { AssignTarget: AssignTargetModel } = await getAutoModels(req);

    const deletedAssignTarget = await AssignTargetModel.findByIdAndDelete(req.params.id);

    if (!deletedAssignTarget) {
      return res.status(404).json({ message: "Assign Target not found" });
    }

    res.status(200).json({
      message: "Assign Target deleted successfully",
    });
  } catch (error) {
    next(error);
  }
};