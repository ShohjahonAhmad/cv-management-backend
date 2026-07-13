import { Router } from "express";
import * as positionController from "../controllers/positions.js";
import * as validation from "../middleware/validation.js";

const router = Router();    

router.get("/", positionController.getPositions);
router.post("/", validation.CreatePosition, positionController.createPosition);
router.delete("/", validation.DeletePositions, positionController.deletePosition);
router.put("/:id", validation.UpdatePosition, positionController.updatePosition);
router.post("/:id/duplicate", positionController.duplicatePosition);

export default router;