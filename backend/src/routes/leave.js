import express from "express";
import * as leaveController from "../util/leaveHelper.js";

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

leaveRouter.post("/approve", leaveController.approveLeaves);

leaveRouter.post("/reject", leaveController.rejectLeaves);

leaveRouter.post("/grant-cpl" , leaveController.grantCpl);

leaveRouter.get("/history", leaveController.getLeaveHistory);


export default leaveRouter;
