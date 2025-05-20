import { Request, Response, NextFunction } from 'express';
import { body } from 'express-validator';
import { validationResult } from 'express-validator'; // importa la funcion para validar los inputs

export const validateRegisterInput = [
    body('name')
        .notEmpty().withMessage('Nombre requerido')
        .isLength({ max: 50 }).withMessage('Máximo 50 caracteres'),
    
    body('email')
        .notEmpty().withMessage('Email requerido')
        .isEmail().withMessage('Formato de email inválido')
        .matches(/^[a-zA-Z0-9@._-]+$/).withMessage('Caracteres no permitidos'),
    
    body('password')
        .notEmpty().withMessage('Contraseña requerida')
        .isLength({ min: 8 }).withMessage('Mínimo 8 caracteres')
        .matches(/^[a-zA-Z0-9]+$/).withMessage('Solo caracteres alfanuméricos')
];

export const validateLoginInput = [
    body('email')
        .notEmpty().withMessage('Email requerido')
        .isEmail().withMessage('Formato de email inválido'),
    
    body('password')
        .notEmpty().withMessage('Contraseña requerida')
];

// middleware para manejar errores de validacion en las solicitudes
export const handleInputErrors = (req: Request, res: Response, next: NextFunction) => {
    // Obtiene los errores de validación generados por express-validator
    const errors = validationResult(req);

    // si hay errores responde con un estado 400 y devuelve los errores en formato JSON
    if (!errors.isEmpty()) {
        res.status(400).json({errors: errors.array()});
        return; // Retorna para evitar que el código continúe ejecutándose
    }

    // si no hay errores pasa al siguiente middleware o controlador
    next();
};

export const validatePasswordReset = [
    body('token').notEmpty().withMessage('el token es requerido'),
    body("newPassword")
    .isLength({min:8}).withMessage('la contrasenia debe tener al menos 8 caracteres'),
    body('confirmPassword')
    .custom((value, {req}) => {
        if(value !== req.body.newPassword){
            throw new Error("las contrasenias no coinciden")
        }
        return true;
    })
    .withMessage('las contrasenias deben concidir')
]