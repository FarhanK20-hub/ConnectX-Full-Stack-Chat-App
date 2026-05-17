const express = require('express');
const router = express.Router();
const { getLinkPreview } = require('link-preview-js');
const { protect } = require('../middleware/authMiddleware');

router.post('/', protect, async (req, res) => {
  const { url } = req.body;
  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    const preview = await getLinkPreview(url, {
      imagesPropertyType: "og", // fetch only open graph images
      headers: {
        "user-agent": "googlebot", // helps bypass some weak protections
      },
      timeout: 3000
    });
    
    // Fallback logic for missing properties
    const result = {
      title: preview.title || preview.siteName || url,
      description: preview.description || '',
      image: preview.images && preview.images.length > 0 ? preview.images[0] : null,
      url: preview.url || url,
      siteName: preview.siteName || ''
    };

    res.json(result);
  } catch (error) {
    console.error('Failed to generate link preview:', error);
    res.status(500).json({ error: 'Failed to generate preview' });
  }
});

module.exports = router;
