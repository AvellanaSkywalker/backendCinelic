import { Router } from 'express';
import { BookingController } from '../controllers/BookingController';
import { authenticate } from '../middleware/auth';
import { validateBooking } from '../middleware/validateBooking';

const bookingRouter = Router();

// Ruta para crear una reserva: se requiere autenticación y validación de los datos de entrada.
bookingRouter.post('/create', authenticate, validateBooking, BookingController.createBooking);

// Ruta para cancelar una reserva: se requiere autenticación.
// El parámetro `bookingId` se pasa en la URL.
bookingRouter.patch('/:bookingId/cancel', authenticate, BookingController.cancelBooking);

bookingRouter.get('/user', authenticate, BookingController.getUserBookings); // Ejemplo: obtener reservas del usuario autenticado.

bookingRouter.get('/folio/:folio', authenticate, BookingController.getBookingByFolio);

export default bookingRouter;
