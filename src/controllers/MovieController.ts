import { Request, Response } from 'express';
import fs from 'fs';
import Movie from '../models/Movie';
import cloudinary from '../config/cloudinary';


export class MovieController {
  /**
   * Crea una nueva película.
   * Se esperan en el body: title, description, duration, rating, posterurl.
   * se puede envoar archivo en el campo image
   */
static async createMovie(req: Request, res: Response): Promise<void> {
  try {
    const { title, description, duration, rating } = req.body;
    let posterurl: string | null = null;

    // Validación mínima de datos obligatorios; aquí se considera que title, duration y rating son requeridos.
    if (req.file) {
      const result = await cloudinary.uploader.upload(req.file.path, {
        folder: 'movies',
      });
      posterurl = result.secure_url;

      // Eliminamos el archivo del almacenamiento local tras subirlo a Cloudinary
      fs.unlinkSync(req.file.path);
    }

    const newMovie = await Movie.create({
      title,
      description: description || null,
      duration,
      rating,
      posterurl,
    });

    res.status(201).json({
      message: 'Película creada exitosamente.',
      movie: newMovie, // Corrección: referencia al objeto creado
    });
  } catch (error) {
    console.error('Error al crear la película:', error);
    res.status(500).json({
      error: 'Error interno al crear la película.',
    });
  }
}


  /**
   * Obtiene todas las películas.
   * Se listan todas las películas registradas.
   */
  static async getMovies(req: Request, res: Response): Promise<void> {
    try {
      const movies = await Movie.findAll();
      res.status(200).json({ movies });
    } catch (error) {
      console.error('Error al obtener películas:', error);
      res.status(500).json({
        error: 'Error interno al obtener películas.'
      });
    }
  }

  /**
   * Obtiene los detalles de una película a partir de su ID.
   */
  static async getMovieDetails(req: Request, res: Response): Promise<void> {
    try {
      const { movieId } = req.params;
      if (!movieId) {
        res.status(400).json({ error: 'Movie ID es requerido.' });
        return;
      }
      const movie = await Movie.findByPk(movieId);
      if (!movie) {
        res.status(404).json({ error: 'Película no encontrada.' });
        return;
      }
      res.status(200).json({ movie });
    } catch (error) {
      console.error('Error al obtener detalles de la película:', error);
      res.status(500).json({
        error: 'Error interno al obtener detalles de la película.'
      });
    }
  }

  /**
   * Actualiza la información de una película.
   * Permite modificar los campos: title, description, duration, rating y posterurl.
   */
  static async updateMovie(req: Request, res: Response): Promise<void> {
    try {
      const { movieId } = req.params;
      if (!movieId) {
        res.status(400).json({ error: 'Movie ID es requerido.' });
        return;
      }
      const movie = await Movie.findByPk(movieId);
      if (!movie) {
        res.status(404).json({ error: 'Película no encontrada.' });
        return;
      }

      const { title, description, duration, rating} = req.body;

      if (title !== undefined) movie.title = title;
      
      if (description !== undefined) movie.description = description;
      if (duration !== undefined) movie.duration = duration;
      if (rating !== undefined) movie.rating = rating;

      if (req.file) {
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'movies',
        });
        movie.posterurl = result.secure_url;

        fs.unlinkSync(req.file.path);
      }

      await movie.save();
      res.status(200).json({
        message: 'Película actualizada exitosamente.',
        movie,
      });
    } catch (error) {
      console.error('Error al actualizar la película:', error);
      res.status(500).json({
        error: 'Error interno al actualizar la película.'
      });
    }
  }

  /**
   * Elimina una película a partir de su ID.
   */
  static async deleteMovie(req: Request, res: Response): Promise<void> {
    try {
      const { movieId } = req.params;
      if (!movieId) {
        res.status(400).json({ error: 'Movie ID es requerido.' });
        return;
      }
      const movie = await Movie.findByPk(movieId);
      if (!movie) {
        res.status(404).json({ error: 'Película no encontrada' });
        return;
      }

      await movie.destroy();
      res.status(200).json({ message: 'Película eliminada exitosamente.' });
    } catch (error) {
      console.error('Error al eliminar la película:', error);
      res.status(500).json({
        error: 'Error interno al eliminar la película.'
      });
    }
  }
}
