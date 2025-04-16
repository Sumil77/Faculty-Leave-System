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
// import ProtectedRoute from "./protectedRoutes.js";
// import AuthRoute from "./authRoutes.js";

const AppRoutes = () => {
  return (
    <Routes>
      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/apply-leave" element={<ApplyLeave />} />
        <Route path="/leave-status" element={<LeaveStatus />} />
        <Route path="/admin-panel" element={<AdminPanel />} />
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