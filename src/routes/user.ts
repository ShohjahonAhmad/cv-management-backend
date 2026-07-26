import { Router } from "express";
import * as userController from "../controllers/user.js";
import authorized from "../middleware/authorized.js";
import * as validation from "../middleware/validation.js"
import { Role } from "../../generated/prisma/client.js";
const router = Router();

router.get("/", authorized([Role.ADMIN]), userController.getUsers);
router.delete("/", authorized([Role.ADMIN]), validation.DeleteUsers, userController.deleteUsers)
router.get("/me", userController.getMe);
router.patch("/role", authorized([Role.ADMIN]), validation.UpdateUsersRole, userController.updateUserRole)
router.patch("/block", authorized([Role.ADMIN]), validation.UpdateUsersBlock, userController.updateUserBlock)


export default router;