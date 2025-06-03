import { Router } from "express";
import { RoomController } from "../controllers/RoomController";
import { validateRoom } from "../middleware/validateRoom";
import { Request, Response, NextFunction } from "express";

export function authenticate(req: Request, res: Response, next: NextFunction) {

	next();
}

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
