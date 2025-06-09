import { Request, Response } from "express";
import Booking from "../models/Booking";
import User from "../models/User";
import Screening from "../models/Screening";
import Movie from "../models/Movie";
import Room from "../models/Room";
import { BookingEmail } from "../emails/BookingEmails"; 

/**
 * funcion para generar un folio con el formato XXXX-XXXX
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
   *  crea una nueva reserva y envia correo de confirmacion
   */
  static async createBooking(req: Request, res: Response): Promise<void> {
    try {
      const { screeningId, seats } = req.body;
      const userId = req.user?.id || req.body.userId;

      if (!userId || !screeningId || !seats || !Array.isArray(seats) || seats.length === 0) {
        res.status(400).json({ error: "Faltan datos obligatorios: userId, screeningId o seats." });
        return;
      }

      // obtiene datos adicionales
      
      const user = await User.findByPk(userId);
      
      const screening = await Screening.findByPk(screeningId, {raw: true});

      //bloquea reservas para funciones pasadas
      if(!screening || new Date(screening.startTime) < new Date()) {
        res.status(400).json({ error: "La proyección no existe o ya ha comenzado" });
        return;
      }
      
      const movie = await Movie.findByPk(screening?.movieId);

      const room = await Room.findByPk(screening?.roomId);

      if (!user || !screening || !movie || !room) {
      res.status(500).json({ error: "Error al obtener datos adicionales." });
      return;
      }
        console.log("Estructura de layout:", JSON.stringify(room.layout.seats, null, 2));

       // valida disponibilidad 
      const layout = room.layout as any;
      for(const { row, column } of seats) {
        if (!layout.seats[row]?.[column] || layout.seats[row][column] === "occupied" || layout.seats[row][column] === "selected") {
          res.status(400).json({ error: `El asiento ${row}${column} no existe` });
          return;
        }
      }

      if (seats.length > 5) {
        res.status(400).json({ error: "No puedes reservar más de 5 asientos a la vez." });
        return;
      }

       // genera folio y fecha de reserva
      const folio = generateFolio();
      const bookingDate = new Date();

      // crea la reserva
      const booking = await Booking.create({
        folio,
        bookingDate,
        status: "ACTIVA",
        seats,
        userId,
        screeningId,
      });


      // actualiza el layout de la sala
      seats.forEach(({ row, column }) => { 
          layout.seats[row][column] = "selected";
      });

      await Room.update({ layout }, { where: { id: room.id } });

      // calcula precio total
      const totalPrice = parseFloat(screening.price.toString()) * seats.length;

      // **Envia correo de confirmación**
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
   *  cancela una reserva y libera asientos
   */
static async cancelBooking(req: Request, res: Response): Promise<void> {
  try {
    const { bookingId } = req.params;
    const { confirm } = req.body;
    const userId = req.user?.id;

    // validaciones 
    if (!userId) res.status(401).json({ error: "Usuario no autenticado." });
    if (!bookingId) res.status(400).json({ error: "ID de reserva requerido." });
    if (!confirm) res.status(400).json({ error: "Confirmación requerida." });

    // busca reserva 
    const booking = await Booking.findOne({
      where: { id: bookingId, userId },
      include: [{
        model: Screening,
        include: [Room]
      }]
    });

    if (!booking) res.status(404).json({ error: "Reserva no encontrada." });
    if (booking.status === "CANCELADA") {
      res.status(400).json({ error: "La reserva ya está cancelada." });
      return;
    }

    // obtiene datos 
    const screening = booking.screening;
    const room = screening?.room;
    
    if (!room) {
      res.status(500).json({ error: "Datos de sala no disponibles." });
    }

    // libera asientos 
    const layout = room.layout as any;
    let seatsUpdated = false;

    booking.seats.forEach(({ row, column }) => {
      if (layout.seats?.[row]?.[column] === "selected") {
        layout.seats[row][column] = "available";
        seatsUpdated = true;
      }
    });

    // actualiza solo si hubo cambios
    if (seatsUpdated) {
      await Room.update({ layout }, { where: { id: room.id } });
    }

    // actualiza estado de  reserva
    await booking.update({ status: "CANCELADA" });

    // envia correo en segundo plano
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

    // resp al frontend
    res.status(200).json({ 
      message: "Reserva cancelada y asientos liberados.",
      bookingId: booking.id,
      newStatus: "CANCELADA"
    });

  } catch (error) {
    console.error("Error en cancelBooking:", error);
    res.status(500).json({ error: "Error al cancelar la reserva." });
  }
}

  /**
   *  obtiene una reserva por folio
   */
  static async getBookingByFolio(req: Request, res: Response): Promise<void> {
    try {
      const { folio } = req.params;

      if (!folio) {
        res.status(400).json({ error: "Folio es requerido." });
        return;
      }

      const booking = await Booking.findOne({ where: { folio, userId: req.user.id },
        include: [
          {
            model: Screening,
            include: [ Movie, Room]
          }
        ],
      });
     
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
   *  pbtiene todas las reservas de un usuario
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
          include: [Movie, Room] 
        }
      ]
    });

    res.status(200).json({ bookings });

  } catch (error) {
    console.error("Error en getUserBookings:", error);
    res.status(500).json({ error: "Error al obtener reservas del usuario." });
  }
}

}
