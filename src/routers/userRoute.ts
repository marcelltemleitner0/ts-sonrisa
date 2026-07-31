import { Router } from "express";
import { UserController } from "../controllers/userController";

const router = Router();

router.post("/api/v1/CreateUser", UserController.createUser);

export default router;
