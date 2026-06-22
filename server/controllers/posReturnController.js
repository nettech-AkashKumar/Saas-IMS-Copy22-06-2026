const mongoose = require('mongoose');
const { getAutoModels } = require("../utils/SaaS/autoModelInitializer");

const normalizeSaleItemSerialNumbers = (saleItem) => {
  if (!saleItem) return [];
  if (Array.isArray(saleItem.serialNumbers) && saleItem.serialNumbers.length > 0) {
    return saleItem.serialNumbers
      .filter((s) => typeof s === 'string')
      .map((s) => s.trim())
      .filter(Boolean);
  }
  if (typeof saleItem.serialNumber === 'string' && saleItem.serialNumber.trim()) {
    return [saleItem.serialNumber.trim()];
  }
  return [];
};

const calculateRefundableAmount = (saleItem) => {
  const totalPrice = Number(saleItem?.totalPrice || 0);
  const discount = Number(saleItem?.discount || 0);
  const tax = Number(saleItem?.tax || 0);
  return Math.max(totalPrice - discount + tax, 0);
};

const createPosReturn = async (req, res) => {
  try {
    const { PosSale: PosSaleModel, Product: ProductModel, PosReturn: PosReturnModel } = await getAutoModels(req);
    const invoiceNumber = String(req.body.invoiceNumber || '').trim();
    const paymentMethod = String(req.body.paymentMethod || '').trim();
    const itemIds = Array.isArray(req.body.itemIds) ? req.body.itemIds : [];

    if (!invoiceNumber) {
      return res.status(400).json({ message: 'invoiceNumber is required' });
    }
    if (!paymentMethod || !['Cash', 'Card', 'UPI', 'Split'].includes(paymentMethod)) {
      return res.status(400).json({ message: 'Invalid paymentMethod' });
    }
    if (itemIds.length === 0) {
      return res.status(400).json({ message: 'Select at least one item to return' });
    }
    for (const id of itemIds) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ message: 'Invalid itemId in request' });
      }
    }

    const sale = await PosSaleModel.findOne({ invoiceNumber });
    if (!sale) {
      return res.status(404).json({ message: 'Sale not found' });
    }

    const selectedIdSet = new Set(itemIds.map((x) => String(x)));
    const itemsToReturn = (sale.items || []).filter((it) => selectedIdSet.has(String(it._id)));
    if (itemsToReturn.length === 0) {
      return res.status(400).json({ message: 'No matching sale items found' });
    }

    for (const it of itemsToReturn) {
      if (String(it.status || 'Sold') === 'Return') {
        return res.status(400).json({ message: `Item already returned: ${it.productName || it._id}` });
      }
    }

    const returnItems = itemsToReturn.map((it) => {
      const serialNumbers = normalizeSaleItemSerialNumbers(it);
      const refundableAmount = calculateRefundableAmount(it);
      return {
        saleItemId: it._id,
        productId: it.productId,
        variantId: it.variantId || undefined,
        productName: it.productName,
        quantity: Number(it.quantity || 0),
        unitPrice: Number(it.unitPrice || 0),
        totalPrice: Number(it.totalPrice || 0),
        discount: Number(it.discount || 0),
        tax: Number(it.tax || 0),
        unit: it.unit,
        serialNumbers,
        refundableAmount,
        status: 'Return',
      };
    });

    const totalRefundAmount = returnItems.reduce((sum, it) => sum + (Number(it.refundableAmount) || 0), 0);
    if (totalRefundAmount <= 0) {
      return res.status(400).json({ message: 'Refund amount must be greater than 0' });
    }

    for (const it of sale.items || []) {
      if (selectedIdSet.has(String(it._id))) {
        it.status = 'Return';
      }
    }

    const subtotalReduction = returnItems.reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);
    const discountReduction = returnItems.reduce((sum, it) => sum + (Number(it.discount) || 0), 0);
    const taxReduction = returnItems.reduce((sum, it) => sum + (Number(it.tax) || 0), 0);

    if (sale.totals) {
      sale.totals.subtotal = Math.max(0, Number(sale.totals.subtotal || 0) - subtotalReduction);
      sale.totals.discount = Math.max(0, Number(sale.totals.discount || 0) - discountReduction);
      sale.totals.tax = Math.max(0, Number(sale.totals.tax || 0) - taxReduction);
      sale.totals.totalAmount = Math.max(0, Number(sale.totals.totalAmount || 0) - totalRefundAmount);
    }

    await sale.save();

    for (const ri of returnItems) {
      const qty = Number(ri.quantity || 0);
      if (qty <= 0) continue;
      if (ri.variantId) {
        const update = {
          $inc: { 'variants.$.stockQuantity': qty },
        };
        if (Array.isArray(ri.serialNumbers) && ri.serialNumbers.length > 0) {
          update.$addToSet = {
            'variants.$.serialNumbers': { $each: ri.serialNumbers.map((s) => String(s)) },
          };
        }
        const result = await ProductModel.updateOne(
          { _id: ri.productId, 'variants._id': ri.variantId },
          update,
        );
        if (!result || (Number(result.matchedCount || 0) === 0)) {
          await ProductModel.updateOne(
            { _id: ri.productId },
            { $inc: { legacy_stockQuantity: qty } },
          );
        }
      } else {
        await ProductModel.updateOne(
          { _id: ri.productId },
          { $inc: { legacy_stockQuantity: qty } },
        );
      }
    }

    const posReturn = await PosReturnModel.create({
      invoiceNumber,
      posSaleId: sale._id,
      customer: {
        customerId: sale.customer?.customerId,
        name: sale.customer?.name,
        phone: sale.customer?.phone,
        email: sale.customer?.email,
      },
      items: returnItems,
      paymentMethod,
      totalRefundAmount,
      createdBy: req.user && req.user._id ? req.user._id : null,
    });

    return res.status(201).json({
      success: true,
      message: 'Return transaction completed',
      data: posReturn,
    });
  } catch (error) {
    if (error && error.name === 'ValidationError') {
      return res.status(400).json({
        message: 'Validation error',
        error: error.message,
        details: error.errors,
      });
    }
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const getPosReturns = async (req, res) => {
  try {
    const { PosReturn: PosReturnModel } = await getAutoModels(req);
    const invoiceNumber = req.query.invoiceNumber ? String(req.query.invoiceNumber).trim() : '';
    const filter = {};
    if (invoiceNumber) filter.invoiceNumber = invoiceNumber;
    const rows = await PosReturnModel.find(filter).sort({ createdAt: -1 }).limit(200);
    return res.status(200).json({ success: true, data: rows });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

const getPosReturnById = async (req, res) => {
  try {
    const { PosReturn: PosReturnModel } = await getAutoModels(req);
    const id = String(req.params.id || '').trim();
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ message: 'Invalid return id' });
    }
    const doc = await PosReturnModel.findById(id);
    if (!doc) {
      return res.status(404).json({ message: 'Return not found' });
    }
    return res.status(200).json({ success: true, data: doc });
  } catch (error) {
    return res.status(500).json({ message: 'Internal server error', error: error.message });
  }
};

module.exports = {
  createPosReturn,
  getPosReturns,
  getPosReturnById,
};
