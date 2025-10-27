import express from "express";
import * as adminController from "../controllers/adminController.js";
import * as reportController from "../controllers/reportController.js";

const adminRouter = express.Router();

// GET    /api/reports/monthly
// GET    /api/reports/semester
// GET    /api/reports/yearly
// GET    /api/reports/download?type=pdf|excel
// POST   /api/reports/send-mail

adminRouter.get("/getUsers", adminController.getUsers);
adminRouter.get("/getRequests", adminController.getRequests);

adminRouter.post("/approve", adminController.approveLeaves);
adminRouter.post("/reject", adminController.rejectLeaves);
adminRouter.post("/grant-cpl", adminController.grantCpl);

adminRouter.patch("/patchUser", adminController.patchUsers);

adminRouter.delete("/deleteUsers", adminController.deleteUsers);

// adminController.js
adminRouter.get("/download-request", reportController.requestDownload);
adminRouter.get("/download-status/:jobId", reportController.checkDownload); 
adminRouter.get("/downloads/:jobId.:format", reportController.serveDownload);

adminRouter.get("/report-summary", reportController.getReportSummary);
adminRouter.get("/leave-summary", reportController.getLeaveSummary);
adminRouter.get("/leave-history", reportController.getLeaveHistory);
adminRouter.get("/download-history", reportController.downloadHistory);
adminRouter.post("/send-mail", reportController.sendMail);
adminRouter.post("/send-history-mail", reportController.sendHistoryMail);

export default adminRouter;
