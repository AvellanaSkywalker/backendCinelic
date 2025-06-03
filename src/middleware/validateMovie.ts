import { Request, Response, NextFunction } from 'express';

export const validateMovie = (req: Request, res: Response, next: NextFunction) => {
  const { title, duration, description } = req.body;

  if (req.method === 'POST' && !req.file) {
    res.status(400).json({ error: 'La imagen es requerida' });
    return;
  }

  const missingFields = [];
  if (!title) missingFields.push('title');
  if (!duration) missingFields.push('duration');
  if (!description) missingFields.push('description');

if (missingFields.length > 0) {
  const errorJson = {
    error: 'Campos faltantes',
    missingFields
  };
  console.log('Respuesta de error:', errorJson); 
  res.status(400).json(errorJson);
  return;
}

  next();
};