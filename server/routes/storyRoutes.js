const express = require('express');
const router = express.Router();
const {
  getStories,
  createStory,
  viewStory,
} = require('../controllers/storyController');
const { protect } = require('../middleware/authMiddleware');

router.route('/').get(protect, getStories).post(protect, createStory);
router.route('/:id/view').post(protect, viewStory);

module.exports = router;
