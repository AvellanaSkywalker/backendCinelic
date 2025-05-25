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
import Room from './models/Room';
import { timeStamp } from 'console';
import { stat } from 'fs';
import cors from 'cors';

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
app.use(cors({ origin: "http://localhost:3000" })); // Cambia esto según tu configuración de CORS

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

  const seatTimers = new Map();

  // evento cuando un usuario selecciona un asiento
  socket.on('seat:select', async (data) => {
    const { screeningId, seat, userId } = data;
    // data puede ser un objeto { screeningId, seat, userId }
    console.log(`Asiento ${data.seat} seleccionado para el screening ${data.screeningId}`, data);
    
    const room = await Room.findOne({
      where: { id: screeningId } });
    const layout = room.layout as any;
    layout.seats[seat.row][seat.column] = { state: "slected", timeStamp: new Date() };
    
    await room.update({ layout }, { where: { id: room.id } });
    // se notifica a todos los demas clientes que este asiento esta en "proceso" de seleccion
    socket.broadcast.emit(`seat:update:${data.screeningId}`, {
      seat, state: "selected"
    });

    if (seatTimers.has(`${screeningId}-${seat.row}-${seat.column}`)) {
      clearTimeout(seatTimers.get(`${screeningId}-${seat.row}-${seat.column}`));
    }

    const timeout = setTimeout(async () => {
      const now = new Date();
      const elapsedTime = (now.getTime() - new Date(layout.seats[seat.row][seat.column].timestamp).getTime()) / 1000; // tiempo en segundos
      
      if (elapsedTime >= 300 && layout.seats[seat.row][seat.column].state === "selected" ){
        layout.seats[seat.row][seat.column] = "available";
        await Room.update({ layout }, { where: { id: room.id } });

        io.emit(`seat:update:${screeningId}`, { seat, state: "available" });
        console.log(`Asiento ${seat.row}${seat.column} liberado automáticamente después de 5 minutos.`);
      }

      seatTimers.delete(`${screeningId}-${seat.row}-${seat.column}`);
    }, 300000); // 5 minutos en milisegundos

    seatTimers.set(`${screeningId}-${seat.row}-${seat.column}`, timeout);
  
    });

  // evento cuando un usuario deselecciona un asiento
  socket.on('seat:deselect', async (data) => {

    const { screeningId, seat } = data;
    console.log(`Asiento ${data.seat} deseleccionado para el screening ${data.screeningId}`, data);

    const room = await Room.findOne({
      where: { id: screeningId } });

    const layout = room.layout as any;
    layout.seats[seat.row][seat.column] = "available";

    await Room.update({ layout }, { where: { id: room.id } });

    socket.broadcast.emit(`seat:update:${data.screeningId}`, {
      seat, state: "available"
    });

    if(seatTimers.has(`${screeningId}-${seat.row}-${seat.column}`)) {
      clearTimeout(seatTimers.get(`${screeningId}-${seat.row}-${seat.column}`));
      seatTimers.delete(`${screeningId}-${seat.row}-${seat.column}`);
    }
  });

  
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
    console.log(colors.blue.bold(`Servidor corriendo en http://localhost:${PORT}`));
    });
});

export default app