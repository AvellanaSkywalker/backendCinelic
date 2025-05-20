import { Request, Response, NextFunction } from "express";

export const validateRoom = (req: Request, res: Response, next: NextFunction) => {
  // Validar que el body contenga los campos obligatorios
  console.log("Datos recibidos en validateRoom:", JSON.stringify(req.body, null, 2));

  const { name, layout } = req.body;
  if (!name || !layout || typeof layout !== "object") {
    res.status(400).json({ error: "Faltan datos obligatorios: name y layout." });
    return;
  }
  next();
};
