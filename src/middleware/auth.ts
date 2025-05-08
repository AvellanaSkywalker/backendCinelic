import { Request, Response, NextFunction } from "express";
import jwt from 'jsonwebtoken';
import User from "../models/User";

// Extensión de la interfaz Request de Express para incluir un usuario autenticado
declare global {
    namespace Express {
        interface Request {
            user?: User;
        }
    }
}

// Middleware de autenticación
export const authenticate = async (req: Request, res: Response, next: NextFunction) => {
    // Obtiene el token de autorización desde los headers
    const bearer = req.headers.authorization;

    // Si no hay token, retorna un error de autorización
    if (!bearer) {
        const error = new Error('No autorizado');
        res.status(401).json({ error: error.message });
        return;
    }

    // Divide el header de autorización para obtener el token
    const [, token] = bearer.split(' ');

    // Verifica si el token está presente, si no, retorna error
    if (!token) {
        const error = new Error('Token no válido');
        res.status(401).json({ error: error.message });
        return;
    }

    try {
        // Verifica el token con la clave secreta almacenada en las variables de entorno
        const decode = jwt.verify(token, process.env.JWT_SECRET);

        // Comprueba si el token decodificado es un objeto y tiene un ID válido
        if (typeof decode === 'object' && decode.id) {
            // Busca el usuario en la base de datos y limita los atributos que se obtienen
            req.user = await User.findByPk(decode.id, {
                attributes: ['id', 'name', 'email']
            });

            // Continúa con el siguiente middleware
            next();
        }

    } catch (error) {
        // Si la verificación del token falla, retorna un error
        res.status(500).json({ error: 'Token no válido' });
    }
};

