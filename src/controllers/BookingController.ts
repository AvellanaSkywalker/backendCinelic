import { Request, Response } from "express";
import Booking from "../models/Booking";
import User from "../models/User";
import Screening from "../models/Screening";
import Movie from "../models/Movie";
import Room from "../models/Room";
import { BookingEmail } from "../emails/BookingEmails";

/**
 * Función auxiliar para generar un folio con el formato "XXXX-XXXX".
 */
const generateFolio = (): string => {
  const digits = "0123456789";
  let part1 = "";
  let part2 = "";
  for (let i = 0; i < 4; i++) {
    part1 += digits.charAt(Math.floor(Math.random() * digits.length));
    part2 += digits.charAt(Math.floor(Math.random() * digits.length));
  }
  return `${part1}-${part2}`;
};

export class BookingController {
  /**
   * Crea una nueva reserva.
   * Se requiere en el body: screeningId, seats (array de strings) y/o userId (puede venir desde req.user o req.body).
   */
  static async createBooking(req: Request, res: Response): Promise<void> {
    try {
      const { screeningId, seats } = req.body;
      // Se obtiene el userId desde req.user (si se usa autenticación) o desde el body directamente
      const userId = req.user?.id || req.body.userId;
      if (!userId || !screeningId || !seats || !Array.isArray(seats) || seats.length === 0) {
        res.status(400).json({ error: "Faltan datos obligatorios: userId, screeningId o seats." });
        return;
      }

      // Genera el folio y establece la fecha de reserva
      const folio = generateFolio();
      const bookingDate = new Date();

      // Crea la reserva en estado "ACTIVA"
      // Nota: Puedes optar por almacenar totalPrice en la reserva si así lo requiere tu modelo
      const booking = await Booking.create({
        folio,
        bookingDate,
        status: "ACTIVA",
        seats,
        userId,
        screeningId,
      });

      // Obtén datos adicionales: usuario y screening
      const user = await User.findByPk(userId);
      const screening = await Screening.findByPk(screeningId);
      if (!user || !screening) {
        res.status(500).json({ error: "Error al obtener datos adicionales para la reserva." });
        return;
      }

      // Obtén la información de la película y de la sala
      const movie = await Movie.findByPk(screening.movieId);
      const room = await Room.findByPk(screening.roomId);
      if (!movie || !room) {
        res.status(500).json({ error: "Error al obtener datos de la película o sala." });
        return;
      }

      // Calcula el precio total usando el precio definido en el screening
      const ticketPrice: number = parseFloat(screening.price.toString());
      const totalPrice = ticketPrice * seats.length;

      // Envía el correo de confirmación de reserva
      await BookingEmail.sendBookingConfirmation({
        user: { name: user.name, email: user.email },
        movie: {
          title: movie.title,
          date: screening.startTime ? new Date(screening.startTime).toLocaleDateString() : "No especificado",
          time: screening.startTime ? new Date(screening.startTime).toLocaleTimeString() : "No especificado",
          room: room.name || "No especificado"
        },
        seats,
        totalPrice,
        folio: booking.folio,
        message: "Tienes un límite de 20 minutos para completar el pago."
      });

      res.status(201).json({ message: "Reserva creada exitosamente. Se ha enviado el correo de confirmación.", booking });
    } catch (error) {
      console.error("Error en createBooking:", error);
      res.status(500).json({ error: "Error al crear la reserva." });
    }
  }

  /**
   * Obtiene todas las reservas asociadas a un usuario.
   * El userId se obtiene de req.user o de req.params.
   */
  static async getUserBookings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id || req.params.userId;
      if (!userId) {
        res.status(400).json({ error: "User ID no proporcionado." });
        return;
      }

      const bookings = await Booking.findAll({ where: { userId } });
      res.status(200).json({ bookings });
    } catch (error) {
      console.error("Error en getUserBookings:", error);
      res.status(500).json({ error: "Error al obtener reservas del usuario." });
    }
  }

  /**
   * Cancela una reserva actualizando su estado a "CANCELADA" y envía el correo de cancelación.
   * Se requiere el bookingId en los parámetros.
   */
  static async cancelBooking(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      if (!bookingId) {
        res.status(400).json({ error: "Booking ID requerido." });
        return;
      }

      const booking = await Booking.findByPk(bookingId);
      if (!booking) {
        res.status(404).json({ error: "Reserva no encontrada." });
        return;
      }

      // Actualiza el estado de la reserva a "CANCELADA"
      booking.status = "CANCELADA";
      await booking.save();

      // Envía el correo de cancelación
      const user = await User.findByPk(booking.userId);
      if (user) {
        await BookingEmail.sendBookingCancellation({
          user: { name: user.name, email: user.email },
          folio: booking.folio,
          message: "Tu reserva ha sido cancelada. Si tienes alguna duda, contáctanos."
        });
      }

      res.status(200).json({ message: "Reserva cancelada exitosamente.", booking });
    } catch (error) {
      console.error("Error en cancelBooking:", error);
      res.status(500).json({ error: "Error al cancelar la reserva." });
    }
  }

  /**
   * Obtiene una reserva en función del folio.
   * Se requiere que el folio se pase en los parámetros.
   */
  static async getBookingByFolio(req: Request, res: Response): Promise<void> {
    try {
      const { folio } = req.params;
      if (!folio) {
        res.status(400).json({ error: "Folio es requerido." });
        return;
      }

      const booking = await Booking.findOne({ where: { folio } });
      if (!booking) {
        res.status(404).json({ error: "Reserva no encontrada para el folio proporcionado." });
        return;
      }

      res.status(200).json({ booking });
    } catch (error) {
      console.error("Error en getBookingByFolio:", error);
      res.status(500).json({ error: "Error al obtener la reserva." });
    }
  }
}
