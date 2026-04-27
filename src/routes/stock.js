const router = require('express').Router();
const { scanItem, updateStock } = require('../controllers/stockController');
const { authenticate } = require('../middleware/auth');
const { stockValidators, validate } = require('../middleware/validators');

router.use(authenticate);

router.post('/scan', stockValidators.scan, validate, scanItem);
router.post('/update-stock', stockValidators.update, validate, updateStock);

module.exports = router;
