import { Router } from "express";
import * as candidateController from "../controllers/candidate.js";
import upload from "../middleware/multer.js";
import * as validation from "../middleware/validation.js";

const router = Router();

router.get("/profile", candidateController.getProfile);
router.post("/profile/attributes", validation.AddAttribute, candidateController.addAttributes);
router.get("/profile/attributes", candidateController.searchAttributes);
router.put("/profile/:id", validation.validateId, candidateController.updateProfile);
router.get("/profile/:id", validation.validateId, candidateController.getProfileById);
router.post("/profile/avatar", upload.single("avatar"), candidateController.uploadAvatar);
router.post("/profile/image/:attributeValueId", upload.single("image"), candidateController.uploadImageAttribute);
router.get("/positions", candidateController.getPositions);
router.get("/positions/:id", candidateController.getPositionById);

export default router;