import { storage } from '../config/cloudinary';
import multer from 'multer';
import { Request, Response, NextFunction } from 'express';

// Config mejorada
export const upload = multer({
  storage,
  limits: { 
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1 // Solo permite 1 archivo
  },
  fileFilter: (req, file, cb) => {
    const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp'];
    
    if (allowedMimeTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE'));
    }
  }
});

//  para manejar errores de Multer
export const handleMulterErrors = (err: any, req: Request, res: Response, next: NextFunction) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      res.status(400).json({ error: 'La imagen no puede exceder 5MB' });
      return;
    }
    if (err.code === 'LIMIT_UNEXPECTED_FILE') {
      res.status(400).json({ error: 'Solo se permiten archivos de imagen' });
      return;
    }
  } else if (err) {
    res.status(500).json({ error: 'Error al procesar la imagen' });
    return;
  }
  next();
};