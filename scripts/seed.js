require('dotenv').config();
const mongoose = require('mongoose');
const { connect } = require('../src/config/db');
const User = require('../src/models/User');
const Item = require('../src/models/Item');
const Transaction = require('../src/models/Transaction');

const users = [
  { name: 'Admin User', email: 'admin@scanmaster.com', password: 'admin123', role: 'admin' },
  { name: 'Staff Alice', email: 'alice@scanmaster.com', password: 'staff123', role: 'staff' },
  { name: 'Staff Bob',   email: 'bob@scanmaster.com',   password: 'staff123', role: 'staff' },
];

const items = [
  { name: 'Wireless Keyboard',  sku: 'WK-001', qr_code: 'QR-WK-001',  quantity: 45, unit: 'pcs',  category: 'Electronics',  location: 'Shelf A1', low_stock_threshold: 10 },
  { name: 'USB-C Hub',          sku: 'UH-002', qr_code: 'QR-UH-002',  quantity: 8,  unit: 'pcs',  category: 'Electronics',  location: 'Shelf A2', low_stock_threshold: 10 },
  { name: 'Office Chair',       sku: 'OC-003', qr_code: 'QR-OC-003',  quantity: 12, unit: 'pcs',  category: 'Furniture',    location: 'Warehouse B', low_stock_threshold: 5 },
  { name: 'A4 Paper Ream',      sku: 'AP-004', qr_code: 'QR-AP-004',  quantity: 200, unit: 'reams', category: 'Stationery', location: 'Shelf C3', low_stock_threshold: 50 },
  { name: 'Ballpoint Pens Box', sku: 'BP-005', qr_code: 'QR-BP-005',  quantity: 5,  unit: 'boxes', category: 'Stationery', location: 'Shelf C1', low_stock_threshold: 10 },
  { name: 'HDMI Cable 2m',      sku: 'HC-006', qr_code: 'QR-HC-006',  quantity: 30, unit: 'pcs',  category: 'Electronics',  location: 'Shelf A3', low_stock_threshold: 8  },
  { name: 'Standing Desk',      sku: 'SD-007', qr_code: 'QR-SD-007',  quantity: 3,  unit: 'pcs',  category: 'Furniture',    location: 'Warehouse B', low_stock_threshold: 5 },
  { name: 'Webcam HD 1080p',    sku: 'WC-008', qr_code: 'QR-WC-008',  quantity: 0,  unit: 'pcs',  category: 'Electronics',  location: 'Shelf A1', low_stock_threshold: 5  },
];

const seed = async () => {
  try {
    await connect();

    console.log('🗑  Clearing existing data...');
    await Promise.all([
      User.deleteMany({}),
      Item.deleteMany({}),
      Transaction.deleteMany({}),
    ]);

    console.log('👤 Seeding users...');
    const createdUsers = await User.create(users);
    const admin = createdUsers.find((u) => u.role === 'admin');
    const staff = createdUsers.find((u) => u.role === 'staff');

    console.log('📦 Seeding items...');
    const createdItems = await Item.create(items);

    console.log('📋 Seeding transactions...');
    const transactions = [
      { item_id: createdItems[0]._id, type: 'IN',  quantity: 50, quantity_before: 0,  quantity_after: 50, user: admin._id, note: 'Initial stock' },
      { item_id: createdItems[0]._id, type: 'OUT', quantity: 5,  quantity_before: 50, quantity_after: 45, user: staff._id, note: 'Issued to IT dept' },
      { item_id: createdItems[1]._id, type: 'IN',  quantity: 15, quantity_before: 0,  quantity_after: 15, user: admin._id, note: 'Initial stock' },
      { item_id: createdItems[1]._id, type: 'OUT', quantity: 7,  quantity_before: 15, quantity_after: 8,  user: staff._id, note: 'Distributed to team' },
      { item_id: createdItems[3]._id, type: 'IN',  quantity: 200, quantity_before: 0, quantity_after: 200, user: admin._id, note: 'Bulk order received' },
      { item_id: createdItems[4]._id, type: 'IN',  quantity: 20, quantity_before: 0,  quantity_after: 20, user: admin._id, note: 'Initial stock' },
      { item_id: createdItems[4]._id, type: 'OUT', quantity: 15, quantity_before: 20, quantity_after: 5,  user: staff._id, note: 'Monthly distribution' },
    ];

    await Transaction.create(transactions);

    console.log('\n✅ Seed complete!\n');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Login credentials:');
    console.log('  Admin  → admin@scanmaster.com  / admin123');
    console.log('  Staff  → alice@scanmaster.com  / staff123');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

    process.exit(0);
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exit(1);
  }
};

seed();
