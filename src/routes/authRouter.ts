import { Router } from "express";
import { AuthController } from "../controllers/AuthController";
import { validateRegisterInput, validateLoginInput, handleInputErrors, validatePasswordReset } from "../middleware/validation";
import User from "../models/User";
import { generateJWT } from "../utils/jwt";

const router = Router();

// Registro con validaciones
router.post('/createAccount', validateRegisterInput, handleInputErrors, AuthController.createAccount);

// Login con validaciones
router.post('/login', validateLoginInput, handleInputErrors, AuthController.login);

router.get('/confirm/:token', AuthController.confirmAccountByLink);

router.post('/forgotPassword', AuthController.forgotPassword);

router.post('/resetPassword', validatePasswordReset, handleInputErrors, AuthController.resetPassword);

router.post('/guest', async (req, res) => {
    try {
        // Busca el usuario guest fijo
        let guest = await User.findOne({ where: { email: "guest@cineclic.com" } });
        if (!guest) {
            guest = await User.create({
                name: "Iniciar sesión",
                email: "guest@cineclic.com",
                password: "guest", // No se usará para login real
                role: "guest",
                isVerified: true
            });
        }
        // Genera un JWT para el invitado
        const token = generateJWT(guest.id.toString());
        res.status(201).json({
            message: "Sesión de invitado iniciada.",
            token,
            user: { id: guest.id, name: guest.name, email: guest.email, role: guest.role }
        });
    } catch (error) {
        res.status(500).json({ error: "No se pudo crear usuario invitado" });
    }
});


export default router;