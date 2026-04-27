const Transaction = require('../models/Transaction');

const getHistory = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      type,
      item_id,
      user_id,
      startDate,
      endDate,
    } = req.query;

    const filter = {};

    if (type) filter.type = type;
    if (item_id) filter.item_id = item_id;
    if (user_id) filter.user = user_id;

    if (startDate || endDate) {
      filter.timestamp = {};
      if (startDate) filter.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        filter.timestamp.$lte = end;
      }
    }

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find(filter)
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('item_id', 'name sku unit qr_code')
        .populate('user', 'name email role'),
      Transaction.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

const getItemHistory = async (req, res, next) => {
  try {
    const { item_id } = req.params;
    const { page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [transactions, total] = await Promise.all([
      Transaction.find({ item_id })
        .sort({ timestamp: -1 })
        .skip(skip)
        .limit(parseInt(limit))
        .populate('user', 'name email role'),
      Transaction.countDocuments({ item_id }),
    ]);

    res.json({
      success: true,
      data: {
        transactions,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
      },
    });
  } catch (err) {
    next(err);
  }
};

const getSummary = async (req, res, next) => {
  try {
    const { startDate, endDate } = req.query;

    const matchFilter = {};
    if (startDate || endDate) {
      matchFilter.timestamp = {};
      if (startDate) matchFilter.timestamp.$gte = new Date(startDate);
      if (endDate) {
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        matchFilter.timestamp.$lte = end;
      }
    }

    const summary = await Transaction.aggregate([
      { $match: matchFilter },
      {
        $group: {
          _id: '$type',
          count: { $sum: 1 },
          total_quantity: { $sum: '$quantity' },
        },
      },
    ]);

    const result = { IN: { count: 0, total_quantity: 0 }, OUT: { count: 0, total_quantity: 0 } };
    summary.forEach((s) => {
      result[s._id] = { count: s.count, total_quantity: s.total_quantity };
    });

    res.json({ success: true, data: { summary: result } });
  } catch (err) {
    next(err);
  }
};

module.exports = { getHistory, getItemHistory, getSummary };
