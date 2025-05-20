import { Router } from 'express';
import { BookingController } from '../controllers/BookingController';
import { authenticate } from '../middleware/auth';
import { validateBooking } from '../middleware/validateBooking';

const bookingRouter = Router();

// ruta para crear una reserva requiere autenticacion y validacion de los datos de entrada
bookingRouter.post('/create', authenticate, validateBooking, BookingController.createBooking);

// ruta para cancelar una reserva requiere autenticacion
// el bookingId se pasa en la URL.
bookingRouter.patch('/:bookingId/cancel', authenticate, BookingController.cancelBooking);

bookingRouter.get('/user', authenticate, BookingController.getUserBookings); // obtiene reservas del usuario autenticado

bookingRouter.get('/folio/:folio', authenticate, BookingController.getBookingByFolio);

export default bookingRouter;
