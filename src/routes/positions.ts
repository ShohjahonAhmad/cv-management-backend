import { Router } from "express";
import * as positionController from "../controllers/positions.js";
import * as validation from "../middleware/validation.js";
import authorized from "../middleware/authorized.js";
import { Role } from "../../generated/prisma/client.js";

const router = Router();    

router.get("/", authorized([Role.ADMIN, Role.RECRUITER]), positionController.getPositions);
router.post("/", authorized([Role.ADMIN, Role.RECRUITER]), validation.CreatePosition, positionController.createPosition);
router.delete("/", authorized([Role.ADMIN, Role.RECRUITER]), validation.DeletePositions, positionController.deletePosition);
router.put("/:id", authorized([Role.ADMIN, Role.RECRUITER]), validation.UpdatePosition, positionController.updatePosition);
router.post("/:id/duplicate", authorized([Role.ADMIN, Role.RECRUITER]), positionController.duplicatePosition);

export default router;