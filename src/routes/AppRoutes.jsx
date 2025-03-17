import { Routes, Route } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Dashboard from "../pages/Dashboard";
import ApplyLeave from "../pages/ApplyLeave";
import LeaveStatus from "../pages/LeaveStatus";
import AdminPanel from "../pages/AdminPanel";
import HolidayCalendar from "../pages/HolidayCalendar";  // ✅ Import the HolidayCalendar component

const AppRoutes = () => {
  return (
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/dashboard" element={<Dashboard />} />
      <Route path="/apply-leave" element={<ApplyLeave />} />
      <Route path="/leave-status" element={<LeaveStatus />} />
      <Route path="/admin-panel" element={<AdminPanel />} />
      <Route path="/holiday-calendar" element={<HolidayCalendar />} />  
    </Routes>
  );
};

export default AppRoutes;
