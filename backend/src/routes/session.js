import express from "express";

import { getSession, login, logout } from "../controllers/authController.js";

export const sessionRouter = express.Router();

sessionRouter.post("", login);

sessionRouter.delete("", logout);

sessionRouter.get("", getSession);

export default sessionRouter;
