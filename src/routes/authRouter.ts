import { Router } from "express";
import { body, param } from "express-validator"; // Librería para validar los inputs de las solicitudes
import { AuthController } from "../controllers/AuthController"; // Importación del controlador de autenticación
import { handleInputErrors } from "../middleware/validation"; // Middleware para manejar errores de validación
import { limiter } from "../config/limiter"; // Middleware para limitar solicitudes y prevenir abuso de API
import { authenticate } from "../middleware/auth"; // Middleware para manejar la autenticación de usuarios

// Creación de una nueva instancia de Router para definir rutas de autenticación
const router = Router();

router.use(limiter); // Aplica el middleware de límite de solicitudes a todas las rutas

// Ruta para registrar una nueva cuenta
router.post('/create-account', 
    body('name')
        .notEmpty().withMessage('No se permiten campos vacíos'), // Valida que el campo "name" no esté vacío
    body('password')
        .isLength({ min: 8 }).withMessage('Contraseña demasiado corta, mínimo 8 caracteres'), // Valida la longitud mínima del password
    body('email')
        .isEmail().withMessage('Email no válido'), // Valida que el email tenga un formato válido
    handleInputErrors, // Middleware que maneja errores de validación
    AuthController.createAccount // Método del controlador que procesa la creación de usuario
);

// Ruta para confirmar cuenta con un token
router.post('/confirm-account',
    body('token')
        .notEmpty() // Verifica que el token no esté vacío
        .isLength({ min: 6, max: 6 }) // Valida que el token tenga exactamente 6 caracteres
        .withMessage('Token no válido'),
    handleInputErrors,
    AuthController.confirmAccount
);

// Ruta para iniciar sesión
router.post('/login',
    body('email')
        .isEmail().withMessage('Email no válido'),
    body('password')
        .notEmpty().withMessage('El password es obligatorio'), // Verifica que la contraseña no esté vacía
    handleInputErrors,
    AuthController.login
);

// Ruta para solicitar recuperación de contraseña
router.post('/forgot-password',
    body('email')
        .isEmail().withMessage('Email no válido'), // Valida que el email tenga un formato correcto
    handleInputErrors,
    AuthController.forgotPassword
);

// Ruta para validar si un token de recuperación es válido
router.post('/validate-token',
    body('token')
        .notEmpty()
        .isLength({ min: 6, max: 6 })
        .withMessage('Token no válido'),
    handleInputErrors,
    AuthController.validateToken
);

// Ruta para restablecer la contraseña con un token
router.post('/reset-password/:token',
    param('token')
        .notEmpty()
        .isLength({ min: 6, max: 6 })
        .withMessage('Token no válido'),
    body('password')
        .isLength({ min: 8 }).withMessage('Contraseña demasiado corta, mínimo 8 caracteres'),
    handleInputErrors,
    AuthController.resetPasswordWithToken
);

// Ruta para obtener información del usuario autenticado
router.get('/user',
    authenticate, // Middleware para verificar que el usuario está autenticado
    AuthController.user // Método del controlador que devuelve los datos del usuario
);

// Exporta el router para ser utilizado en la aplicación principal
export default router;
