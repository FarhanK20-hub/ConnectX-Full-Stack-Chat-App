const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const { protect } = require('../middleware/authMiddleware');
const User = require('../models/User');

// @desc    Set or update vault PIN
// @route   POST /api/vault/pin
// @access  Private
router.post('/pin', protect, async (req, res, next) => {
  try {
    const { pin } = req.body;
    if (!pin || pin.length < 4) {
      return res.status(400).json({ message: 'PIN must be at least 4 characters' });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPin = await bcrypt.hash(pin, salt);

    await User.findByIdAndUpdate(req.user._id, { vaultPin: hashedPin });
    res.json({ message: 'Vault PIN set successfully' });
  } catch (error) {
    next(error);
  }
});

// @desc    Verify vault PIN
// @route   POST /api/vault/verify
// @access  Private
router.post('/verify', protect, async (req, res, next) => {
  try {
    const { pin } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.vaultPin) {
      return res.status(400).json({ message: 'No vault PIN set' });
    }

    const isMatch = await bcrypt.compare(pin, user.vaultPin);
    if (!isMatch) {
      return res.status(401).json({ message: 'Invalid PIN' });
    }

    res.json({ success: true, lockedConversations: user.lockedConversations });
  } catch (error) {
    next(error);
  }
});

// @desc    Lock a conversation
// @route   POST /api/vault/lock
// @access  Private
router.post('/lock', protect, async (req, res, next) => {
  try {
    const { conversationId } = req.body;
    const user = await User.findById(req.user._id);

    if (!user.vaultPin) {
      return res.status(400).json({ message: 'Please set a Vault PIN first' });
    }

    if (!user.lockedConversations.includes(conversationId)) {
      user.lockedConversations.push(conversationId);
      await user.save();
    }

    res.json({ lockedConversations: user.lockedConversations });
  } catch (error) {
    next(error);
  }
});

// @desc    Unlock a conversation
// @route   POST /api/vault/unlock
// @access  Private
router.post('/unlock', protect, async (req, res, next) => {
  try {
    const { conversationId } = req.body;
    const user = await User.findById(req.user._id);

    user.lockedConversations = user.lockedConversations.filter(
      id => id.toString() !== conversationId
    );
    await user.save();

    res.json({ lockedConversations: user.lockedConversations });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
