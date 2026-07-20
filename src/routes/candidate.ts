import { Router } from "express";
import * as candidateController from "../controllers/candidate.js";
import upload from "../middleware/multer.js";
import * as validation from "../middleware/validation.js";

const router = Router();

router.get("/profile", candidateController.getProfile);
router.put("/profile", candidateController.updateProfile);
router.post("/profile/avatar", upload.single("avatar"), candidateController.uploadAvatar);
router.post("/profile/image/:attributeValueId", upload.single("image"), candidateController.uploadImageAttribute);
router.post("/profile/attributes", validation.AddAttribute, candidateController.addAttributes);
router.get("/profile/attributes", candidateController.searchAttributes);
router.get("/positions", candidateController.getPositions);

export default router;