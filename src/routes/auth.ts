import { Router } from "express";
import * as authController from "../controllers/auth.js";
import passport from "passport";
import {validateReqUser} from "../middleware/validation.js";
import authenticated from "../middleware/authenticated.js";

const router = Router();

router.get("/google", passport.authenticate("google", {scope: ["profile", "email"]}))
router.get("/google/callback", passport.authenticate("google", {session: false}), validateReqUser, authController.authCallback)
router.get("/github", passport.authenticate("github", { scope: ["user:email"]}))
router.get("/github/callback", passport.authenticate("github", {session: false}), validateReqUser, authController.authCallback)
router.get("/me", authenticated, authController.getMe);

export default router;