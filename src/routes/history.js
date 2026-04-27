const router = require('express').Router();
const { getHistory, getItemHistory, getSummary } = require('../controllers/historyController');
const { authenticate, authorize } = require('../middleware/auth');
const { historyValidators, validate } = require('../middleware/validators');

router.use(authenticate);

router.get('/', historyValidators.query, validate, getHistory);
router.get('/summary', getSummary);
router.get('/item/:item_id', getItemHistory);

module.exports = router;
