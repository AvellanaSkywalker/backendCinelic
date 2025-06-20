import { Request, Response, NextFunction } from 'express';

export const validateScreening = (req: Request, res: Response, next: NextFunction) => {
  const { movieId, roomId, price, startTime, endTime } = req.body; 
  
  const missingFields = [];
  if (!movieId) missingFields.push('movieId');
  if (!roomId) missingFields.push('roomId');
  if (!startTime) missingFields.push('startTime'); 
  if (!endTime) missingFields.push('endTime');     
  if (price === undefined) missingFields.push('price');

  if (missingFields.length > 0) {
    res.status(400).json({
      error: 'Faltan campos obligatorios',
      missingFields,
      received: req.body // Para debug
    });
    return;
  }

  // validacion adicional de tipos
  if (isNaN(Number(price))) {
    res.status(400).json({ error: 'Price debe ser un número' });
    return;
  }

  next();
};