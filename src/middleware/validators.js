const { body, query, validationResult } = require('express-validator');

const validate = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: 'Validation failed',
      errors: errors.array().map((e) => ({ field: e.path, message: e.msg })),
    });
  }
  next();
};

const authValidators = {
  register: [
    body('name').trim().notEmpty().withMessage('Name is required'),
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').isLength({ min: 6 }).withMessage('Password must be at least 6 characters'),
    body('role').optional().isIn(['admin', 'staff']).withMessage('Role must be admin or staff'),
  ],
  login: [
    body('email').isEmail().normalizeEmail().withMessage('Valid email required'),
    body('password').notEmpty().withMessage('Password is required'),
  ],
};

const itemValidators = {
  create: [
    body('name').trim().notEmpty().withMessage('Item name is required'),
    body('sku').trim().notEmpty().withMessage('SKU is required'),
    body('qr_code').trim().notEmpty().withMessage('QR code is required'),
    body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('low_stock_threshold').optional().isInt({ min: 0 }).withMessage('Threshold must be a non-negative integer'),
  ],
  update: [
    body('name').optional().trim().notEmpty().withMessage('Name cannot be empty'),
    body('quantity').optional().isInt({ min: 0 }).withMessage('Quantity must be a non-negative integer'),
    body('low_stock_threshold').optional().isInt({ min: 0 }).withMessage('Threshold must be a non-negative integer'),
  ],
};

const stockValidators = {
  scan: [
    body('qr_code').trim().notEmpty().withMessage('QR code is required'),
  ],
  update: [
    body('item_id').notEmpty().withMessage('Item ID is required'),
    body('type').isIn(['IN', 'OUT']).withMessage('Type must be IN or OUT'),
    body('quantity').isInt({ min: 1 }).withMessage('Quantity must be a positive integer'),
    body('note').optional().trim().isLength({ max: 500 }).withMessage('Note cannot exceed 500 characters'),
  ],
};

const historyValidators = {
  query: [
    query('page').optional().isInt({ min: 1 }).withMessage('Page must be a positive integer'),
    query('limit').optional().isInt({ min: 1, max: 100 }).withMessage('Limit must be between 1 and 100'),
    query('type').optional().isIn(['IN', 'OUT']).withMessage('Type must be IN or OUT'),
  ],
};

module.exports = { validate, authValidators, itemValidators, stockValidators, historyValidators };
