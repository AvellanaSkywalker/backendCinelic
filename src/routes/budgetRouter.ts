import { Router } from "express"
import { body, param } from 'express-validator';
import { BudgetContoller } from '../controllers/BudgetController';
import { handleInputErrors } from "../middleware/validation";
import { hasAccess, validateBudgetExist, validateBudgetId, validateBudgetInput } from "../middleware/budget";
import { ExpensesController } from "../controllers/ExpenseController";
import { validateExpenseExist, validateExpenseId, validateExpenseInput } from "../middleware/expense";
import { authenticate } from "../middleware/auth";



const router = Router()

router.use(authenticate) //es el que genera req.user 

router.param('budgetid', validateBudgetId)
router.param('budgetid', validateBudgetExist) //genera req.budget
router.param('budgetId', hasAccess) 

router.param('expenseId', validateExpenseId)
router.param('expenseId', validateExpenseExist)

router.get('/', BudgetContoller.getAll)


router.post('/', 

    validateBudgetInput,
    handleInputErrors,
    BudgetContoller.create
)

router.get('/:budgetid', BudgetContoller.getById)

router.put('/:budgetid', 
    validateBudgetInput,
    handleInputErrors,
    BudgetContoller.updateById
)

router.delete('/:budgetid', BudgetContoller.deleteById)

/*Routes para expenses */


router.post('/:budgetid/expenses', 
    validateExpenseInput,
    handleInputErrors,
    ExpensesController.create
)
router.get('/:budgetid/expenses/:expenseId', ExpensesController.getById)
router.put('/:budgetid/expenses/:expenseId', 
    validateExpenseInput,
    handleInputErrors,
    ExpensesController.updateById
)
router.delete('/:budgetid/expenses/:expenseId', ExpensesController.deleteById)

export default router