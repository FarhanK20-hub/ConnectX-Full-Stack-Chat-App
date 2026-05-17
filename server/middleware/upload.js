const multer = require('multer');

const storage = multer.diskStorage({});

const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image')) {
    cb(null, true);
  } else {
    cb('Invalid file type, only images are allowed!', false);
  }
};

const upload = multer({ storage, fileFilter });

module.exports = upload;
