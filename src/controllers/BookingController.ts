import { Request, Response } from "express";
import Booking from "../models/Booking";
import User from "../models/User";
import Screening from "../models/Screening";
import Movie from "../models/Movie";
import Room from "../models/Room";
import { BookingEmail } from "../emails/BookingEmails"; // Archivo con funciones de envío de correo

/**
 * Función auxiliar para generar un folio único con el formato "XXXX-XXXX".
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
   *  Crea una nueva reserva y envía correo de confirmación.
   */
  static async createBooking(req: Request, res: Response): Promise<void> {
    try {
      const { screeningId, seats } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId || !screeningId || !seats || !Array.isArray(seats) || seats.length === 0) {
        res.status(400).json({ error: "Faltan datos obligatorios: userId, screeningId o seats." });
        return;
      }

      // Obtener datos adicionales
      
      const user = await User.findByPk(userId);
      
      const screening = await Screening.findByPk(screeningId, {raw: true});
      
      const movie = await Movie.findByPk(screening?.movieId);

      const room = await Room.findByPk(screening?.roomId);

      if (!user || !screening || !movie || !room) {
      res.status(500).json({ error: "Error al obtener datos adicionales." });
      return;
      }
        console.log("Estructura de layout:", JSON.stringify(room.layout.seats, null, 2));

       // valida disponibilidad de
      const layout = room.layout as any;
      for(const { row, column } of seats) {
        if (!layout.seats || !layout.seats[row] || !layout.seats[row][column]) {
          res.status(400).json({ error: `El asiento ${row}${column} no existe` });
          return;
        }
        
        if(layout.seats[row][column] === "occupied" || layout.seats[row][column] === "selected") {
          res.status(400).json({ error: `El asiento ${row}${column} ya está ocupado` });
          return;
        } 
      }

       // Generar folio y fecha de reserva
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
      });

      // Actualizar el layout de la sala
      seats.forEach(({ row, column }) => { 
          layout.seats[row][column] = "selected";
      });

      await Room.update({ layout }, { where: { id: room.id } });

      // Calcular precio total
      const totalPrice = parseFloat(screening.price.toString()) * seats.length;

      // **Enviar correo de confirmación**
      await BookingEmail.sendBookingConfirmation({
        user: { name: user.name, email: user.email },
        movie: {
          title: movie.title,
          date: screening.startTime?.toLocaleDateString() || "",
          time: screening.startTime?.toLocaleTimeString() || "",
          room: room.name,
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
   *  Cancela una reserva y libera los asientos.
   */
  static async cancelBooking(req: Request, res: Response): Promise<void> {
    try {
      const { bookingId } = req.params;
      const { confirm} = req.body;

      if (!bookingId) {
        res.status(400).json({ error: "ID de reserva es requerido." });
        return;
      }

      //busca reserva por id
      const booking = await Booking.findByPk(bookingId);
      if (!booking) {
        res.status(404).json({ error: "Reserva no encontrada." });
        return;
      }
      

      //pide confirmacion
      if (!confirm) {
        res.status(200).json({ 
          message: 'desea cancelar la reserva?',
          options: {confirm: true, cancel: false}});
        return;
      }
      //obtiene la sala y la proyeccion


      const screening = await Screening.findByPk(booking.screeningId);
      console.log("Screening encontrado:", screening);
      console.log("Room ID obtenido:", screening?.roomId);
      const room = await Room.findByPk(screening?.roomId);

      if (!room) {
        res.status(500).json({ error: "Error al obtener datos de la sala." });
        return;
      }

      // Verificar la estructura de `seats` antes de iterar
      if (!Array.isArray(booking.seats)) {
        res.status(500).json({ error: "Formato de asientos incorrecto." });
        return;
      }

      // Liberar los asientos seleccionados
      const layout = room.layout as any;
      console.log("Estructura de layout.seats:", JSON.stringify(layout.seats, null, 2));
      console.log("Intentando liberar asientos:", booking.seats);

      booking.seats.forEach(({ row, column }) => {
        if(!layout.seats[row] || !layout.seats[row][column]) {
          console.warn(`Asiento ${row}${column} no encontrado en el layout.`);
          return;
        }
        if (layout.seats[row][column] === "selected") {
          layout.seats[row][column] = "available";
        }
      });

      await Room.update({ layout }, { where: { id: room.id } });
      console.log("Layout actualizado:", JSON.stringify(layout, null, 2));

      // Cambiar el estado de la reserva a "CANCELADA"
      await booking.update({ status: "CANCELADA"}); 

      //posiblemente eliminar este bloque
      const user = await User.findByPk(booking.userId);
      if (!user) {
       res.status(500).json({ error: "Usuario no encontrado para la reserva." });
       return;
      }


      // **Enviar correo de cancelación**
      await BookingEmail.sendBookingCancellation({
        user: { name: user.name, email: user.email },
        folio: booking.folio,
        message: "Tu reserva ha sido cancelada y los asientos han sido liberados."
      });

      res.status(200).json({ message: "Reserva cancelada y asientos liberados." });

    } catch (error) {
      console.error("Error en cancelBooking:", error);
      res.status(500).json({ error: "Error al cancelar la reserva." });
    }
  }

  /**
   *  Obtiene una reserva por folio.
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

      res.status(200).json({ booking, cancelable: booking.status === "ACTIVA" });

    } catch (error) {
      console.error("Error en getBookingByFolio:", error);
      res.status(500).json({ error: "Error al obtener la reserva." });
    }
  }

  /**
   *  Obtiene todas las reservas de un usuario.
   */
  static async getUserBookings(req: Request, res: Response): Promise<void> {
    try {
      const userId = req.user?.id;

      if (!userId) {
      res.status(401).json({ error: "Usuario no autenticado." });
      return;
      }

      // Obtener todas las reservas del usuario
      const bookings = await Booking.findAll({ where: { userId }, order: [["createdAt", "DESC"]] });

      res.status(200).json({ bookings });

    }catch (error) {
      console.error("Error en getUserBookings:", error);
      res.status(500).json({ error: "Error al obtener reservas del usuario." });
    }
  }

}
