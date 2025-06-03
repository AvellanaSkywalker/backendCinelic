import { v2 as cloudinary } from 'cloudinary';
import { CloudinaryStorage } from 'multer-storage-cloudinary';

// Config básica
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true
});

// Storage para Multer
export const storage = new CloudinaryStorage({
  cloudinary,
  params: async (req, file) => {
    try {
      // Valida tipo de archivo
      const allowedFormats = ['image/jpeg', 'image/png', 'image/webp'];
      if (!allowedFormats.includes(file.mimetype)) {
        throw new Error('Solo se permiten imágenes JPEG, PNG o WEBP');
      }

      return {
        public_id: `poster_${Date.now()}`, // ID 
        folder: 'cineclic/posters',
        format: 'webp',
        transformation: [
          { width: 500, height: 750, crop: 'fill' },
          { quality: 'auto:best' } // Mejor calidad auto
        ],
        allowed_formats: ['jpg', 'png', 'webp'] 
      };
    } catch (error) {
      console.error('Error en configuración de Cloudinary:', error);
      throw error;
    }
  },
});

export default cloudinary;