import express from "express";
import * as adminController from "../controllers/adminController.js";
import * as reportController from "../controllers/reportController.js";

const adminRouter = express.Router();

// GET    /api/reports/monthly
// GET    /api/reports/semester
// GET    /api/reports/yearly
// GET    /api/reports/download?type=pdf|excel
// POST   /api/reports/send-mail

// User and Request Management
adminRouter.get("/getUsers", adminController.getUsers);
adminRouter.get("/getRequests", adminController.getRequests);

// Leave Management
adminRouter.post("/approve", adminController.approveLeaves);
adminRouter.post("/reject", adminController.rejectLeaves);
adminRouter.post("/grant-cpl", adminController.grantCpl);

adminRouter.post("/v2/grant-cpl", adminController.grantCplV2);

// User Management
adminRouter.patch("/patchUser", adminController.patchUsers);

adminRouter.delete("/deleteUsers", adminController.deleteUsers);

// Downloadable Reports
adminRouter.get("/download-request", reportController.requestDownload);
adminRouter.get("/download-status/:jobId", reportController.checkDownload);
adminRouter.get("/downloads/:jobId.:format", reportController.serveDownload);

// Report Management
adminRouter.get("/report-summary", reportController.getReportSummary);
adminRouter.get("/leave-summary", reportController.getLeaveSummary);
adminRouter.get("/leave-history", reportController.getLeaveHistory);
adminRouter.get("/download-history", reportController.downloadHistory);
adminRouter.post("/send-mail", reportController.sendMail);
adminRouter.post("/send-history-mail", reportController.sendHistoryMail);

// Leave Type Management
adminRouter.get("/leave-types", adminController.getAllLeaveTypes);
adminRouter.post("/leave-types", adminController.addLeaveType);
adminRouter.put("/leave-types/:id", adminController.updateLeaveType);
adminRouter.delete("/leave-types/:id", adminController.deactivateLeaveType);

export default adminRouter;
