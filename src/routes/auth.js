const router = require('express').Router();
const { register, login, getMe, updatePassword } = require('../controllers/authController');
const { authenticate, authorize } = require('../middleware/auth');
const { authValidators, validate } = require('../middleware/validators');

router.post('/register', authValidators.register, validate, register);
router.post('/login', authValidators.login, validate, login);
router.get('/me', authenticate, getMe);
router.patch('/password', authenticate, updatePassword);

// Admin-only: register a new admin
router.post('/admin/register', authenticate, authorize('admin'), authValidators.register, validate, register);

module.exports = router;
