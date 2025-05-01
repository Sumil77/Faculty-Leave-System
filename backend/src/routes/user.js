import express from "express";
import * as userController from "../util/helpers.js";

const userRouter = express.Router();

userRouter.post("", userController.createUser);

userRouter.get("/me", userController.getUser);

userRouter.patch("", userController.updateUser)

export default userRouter;