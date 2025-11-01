import React from "react";
import { useNavigate } from "react-router-dom";

const AdminPanel = () => {
  const navigate = useNavigate();

  const sections = [
    {
      title: "Manage Leave Requests",
      desc: "Approve, reject, or view pending leave requests from employees.",
      path: "requests",
    },
    {
      title: "Manage Users",
      desc: "Add, update, or deactivate user accounts within the system.",
      path: "users",
    },
    {
      title: "Manage Departments",
      desc: "Create or modify departments and assign users to them.",
      path: "departments",
    },
    {
      title: "Manage Leave Types",
      desc: "Define and configure different categories of leaves.",
      path: "leaves",
    },
    {
      title: "Reports & Analytics",
      desc: "Generate and export reports related to leave trends and department activity.",
      path: "reports",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      {/* Header */}
      <header className="bg-white border-b px-6 py-4 shadow-sm">
        <h1 className="text-2xl font-semibold text-center">Admin Panel</h1>
        <p className="text-center text-gray-600 text-sm mt-1">
          Access all administrative tools and configurations from one place.
        </p>
      </header>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto p-8">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {sections.map((s) => (
            <div
              key={s.title}
              className="bg-white border rounded-xl p-6 flex flex-col justify-between"
            >
              <div>
                <h2 className="text-lg font-semibold mb-2">{s.title}</h2>
                <p className="text-sm text-gray-600">{s.desc}</p>
              </div>
              <div className="mt-4">
                <button
                  onClick={() => navigate(s.path)}
                  className="w-full bg-gray-900 text-white py-2 rounded-md hover:bg-gray-800 transition"
                >
                  Open
                </button>
              </div>
            </div>
          ))}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-8 text-center text-xs text-gray-500 pb-4">
        © {new Date().getFullYear()} Admin Dashboard — Internal Use Only
      </footer>
    </div>
  );
};

export default AdminPanel;
