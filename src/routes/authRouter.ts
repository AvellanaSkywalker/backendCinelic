import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { validateRegisterInput, validateLoginInput, handleInputErrors, validatePasswordReset } from "../middleware/validation";

const router = Router();

// Registro con validaciones
router.post('/createAccount', validateRegisterInput, handleInputErrors, AuthController.createAccount);

// Login con validaciones
router.post('/login', validateLoginInput, handleInputErrors, AuthController.login);

router.get('/confirm/:token', AuthController.confirmAccountByLink);

router.post('/forgotPassword', AuthController.forgotPassword);

router.post('/resetPassword', validatePasswordReset, handleInputErrors, AuthController.resetPassword);


export default router;
