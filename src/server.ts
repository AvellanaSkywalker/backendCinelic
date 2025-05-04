import express from 'express' 
import colors from 'colors'
import morgan from 'morgan'
import { db } from './config/db'
import budgetRouter from './routes/budgetRouter'
import authRouter from './routes/authRouter'


async function connectDB() {
    try{
        await db.authenticate()
        db.sync()
        console.log(colors.blue.bold('conexion exitosa a DB'))
        
    }catch (error){
        console.log(colors.red.bold('conexion fallida a DB'))
        //console.log(error)
    }
    
}

connectDB()
const app = express()

app.use(morgan('dev'))

app.use(express.json())

app.use('/api/budgets', budgetRouter)
app.use('/api/auth', authRouter)


export default app