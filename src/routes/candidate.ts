import { Router } from "express";
import * as candidateController from "../controllers/candidate.js";
import upload from "../middleware/multer.js";

const router = Router();

router.get("/profile", candidateController.getProfile);
router.put("/profile", candidateController.updateProfile);
router.post("/profile/avatar", upload.single("avatar"), candidateController.uploadAvatar);

export default router;