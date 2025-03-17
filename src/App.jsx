import { BrowserRouter as Router, Route, Routes } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import LeaveBalance from "./components/LeaveBalance";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import Footer from "./components/Footer";
import HolidayCalendar from "./pages/HolidayCalendar";

function App() {
  return (
    <Router>
      <Navbar />
      <div className="flex">
        {/* Sidebar Section */}
        <div className="w-64">
          <div className="h-[300px] overflow-hidden"> {/* ✅ Fixed shorter height */}
            <Sidebar />
          </div>
          
          {/* ✅ Leave Balance stays below but does NOT increase Sidebar height */}
          <div className="mt-4">
            <LeaveBalance />
          </div>
        </div>

        {/* Main Content Section */}
        <div className="flex-1 p-5">
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/holiday-calendar" element={<HolidayCalendar />} /> 
          </Routes>
        </div>
      </div>
      <Footer />
    </Router>
  );
}

export default App;
