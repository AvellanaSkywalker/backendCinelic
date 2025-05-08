import { Request, Response, NextFunction } from 'express'; 
import { validationResult } from 'express-validator'; // Importa la función para validar los inputs

// Middleware para manejar errores de validación en las solicitudes
export const handleInputErrors = (req: Request, res: Response, next: NextFunction) => {
    // Obtiene los errores de validación generados por express-validator
    let errors = validationResult(req);

    // Si hay errores, responde con un estado 400 y devuelve los errores en formato JSON
    if (!errors.isEmpty()) {
        res.status(400).json({ errors: errors.array() });
        return; // Retorna para evitar que el código continúe ejecutándose
    }

    // Si no hay errores, pasa al siguiente middleware o controlador
    next();
};
