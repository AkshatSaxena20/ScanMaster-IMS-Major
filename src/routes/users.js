const router = require('express').Router();
const { getUsers, getUser, updateUser, deactivateUser } = require('../controllers/userController');
const { authenticate, authorize } = require('../middleware/auth');

router.use(authenticate, authorize('admin'));

router.get('/', getUsers);
router.get('/:id', getUser);
router.patch('/:id', updateUser);
router.delete('/:id', deactivateUser);

module.exports = router;
