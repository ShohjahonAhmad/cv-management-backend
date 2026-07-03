import { Router } from "express";
import * as attributeController from "../controllers/attributes.js";
import * as validation from "../middleware/validation.js";

const router = Router();

router.get("/", attributeController.getAttributes);
router.post("/", validation.CreateAttribute, attributeController.createAttribute);
router.delete("/", validation.DeleteAttribute, attributeController.deleteAttribute);
router.patch("/:id", validation.UpdateAttribute, attributeController.updateAttribute);

export default router;
