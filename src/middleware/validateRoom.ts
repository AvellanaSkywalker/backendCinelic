// src/middleware/validateRoom.ts
import { Request, Response, NextFunction } from "express";

export const validateRoom = (req: Request, res: Response, next: NextFunction) => {
  const { name, layout } = req.body;
  if (!name || layout === undefined) {
    res.status(400).json({ error: "Faltan datos obligatorios: name y layout." });
    return;
  }
  next();
};
