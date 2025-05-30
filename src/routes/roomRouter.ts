import { Router } from "express";
import { RoomController } from "../controllers/RoomController";
import { validateRoom } from "../middleware/validateRoom";
// Update the import path if the file is named differently or located elsewhere
// For example, if the file is named 'authMiddleware.ts':
// import { authenticate } from "../middleware/authMiddleware";

// If the file does not exist, create it with the following content:
import { Request, Response, NextFunction } from "express";

export function authenticate(req: Request, res: Response, next: NextFunction) {
	// Dummy authentication middleware
	// Replace with real authentication logic
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
