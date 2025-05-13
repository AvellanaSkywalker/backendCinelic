// src/middleware/validateBooking.ts
import { Request, Response, NextFunction } from 'express';

export const validateBooking = (req: Request, res: Response, next: NextFunction) => {
    const { screeningId, seats } = req.body;

    if (!screeningId || !seats || seats.length === 0) {
        res.status(400).json({ error: 'screeningId y seats son requeridos' });
        return;
    }

    if (!Array.isArray(seats)) {
        res.status(400).json({ error: 'seats debe ser un array' });
        return;
    }

    next();
};
