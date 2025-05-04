import { ChainCondition } from "express-validator/lib/context-items"
import { transport } from "../config/nodemailer"

type EmailType = {
    name: string
    email: string
    token: string
}

export class AuthEmail{
    static sendConfirmationEmail = async (user: EmailType) => {
        const email = await transport.sendMail({
            from: 'Cineclic <admin@cineclic.com>',
            to: user.email,
            subject: 'Cineclic - confirma tu cuenta',
            html: `
                <p>hola: ${user.name}, has creado tu ceunta en cineclic </p>
                <p>Visita el siguiente enlace:</p>
                <a href="#">confirmar cuenta</a>
                <p>ingresa token: <b>${user.token}</b></p>
            `
        })

        console.log('mensaje enviado', email.messageId)
    }

    static sendPasswordResetToken = async (user: EmailType) => {
        const email = await transport.sendMail({
            from: 'Cineclic <admin@cineclic.com>',
            to: user.email,
            subject: 'Cineclic - RESTABLECE TU PASSWORD',
            html: `
                <p>hola: ${user.name}, has solicitado restablecer tu password en cineclic </p>
                <p>Visita el siguiente enlace:</p>
                <a href="#">REESTABLECER PASSWORD</a>
                <p>ingresa token: <b>${user.token}</b></p>
            `
        })

        console.log('mensaje enviado', email.messageId)
    }

}