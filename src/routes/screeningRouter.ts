// src/routes/screening.ts
import { Router } from 'express';
import { ScreeningController } from '../controllers/ScreeningController';
import { authenticate } from '../middleware/auth';
import { validateScreening } from '../middleware/validateScreening';

const screeningRouter = Router();

// Crear un nuevo screening
screeningRouter.post('/', authenticate, validateScreening, ScreeningController.createScreening);

// Listar todos los screenings
screeningRouter.get('/', authenticate, ScreeningController.getScreenings);

// Obtener detalles de un screening por ID
screeningRouter.get('/:screeningId', authenticate, ScreeningController.getScreeningById);

// Actualizar un screening
screeningRouter.put('/:screeningId', authenticate, ScreeningController.updateScreening);//se elimino validateScreening

// Eliminar un screening
screeningRouter.delete('/:screeningId', authenticate, ScreeningController.deleteScreening);

export default screeningRouter;
