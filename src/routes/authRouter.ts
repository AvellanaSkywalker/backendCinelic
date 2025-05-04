import { Router } from "express";
import { body, param } from "express-validator";
import { AuthContoller } from "../controllers/AuthController";
import { handleInputErrors } from "../middleware/validation";
import { limiter } from "../config/limiter";
import { authenticate } from "../middleware/auth";

const router = Router()

router.use(limiter)

router.post('/create-account', 
    body('name')
        .notEmpty().withMessage('no campo vacio'),
    body('password')
        .isLength({min: 8}).withMessage('password muy corto minimo 8 caracteres'),
    body('email')
        .isEmail().withMessage('email no valido'),
    handleInputErrors,
    AuthContoller.createAccount
)

router.post('/confirm-account',
    body('token')
        .notEmpty()
        .isLength({min: 6, max: 6})
        .withMessage('token no valido'),
    handleInputErrors,
    AuthContoller.confirmAccount
)

router.post('/login',
    body('email')
        .isEmail().withMessage('email no valido'),
    body('password')
        .notEmpty().withMessage('el password es obligatorio'),
    handleInputErrors,
    AuthContoller.login
)

router.post('/forgot-password',
    body('email')
        .isEmail().withMessage('email no valido'),
    handleInputErrors,
    AuthContoller.forgotPassword
)

router.post('/validate-token',
    body('token')
        .notEmpty()
        .isLength({min: 6, max: 6})
        .withMessage('token no valido'),
    handleInputErrors,
    AuthContoller.validateToken
)

router.post('/reset-password/:token',
    param('token')
        .notEmpty()
        .isLength({min: 6, max: 6})
        .withMessage('token no valido'),
    body('password')
        .isLength({min: 8}).withMessage('password muy corto minimo 8 caracteres'),
    handleInputErrors,
    AuthContoller.resetPasswordWithToken
)

router.get('/user',
    authenticate,
    AuthContoller.user
)



export default router