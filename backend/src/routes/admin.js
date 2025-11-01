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

// Leave types
adminRouter.get("/leave-types", adminController.getAllLeaveTypes);
adminRouter.get("/leave-types/:id", adminController.getLeaveTypeById);
adminRouter.post("/leave-types", adminController.addLeaveType);
adminRouter.put("/leave-types/:id", adminController.updateLeaveType);
adminRouter.patch("/leave-types/:id/deactivate", adminController.deactivateLeaveType);

// Leave rules
adminRouter.get("/leave-rules", adminController.getLeaveRules);
adminRouter.post("/leave-rules", adminController.addLeaveRule);
adminRouter.put("/leave-rules/:id", adminController.updateLeaveRule);
adminRouter.delete("/leave-rules/:id", adminController.deleteLeaveRule);

// Credit rules
adminRouter.get("/credit-rules", adminController.getCreditRules);
adminRouter.post("/credit-rules", adminController.addCreditRule);
adminRouter.put("/credit-rules/:id", adminController.updateCreditRule);
adminRouter.delete("/credit-rules/:id", adminController.deleteCreditRule);

export default adminRouter;
