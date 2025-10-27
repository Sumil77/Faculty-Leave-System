import express from "express";

import { getSession, login, logout } from "../controllers/authController.js";

export const sessionRouter = express.Router();

sessionRouter.get("", getSession);

sessionRouter.post("", login);

sessionRouter.delete("", logout);

export default sessionRouter;
