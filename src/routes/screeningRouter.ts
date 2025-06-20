import { Router } from 'express';
import { ScreeningController } from '../controllers/ScreeningController';
import { authenticate } from '../middleware/auth';
import { validateScreening } from '../middleware/validateScreening';

const screeningRouter = Router();

// crea una nueva screening
screeningRouter.post('/', authenticate, validateScreening, ScreeningController.createScreening);

// lista todos los screenings
screeningRouter.get('/', authenticate, ScreeningController.getScreenings);

// obtiene detalles de un screening por ID
screeningRouter.get('/:screeningId', authenticate, ScreeningController.getScreeningById);

// actualiza un screening
screeningRouter.put('/:screeningId', authenticate, ScreeningController.updateScreening);

// elimina un screening
screeningRouter.delete('/:screeningId', authenticate, ScreeningController.deleteScreening);

export default screeningRouter;
