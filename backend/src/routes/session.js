import express from "express";

import { getSession, login, logout, getLeaveTypes, getDepartmentList } from "../controllers/authController.js";

export const sessionRouter = express.Router();

sessionRouter.get("", getSession);

sessionRouter.post("", login);

sessionRouter.delete("", logout);

sessionRouter.get("/leave-types", getLeaveTypes);

sessionRouter.get("/dept-list", getDepartmentList);

export default sessionRouter;
