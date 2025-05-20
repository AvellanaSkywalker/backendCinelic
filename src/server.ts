import express from 'express' 
import colors from 'colors'
import morgan from 'morgan'
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";

import { db } from './config/db'
import authRouter from './routes/authRouter'
import roomRouter from './routes/roomRouter'
import bookingRouter from './routes/bookingRouter'
import movieRouter from './routes/movieRouter'
import screeningRouter from './routes/screeningRouter';
import cron from 'node-cron';
import {Op} from 'sequelize';
import Booking from './models/Booking'
import Screening from './models/Screening'

async function connectDB() {
    try{
        await db.authenticate()
        await db.sync({alter: true})
        console.log(colors.blue.bold('conexion exitosa a DB'))
        
    }catch (error){
        console.log(colors.red.bold('conexion fallida a DB'))
        console.error(error)
    }
    
}

connectDB()
const app = express()

app.use(morgan('dev'))
app.use(express.json())

app.use('/api/auth', authRouter)

app.use('/api/rooms', roomRouter);

app.use('/api/bookings', bookingRouter);

app.use('/api/movies', movieRouter);

app.use('/api/screening', screeningRouter);

const httpServer = createServer(app);

cron.schedule('*/15 * * * *', async () => {
  console.log("Revisando reservas sin pago antes de la función...");

  const now = new Date();
  const limitTime = new Date(now.getTime() + 20 * 60 * 1000); // 20 minutos en el futuro

  const updatedCount = await Booking.update(
    { status: "CANCELADA" },
    {
      where: {
        status: "ACTIVA",
        screeningId: {
          [Op.in]: (
            await Screening.findAll({
              attributes: ["id"],
              where: { startTime: { [Op.lt]: limitTime } },
            })
          ).map(s => s.id)
        }
      }
    }
  );

  console.log(`Reservas canceladas automáticamente: ${updatedCount}`);

  const canceledBookings = await Booking.findAll({ where: { status: "CANCELADA" } });
  console.log("Reservas afectadas:", canceledBookings.map(b => b.id));
});

// Socket.io al servidor 
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*' // configura los origenes permitidos 
  }
});

io.on('connection', (socket) => {
  console.log(colors.green(`Cliente conectado: ${socket.id}`));

  // evento cuando un usuario selecciona un asiento
  socket.on('seat:select', (data) => {
    // data puede ser un objeto { screeningId, seat, userId }
    console.log(`Asiento ${data.seat} seleccionado para el screening ${data.screeningId}`, data);
    // se notifica a todos los demas clientes que este asiento esta en "proceso" de seleccion
    socket.broadcast.emit(`seat:update:${data.screeningId}`, {
      seat: data.seat,
      state: 'in_process'
    });
  });

  // evento cuando un usuario deselecciona un asiento
  socket.on('seat:deselect', (data) => {
    console.log(`Asiento ${data.seat} deseleccionado para el screening ${data.screeningId}`, data);
    socket.broadcast.emit(`seat:update:${data.screeningId}`, {
      seat: data.seat,
      state: 'available'
    });
  });

  
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
    console.log(colors.blue.bold(`Servidor corriendo en http://localhost:${PORT}`));
    });
});

export default app