import { useState } from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      {/* Toggle Button for Mobile */}
      <button 
        className="md:hidden p-3 bg-gray-700 text-white fixed top-2 left-2 z-50 rounded"
        onClick={() => setIsOpen(!isOpen)}
      >
        ☰
      </button>

      {/* Sidebar */}
      <aside 
        className={`fixed top-0 left-0 h-full bg-gray-800 text-white p-5 transition-transform duration-300 ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } md:relative md:translate-x-0 md:w-64`}
      >
        <ul className="space-y-4">
          <li><Link to="/dashboard" className="hover:text-blue-300 transition">Dashboard</Link></li>
          <li><Link to="/apply-leave" className="hover:text-blue-300 transition">Apply Leave</Link></li>
          <li><Link to="/leave-status" className="hover:text-blue-300 transition">Leave Status</Link></li>
          <li><Link to="/admin-panel" className="hover:text-blue-300 transition">Admin Panel</Link></li>
        </ul>
      </aside>
    </>
  );
};

export default Sidebar;
