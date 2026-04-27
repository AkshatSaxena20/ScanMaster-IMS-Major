const router = require('express').Router();
const { getDashboard } = require('../controllers/dashboardController');
const { authenticate, authorize } = require('../middleware/auth');

router.get('/', authenticate, authorize('admin'), getDashboard);

module.exports = router;
