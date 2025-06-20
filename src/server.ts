import express from 'express';
import colors from 'colors';
import morgan from 'morgan';
import { createServer } from "http";
import { Server as SocketIOServer } from "socket.io";
import { cleanUnverifiedUsers } from '../src/middleware/unverifiedUserCleanup';
import { db } from './config/db';
import authRouter from './routes/authRouter';
import roomRouter from './routes/roomRouter';
import bookingRouter from './routes/bookingRouter';
import movieRouter from './routes/movieRouter';
import screeningRouter from './routes/screeningRouter';
import cron from 'node-cron';
import { Op } from 'sequelize';
import Booking from './models/Booking';
import Screening from './models/Screening';
import Room from './models/Room';
import cors from 'cors';

// Conexión a la base de datos
async function connectDB() {
    try {
        await db.authenticate();
        await db.sync({ alter: true });
        console.log(colors.blue.bold('Conexión exitosa a DB'));
    } catch (error) {
        console.log(colors.red.bold('Conexión fallida a DB'));
        console.error(error);
    }
}

connectDB();

const app = express();

// Middlewares
app.use(morgan('dev'));
app.use(express.json());
app.use(cors({ origin: "http://localhost:3000" }));

// Rutas
app.use('/api/auth', authRouter);
app.use('/api/rooms', roomRouter);
app.use('/api/bookings', bookingRouter);
app.use('/api/movies', movieRouter);
app.use('/api/screening', screeningRouter);

// Servidor HTTP
const httpServer = createServer(app);

// Tareas programadas
cron.schedule('*/15 * * * *', async () => {
    console.log("Revisando reservas sin pago antes de la función...");

    const now = new Date();
    const limitTime = new Date(now.getTime() + 20 * 60 * 1000); // 20 minutos

    // Obtener reservas activas para funciones que empiezan pronto
    const activeBookings = await Booking.findAll({
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
        },
        include: [{
            model: Screening,
            include: [Room]
        }]
    });

    // Cancelar reservas y liberar asientos
    for (const booking of activeBookings) {
        if (booking.screening && booking.screening.room) {
            const room = booking.screening.room;
            const layout = JSON.parse(JSON.stringify(room.layout));

            // Liberar asientos
            booking.seats.forEach(({ row, column }) => {
                if (layout.seats?.[row]?.[column]?.state === "selected") {
                    layout.seats[row][column] = "available";
                }
            });

            // Actualizar sala
            await Room.update({ layout }, { where: { id: room.id } });

            // Notificar a los clientes
            booking.seats.forEach(seat => {
                io.emit(`seat:update:${booking.screeningId}`, {
                    seat: { row: seat.row, column: seat.column },
                    state: "available"
                });
            });
        }

        // Actualizar estado de la reserva
        await booking.update({ status: "CANCELADA" });
    }

    console.log(`Reservas canceladas automáticamente: ${activeBookings.length}`);
});

// Limpieza de usuarios no verificados
cron.schedule("0 0 * * *", async () => {
    console.log("Iniciando limpieza de usuarios no verificados...");
    await cleanUnverifiedUsers();
});

// Configuración de Socket.IO
const io = new SocketIOServer(httpServer, {
    cors: {
        origin: 'http://localhost:3000',
        methods: ['GET', 'POST'],
        credentials: true
    }
});

const seatTimers = new Map();

// Helper para configurar temporizador de asiento
function setupSeatTimer(seatKey: string, screeningId: string, seat: any, roomId: string) {
    clearSeatTimer(seatKey);

    const timeout = setTimeout(async () => {
        try {
            const room = await Room.findByPk(roomId);
            if (!room) return;

            const layout = JSON.parse(JSON.stringify(room.layout));

            if (layout.seats[seat.row]?.[seat.column]?.state === "selected") {
                layout.seats[seat.row][seat.column] = "available";
                await Room.update({ layout }, { where: { id: roomId } });

                io.emit(`seat:update:${screeningId}`, {
                    seat,
                    state: "available"
                });

                console.log(`Asiento ${seat.row}${seat.column} liberado automáticamente.`);
            }
        } catch (error) {
            console.error("Error en temporizador de asiento:", error);
        } finally {
            seatTimers.delete(seatKey);
        }
    }, 300000); // 5 minutos

    seatTimers.set(seatKey, timeout);
}

// Helper para limpiar temporizador
function clearSeatTimer(seatKey: string) {
    if (seatTimers.has(seatKey)) {
        clearTimeout(seatTimers.get(seatKey));
        seatTimers.delete(seatKey);
    }
}

// Eventos de Socket.IO
io.on('connection', (socket) => {
    console.log(colors.green(`Cliente conectado: ${socket.id}`));

    // Evento para seleccionar asiento
    socket.on('seat:select', async (data) => {
        const { screeningId, seat } = data;
        
        try {
            // Obtener screening y sala relacionada
            const screening = await Screening.findByPk(screeningId, {
                include: [{ model: Room }]
            });
            
            if (!screening || !screening.room) {
                console.error(`Sala no encontrada para screening: ${screeningId}`);
                return;
            }
            
            const room = screening.room;
            const layout = JSON.parse(JSON.stringify(room.layout));
            
            // Verificar disponibilidad del asiento
            if (layout.seats[seat.row]?.[seat.column] === "available") {
                // Marcar como seleccionado
                layout.seats[seat.row][seat.column] = {
                    state: "selected",
                    timestamp: new Date(),
                    userId: socket.id
                };
                
                // Actualizar sala en la base de datos
                await Room.update({ layout }, { where: { id: room.id } });
                
                // Notificar a todos los clientes
                io.emit(`seat:update:${screeningId}`, {
                    seat,
                    state: "selected"
                });
                
                // Configurar temporizador para liberación automática
                const seatKey = `${screeningId}-${seat.row}-${seat.column}-${socket.id}`;
                setupSeatTimer(seatKey, screeningId, seat, room.id);
            }
        } catch (error) {
            console.error("Error en seat:select:", error);
        }
    });

    // Evento para deseleccionar asiento
    socket.on('seat:deselect', async (data) => {
        const { screeningId, seat } = data;
        
        try {
            const screening = await Screening.findByPk(screeningId, {
                include: [{ model: Room }]
            });
            
            if (!screening || !screening.room) return;
            
            const room = screening.room;
            const layout = JSON.parse(JSON.stringify(room.layout));
            
            // Verificar si el asiento fue seleccionado por este usuario
            if (
                layout.seats[seat.row]?.[seat.column]?.state === "selected" &&
                layout.seats[seat.row][seat.column].userId === socket.id
            ) {
                // Liberar asiento
                layout.seats[seat.row][seat.column] = "available";
                
                await Room.update({ layout }, { where: { id: room.id } });
                
                // Notificar a todos los clientes
                io.emit(`seat:update:${screeningId}`, {
                    seat,
                    state: "available"
                });
                
                // Limpiar temporizador
                const seatKey = `${screeningId}-${seat.row}-${seat.column}-${socket.id}`;
                clearSeatTimer(seatKey);
            }
        } catch (error) {
            console.error("Error en seat:deselect:", error);
        }
    });

    // Liberar recursos al desconectar
    socket.on('disconnect', () => {
        // Limpiar todos los temporizadores asociados a este socket
        for (const [key] of seatTimers.entries()) {
            if (key.includes(socket.id)) {
                clearSeatTimer(key);
            }
        }
        console.log(colors.yellow(`Cliente desconectado: ${socket.id}`));
    });
});

// Iniciar servidor
const PORT = process.env.PORT || 4000;
httpServer.listen(PORT, () => {
    console.log(colors.blue.bold(`Servidor corriendo en http://localhost:${PORT}`));
});

export default app;