import type {Request, Response} from 'express'
import Budget from '../models/Budget'
import Expense from '../models/Expense'

export class BudgetContoller{
    static getAll = async (req: Request, res: Response) => {
        try {
            const budgets = await Budget.findAll({
                order:[
                    ['createdAt', 'DESC']
                ],
                where:{
                    userId: req.user.id
                }
            })

            res.json(budgets)
        } catch (error) {
            //console.log(error)
            res.status(500).json({error: 'HUBO ERROR'})
        }
    }

    static create = async (req: Request, res: Response) => {
        try {
            const budget = await Budget.create(req.body)
            budget.userId = req.user.id
            await budget.save()
            res.status(201).json('presupuesto creado correctamente')
        } catch (error) {
            //console.log(error)
            res.status(500).json({error: 'HUBO ERROR'})
        }
    }

    static getById = async (req: Request, res: Response) => {
        const budget = await Budget.findByPk(req.budget.id, {
                include:[Expense]
        })
        
        res.json(budget)
    }

    static updateById = async (req: Request, res: Response) => {
        await req.budget.update(req.body)
        res.json('presupuesto actualizado')

    }

    static deleteById = async (req: Request, res: Response) => {
        await req.budget.destroy()
        res.json('presupuesto eliminado')
    
    }

}

