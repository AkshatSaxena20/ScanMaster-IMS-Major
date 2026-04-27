const mongoose = require('mongoose');

const itemSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    sku: {
      type: String,
      required: [true, 'SKU is required'],
      unique: true,
      uppercase: true,
      trim: true,
    },
    qr_code: {
      type: String,
      required: [true, 'QR code is required'],
      unique: true,
      trim: true,
    },
    quantity: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Quantity cannot be negative'],
    },
    unit: {
      type: String,
      default: 'pcs',
      trim: true,
    },
    category: {
      type: String,
      trim: true,
      default: 'Uncategorized',
    },
    location: {
      type: String,
      trim: true,
      default: 'Warehouse',
    },
    low_stock_threshold: {
      type: Number,
      default: function () {
        return parseInt(process.env.LOW_STOCK_THRESHOLD) || 10;
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    updated_at: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

itemSchema.virtual('isLowStock').get(function () {
  return this.quantity <= this.low_stock_threshold;
});

itemSchema.set('toJSON', { virtuals: true });
itemSchema.set('toObject', { virtuals: true });

itemSchema.index({ category: 1 });

module.exports = mongoose.model('Item', itemSchema);
