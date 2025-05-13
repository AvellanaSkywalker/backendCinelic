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


async function connectDB() {
    try{
        await db.authenticate()
        await db.sync({force: true})
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

const httpServer = createServer(app);

// Integramos Socket.io al servidor HTTP
const io = new SocketIOServer(httpServer, {
  cors: {
    origin: '*' // Configura los orígenes permitidos según tu entorno
  }
});

io.on('connection', (socket) => {
  console.log(colors.green(`Cliente conectado: ${socket.id}`));

  // Evento cuando un usuario selecciona un asiento
  socket.on('seat:select', (data) => {
    // data puede ser un objeto { screeningId, seat, userId }
    console.log(`Asiento ${data.seat} seleccionado para el screening ${data.screeningId}`, data);
    // Se notifica a todos los demás clientes que este asiento está en "proceso" de selección
    socket.broadcast.emit(`seat:update:${data.screeningId}`, {
      seat: data.seat,
      state: 'in_process'
    });
  });

  // Evento cuando un usuario deselecciona un asiento
  socket.on('seat:deselect', (data) => {
    console.log(`Asiento ${data.seat} deseleccionado para el screening ${data.screeningId}`, data);
    socket.broadcast.emit(`seat:update:${data.screeningId}`, {
      seat: data.seat,
      state: 'available'
    });
  });

  // Puedes agregar otros eventos, como confirmación de selección o bloqueo de asientos, según lo necesites.
    const PORT = process.env.PORT || 3000;
    httpServer.listen(PORT, () => {
    console.log(colors.blue.bold(`Servidor corriendo en http://localhost:${PORT}`));
    });
});

export default app