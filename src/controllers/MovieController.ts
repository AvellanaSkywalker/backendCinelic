import { Request, Response } from 'express';
import fs from 'fs';
import Movie from '../models/Movie';
import Screening from '../models/Screening';
import cloudinary from '../config/cloudinary';
import { getRepository } from 'typeorm';


export class MovieController {

  /**
   * Crea una nueva pelicula
   * Se espera title, description, duration, rating, posterurl
   * se puede envoar archivo en el campo image
   */
static async createMovie(req: Request, res: Response): Promise<void> {
  try {
    console.log('Datos recibidos:', req.body);
    console.log('Archivo recibido:', req.file);
    const { title, description, duration, rating } = req.body;
    
    // valida  datos obligatorios
    if (!title || !duration || !rating) {
      const missingFields = [];
      if (!title) missingFields.push('title');
      if (!duration) missingFields.push('duration');
      if (!rating) missingFields.push('rating');
      res.status(400).json({ error: 'Faltan campos requeridos', missingFields, receivedFields: req.body });
      return;
    }

    let uploadResult = null;
    
    if (req.file) {
      try {
        uploadResult = await cloudinary.uploader.upload(req.file.path, {
          folder: 'cineclic/posters',
          public_id: `poster_${Date.now()}`,
          transformation: [
            { width: 500, height: 750, crop: 'fill' },
            { quality: 'auto:best' }
          ]
        });

        // elimina archivo temporal
        if (req.file?.path && fs.existsSync(req.file.path)) {
          fs.unlinkSync(req.file.path);
        }
      } catch (uploadError) {
        console.error('Error al subir a Cloudinary:', uploadError);
        if (req.file?.path) fs.unlinkSync(req.file.path);
        throw new Error('Error al procesar la imagen');
      }
    }

    const newMovie = await Movie.create({
      title,
      description,
      duration,
      rating,
      posterurl: uploadResult?.secure_url || null,
      publicId: uploadResult?.public_id || null
    });

    res.status(201).json({
      message: 'Película creada exitosamente.',
      movie: newMovie
    });
  } catch (error) {
    console.error('Error al crear la película:', error);
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Error interno al crear la película.'
    });
  }
}


  /**
   * obtiene todas las peliculas
   * lista todas las peliculas registradas
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
   * obtiene los detalles de una pelicula a partir de su ID
   */
  static async getMovieDetails(req: Request, res: Response): Promise<void> {
    try {
      const { movieId } = req.params;
      
      if (!movieId) {
        res.status(400).json({ error: 'Movie ID es requerido.' });
        return;
      }
      
      
      const movie = await Movie.findOne({
        where: { id: req.params.movieId},
        include: [{model: Screening, as: 'screenings'}] 
       });
       

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
   * actualiza la informacion de una pelicula
   * prmite modificar los campos title, description, duration, rating y posterurl
   */
static async updateMovie(req: Request, res: Response): Promise<void> {
  try {
    const { movieId } = req.params;
    const movie = await Movie.findByPk(movieId);
    
    if (!movie) {
      res.status(404).json({ error: 'Película no encontrada' });
      return;
    }

    // actualiza campos 
    const updatableFields = ['title', 'description', 'duration', 'rating'];
    updatableFields.forEach(field => {
      if (req.body[field] !== undefined) {
        movie[field] = req.body[field];
      }
    });

    // manejo de img
    if (req.file) {
      try {
        // elimina imagen anterior si existe
        if (movie.publicId) {
          await cloudinary.uploader.destroy(movie.publicId)
            .catch(e => console.error('Error al eliminar imagen anterior:', e));
        }

        // sube nueva imagen
        const result = await cloudinary.uploader.upload(req.file.path, {
          folder: 'cineclic/posters',
          public_id: `poster_${Date.now()}`,
          transformation: [
            { width: 500, height: 750, crop: 'fill' },
            { quality: 'auto:best' }
          ]
        });

        movie.posterurl = result.secure_url;
        movie.publicId = result.public_id;
        
        // limpia archivo temporal
      if (req.file?.path && fs.existsSync(req.file.path)) {
        fs.unlinkSync(req.file.path);
      }
      } catch (uploadError) {
        console.error('Error en Cloudinary:', uploadError);
        if (req.file?.path) fs.unlinkSync(req.file.path);
        throw new Error('Error al procesar la imagen');
      }
    }

    await movie.save();
    res.json({ message: 'Película actualizada', movie });
  } catch (error) {
    console.error('Error:', error);
    res.status(500).json({ 
      error: error instanceof Error ? error.message : 'Error interno' 
    });
  }
}

  /**
   * elimina una peli a partir de su ID
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
