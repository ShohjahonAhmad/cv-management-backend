import { Router } from "express";
import * as tagController from "../controllers/tags.js";

const router = Router();

router.get("/", tagController.getTags);

export default router;