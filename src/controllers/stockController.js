const mongoose = require('mongoose');
const Item = require('../models/Item');
const Transaction = require('../models/Transaction');

const scanItem = async (req, res, next) => {
  try {
    const { qr_code } = req.body;

    const item = await Item.findOne({ qr_code: qr_code.trim(), isActive: true });
    if (!item) {
      return res.status(404).json({
        success: false,
        message: 'No item found for this QR code',
        data: { qr_code },
      });
    }

    res.json({
      success: true,
      message: 'Item found',
      data: {
        item,
        alert: item.isLowStock
          ? { type: 'LOW_STOCK', message: `Stock is low (${item.quantity} ${item.unit} remaining)` }
          : null,
      },
    });
  } catch (err) {
    next(err);
  }
};

const updateStock = async (req, res, next) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { item_id, type, quantity, note } = req.body;
    const qty = parseInt(quantity);

    const item = await Item.findOne({ _id: item_id, isActive: true }).session(session);
    if (!item) {
      await session.abortTransaction();
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    const quantityBefore = item.quantity;
    let quantityAfter;

    if (type === 'IN') {
      quantityAfter = quantityBefore + qty;
    } else {
      if (quantityBefore < qty) {
        await session.abortTransaction();
        return res.status(400).json({
          success: false,
          message: `Insufficient stock. Available: ${quantityBefore} ${item.unit}, Requested: ${qty} ${item.unit}`,
          data: { available: quantityBefore, requested: qty },
        });
      }
      quantityAfter = quantityBefore - qty;
    }

    item.quantity = quantityAfter;
    item.updated_at = new Date();
    await item.save({ session });

    const transaction = await Transaction.create(
      [
        {
          item_id: item._id,
          type,
          quantity: qty,
          quantity_before: quantityBefore,
          quantity_after: quantityAfter,
          user: req.user._id,
          note: note?.trim() || null,
        },
      ],
      { session }
    );

    await session.commitTransaction();

    const lowStockAlert =
      item.isLowStock
        ? { type: 'LOW_STOCK', message: `Stock is now low (${quantityAfter} ${item.unit} remaining)` }
        : null;

    res.json({
      success: true,
      message: `Stock ${type === 'IN' ? 'added' : 'removed'} successfully`,
      data: {
        item,
        transaction: transaction[0],
        alert: lowStockAlert,
      },
    });
  } catch (err) {
    await session.abortTransaction();
    next(err);
  } finally {
    session.endSession();
  }
};

module.exports = { scanItem, updateStock };
