const Story = require('../models/Story');
const User = require('../models/User');

// @desc    Get active stories of all users (including self)
// @route   GET /api/stories
// @access  Private
const getStories = async (req, res, next) => {
  try {
    // Only get stories that haven't expired
    const activeStories = await Story.find({
      expiresAt: { $gt: new Date() }
    })
      .populate('userId', 'name avatar')
      .sort({ createdAt: 1 });

    // Group stories by userId
    const storiesByUser = {};
    activeStories.forEach(story => {
      const uId = story.userId._id.toString();
      if (!storiesByUser[uId]) {
        storiesByUser[uId] = {
          user: story.userId,
          stories: []
        };
      }
      storiesByUser[uId].stories.push(story);
    });

    res.json(Object.values(storiesByUser));
  } catch (error) {
    next(error);
  }
};

// @desc    Create a new story
// @route   POST /api/stories
// @access  Private
const createStory = async (req, res, next) => {
  try {
    const { mediaUrl, type } = req.body;

    if (!mediaUrl) {
      res.status(400);
      throw new Error('Please provide media URL');
    }

    const expiresAt = new Date();
    expiresAt.setHours(expiresAt.getHours() + 24); // Expires in 24 hours

    const story = await Story.create({
      userId: req.user._id,
      mediaUrl,
      type: type || 'image',
      expiresAt
    });

    const fullStory = await Story.findById(story._id).populate('userId', 'name avatar');

    // Broadcast the new story to all connected clients
    const io = req.app.get('io');
    if (io) {
      io.emit('new_story', fullStory);
    }

    res.status(201).json(fullStory);
  } catch (error) {
    next(error);
  }
};

// @desc    Mark story as viewed
// @route   POST /api/stories/:id/view
// @access  Private
const viewStory = async (req, res, next) => {
  try {
    const story = await Story.findById(req.params.id);

    if (!story) {
      res.status(404);
      throw new Error('Story not found');
    }

    if (!story.viewedBy.includes(req.user._id)) {
      story.viewedBy.push(req.user._id);
      await story.save();
    }

    res.json(story);
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getStories,
  createStory,
  viewStory
};
