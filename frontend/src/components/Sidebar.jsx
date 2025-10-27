import { useState } from "react";
import { Link } from "react-router-dom";

const Sidebar = () => {
  const [isOpen, setIsOpen] = useState(false);

  const handleLinkClick = () => {
    if (window.innerWidth < 768) setIsOpen(false);
  };

  return (
    <>
      {/* Hamburger button (mobile only) */}
      {!isOpen && (
        <button
          className="md:hidden p-3 bg-gray-700 text-white fixed top-4 left-4 z-50 rounded"
          onClick={() => setIsOpen(true)}
        >
          ☰
        </button>
      )}

      {/* Sidebar */}
      <aside
        className={`
          bg-gray-800 text-white w-56
          transform transition-transform duration-300
          md:translate-x-0 md:static
          fixed inset-y-0 left-0 z-40
          ${isOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        `}
      >
        {/* Sidebar Header (mobile only) */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 md:hidden">
          <span className="font-semibold">Menu</span>
          <button onClick={() => setIsOpen(false)} className="text-xl">
            ✕
          </button>
        </div>

        {/* Sidebar Nav */}
        <nav className="h-full overflow-y-auto py-6">
          <ul className="space-y-4 text-base px-4">
            <li>
              <Link to="/dashboard" onClick={handleLinkClick}>
                Dashboard
              </Link>
            </li>
            <li>
              <Link to="/apply-leave" onClick={handleLinkClick}>
                Apply Leave
              </Link>
            </li>
            <li>
              <Link to="/leave-status" onClick={handleLinkClick}>
                Leave Status
              </Link>
            </li>
            <li>
              <Link to="/admin-panel" onClick={handleLinkClick}>
                Admin Panel
              </Link>
            </li>
          </ul>
        </nav>
      </aside>

      {/* Backdrop (mobile only) */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 md:hidden"
          onClick={() => setIsOpen(false)}
        />
      )}
    </>
  );
};

export default Sidebar;
