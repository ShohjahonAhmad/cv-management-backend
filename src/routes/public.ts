import { Router } from "express";
import * as publicController from "../controllers/public.js";
import optionalAuthenticated from "../middleware/optionalAuthenticated.js";

const router = Router();

router.get("/positions", optionalAuthenticated, publicController.getHomePositions);
router.get("/positions/:id", optionalAuthenticated, publicController.getPositionById);


export default router;