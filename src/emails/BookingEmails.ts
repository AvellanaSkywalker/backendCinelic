import sgMail from '@sendgrid/mail';

//  la API Key de SendGrid
if (!process.env.SENDGRID_API_KEY) {
    throw new Error("SENDGRID_API_KEY no está definido en las variables de entorno.");
}
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

type BookingConfirmationEmailType = {
  user: { name: string; email: string };
  movie: { title: string; date: string | Date; time: string; room: string };
  seats: Array<{ row: string | number; column: string | number}>;
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
   * Envia correo de confirmacion de reserva
   */
  static async sendBookingConfirmation({
    user,
    movie,
    seats,
    totalPrice,
    folio,
    message
  }: BookingConfirmationEmailType) {
    const formattedDate = typeof movie.date === 'string' 
      ? movie.date 
      : movie.date.toLocaleDateString('es-MX');

    const msg = {
      to: user.email,
      from: 'CineClic <cinceclic.official@gmail.com>', // email  en sendGrid
      subject: "Confirmación de Reserva - CineClic",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #1a237e;">Hola ${user.name}, tu reserva ha sido confirmada 🎉</h1>
          <div style="background-color: #f5f5f5; padding: 20px; border-radius: 8px;">
            <h2 style="color: #1a237e;">Detalles de tu reserva:</h2>
            <ul style="list-style: none; padding: 0;">
              <li style="margin-bottom: 10px;"><strong>🎬 Película:</strong> ${movie.title}</li>
              <li style="margin-bottom: 10px;"><strong>📅 Fecha:</strong> ${formattedDate}</li>
              <li style="margin-bottom: 10px;"><strong>⏰ Horario:</strong> ${movie.time}</li>
              <li style="margin-bottom: 10px;"><strong>📍 Sala:</strong> ${movie.room}</li>
              <li style="margin-bottom: 10px;"><strong>💺 Asientos:</strong> ${seats.map(seat => `${seat.row}${seat.column}`).join(", ")}</li>
              <li style="margin-bottom: 10px;"><strong>💰 Total:</strong> $${totalPrice.toFixed(2)} MXN</li>
              <li style="margin-bottom: 10px;"><strong>🔖 Folio:</strong> <code>${folio}</code></li>
            </ul>
          </div>
          <div style="margin-top: 20px; padding: 15px; background-color: #fff8e1; border-left: 4px solid #ffc107;">
            <p>${message}</p>
          </div>
          <p style="margin-top: 20px;">¡Gracias por elegir CineClic! Disfruta de tu película 🍿</p>
        </div>
      `
    };

    try {
      await sgMail.send(msg);
      console.log(` Correo de confirmación enviado a ${user.email}`);
    } catch (error) {
      console.error(' Error enviando email de confirmación:', error);
      throw new Error("Error al enviar el correo de confirmación");
    }
  }

  /**
   * envia correo de cancelacion de reserva
   */
  static async sendBookingCancellation({
    user,
    folio,
    message
  }: BookingCancellationEmailType) {
    const msg = {
      to: user.email,
      from: 'CineClic <cinceclic.official@gmail.com>',
      subject: "Cancelación de Reserva - CineClic",
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h1 style="color: #b71c1c;">Reserva Cancelada</h1>
          <p>Hola ${user.name},</p>
          
          <div style="background-color: #ffebee; padding: 20px; border-radius: 8px; border-left: 4px solid #d32f2f;">
            <p>Tu reserva con folio <strong><code>${folio}</code></strong> ha sido cancelada.</p>
            <p>${message}</p>
          </div>
          
          <p style="margin-top: 20px;">Si consideras que esto es un error o necesitas asistencia, por favor contáctanos respondiendo a este correo.</p>
          
          <div style="margin-top: 30px; padding-top: 15px; border-top: 1px solid #e0e0e0;">
            <p>Atentamente,<br>El equipo de CineClic</p>
          </div>
        </div>
      `
    };

    try {
      await sgMail.send(msg);
      console.log(` Correo de cancelación enviado a ${user.email} para la reserva ${folio}`);
    } catch (error) {
      console.error(' Error enviando email de cancelación:', error);
      throw new Error("Error al enviar el correo de cancelación");
    }
  }
}