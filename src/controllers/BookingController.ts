import { Request, Response } from "express";
import Booking from "../models/Booking";
import User from "../models/User";
import Screening from "../models/Screening";
import Movie from "../models/Movie";
import Room from "../models/Room";
import { BookingEmail } from "../emails/BookingEmails";
import { Op } from "sequelize";

/**
 * Función para generar un folio con el formato XXXX-XXXX
 */
const generateFolio = (): string => {
  const digits = "0123456789";
  let part1 = "", part2 = "";
  for (let i = 0; i < 4; i++) {
    part1 += digits.charAt(Math.floor(Math.random() * digits.length));
    part2 += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return `${part1}-${part2}`;
};

export class BookingController {
  /**
   * Crea una nueva reserva y envía correo de confirmación
   */
  static async createBooking(req: Request, res: Response): Promise<void> {
    try {
      const { screeningId, seats } = req.body;
      const userId = req.user?.id || req.body.userId;

      // Validaciones básicas
      if (!userId || !screeningId || !seats || !Array.isArray(seats) || seats.length === 0) {
        res.status(400).json({ error: "Faltan datos obligatorios: userId, screeningId o seats." });
        return;
      }

      // Obtener datos adicionales necesarios
      const [user, screening, room] = await Promise.all([
        User.findByPk(userId),
        Screening.findByPk(screeningId, { raw: true }),
        Screening.findByPk(screeningId, { include: [Room] }).then(s => s?.room)
      ]);

      // Validar que existan todos los datos necesarios
      if (!user || !screening || !room) {
        res.status(400).json({ error: "No se pudo obtener información necesaria para la reserva." });
        return;
      }

      // Bloquear reservas para funciones pasadas
      if (new Date(screening.startTime) < new Date()) {
        res.status(400).json({ error: "La proyección no existe o ya ha comenzado" });
        return;
      }

      // Validar límite de asientos
      if (seats.length > 5) {
        res.status(400).json({ error: "No puedes reservar más de 5 asientos a la vez." });
        return;
      }

      // Validar disponibilidad de asientos
      const layout = JSON.parse(JSON.stringify(room.layout));
      const invalidSeats = seats.filter(({ row, column }) => {
        return !layout.seats[row]?.[column] || 
               layout.seats[row][column] === "occupied" || 
               layout.seats[row][column] === "selected";
      });

      if (invalidSeats.length > 0) {
        res.status(400).json({ 
          error: `Los siguientes asientos no están disponibles: ${invalidSeats.map(s => `${s.row}${s.column}`).join(', ')}`
        });
        return;
      }

      // Crear la reserva en una transacción para asegurar consistencia
      const transaction = await Booking.sequelize?.transaction();
      
      try {
        // Generar folio y fecha
        const folio = generateFolio();
        const bookingDate = new Date();

        // Crear la reserva
        const booking = await Booking.create({
          folio,
          bookingDate,
          status: "ACTIVA",
          seats,
          userId,
          screeningId,
        }, { transaction });

        // Actualizar el layout de la sala
        seats.forEach(({ row, column }) => { 
          layout.seats[row][column] = "occupied"; // Cambiado a "occupied" para reservas confirmadas
        });

        await Room.update({ layout }, { 
          where: { id: room.id },
          transaction
        });

        // Commit de la transacción
        await transaction?.commit();

        // Calcular precio total
        const totalPrice = parseFloat(screening.price.toString()) * seats.length;

        // Obtener datos de la película para el correo
        const movie = await Movie.findByPk(screening.movieId);
        if (!movie) throw new Error("Película no encontrada");

        // Enviar correo de confirmación (en segundo plano)
        BookingEmail.sendBookingConfirmation({
          user: { name: user.name, email: user.email },
          movie: {
            title: movie.title,
            date: new Date(screening.startTime).toLocaleDateString(),
            time: new Date(screening.startTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            room: room.name,
          },
          seats,
          totalPrice,
          folio: booking.folio,
          message: "Tienes un límite de 20 minutos para completar el pago."
        }).catch(error => console.error("Error enviando correo:", error));

        res.status(201).json({ 
          message: "Reserva creada exitosamente. Se ha enviado el correo de confirmación.", 
          booking 
        });

      } catch (error) {
        await transaction?.rollback();
        throw error;
      }

    } catch (error) {
      console.error("Error en createBooking:", error);
      res.status(500).json({ error: "Error al crear la reserva." });
    }
  }

  /**
   * Cancela una reserva y libera asientos
   */
  static async cancelBooking(req: Request, res: Response): Promise<void> {
    const transaction = await Booking.sequelize?.transaction();
    
    try {
      const { bookingId } = req.params;
      const { confirm } = req.body;
      const userId = req.user?.id;

      // Validaciones 
      if (!userId) {
        await transaction?.rollback();
        res.status(401).json({ error: "Usuario no autenticado." });
        return;
      }
      if (!bookingId) {
        await transaction?.rollback();
        res.status(400).json({ error: "ID de reserva requerido." });
        return;
      }
      if (!confirm) {
        await transaction?.rollback();
        res.status(400).json({ error: "Confirmación requerida." });
        return;
      }

      // Buscar reserva con información relacionada
      const booking = await Booking.findOne({
        where: { id: bookingId, userId },
        include: [{
          model: Screening,
          include: [Room]
        }],
        transaction
      });

      if (!booking) {
        await transaction?.rollback();
        res.status(404).json({ error: "Reserva no encontrada." });
        return;
      }

      if (booking.status === "CANCELADA") {
        await transaction?.rollback();
        return;
      }

      // Obtener datos necesarios
      const room = booking.screening?.room;
      if (!room) {
        await transaction?.rollback();
        res.status(500).json({ error: "Datos de sala no disponibles." });
        return;
      }

      // Liberar asientos 
      const layout = JSON.parse(JSON.stringify(room.layout));
      let seatsUpdated = false;

      booking.seats.forEach(({ row, column }) => {
        if (layout.seats?.[row]?.[column] === "occupied") {
          layout.seats[row][column] = "available";
          seatsUpdated = true;
        }
      });

      // Actualizar solo si hubo cambios
      if (seatsUpdated) {
        await Room.update({ layout }, { 
          where: { id: room.id },
          transaction
        });
      }

      // Actualizar estado de la reserva
      await booking.update({ status: "CANCELADA" }, { transaction });

      // Commit de la transacción
      await transaction?.commit();

      // Enviar correo de cancelación (en segundo plano)
      try {
        const user = await User.findByPk(booking.userId);
        if (user) {
          BookingEmail.sendBookingCancellation({
            user: { name: user.name, email: user.email },
            folio: booking.folio,
            message: "Tu reserva ha sido cancelada y los asientos han sido liberados."
          }).catch(emailError => {
            console.error("Error enviando correo:", emailError);
          });
        }
      } catch (emailError) {
        console.error("Error obteniendo datos para correo:", emailError);
      }

      // Respuesta al frontend
      res.status(200).json({ 
        message: "Reserva cancelada y asientos liberados.",
        bookingId: booking.id,
        newStatus: "CANCELADA"
      });

    } catch (error) {
      await transaction?.rollback();
      console.error("Error en cancelBooking:", error);
      res.status(500).json({ error: "Error al cancelar la reserva." });
    }
  }

  /**
   * Obtiene una reserva por folio
   */
  static async getBookingByFolio(req: Request, res: Response): Promise<void> {
    try {
      const { folio } = req.params;
      const userId = req.user?.id;

      if (!folio) {
        res.status(400).json({ error: "Folio es requerido." });
        return;
      }

      if (!userId) {
        res.status(401).json({ error: "Usuario no autenticado." });
        return;
      }

      const booking = await Booking.findOne({ 
        where: { folio, userId },
        include: [
          {
            model: Screening,
            include: [Movie, Room]
          }
        ],
      });
     
      if (!booking) {
        res.status(404).json({ error: "Reserva no encontrada para el folio proporcionado." });
        return;
      }

      // Determinar si la reserva es cancelable
      const now = new Date();
      const screeningTime = booking.screening?.startTime ? new Date(booking.screening.startTime) : null;
      const isCancelable = booking.status === "ACTIVA" && 
                         screeningTime && 
                         screeningTime > new Date(now.getTime() + 30 * 60 * 1000); // 30 minutos antes

      res.status(200).json({ 
        booking, 
        cancelable: isCancelable 
      });

    } catch (error) {
      console.error("Error en getBookingByFolio:", error);
      res.status(500).json({ error: "Error al obtener la reserva." });
    }
  }

  /**
   * Obtiene todas las reservas de un usuario
   */
  static async getUserBookings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
        res.status(401).json({ error: "Usuario no autenticado." });
        return;
      }

      const bookings = await Booking.findAll({
        where: { userId },
        order: [["createdAt", "DESC"]],
        include: [
          {
            model: Screening,
            include: [Movie, Room],
            where: {
              startTime: { [Op.gte]: new Date() }
            },
            required: false
          }
        ]
      });

      // Marcar reservas cancelables
      const now = new Date();
      const bookingsWithStatus = bookings.map(booking => {
        const screeningTime = booking.screening?.startTime ? new Date(booking.screening.startTime) : null;
        const isCancelable = booking.status === "ACTIVA" && 
                           screeningTime && 
                           screeningTime > new Date(now.getTime() + 30 * 60 * 1000); // 30 minutos antes
        
        return {
          ...booking.toJSON(),
          cancelable: isCancelable
        };
      });

      res.status(200).json({ bookings: bookingsWithStatus });

    } catch (error) {
      console.error("Error en getUserBookings:", error);
      res.status(500).json({ error: "Error al obtener reservas del usuario." });
    }
  }
}