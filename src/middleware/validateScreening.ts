import { Request, Response, NextFunction } from 'express';

export const validateScreening = (req: Request, res: Response, next: NextFunction) => {
  const { movieId, roomId, date, price, startTime, endTime } = req.body; // Cambiado a date/time
  
  const missingFields = [];
  if (!movieId) missingFields.push('movieId');
  if (!roomId) missingFields.push('roomId');
  if (!date) missingFields.push('date');
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

  // Valida adicional de tipos
  if (isNaN(Number(price))) {
    res.status(400).json({ error: 'Price debe ser un número' });
    return;
  }

  next();
};