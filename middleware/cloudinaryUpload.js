const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('../utils/cloudinary');

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'workout_plans',
    resource_type: 'raw', // for PDFs, ZIPs, etc.
    allowedFormats: ['pdf']
  }
});

const upload = multer({ storage });

module.exports = upload;
