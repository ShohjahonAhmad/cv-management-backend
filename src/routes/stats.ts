import { Router } from "express";
import  * as statsController from "../controllers/stats.js";

const router = Router();

router.get("/", statsController.getStats);

export default router;