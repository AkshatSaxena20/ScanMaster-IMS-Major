const router = require('express').Router();
const {
  getInventory,
  getItem,
  createItem,
  updateItem,
  deleteItem,
  getLowStockAlerts,
} = require('../controllers/inventoryController');
const { authenticate, authorize } = require('../middleware/auth');
const { itemValidators, validate } = require('../middleware/validators');

router.use(authenticate);

router.get('/', getInventory);
router.get('/alerts/low-stock', getLowStockAlerts);
router.get('/:id', getItem);

router.post('/', itemValidators.create, validate, createItem);
router.patch('/:id', authorize('admin'), itemValidators.update, validate, updateItem);
router.delete('/:id', authorize('admin'), deleteItem);

module.exports = router;
