import { BrowserRouter as Router } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import LeaveBalance from "./components/LeaveBalance";
import Footer from "./components/Footer";
import AppRoutes from "./routes/AppRoutes";  // Import your AppRoutes component

function App() {
  return (
<>
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
          {/* Use AppRoutes to handle routes */}
          <AppRoutes />  {/* This will render all the routes you defined in AppRoutes.jsx */}
        </div>
      </div>
      <Footer />
      </>
  );
}

export default App;
