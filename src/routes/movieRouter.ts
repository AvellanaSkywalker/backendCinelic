import { Router } from 'express';
import upload from '../middleware/multer';
import { MovieController } from '../controllers/MovieController';
import { authenticate } from '../middleware/auth';
import { validateMovie } from "../middleware/validateMovie";

const movieRouter = Router();

// crea una nueva pelicula
movieRouter.post('/', authenticate, upload.single('image'), validateMovie, MovieController.createMovie);

// lista todas las peliculas activas 
movieRouter.get('/', authenticate, MovieController.getMovies);

// obtiene detalles de una pelicula a partir de su ID
movieRouter.get('/:movieId', authenticate, MovieController.getMovieDetails);

// actualiza una pelicula usando el ID de la pelicula
movieRouter.put('/:movieId', authenticate, upload.single('image'), MovieController.updateMovie);

// eliminar una pelicula a partir de su ID
movieRouter.delete('/:movieId', authenticate, MovieController.deleteMovie);

export default movieRouter;
