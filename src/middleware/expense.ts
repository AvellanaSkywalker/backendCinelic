import type { Request, Response, NextFunction } from 'express'
import { param, validationResult, body } from 'express-validator'
import Expense from '../models/Expense'

declare global{
    namespace Express {
        interface Request{
            expense?: Expense
        }
    }
}


export const validateExpenseInput = async (req: Request, res: Response, next: NextFunction) => {

        await body('name')
            .notEmpty().withMessage('el nombre del gastp no puede ir vacio').run(req)

        await body('amount')
            .notEmpty().withMessage('la cantidad del gasto no puede ir vacio')
            .isNumeric().withMessage('la cantidad deben ser numeros')
            .custom(value => value > 0 ).withMessage('gastoo mayor a 0').run(req)
    

        next()
}

export const validateExpenseId = async (req: Request, res: Response, next: NextFunction) => {
        await param('expenseId').isInt().custom(value => value > 0 )
        .withMessage('ID no valido').run(req)

        let errors = validationResult(req)
        if (!errors.isEmpty()) {
             res.status(400).json({ errors: errors.array() })
             return
        }
        next()
}


export const validateExpenseExist = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { expenseId } = req.params
        const expense = await Expense.findByPk(expenseId)
        
        if(!expense){
            res.status(404).json({error: "GASTO NO ECNONTRADO"})
        }
        req.expense = expense

        next()
    } catch (error) {
        //console.log(error)
        res.status(500).json({error: 'HUBO ERROR'})
    }

}