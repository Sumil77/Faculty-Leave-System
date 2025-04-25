import express from "express";
import * as leaveController from "../util/leaveHelper.js";

const leaveRouter = express.Router();

leaveRouter.get("/approved", leaveController.getLeaveApproved);

leaveRouter.get("/pending", leaveController.getLeavePending);

leaveRouter.get("/rejected", leaveController.getLeaveRejected);

leaveRouter.get("/balance", leaveController.getLeaveBalance);

leaveRouter.get("/taken", leaveController.getLeaveTaken);

leaveRouter.post("/apply", leaveController.postAppliedLeave);

leaveRouter.post("/cancelPending", leaveController.postCancelPending);

leaveRouter.get("/recent", leaveController.getRecentLeaves);

export default leaveRouter;
