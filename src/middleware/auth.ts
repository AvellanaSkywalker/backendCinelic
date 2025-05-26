import { Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
import User from '../models/User'

declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

// extende la interface Request para agregar la propiedad user
export interface AuthRequest extends Request {
  user?: any;
}

export const authenticate = (req: AuthRequest, res: Response, next: NextFunction): any => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
     res.status(401).json({ error: "No se proporcionó token de autenticación" });
     return;
  }

  //  el token se envia en el formato Bearer <token>
  const token = authHeader.split(" ")[1];
  if (!token) {
    res.status(401).json({ error: "Token de autenticación ausente" });
    return;
  }

  try {
    // verifica el token utilizando el secreto definido en las variables de entorno
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string);
    req.user = decoded;
    next();
  } catch (error) {
     res.status(401).json({ error: "Token inválido" });
     return;
  }
};
