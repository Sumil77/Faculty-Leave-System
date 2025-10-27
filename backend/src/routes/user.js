import express from "express";
import * as userController from "../controllers/userController.js";

const userRouter = express.Router();

userRouter.get("/me", userController.getUser);

userRouter.post("", userController.createUser);

userRouter.patch("", userController.updateUser)

export default userRouter;