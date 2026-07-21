import {Router} from "express";
import * as cvController from "../controllers/cv.js";
import * as validation from "../middleware/validation.js";

const router = Router();

router.post("/:positionId", validation.validatePositionId, cvController.createCV);
router.get("/:id", validation.validateId, cvController.getCVById);
router.patch("/:id", validation.validateId, validation.UpdateCV, cvController.updateCV);
router.patch("/:id/publish", cvController.publishCV)

export default router;