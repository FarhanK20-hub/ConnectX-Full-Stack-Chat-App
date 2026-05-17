const express = require('express');
const router = express.Router();
const { searchUsers, updateProfile } = require('../controllers/userController');
const { protect } = require('../middleware/authMiddleware');

router.get('/search', protect, searchUsers);
router.patch('/profile', protect, updateProfile);

module.exports = router;
