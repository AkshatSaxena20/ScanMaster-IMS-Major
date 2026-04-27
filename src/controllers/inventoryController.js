const mongoose = require('mongoose');
const Item = require('../models/Item');

const getInventory = async (req, res, next) => {
  try {
    const {
      page = 1,
      limit = 20,
      category,
      lowStock,
      search,
      sortBy = 'name',
      order = 'asc',
    } = req.query;

    const filter = { isActive: true };

    if (category) filter.category = category;
    if (lowStock === 'true') {
      filter.$expr = { $lte: ['$quantity', '$low_stock_threshold'] };
    }
    if (search) {
      filter.$or = [
        { name: { $regex: search, $options: 'i' } },
        { sku: { $regex: search, $options: 'i' } },
        { category: { $regex: search, $options: 'i' } },
      ];
    }

    const sortOrder = order === 'desc' ? -1 : 1;
    const allowedSorts = ['name', 'quantity', 'category', 'updated_at', 'createdAt'];
    const sortField = allowedSorts.includes(sortBy) ? sortBy : 'name';

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [items, total] = await Promise.all([
      Item.find(filter)
        .sort({ [sortField]: sortOrder })
        .skip(skip)
        .limit(parseInt(limit)),
      Item.countDocuments(filter),
    ]);

    const lowStockCount = await Item.countDocuments({
      isActive: true,
      $expr: { $lte: ['$quantity', '$low_stock_threshold'] },
    });

    res.json({
      success: true,
      data: {
        items,
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / parseInt(limit)),
        },
        alerts: { low_stock_count: lowStockCount },
      },
    });
  } catch (err) {
    next(err);
  }
};

const getItem = async (req, res, next) => {
  try {
    const isObjectId = mongoose.Types.ObjectId.isValid(req.params.id);
    const query = isObjectId 
      ? { _id: req.params.id, isActive: true } 
      : { sku: req.params.id, isActive: true };

    const item = await Item.findOne(query);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }
    res.json({ success: true, data: { item } });
  } catch (err) {
    next(err);
  }
};

const createItem = async (req, res, next) => {
  try {
    const item = await Item.create(req.body);
    res.status(201).json({ success: true, message: 'Item created successfully', data: { item } });
  } catch (err) {
    next(err);
  }
};

const updateItem = async (req, res, next) => {
  try {
    const allowedFields = ['name', 'unit', 'category', 'location', 'low_stock_threshold'];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { ...updates, updated_at: Date.now() },
      { new: true, runValidators: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({ success: true, message: 'Item updated successfully', data: { item } });
  } catch (err) {
    next(err);
  }
};

const deleteItem = async (req, res, next) => {
  try {
    const item = await Item.findOneAndUpdate(
      { _id: req.params.id, isActive: true },
      { isActive: false },
      { new: true }
    );

    if (!item) {
      return res.status(404).json({ success: false, message: 'Item not found' });
    }

    res.json({ success: true, message: 'Item deactivated successfully' });
  } catch (err) {
    next(err);
  }
};

const getLowStockAlerts = async (req, res, next) => {
  try {
    const items = await Item.find({
      isActive: true,
      $expr: { $lte: ['$quantity', '$low_stock_threshold'] },
    }).sort({ quantity: 1 });

    res.json({
      success: true,
      data: {
        count: items.length,
        items,
      },
    });
  } catch (err) {
    next(err);
  }
};

module.exports = { getInventory, getItem, createItem, updateItem, deleteItem, getLowStockAlerts };
