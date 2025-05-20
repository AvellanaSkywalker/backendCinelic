import { Router } from "express";
import { RoomController } from "../controllers/RoomController";
import { authenticate } from "../middleware/auth";
import { validateRoom } from "../middleware/validateRoom";

const roomRouter = Router();

// crea una nueva sala
roomRouter.post("/", authenticate, validateRoom, RoomController.createRoom);

// lista todas las salas
roomRouter.get("/", authenticate, RoomController.getRooms);

// obtiene detalles de una sala por ID
roomRouter.get("/:roomId", authenticate, RoomController.getRoomById);

// actualiza una sala
roomRouter.put("/:roomId", authenticate, validateRoom, RoomController.updateRoom);

// elimina una sala
roomRouter.delete("/:roomId", authenticate, RoomController.deleteRoom);

export default roomRouter;
