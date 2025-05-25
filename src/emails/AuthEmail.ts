import { transport } from "../config/nodemailer";

type EmailType = {
    name: string;
    email: string;
    token: string;
};

export class AuthEmail {
    // Envia email de confirmacion de cuenta
static async sendConfirmationEmail({ name, email, token }: EmailType) {
    if (!process.env.FRONTEND_URL) {
        throw new Error("NEXT_PUBLIC_FRONTEND_URL no está definido en las variables de entorno.");
    }

    const confirmUrl = `${process.env.FRONTEND_URL}/verification?token=${token}`;

    await transport.sendMail({
        from: "CineClic <no-reply@cineclic.com>",
        to: email,
        subject: "Confirma tu cuenta en CineClic",
        html: `
            <h1>¡Gracias por registrarte, ${name}!</h1>
            <p>Confirma tu cuenta haciendo clic en el siguiente enlace:</p>
            <a href="${confirmUrl}" target="_blank">Confirmar mi cuenta</a>
        `,
    });
}

static async sendPasswordResetToken({ name, email, token }: EmailType) {
    if (!process.env.FRONTEND_URL) {
        throw new Error("NEXT_PUBLIC_FRONTEND_URL no está definido en las variables de entorno.");
    }

    const resetUrl = `${process.env.FRONTEND_URL}/resetPassword?token=${token}`;

    await transport.sendMail({
        from: "CineClic <admin@cineclic.com>",
        to: email,
        subject: "Restablece tu contraseña en CineClic",
        html: `
            <p>Hola, ${name}, has solicitado restablecer tu contraseña.</p>
            <p>Visita el siguiente enlace para cambiar tu contraseña:</p>
            <a href="${resetUrl}" target="_blank">Restablecer contraseña</a>
        `,
    });

    console.log(`Correo de recuperación enviado a ${email}`);
}

}
