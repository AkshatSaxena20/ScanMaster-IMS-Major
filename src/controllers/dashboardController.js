const Item = require('../models/Item');
const Transaction = require('../models/Transaction');
const User = require('../models/User');

const getDashboard = async (req, res, next) => {
  try {
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      totalItems,
      lowStockItems,
      outOfStockItems,
      totalTransactions,
      todayTransactions,
      monthTransactions,
      totalUsers,
      recentTransactions,
      topMovers,
    ] = await Promise.all([
      Item.countDocuments({ isActive: true }),

      Item.countDocuments({
        isActive: true,
        $expr: { $and: [{ $lte: ['$quantity', '$low_stock_threshold'] }, { $gt: ['$quantity', 0] }] },
      }),

      Item.countDocuments({ isActive: true, quantity: 0 }),

      Transaction.countDocuments({}),

      Transaction.countDocuments({ timestamp: { $gte: startOfToday } }),

      Transaction.aggregate([
        { $match: { timestamp: { $gte: startOfMonth } } },
        { $group: { _id: '$type', count: { $sum: 1 }, total_qty: { $sum: '$quantity' } } },
      ]),

      User.countDocuments({ isActive: true }),

      Transaction.find({})
        .sort({ timestamp: -1 })
        .limit(10)
        .populate('item_id', 'name sku')
        .populate('user', 'name role'),

      Transaction.aggregate([
        { $match: { timestamp: { $gte: startOfMonth } } },
        { $group: { _id: '$item_id', movement: { $sum: '$quantity' }, txCount: { $sum: 1 } } },
        { $sort: { movement: -1 } },
        { $limit: 5 },
        { $lookup: { from: 'items', localField: '_id', foreignField: '_id', as: 'item' } },
        { $unwind: '$item' },
        { $project: { movement: 1, txCount: 1, 'item.name': 1, 'item.sku': 1, 'item.quantity': 1 } },
      ]),
    ]);

    const monthSummary = { IN: { count: 0, total_qty: 0 }, OUT: { count: 0, total_qty: 0 } };
    monthTransactions.forEach((t) => { monthSummary[t._id] = { count: t.count, total_qty: t.total_qty }; });

    res.json({
      success: true,
      data: {
        overview: {
          total_items: totalItems,
          low_stock_items: lowStockItems,
          out_of_stock_items: outOfStockItems,
          total_transactions: totalTransactions,
          today_transactions: todayTransactions,
          total_users: totalUsers,
        },
        this_month: monthSummary,
        top_movers: topMovers,
        recent_transactions: recentTransactions,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getDashboard };
