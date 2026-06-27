const cloudinary = require('../config/cloudinary');
const fs = require('fs');

const uploadFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    const fileType = req.file.mimetype.split('/')[0];
    let resourceType = 'raw';
    if (fileType === 'image') resourceType = 'image';
    if (fileType === 'video') resourceType = 'video';
    if (fileType === 'audio') resourceType = 'video';

    const result = await cloudinary.uploader.upload(req.file.path, {
      resource_type: resourceType,
      folder: 'nexchat',
    });

    fs.unlinkSync(req.file.path);

    res.json({
      url: result.secure_url,
      type: fileType,
      originalName: req.file.originalname,
    });
  } catch (error) {
    console.error('Upload Error:', error.message);
    res.status(500).json({ message: error.message });
  }
};

module.exports = { uploadFile };