import { Request, Response } from "express";
import {generateJWT} from '../utils/jwt'
import {hashPassword, checkPassword} from '../utils/auth'
import jwt from 'jsonwebtoken';
import User from "../models/User";
import { AuthEmail } from "../emails/AuthEmail";

export class AuthController {
  // REGISTRO DE USUARIO
 static async createAccount(req: Request, res: Response): Promise<void> {
    try {
      const { name, email, password, role } = req.body;

      // No se permite registrar administradores desde este endpoint.
      if (role && role.toLowerCase() === "admin") {
        res.status(403).json({ error: "No se permite registrar un admin a través de esta ruta." });
        return;
      }

      // Verificar si el email ya existe.
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(400).json({ error: "El email ya se encuentra registrado." });
        return;
      }

      // Hashear la contraseña para almacenarla de forma segura.
      const hashedPassword = await hashPassword(password);
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "user" // Fuerza siempre role "user"
      });

      if(!process.env.JWT_SECRET){
        throw new Error("la variable esta configurada")
      }

      // Generar un token de confirmación (válido por 24h) para enviar por email (opcional).
      console.log("JWT_SECRET en generación:", process.env.JWT_SECRET);
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "24h" });

      // Enviar email de confirmación (asegúrate de que AuthEmail esté correctamente configurado).
      await AuthEmail.sendConfirmationEmail({ name, email, token });

      res.status(201).json({ message: "Cuenta creada correctamente. Revisa tu correo para confirmar la cuenta.", user });
      return;
    } catch (error) {
      console.error("Error en createAccount:", error);
      res.status(500).json({ error: "Error al crear la cuenta." });
      return;
    }
  }

  // CONFIRMACIÓN DE CUENTA VIA TOKEN
static async confirmAccountByLink(req: Request, res: Response): Promise<void> {
    try {
        const {token} = req.params

        if(!process.env.JWT_SECRET){//jhj
        throw new Error("la variable esta configurada")
        }

        if (!token) {
            res.status(400).json({ error: "Token no proporcionado." });
            return;
        }

        console.log('token recibido:', token)
        console.log('JWT_SECRET en verificacion:', process.env.JWT_SECRET);

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as {id:number}

        await User.update({isVerified: true}, {where: {id:decoded.id}})

        res.json({message: 'cuenta confirmada exitosamente'})
    } catch (error) {
        console.error("Error en confirmAccountByLink:", error);

        if(error instanceof jwt.TokenExpiredError){
          res.status(400).json({error: "token expirado"})
        }else if(error instanceof jwt.JsonWebTokenError){
          res.status(400).json({error: "token invalido"})
        }else{
          res.status(500).json({ error: "Error al confirmar la cuenta." });
        }
        
    }
}

  // INICIO DE SESIÓN
static async login(req: Request, res: Response): Promise<void> {
    try {
      const { email, password } = req.body;
      const user = await User.findOne({ where: { email } });

      if (!user) {
        res.status(401).json({ error: "Credenciales inválidas." });
        return;
      }

      if (!user.isVerified) {
        res.status(403).json({ error: "Debes verificar tu cuenta antes de iniciar sesión." });
        return;
      }

      // Validación extra para administradores
      if (user.role === "admin" && !user.email.endsWith("@cineclic.ad.com")) {
        res.status(403).json({ error: "Acceso restringido, el email admin no cumple con el dominio requerido." });
        return;
      }

      const isPasswordValid = await checkPassword(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ error: "Credenciales inválidas." });
        return;
      }

      // Generar el token JWT.
      const token = generateJWT(user.id.toString());

      res.status(200).json({ message: "Inicio de sesión exitoso.", token });
      return;
    } catch (error) {
      console.error(`Error en login (${req.body.email}):`, error);
      res.status(500).json({ error: "Error al iniciar sesión." });
      return;
    }
}

  // ENVÍO DE EMAIL PARA RECUPERACIÓN DE CONTRASEÑA
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const user = await User.findOne({ where: { email } });

      if (!user) {
        res.status(404).json({ error: "El email no se encuentra registrado" });
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: "1h" });

      // Usamos la función centralizada en `AuthEmail`
      await AuthEmail.sendPasswordResetToken({ name: user.name, email: user.email, token });

      res.json({ message: "Email de recuperación enviado" });
    } catch (error) {
      console.error("Error en forgotPassword:", error);
      res.status(500).json({ error: "Error al enviar email de recuperación" });
    }
  }

  static async resetPassword(req: Request, res: Response): Promise<void> {
    try {
        const { token, newPassword, confirmPassword } = req.body;

        if(newPassword !== confirmPassword){
          res.status(400).json({error: "las contrasenias no coinciden"})
          return;
        }

        if (!process.env.JWT_SECRET) {
            throw new Error("JWT_SECRET no configurado.");
        }

        // Verificar token
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: number };

        // Hashear nueva contraseña
        const hashedPassword = await hashPassword(newPassword);

        // Actualizar en DB
        await User.update(
            { password: hashedPassword },
            { where: { id: decoded.id } }
        );

        res.json({ message: "Contrasenia actualizada exitosamente." });
    } catch (error) {
        console.error("Error en resetPassword:", error);

        if (error instanceof jwt.TokenExpiredError) {
            res.status(400).json({ error: "El enlace ha expirado." });
        } else if (error instanceof jwt.JsonWebTokenError) {
            res.status(400).json({ error: "Token inválido." });
        } else {
            res.status(500).json({ error: "Error al actualizar la contraseña." });
        }
    }
}

}
