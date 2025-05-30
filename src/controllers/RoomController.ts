import { Request, Response } from "express";
import Room from "../models/Room";

export class RoomController {
  /**
   * Crea una nueva sala
   * espera en el body: name string, capacity number, opcional y layout number
   */
  static async createRoom(req: Request, res: Response): Promise<void> {
    try {

      const { name, capacity, layout } = req.body;
      //  name y layout son obligatorios
      const parsedLayout = layout;

      const newRoom = await Room.create({
        name,
        capacity: capacity !== undefined ? capacity : null,
        layout: parsedLayout,
      });
      res.status(201).json({ message: "Sala creada exitosamente.", room: newRoom });
    } catch (error) {
      console.error("Error al crear sala:", error);
      res.status(500).json({ error: "Error interno al crear la sala." });
    }
  }

  /**
   * obtiene todas las salas
   */
  static async getRooms(req: Request, res: Response): Promise<void> {
    try {
      const rooms = await Room.findAll();
      res.status(200).json({ rooms });
    } catch (error) {
      console.error("Error obteniendo salas:", error);
      res.status(500).json({ error: "Error interno al obtener las salas." });
    }
  }

  /**
   * obtiene los detalles de una sala a partir de su ID
   */
  static async getRoomById(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      if (!roomId) {
        res.status(400).json({ error: "Room ID es requerido." });
        return;
      }
      
      const room = await Room.findByPk(roomId);
      if (!room) {
        res.status(404).json({ error: "Sala no encontrada." });
        return;
      }
      res.status(200).json({ room });
    } catch (error) {
      console.error("Error obteniendo sala:", error);
      res.status(500).json({ error: "Error interno al obtener la sala." });
    }
  }

  /**
   * actualiza la informacion de una sala
   * permite modificar: name, capacity y layout
   */
  static async updateRoom(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      if (!roomId) {
        res.status(400).json({ error: "Room ID es requerido." });
        return;
      }
      const room = await Room.findByPk(roomId);
      if (!room) {
        res.status(404).json({ error: "Sala no encontrada." });
        return;
      }
      const { name, capacity, layout } = req.body;
      if (name !== undefined) room.name = name;
      if (capacity !== undefined) room.capacity = capacity;
      if (layout !== undefined) room.layout = layout;
      await room.save();
      res.status(200).json({ message: "Sala actualizada exitosamente.", room });
    } catch (error) {
      console.error("Error actualizando sala:", error);
      res.status(500).json({ error: "Error interno al actualizar la sala." });
    }
  }

  /**
   * elimina una sala a partir de su ID
   */
  static async deleteRoom(req: Request, res: Response): Promise<void> {
    try {
      const { roomId } = req.params;
      if (!roomId) {
        res.status(400).json({ error: "Room ID es requerido." });
        return;
      }
      const deleted = await Room.destroy({ where: { id: roomId } });
      if (deleted === 0) {
        res.status(404).json({ error: "Sala no encontrada para eliminar." });
        return;
      }
      res.status(200).json({ message: "Sala eliminada exitosamente." });
    } catch (error) {
      console.error("Error eliminando sala:", error);
      res.status(500).json({ error: "Error interno al eliminar la sala." });
    }
  }
}
