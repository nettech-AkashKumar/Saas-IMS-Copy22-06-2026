const { getAutoModels } = require('../utils/SaaS/autoModelInitializer');

// Get purchasedetails by productId
exports.getProductPurchaseDetails = async (req, res, next) => {
    try {
        const { Product } = await getAutoModels(req);
        const { productId } = req.params;
        if (!productId) {
            return res.status(400).json({ message: 'Product ID required' });
        }
        const product = await Product.findById(productId).select('purchases');
        if (!product) {
            return res.status(404).json({ message: 'Product not found' });
        }
        res.status(200).json({ purchases: product.purchases });
    } catch (err) {
        next(err);
    }
};
