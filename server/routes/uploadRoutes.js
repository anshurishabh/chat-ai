const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { uploadFile } = require('../controllers/uploadController');
const { protect } = require('../middleware/auth');

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/');
  },
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 50 * 1024 * 1024 },
});

router.post('/', protect, upload.single('file'), uploadFile);

module.exports = router;