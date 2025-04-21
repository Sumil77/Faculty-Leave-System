import express from "express";
import {
  getLeaveApproved,
  getLeaveRejected,
  getLeavePending,
  getLeaveBalance,
  getLeaveTaken,
  postAppliedLeave,
} from "../util/leaveHelper.js";

const leaveRouter = express.Router();

leaveRouter.get("/approved", (req, res) => {
  getLeaveApproved(req,res);
});

leaveRouter.get("/pending", (req, res) => {
  getLeavePending(req,res);
});

leaveRouter.get("/rejected", (req, res) => {
  getLeaveRejected(req,res);
});

leaveRouter.get("/balance", (req, res) => {
  getLeaveBalance(req,res);
});

leaveRouter.get("/taken", (req, res) => {
  getLeaveTaken(req,res);
});

leaveRouter.post("/apply" , (req,res)=>{
  postAppliedLeave(req,res);
})

export default leaveRouter;