import { Router } from 'express';
import upload from '../middleware/multer';
import { MovieController } from '../controllers/MovieController';
import { authenticate } from '../middleware/auth';
import { validateMovie } from "../middleware/validateMovie";

const movieRouter = Router();

// Crear una nueva película
movieRouter.post('/', authenticate, upload.single('image'), validateMovie, MovieController.createMovie);

// Listar todas las películas (o activas, según lo implementado)
movieRouter.get('/', authenticate, MovieController.getMovies);

// Obtener detalles de una película a partir de su ID
movieRouter.get('/:movieId', authenticate, MovieController.getMovieDetails);

// Actualizar una película (usando el ID de la película enviado en los parámetros)
movieRouter.put('/:movieId', authenticate, upload.single('image'), MovieController.updateMovie);

// Eliminar (destruir) una película a partir de su ID
movieRouter.delete('/:movieId', authenticate, MovieController.deleteMovie);

export default movieRouter;
