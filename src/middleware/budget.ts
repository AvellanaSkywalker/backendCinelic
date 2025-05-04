import type { Request, Response, NextFunction } from 'express'
import { param, validationResult, body } from 'express-validator'
import Budget from '../models/Budget'

declare global{
    namespace Express {
        interface Request{
            budget?: Budget
        }
    }
}

export const validateBudgetId = async (req: Request, res: Response, next: NextFunction) => {

    await param('budgetid')
            .isInt().withMessage('ID no valido')
            .custom(value => value > 0 ).withMessage('ID NO VALIDO')
            .run(req)
        

    let errors = validationResult(req)
    if (!errors.isEmpty()) {
         res.status(400).json({ errors: errors.array() })
         return
    }
    next()

}

export const validateBudgetExist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { budgetid } = req.params
        const budget = await Budget.findByPk(budgetid)
        
        if(!budget){
            const error = new Error('Presupuesto no encontrado')
            res.status(404).json({error: error.message})
            return
        }
        req.budget = budget

        next()
    } catch (error) {
        //console.log(error)
        res.status(500).json({error: 'HUBO ERROR'})
    }

}

export const validateBudgetInput = async (req: Request, res: Response, next: NextFunction) => {

        await body('name')
            .notEmpty().withMessage('el nombre no puede ir vacio').run(req)

        await body('amount')
            .notEmpty().withMessage('la cantidad no puede ir vacio')
            .isNumeric().withMessage('la cantidad deben ser numeros')
            .custom(value => value > 0 ).withMessage('presupuesto mayor a 0').run(req)
    

        next()
}

export function hasAccess(req: Request, res: Response, next: NextFunction){

    if(req.budget.userId !== req.body.id){
        const error = new Error('accion no valida')
        res.status(401).json({error: error.message})
    }


    next()
}