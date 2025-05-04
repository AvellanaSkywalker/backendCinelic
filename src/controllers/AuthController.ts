import type { Request, Response } from 'express'
import User from '../models/User'
import { checkPassword, hashPassword } from '../utils/auth'
import { generateToken } from '../utils/token'
import { AuthEmail } from '../emails/AuthEmail'
import { generateJWT } from '../utils/jwt'

export class AuthContoller{
    static createAccount = async (req: Request, res: Response): Promise<void> => {

        const { email, password } = req.body

        //prevenir duplicados
        const userExists = await User.findOne({where: {email}})
        if(userExists){
            res.status(409).json({error: "cuenta usuario ya existe"})
            return
        }
        
        try {
            const user = new User(req.body)
            user.password = await hashPassword(password)
            user.token = generateToken()
            await user.save()

            await AuthEmail.sendConfirmationEmail({
                name: user.name,
                email: user.email,
                token: user.token
            })

            res.json('cuenta creada')
        } catch (error) {
            //console.log(error)
            res.status(500).json({error: 'hubo un error'})
        }

    }

    static confirmAccount = async (req: Request, res: Response) => {
        const { token } = req.body
        
            const user = await User.findOne({where: {token}})
            if(!user) {
                const error = new Error('token no valido')
                res.status(401).json({error: error.message})
                return
            }
            user.confirmed = true
            user.token = null
            await user.save()

            res.json("cuenta confirmada")
    }

    static login = async (req: Request, res: Response) => {
        const { email, password} = req.body

        //revisa usuario existe
        const user = await User.findOne({where: {email}})
        if(!user){
            res.status(404).json({error: "cuenta usuario no encontrado"})
            return
        }

        if(!user.confirmed){
            res.status(403).json({error: "cuenta usuario no confirmada"})
            return
        }

        const isPasswordCorrect = await checkPassword(password, user.password)
        if(!isPasswordCorrect){
            res.status(401).json({error: "password incorrecto"})
            return
        }

        const token = generateJWT(user.id)

        res.json(token)
    }


    static forgotPassword = async (req: Request, res: Response) => {
        const { email } = req.body

        //revisa usuario existe
        const user = await User.findOne({where: {email}})
        if(!user){
            res.status(404).json({error: "cuenta usuario no encontrado"})
            return
        }

        user.token = generateToken()
        await user.save()

        await AuthEmail.sendPasswordResetToken({
            name: user.name,
            email: user.email,
            token: user.token
        })

        res.json('REVISA TU EMAIL PARA CONTINUAR')

    }


    static validateToken = async (req: Request, res: Response) => {
        const { token } = req.body

        const tokenExists = await User.findOne({where: {token}})
        if(!tokenExists){
            const error = new Error('token no valido')
            res.status(404).json({error: error.message})
            return
        }

        res.json("token valido")
    }


    static resetPasswordWithToken = async (req: Request, res: Response) => {
        const { token } = req.params
        const { password } = req.body
        const user = await User.findOne({where: {token}})
        if(!user){
            const error = new Error('token no valido')
            res.status(404).json({error: error.message})
            return
        }

        //asigna nuevo password
        user.password = await hashPassword(password)
        user.token = null
        await user.save()

        res.json('EL PASSWORD SE MODIFICO')
    }

    static user = async (req: Request, res: Response) => {
        res.json(req.user)

    }


}