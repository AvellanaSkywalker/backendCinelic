// src/routes/room.ts
import { Router } from "express";
import { RoomController } from "../controllers/RoomController";
import { authenticate } from "../middleware/auth";
import { validateRoom } from "../middleware/validateRoom";

const roomRouter = Router();

// Crear una nueva sala
roomRouter.post("/", authenticate, validateRoom, RoomController.createRoom);

// Listar todas las salas
roomRouter.get("/", authenticate, RoomController.getRooms);

// Obtener detalles de una sala por ID
roomRouter.get("/:roomId", authenticate, RoomController.getRoomById);

// Actualizar una sala
roomRouter.put("/:roomId", authenticate, validateRoom, RoomController.updateRoom);

// Eliminar una sala
roomRouter.delete("/:roomId", authenticate, RoomController.deleteRoom);

export default roomRouter;
