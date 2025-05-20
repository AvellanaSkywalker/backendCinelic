import { transport } from "../config/nodemailer";

type EmailType = {
    name: string;
    email: string;
    token: string;
};

export class AuthEmail {
    // Envia email de confirmacion de cuenta
static async sendConfirmationEmail({ name, email, token }: EmailType) {
    if (!process.env.BACKEND_URL) {
        throw new Error("BACKEND_URL no está definido en las variables de entorno.");
    }

    const confirmUrl = `${process.env.BACKEND_URL}/api/auth/confirm/${token}`;
    console.log("Enlace de confirmación generado:", confirmUrl); // para debuggear

    await transport.sendMail({
        from: "CineClic <no-reply@cineclic.com>",
        to: email,
        subject: "Confirma tu cuenta en CineClic",
        html: `
            <h1>¡Gracias por registrarte, ${name}!</h1>
            <p>Confirma tu cuenta haciendo clic en el siguiente enlace:</p>
            <a href="${confirmUrl}" target="_blank">Confirmar mi cuenta</a>
            <p>Si no solicitaste este registro, puedes ignorar este mensaje.</p>
        `,
    });
}

    // envia email de recuperacion de contrasenia
    static async sendPasswordResetToken({ name, email, token }: EmailType) {
        const resetUrl = `${process.env.BACKEND_URL}/api/auth/reset-password/${token}`;

        await transport.sendMail({
            from: "CineClic <admin@cineclic.com>",
            to: email,
            subject: "CineClic - RESTABLECE TU PASSWORD",
            html: `
                <p>Hola, ${name}, has solicitado restablecer tu contraseña en CineClic.</p>
                <p>Visita el siguiente enlace:</p>
                <a href="${resetUrl}" target="_blank">REESTABLECER PASSWORD</a>
            `,
        });

        console.log(`Mensaje de recuperación de contraseña enviado a ${email}`);
    }
}
