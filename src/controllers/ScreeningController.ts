import { Request, Response } from 'express';
import Screening from '../models/Screening';
import {parse} from 'date-fns';

export class ScreeningController {
  /**
   * Crea un nuevo screening.
   * Se esperan en el body: movieId, roomId, startTime, endTime y price.
   */
  static async createScreening(req: Request, res: Response): Promise<void> {
    try {
      const { movieId, roomId, date, startTime, endTime, price } = req.body;
      if (!movieId || !roomId || !date || !startTime || !endTime || price === undefined) {
        res.status(400).json({ error: 'Faltan datos obligatorios: movieId, roomId, startTime, endTime y price.' });
        return;
      }

      const startDateTime = `${date} ${startTime}`;
      const endDateTime = `${date} ${endTime}`;

      const screening = await Screening.create({
        movieId,
        roomId,
        startTime: parse(startDateTime, 'yyyy-MM-dd hh:mm a', new Date()),
        endTime: parse(endDateTime, 'yyyy-MM-dd hh:mm a', new Date()),
        price,
      });

      res.status(201).json({ message: 'Screening creada exitosamente.', screening });
    } catch (error) {
      console.error('Error al crear screening:', error);
      res.status(500).json({ error: 'Error interno al crear screening.' });
    }
  }

  /**
   * Obtiene todas las funciones (screenings).
   */
  static async getScreenings(req: Request, res: Response): Promise<void> {
    try {
      const screenings = await Screening.findAll();
      res.status(200).json({ screenings });
    } catch (error) {
      console.error('Error al obtener screenings:', error);
      res.status(500).json({ error: 'Error interno al obtener screenings.' });
    }
  }

  /**
   * Obtiene los detalles de un screening a partir de su ID.
   */
  static async getScreeningById(req: Request, res: Response): Promise<void> {
    try {
      const { screeningId } = req.params;
      if (!screeningId) {
        res.status(400).json({ error: 'Screening ID es requerido.' });
        return;
      }
      const screening = await Screening.findByPk(screeningId);
      if (!screening) {
        res.status(404).json({ error: 'Screening no encontrada.' });
        return;
      }
      res.status(200).json({ screening });
    } catch (error) {
      console.error('Error al obtener screening:', error);
      res.status(500).json({ error: 'Error interno al obtener screening.' });
    }
  }

  /**
   * Actualiza la información de un screening.
   */
  static async updateScreening(req: Request, res: Response): Promise<void> {
    try {
      const { screeningId } = req.params;
      if (!screeningId) {
        res.status(400).json({ error: 'Screening ID es requerido.' });
        return;
      }
      const screening = await Screening.findByPk(screeningId);
      if (!screening) {
        res.status(404).json({ error: 'Screening no encontrada.' });
        return;
      }

      const { movieId, roomId, startTime, endTime, price } = req.body;
      if (movieId !== undefined) screening.movieId = movieId;
      if (roomId !== undefined) screening.roomId = roomId;
      if (startTime !== undefined) screening.startTime = startTime;
      if (endTime !== undefined) screening.endTime = endTime;
      if (price !== undefined) screening.price = price;

      await screening.save();
      res.status(200).json({ message: 'Screening actualizada exitosamente.', screening });
    } catch (error) {
      console.error('Error al actualizar screening:', error);
      res.status(500).json({ error: 'Error interno al actualizar screening.' });
    }
  }

  /**
   * Elimina un screening a partir de su ID.
   */
  static async deleteScreening(req: Request, res: Response): Promise<void> {
    try {
      const { screeningId } = req.params;
      if (!screeningId) {
        res.status(400).json({ error: 'Screening ID es requerido.' });
        return;
      }
      const deleted = await Screening.destroy({ where: { id: screeningId } });
      if (deleted === 0) {
        res.status(404).json({ error: 'Screening no encontrada para eliminar.' });
        return;
      }
      res.status(200).json({ message: 'Screening eliminada exitosamente.' });
    } catch (error) {
      console.error('Error al eliminar screening:', error);
      res.status(500).json({ error: 'Error interno al eliminar screening.' });
    }
  }
}
