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

leaveRouter.post("/v2/apply", leaveController.postAppliedLeaveV2);

leaveRouter.post("/cancelPending", leaveController.postCancelPending);

leaveRouter.get("/v2/balance", leaveController.getLeaveBalanceV2);

export default leaveRouter;
