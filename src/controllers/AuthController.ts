import type { Request, Response } from 'express';
import User from '../models/User'; // Modelo de usuario
import { checkPassword, hashPassword } from '../utils/auth'; // Funciones para manejar contraseñas
import { generateToken } from '../utils/token'; // Generación de tokens de autenticación
import { AuthEmail } from '../emails/AuthEmail'; // Manejo de correos electrónicos
import { generateJWT } from '../utils/jwt'; // Función para generar JSON Web Tokens

export class AuthController {
    
    // Método para crear una nueva cuenta de usuario
    static createAccount = async (req: Request, res: Response): Promise<void> => {
        const { email, password } = req.body;

        // Verifica si el usuario ya existe en la base de datos
        const userExists = await User.findOne({ where: { email } });
        if (userExists) {
            res.status(409).json({ error: "Cuenta de usuario ya existe" });
            return;
        }

        try {
            // Crea una nueva instancia del usuario con los datos proporcionados
            const user = new User(req.body);
            user.password = await hashPassword(password); // Hashea la contraseña antes de guardarla
            user.token = generateToken(); // Genera un token para confirmación de cuenta
            await user.save(); // Guarda el usuario en la base de datos

            // Envía un correo de confirmación
            await AuthEmail.sendConfirmationEmail({
                name: user.name,
                email: user.email,
                token: user.token
            });

            res.json("Cuenta creada");
        } catch (error) {
            // En caso de error, responde con un código 500
            res.status(500).json({ error: "Hubo un error al crear la cuenta" });
        }
    };

    // Método para confirmar una cuenta usando un token
    static confirmAccount = async (req: Request, res: Response) => {
        const { token } = req.body;

        // Busca al usuario con el token proporcionado
        const user = await User.findOne({ where: { token } });
        if (!user) {
            res.status(401).json({ error: "Token no válido" });
            return;
        }

        // Confirma la cuenta y elimina el token
        user.confirmed = true;
        user.token = null;
        await user.save();

        res.json("Cuenta confirmada");
    };

    // Método para iniciar sesión
    static login = async (req: Request, res: Response) => {
        const { email, password } = req.body;

        // Busca el usuario por su email
        const user = await User.findOne({ where: { email } });
        if (!user) {
            res.status(404).json({ error: "Cuenta de usuario no encontrada" });
            return;
        }

        // Verifica si la cuenta ha sido confirmada
        if (!user.confirmed) {
            res.status(403).json({ error: "Cuenta de usuario no confirmada" });
            return;
        }

        // Verifica si la contraseña es correcta
        const isPasswordCorrect = await checkPassword(password, user.password);
        if (!isPasswordCorrect) {
            res.status(401).json({ error: "Contraseña incorrecta" });
            return;
        }

        // Genera un token JWT para la sesión del usuario
        const token = generateJWT(user.id);

        res.json(token);
    };

    // Método para recuperar contraseña
    static forgotPassword = async (req: Request, res: Response) => {
        const { email } = req.body;

        // Verifica si el usuario existe
        const user = await User.findOne({ where: { email } });
        if (!user) {
            res.status(404).json({ error: "Cuenta de usuario no encontrada" });
            return;
        }

        // Genera un nuevo token de recuperación
        user.token = generateToken();
        await user.save();

        // Envía un correo con el token de recuperación
        await AuthEmail.sendPasswordResetToken({
            name: user.name,
            email: user.email,
            token: user.token
        });

        res.json("Revisa tu correo electrónico para continuar con la recuperación");
    };

    // Método para validar un token de recuperación de cuenta
    static validateToken = async (req: Request, res: Response) => {
        const { token } = req.body;

        // Busca el usuario con el token proporcionado
        const tokenExists = await User.findOne({ where: { token } });
        if (!tokenExists) {
            res.status(404).json({ error: "Token no válido" });
            return;
        }

        res.json("Token válido");
    };

    // Método para cambiar la contraseña usando un token
    static resetPasswordWithToken = async (req: Request, res: Response) => {
        const { token } = req.params;
        const { password } = req.body;

        // Busca el usuario por el token
        const user = await User.findOne({ where: { token } });
        if (!user) {
            res.status(404).json({ error: "Token no válido" });
            return;
        }

        // Asigna la nueva contraseña y borra el token
        user.password = await hashPassword(password);
        user.token = null;
        await user.save();

        res.json("La contraseña ha sido modificada");
    };

    // Método para obtener la información del usuario autenticado
    static user = async (req: Request, res: Response) => {
        res.json(req.user);
    };
}
