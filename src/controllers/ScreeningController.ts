import { Request, Response } from 'express';
import Screening from '../models/Screening';
import {parse} from 'date-fns';

export class ScreeningController {
  /**
   * Crea un nuevo screening
   * se espera el movieId, roomId, startTime, endTime y price
   */
static async createScreening(req: Request, res: Response): Promise<void> {
  try {
    const { movieId, roomId, startTime, endTime, price } = req.body;
    console.log('recibe', req.body);
    if (!movieId || !roomId || !startTime || !endTime || price === undefined) {
      res.status(400)
         .json({ error: 'Faltan datos obligatorios: movieId, roomId, startTime, endTime y price.' });
      return;
    }

    // Ya no necesitas screeningStartTime ni screeningEndTime
    const screening = await Screening.create({
      movieId,
      roomId,
      startTime: new Date(startTime),
      endTime:   new Date(endTime),
      price:     Number(price),
    });

    res.status(201).json({ message: 'Screening creada exitosamente.', screening });
  } catch (error) {
    console.error('Error al crear screening:', error);
    res.status(500).json({ error: 'Error interno al crear screening.' });
  }
}


  /**
   * obtiene todas las funciones 
   */
  static async getScreenings(req: Request, res: Response): Promise<void> {
    try {
      const screenings = await Screening.findAll({
        order: [['startTime', 'ASC']]
      });
      res.status(200).json({ screenings });
    } catch (error) {
      console.error('Error al obtener screenings:', error);
      res.status(500).json({ error: 'Error interno al obtener screenings.' });
    }
  }

  /**
   * obtiene los detalles de un screening a partir de su ID
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
   * actualiza la info de un screening
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
   * elimina un screening a partir de su ID
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
