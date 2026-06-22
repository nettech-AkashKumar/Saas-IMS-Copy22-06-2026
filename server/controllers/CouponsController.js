const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");

const createCoupon = async (req, res) => {
  try {
    const { Coupon: CouponModel } = await getAutoModels(req);
    const newCoupon = new CouponModel(req.body);
    await newCoupon.save();
    res.status(201).json({ message: 'Coupon created successfully', coupon: newCoupon });
  } catch (error) {
    res.status(400).json({ message: 'Error creating coupon', error });
  }
};

const getCoupons = async (req, res) => {
  try {
    const { Coupon: CouponModel } = await getAutoModels(req);
    const coupons = await CouponModel.find();
    res.json(coupons);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching coupons', error });
  }
};

const updateCoupon = async (req, res) => {
  try {
    const { id } = req.params;
    const updatedData = req.body;
    const { Coupon: CouponModel } = await getAutoModels(req);
    const updatedCoupon = await CouponModel.findByIdAndUpdate(id, updatedData, {
      new: true,
      runValidators: true,
    });

    if (!updatedCoupon) {
      return res.status(404).json({ message: "Coupon not found" });
    }

    res.status(200).json(updatedCoupon);
  } catch (error) {
    res.status(500).json({ message: "Failed to update coupon", error });
  }
};

const deleteCoupon = async (req, res) => {
  try {
    const { Coupon: CouponModel } = await getAutoModels(req);
    const { id } = req.params;
    const deletedCoupon = await CouponModel.findByIdAndDelete(id);

    if (!deletedCoupon) {
      return res.status(404).json({ message: 'Coupon not found' });
    }

    res.status(200).json({ message: 'Coupon deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete coupon', error });
  }
};

module.exports = {
  createCoupon,
  getCoupons,
  updateCoupon,
  deleteCoupon
};
