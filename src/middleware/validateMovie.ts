import { Request, Response, NextFunction } from 'express';

export const validateMovie = (req: Request, res: Response, next: NextFunction) => {
  const { title, duration, rating, posterurl } = req.body;
  if (!title || !duration || rating === undefined || !posterurl === undefined) {
    res.status(400).json({ error: 'Faltan campos obligatorios: title, duration, rating y posterurl.' });
    return
  }
  next();
};
