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

      // no permite registrar administradores desde este endpoint.
      if (role && role.toLowerCase() === "admin") {
        res.status(403).json({ error: "No se permite registrar un admin a través de esta ruta." });
        return;
      }

      // Verifica si el email ya existe
      const existingUser = await User.findOne({ where: { email } });
      if (existingUser) {
        res.status(400).json({ error: "El email ya se encuentra registrado." });
        return;
      }

      // hash de la contrasenia para almacenar en la base de datos
      const hashedPassword = await hashPassword(password);
      const user = await User.create({
        name,
        email,
        password: hashedPassword,
        role: "user" // Fuerza siempre el role a user
      });

      if(!process.env.JWT_SECRET){
        throw new Error("la variable esta configurada")
      }

      // gnerar un token de confirmacion vslido por 24h para enviar por email
      console.log("JWT_SECRET en generación:", process.env.JWT_SECRET);
      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET, { expiresIn: "24h" });

      // Envia email de confirmacin 
      await AuthEmail.sendConfirmationEmail({ name, email, token });

      res.status(201).json({ message: "Cuenta creada correctamente. Revisa tu correo para confirmar la cuenta.", user });
      return;
    } catch (error) {
      console.error("Error en createAccount:", error);
      res.status(500).json({ error: "Error al crear la cuenta." });
      return;
    }
  }

  // CONFIRMACION DE CUENTA VIA TOKEN
static async confirmAccountByLink(req: Request, res: Response): Promise<void> {
    try {
        const { token } = req.params;

        if (!process.env.JWT_SECRET) {
            throw new Error("la variable esta configurada");
        }

        if (!token) {

            res.status(400).json({ error: "Token no proporcionado." });
            return;
        }

        console.log("Token recibido:", req.params.token);
        console.log("JWT_SECRET en verificación:", process.env.JWT_SECRET);

        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: number };
        console.log("ID decodificado:", decoded.id);

        const user = await User.findOne({ where: { id: decoded.id } });

        if (!user) {
            res.status(400).json({ error: "Usuario no encontrado." });
            return;
        }

        const [updatedRows] = await User.update({ isVerified: true }, { where: { id: decoded.id } });

        if (updatedRows === 0) {
            res.status(400).json({ error: "La actualización no se realizó correctamente." });
            return;
        }

        const updatedUser = await User.findOne({ where: { id: decoded.id } });
        console.log("Estado actualizado en la BD:", updatedUser?.isVerified);

        res.json({ message: "Cuenta confirmada exitosamente" });
    } catch (error) {
        console.error("Error en confirmAccountByLink:", error);

        if (error instanceof jwt.TokenExpiredError) {
            res.status(400).json({ error: "Token expirado" });
        } else if (error instanceof jwt.JsonWebTokenError) {
            res.status(400).json({ error: "Token inválido" });
        } else {
            res.status(500).json({ error: "Error al confirmar la cuenta." });
        }
    }
}


  // INICIO DE SESION
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

      // Validacion extra para administradores
      if (user.role === "admin" && !user.email.endsWith("@cineclic.ad.com")) {
        res.status(403).json({ error: "Acceso restringido, el email admin no cumple con el dominio requerido." });
        return;
      }

      const isPasswordValid = await checkPassword(password, user.password);
      if (!isPasswordValid) {
        res.status(401).json({ error: "Credenciales inválidas." });
        return;
      }

      // Genera el token JWT
      const token = generateJWT(user.id.toString());

      res.status(200).json({ message: "Inicio de sesión exitoso.", 
        token,
        user:{ id: user.id, name: user.name, email: user.email, role: user.role},
      });
      return;
    } catch (error) {
      console.error(`Error en login (${req.body.email}):`, error);
      res.status(500).json({ error: "Error al iniciar sesión." });
      return;
    }
}

  // ENVIO DE EMAIL PARA RECUPERACION DE CONTRASENIA
  static async forgotPassword(req: Request, res: Response): Promise<void> {
    try {
      const { email } = req.body;
      const user = await User.findOne({ where: { email } });

      if (!user) {
        res.status(404).json({ error: "El email no se encuentra registrado" });
        return;
      }

      const token = jwt.sign({ id: user.id }, process.env.JWT_SECRET as string, { expiresIn: "1h" });

      //  funcion centralizada en AuthEmail
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
        console.log("Body recibido en resetPassword:", req.body);

        if(newPassword !== confirmPassword){
          res.status(400).json({error: "las contrasenias no coinciden"})
          console.log("Nueva contraseña:", newPassword);
          console.log("Confirmación de contraseña:", confirmPassword);

          return;
        }

        if (!process.env.JWT_SECRET) {
          console.log("Token recibido:", token);

            throw new Error("JWT_SECRET no configurado.");
        }

        // verifica token
        const decoded = jwt.verify(token, process.env.JWT_SECRET) as { id: number };
        console.log("Token decodificado:", decoded);


        // hashea nueva contrasenia
        const hashedPassword = await hashPassword(newPassword);

        // Actualiza en DB
        await User.update(
            { password: hashedPassword },
            { where: { id: decoded.id } }
        );

        res.json({ message: "Contrasenia actualizada exitosamente." });
    } catch (error) {
        console.error("Error en resetPassword:", error);

        if (error instanceof jwt.TokenExpiredError) {
          console.error("Error en resetPassword:", error);

            res.status(400).json({ error: "El enlace ha expirado." });
        } else if (error instanceof jwt.JsonWebTokenError) {
          console.error("Error en resetPassword:", error);

            res.status(400).json({ error: "Token inválido." });
        } else {
            res.status(500).json({ error: "Error al actualizar la contraseña." });
        }
    }
}

}
