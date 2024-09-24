import cloudinary from 'cloudinary';
import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Cloudinary configuration
cloudinary.v2.config({
  cloud_name: process.env.CLOUD_NAME,
  api_key: process.env.API_KEY,
  api_secret: process.env.API_SECRET,
});

// Set up Cloudinary storage with multer
const storage = new CloudinaryStorage({
  cloudinary: cloudinary.v2,
  params: async (req, file) => {
    // Determine file format based on mimetype
    const allowedFormats = ['image/jpeg', 'image/png', 'image/jpg'];
    if (!allowedFormats.includes(file.mimetype)) {
      throw new Error('Unsupported file format');
    }

    return {
      folder: 'products',
      format: file.mimetype.split('/')[1], // Extracts 'jpeg', 'png', or 'jpg'
      public_id: `${Date.now()}-${file.originalname}`,
    };
  },
});

// Multer middleware for file uploads
export const upload = multer({ storage });
