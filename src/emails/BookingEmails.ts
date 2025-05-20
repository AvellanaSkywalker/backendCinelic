import { transport } from "../config/nodemailer";

type BookingConfirmationEmailType = {
  user: { name: string; email: string };
  movie: { title: string; date: string | Date; time: string; room: string };
  seats: string[];
  totalPrice: number;
  folio: string;
  message: string;
};

type BookingCancellationEmailType = {
  user: { name: string; email: string };
  folio: string;
  message: string;
};

export class BookingEmail {
  /**
   * Envia el correo de confirmacion de reserva con lo siguiente
   *  datos del usuario
   *  detalles de la pelicula (titulo, fecha, hora y sala).
   *  asientos seleccionados
   *  precio total
   *  folio de reserva
   *  advertencia sobre el limite de 20 minutos para pagar
   */
  static async sendBookingConfirmation({
    user,
    movie,
    seats,
    totalPrice,
    folio,
    message
  }: BookingConfirmationEmailType) {
    await transport.sendMail({
      from: "CineClic <no-reply@cineclic.com>",
      to: user.email,
      subject: "Confirmación de Reserva - CineClic",
      html: `
        <h1>Hola ${user.name}, tu reserva ha sido confirmada</h1>
        <p>Detalles de tu reserva:</p>
        <ul>
          <li><strong>Película:</strong> ${movie.title}</li>
          <li><strong>Fecha:</strong> ${movie.date}</li>
          <li><strong>Horario:</strong> ${movie.time}</li>
          <li><strong>Sala:</strong> ${movie.room}</li>
          <li><strong>Asientos:</strong> ${seats.join(", ")}</li>
          <li><strong>Total:</strong> $${totalPrice}</li>
          <li><strong>Folio:</strong> ${folio}</li>
        </ul>
        <p>${message}</p>
      `
    });
    console.log(`Correo de confirmacion enviado a ${user.email}`);
  }

  /**
   * Envia el correo de cancelacion de reserva con lo siguiente
   *  nombre del usuario
   *  folio de la reserva
   *  mensaje de cancelacipn
   */
  static async sendBookingCancellation({
    user,
    folio,
    message
  }: BookingCancellationEmailType) {
    await transport.sendMail({
      from: "CineClic <no-reply@cineclic.com>",
      to: user.email,
      subject: "Cancelación de Reserva - CineClic",
      html: `
        <h1>Reserva Cancelada</h1>
        <p>Hola ${user.name},</p>
        <p>Tu reserva con folio <strong>${folio}</strong> ha sido cancelada.</p>
        <p>${message}</p>
        <p>Si tienes alguna duda, contáctanos.</p>
      `
    });
    console.log(`Correo de cancelacion enviado a ${user.email} para la reserva ${folio}`);
  }
}
