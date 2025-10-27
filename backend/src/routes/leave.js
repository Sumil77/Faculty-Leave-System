import express from "express";
import * as leaveController from "../controllers/leaveController.js";

const leaveRouter = express.Router();

leaveRouter.get("/approved", leaveController.getLeaveApproved);
leaveRouter.get("/pending", leaveController.getLeavePending);
leaveRouter.get("/rejected", leaveController.getLeaveRejected);
leaveRouter.get("/balance", leaveController.getLeaveBalance);
leaveRouter.get("/taken", leaveController.getLeaveTaken);
leaveRouter.get("/recent", leaveController.getRecentLeaves);
leaveRouter.get("/getLeave",leaveController.getLeave);

leaveRouter.post("/apply", leaveController.postAppliedLeave);

leaveRouter.post("/cancelPending", leaveController.postCancelPending);

export default leaveRouter;
