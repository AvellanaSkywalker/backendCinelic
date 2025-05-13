// src/middleware/validateScreening.ts
import { Request, Response, NextFunction } from 'express';

export const validateScreening = (req: Request, res: Response, next: NextFunction) => {
  const { movieId, roomId, startTime, endTime, price } = req.body;
  if (!movieId || !roomId || !startTime || !endTime || price === undefined) {
    res.status(400).json({
      error: 'Faltan datos obligatorios: movieId, roomId, startTime, endTime y price.'
    });
    return;
  }
  next();
};
