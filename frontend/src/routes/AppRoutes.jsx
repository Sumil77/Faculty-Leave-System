import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import ApplyLeave from "../pages/ApplyLeave";
import LeaveStatus from "../pages/LeaveStatus";
import AdminPanel from "../pages/AdminPanel";
import HolidayCalendar from "../pages/HolidayCalendar";
import LeaveInfo from "../pages/LeaveInfo";
import { AuthRoute, ProtectedRoute } from "../util/route.jsx";
import AdminRequests from "../pages/AdminRequests";
import AdminUsers from "../pages/AdminUsers";
import AdminReports from "../pages/AdminReports";
import ReportGenerator from "../pages/ReportGenerator";


const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/apply-leave" element={<ApplyLeave />} />
        <Route path="/leave-status" element={<LeaveStatus />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
        <Route path="/admin-panel/requests" element={<AdminRequests />} />
        <Route path="/admin-panel/users" element={<AdminUsers />} />
        <Route path="/admin-panel/reports" element={<AdminReports />} />
        <Route path="/admin/reports/generator" element={<ReportGenerator />} />
      </Route>

      <Route element={<AuthRoute />}>
        <Route path="/login" element={<Login />} />
      </Route>

      <Route path="/" element={<Home />} />
      <Route path="/holiday-calendar" element={<HolidayCalendar />} />
      <Route path="/leave-info" element={<LeaveInfo />} />
    </Routes>
  );
};

export default AppRoutes;
