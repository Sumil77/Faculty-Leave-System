import { useState } from "react";
import {
  FiBarChart2,
  FiSearch,
  FiDownload,
  FiMail,
  FiArrowLeft,
} from "react-icons/fi";
import * as leaveController from "../util/leave.js"; // for leave types

export default function AdminReports() {
  const reports = [
    { department: "CSE", leavesTaken: 12 },
    { department: "IT", leavesTaken: 10 },
    { department: "ECE", leavesTaken: 8 },
    { department: "EEE", leavesTaken: 5 },
  ];

  const facultyReports = {
    CSE: [
      { name: "Dr. A Sharma", leavesTaken: 4, type: "CL", status: "Approved" },
      { name: "Prof. B Gupta", leavesTaken: 3, type: "SL", status: "Rejected" },
      { name: "Ms. C Singh", leavesTaken: 5, type: "EL", status: "Approved" },
    ],
    IT: [
      { name: "Mr. R Mehta", leavesTaken: 6, type: "CL", status: "Pending" },
      { name: "Ms. K Rao", leavesTaken: 4, type: "EL", status: "Approved" },
    ],
    ECE: [
      { name: "Dr. T Verma", leavesTaken: 5, type: "SL", status: "Approved" },
      { name: "Prof. L Kumar", leavesTaken: 3, type: "CL", status: "Pending" },
    ],
    EEE: [
      { name: "Dr. N Iyer", leavesTaken: 2, type: "EL", status: "Rejected" },
      { name: "Mr. P Das", leavesTaken: 3, type: "SL", status: "Approved" },
    ],
  };

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedDept, setSelectedDept] = useState(null);

  // Faculty filters
  const [facultySearch, setFacultySearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const leaveTypes = leaveController.leaveTypes;

  const filteredReports = reports.filter((r) =>
    r.department.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const filteredFaculty = selectedDept
    ? facultyReports[selectedDept].filter((f) => {
        return (
          f.name.toLowerCase().includes(facultySearch.toLowerCase()) &&
          (statusFilter ? f.status === statusFilter : true) &&
          (typeFilter ? f.type === typeFilter : true)
          // date filtering can be added if faculty leaves have appliedOn/from/to
        );
      })
    : [];

  // Download CSV for departments
  const handleDownloadDept = () => {
    const csvRows = [
      ["Department", "Leaves Taken"],
      ...filteredReports.map((r) => [r.department, r.leavesTaken]),
    ];
    downloadCSV(csvRows, "department_reports.csv");
  };

  // Download CSV for all faculty of a department
  const handleDownloadDeptFaculty = () => {
    const csvRows = [
      ["Faculty", "Leaves Taken", "Type", "Status"],
      ...filteredFaculty.map((f) => [f.name, f.leavesTaken, f.type, f.status]),
    ];
    downloadCSV(csvRows, `${selectedDept}_faculty_reports.csv`);
  };

  // Download CSV for a faculty
  const handleDownloadFaculty = (faculty) => {
    const csvRows = [
      ["Faculty", "Leaves Taken", "Type", "Status"],
      [faculty.name, faculty.leavesTaken, faculty.type, faculty.status],
    ];
    downloadCSV(csvRows, `${faculty.name.replace(/\s+/g, "_")}_report.csv`);
  };

  // Common CSV generator
  const downloadCSV = (rows, fileName) => {
    const csvContent = rows.map((row) => row.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 flex items-center space-x-2">
        <FiBarChart2 /> <span>Leave Reports</span>
      </h1>

      {selectedDept ? (
        <>
          {/* Back Button */}
          <button
            onClick={() => setSelectedDept(null)}
            className="flex items-center gap-2 px-4 py-2 mb-6 bg-gray-700 text-white rounded hover:bg-gray-800 transition"
          >
            <FiArrowLeft /> Back to Departments
          </button>

          <h2 className="text-2xl font-semibold mb-4">{selectedDept} Faculty Reports</h2>

          {/* Faculty Filters */}
          <div className="flex flex-wrap gap-4 mb-6">
            <div className="flex items-center border rounded p-2 bg-white">
              <FiSearch className="text-gray-500 mr-2" />
              <input
                type="text"
                placeholder="Search Faculty"
                value={facultySearch}
                onChange={(e) => setFacultySearch(e.target.value)}
                className="outline-none w-full"
              />
            </div>

            <select
              className="p-2 border rounded"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Status</option>
              <option value="Pending">Pending</option>
              <option value="Approved">Approved</option>
              <option value="Rejected">Rejected</option>
            </select>

            <select
              className="p-2 border rounded"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
            >
              <option value="">All Leave Types</option>
              {Object.entries(leaveTypes).map(([key, type], idx) => (
                <option key={idx} value={key}>
                  {type.fullName}
                </option>
              ))}
            </select>

            <input
              type="date"
              className="p-2 border rounded"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
            <input
              type="date"
              className="p-2 border rounded"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>

          {/* Actions */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleDownloadDeptFaculty}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
            >
              <FiDownload /> Download Department Report
            </button>
            <button
              onClick={() => alert("Faculty report mailed to admin!")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              <FiMail /> Mail Report
            </button>
          </div>

          {/* Faculty Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-xl shadow">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">Faculty Name</th>
                  <th className="px-6 py-3 text-left">Leaves Taken</th>
                  <th className="px-6 py-3 text-left">Type</th>
                  <th className="px-6 py-3 text-left">Status</th>
                  <th className="px-6 py-3 text-left">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredFaculty.length > 0 ? (
                  filteredFaculty.map((f, idx) => (
                    <tr key={idx} className="border-b hover:bg-gray-50 transition">
                      <td className="px-6 py-3">{f.name}</td>
                      <td className="px-6 py-3">{f.leavesTaken}</td>
                      <td className="px-6 py-3">{leaveTypes[f.type]?.fullName || f.type}</td>
                      <td className="px-6 py-3">{f.status}</td>
                      <td className="px-6 py-3">
                        <button
                          onClick={() => handleDownloadFaculty(f)}
                          className="flex items-center gap-1 px-3 py-1 bg-green-500 text-white rounded hover:bg-green-600 transition"
                        >
                          <FiDownload /> Download
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan="5" className="p-4 text-center text-gray-500">
                      No faculty found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      ) : (
        <>
          {/* Department Actions */}
          <div className="flex gap-4 mb-6">
            <button
              onClick={handleDownloadDept}
              className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition"
            >
              <FiDownload /> Download All Departments
            </button>
            <button
              onClick={() => alert("Department report mailed to admin!")}
              className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
            >
              <FiMail /> Mail Report
            </button>
          </div>

          {/* Department Search */}
          <div className="flex items-center border rounded p-2 bg-white mb-6 max-w-md">
            <FiSearch className="text-gray-500 mr-2" />
            <input
              type="text"
              placeholder="Search by Department"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="outline-none w-full"
            />
          </div>

          {/* Department Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            {filteredReports.map((r, idx) => (
              <div
                key={idx}
                onClick={() => setSelectedDept(r.department)}
                className="bg-white rounded-xl shadow p-6 hover:shadow-xl transition transform hover:scale-105 cursor-pointer"
              >
                <h2 className="text-xl font-semibold">{r.department}</h2>
                <p className="text-gray-600 mt-2">Leaves Taken This Month</p>
                <p className="text-3xl font-bold mt-4">{r.leavesTaken}</p>
              </div>
            ))}
          </div>

          {/* Department Table */}
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-xl shadow">
              <thead className="bg-gray-200">
                <tr>
                  <th className="px-6 py-3 text-left">Department</th>
                  <th className="px-6 py-3 text-left">Leaves Taken</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((r, idx) => (
                  <tr
                    key={idx}
                    onClick={() => setSelectedDept(r.department)}
                    className="border-b hover:bg-gray-50 transition cursor-pointer"
                  >
                    <td className="px-6 py-3">{r.department}</td>
                    <td className="px-6 py-3">{r.leavesTaken}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
