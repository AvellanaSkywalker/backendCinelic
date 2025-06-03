import sgMail from '@sendgrid/mail';

//  API Key de SendGrid
if (!process.env.SENDGRID_API_KEY) {
    throw new Error("SENDGRID_API_KEY no está definido en las variables de entorno.");
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

type EmailType = {
    name: string;
    email: string;
    token: string;
};

export class AuthEmail {
    // Envia email de confirmacion de cuenta
    static async sendConfirmationEmail({ name, email, token }: EmailType) {
        if (!process.env.FRONTEND_URL) {
            throw new Error("NEXT_PUBLIC_FRONTEND_URL no está definido");
        }

        const confirmUrl = `${process.env.FRONTEND_URL}/verification?token=${token}`;

        const msg = {
            to: email,
            from: 'CineClic <cinceclic.official@gmail.com>', // email verificado en SendGrid
            subject: "Confirma tu cuenta en CineClic",
            html: `
                <h1>¡Gracias por registrarte, ${name}!</h1>
                <p>Confirma tu cuenta haciendo clic en el siguiente enlace:</p>
                <a href="${confirmUrl}" target="_blank">Confirmar mi cuenta</a>
                <p><small>Si no solicitaste este registro, ignora este mensaje.</small></p>
            `,
        };

        try {
            await sgMail.send(msg);
            console.log(`Correo de confirmación enviado a ${email}`);
        } catch (error) {
            console.error('Error enviando email de confirmación:', error);
            throw new Error("Error al enviar el correo de confirmación");
        }
    }

    static async sendPasswordResetToken({ name, email, token }: EmailType) {
        if (!process.env.FRONTEND_URL) {
            throw new Error("NEXT_PUBLIC_FRONTEND_URL");
        }

        const resetUrl = `${process.env.FRONTEND_URL}/resetPassword?token=${token}`;

        const msg = {
            to: email,
            from: 'CineClic <cinceclic.official@gmail.com>', // email verificado en SendGrid
            subject: "Restablece tu contraseña en CineClic",
            html: `
                <p>Hola, ${name}, has solicitado restablecer tu contraseña.</p>
                <p>Visita el siguiente enlace para cambiar tu contraseña:</p>
                <a href="${resetUrl}" target="_blank">Restablecer contraseña</a>
                <p><small>El enlace expirará en 1 hora. Si no solicitaste este cambio, ignora este mensaje.</small></p>
            `,
        };

        try {
            await sgMail.send(msg);
            console.log(`Correo de recuperación enviado a ${email}`);
        } catch (error) {
            console.error('Error enviando email de recuperación:', error);
            throw new Error("Error al enviar el correo de recuperación");
        }
    }
}