import express from "express"
import * as reportController from "../util/reportHelper.js"

const reportRouter = express.Router()

// GET    /api/reports/monthly
// GET    /api/reports/semester
// GET    /api/reports/yearly
// GET    /api/reports/download?type=pdf|excel
// POST   /api/reports/send-mail


reportRouter.get("", reportController.getReport)
reportRouter.get("/download", reportController.downloadReport)
reportRouter.post("/send-mail", reportController.sendMail)


export default reportRouter;