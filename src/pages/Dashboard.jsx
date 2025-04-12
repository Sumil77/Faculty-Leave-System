import React, { useState } from "react";
import IDCard from "../components/IdCard";
import { FaRegCalendarAlt, FaRegHandPaper, FaHospital, FaUserShield, FaRegClock } from "react-icons/fa";

const facultyData = {
  name: "Dr. Anjali Sharma",
  designation: "Assistant Professor",
  department: "Computer Science",
  email: "anjali.sharma@college.edu",
  phone: "+91-9876543210",
  dateOfJoining: "2020-08-15",
};

// Mapping leave type codes to human-readable descriptions
const leaveTypes = {
  "1": "Casual Leave",
  "2": "Medical Leave",
  "3": "Special Casual Leave",
  "4": "Extra Ordinary Leave",
  "5": "Earned Leave",
  "6-i": "On Duty Leave (Exam Purpose)",
  "6-ii": "On Duty Leave (General Rest)",
  "7": "Maternity Leave",
  "8": "Election Leave (College Election)",
  "9": "Compensatory Leave",
  "10": "Leave Without Pay",
};

// Icons for leave types
const leaveIcons = {
  "1": <FaRegCalendarAlt />,
  "2": <FaHospital />,
  "3": <FaRegHandPaper />,
  "4": <FaUserShield />,
  "5": <FaRegClock />,
  "6-i": <FaRegCalendarAlt />,
  "6-ii": <FaRegCalendarAlt />,
  "7": <FaRegHandPaper />,
  "8": <FaUserShield />,
  "9": <FaRegClock />,
  "10": <FaRegHandPaper />,
};

// Sample leave balance data
const leaveBalances = {
  "1": 10, // Casual Leave
  "2": 5,  // Medical Leave
  "3": 7,  // Special Casual Leave
  "4": 3,  // Extra Ordinary Leave
  "5": 15, // Earned Leave
  "6-i": 2, // On Duty Leave (Exam Purpose)
  "6-ii": 5, // On Duty Leave (General Rest)
  "7": 90, // Maternity Leave
  "8": 1,  // Election Leave
  "9": 5,  // Compensatory Leave
  "10": 0, // Leave Without Pay
};

const allLeaves = [
  { date: "2023-11-12", leaveType: "1", status: "Approved" },
  { date: "2024-01-05", leaveType: "2", status: "Rejected" },
  { date: "2024-02-20", leaveType: "3", status: "Approved" },
  { date: "2024-03-15", leaveType: "6-i", status: "Pending" },
  { date: "2023-05-10", leaveType: "7", status: "Approved" },
];

const getStatusColor = (status) => {
  switch (status.toLowerCase()) {
    case "approved":
      return "text-green-600 font-semibold";
    case "rejected":
      return "text-red-600 font-semibold";
    case "pending":
      return "text-yellow-600 font-semibold";
    default:
      return "text-gray-600";
  }
};

const formatDate = (dateString) => {
  const date = new Date(dateString);
  const day = ("0" + date.getDate()).slice(-2);
  const month = ("0" + (date.getMonth() + 1)).slice(-2); // Months are zero-based, so add 1
  const year = date.getFullYear();
  return `${day}/${month}/${year}`;
};

const Dashboard = () => {
  const [yearFilter, setYearFilter] = useState("All");
  const [monthFilter, setMonthFilter] = useState("All");
  const [sortAsc, setSortAsc] = useState(true);

  const getFilteredLeaves = () => {
    let filtered = [...allLeaves];

    if (yearFilter !== "All") {
      filtered = filtered.filter(
        (leave) => new Date(leave.date).getFullYear().toString() === yearFilter
      );
    }

    if (monthFilter !== "All") {
      filtered = filtered.filter(
        (leave) => new Date(leave.date).getMonth().toString() === monthFilter
      );
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.date);
      const dateB = new Date(b.date);
      return sortAsc ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  };

  const filteredLeaves = getFilteredLeaves();

  const years = [...new Set(allLeaves.map((l) => new Date(l.date).getFullYear().toString()))];
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      {/* Dashboard Heading */}
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex justify-center pb-10">Faculty Dashboard</h2>

      <div className="flex flex-col lg:flex-row gap-6 justify-between items-start">
        {/* Past Leaves Table */}
        <div className="bg-white shadow-lg rounded-lg p-6 w-full lg:w-[650px]">
          <h3 className="text-2xl font-bold mb-4 text-gray-800">Past Leaves</h3>

          {/* Filters */}
          <div className="flex flex-wrap gap-4 mb-4">
            <select
              value={yearFilter}
              onChange={(e) => setYearFilter(e.target.value)}
              className="p-2 border rounded-md"
            >
              <option value="All">All Years</option>
              {years.map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>

            <select
              value={monthFilter}
              onChange={(e) => setMonthFilter(e.target.value)}
              className="p-2 border rounded-md"
            >
              <option value="All">All Months</option>
              {months.map((m, i) => (
                <option key={i} value={i.toString()}>{m}</option>
              ))}
            </select>

            <button
              onClick={() => setSortAsc(!sortAsc)}
              className="px-4 py-2 bg-blue-500 text-white rounded-md"
            >
              Sort by Date {sortAsc ? "↑" : "↓"}
            </button>
          </div>

          {/* Table */}
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-gray-200 text-gray-700">
                <th className="p-3 border-b">Date</th>
                <th className="p-3 border-b">Leave Type</th>
                <th className="p-3 border-b">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredLeaves.map((leave, index) => (
                <tr key={index} className="hover:bg-gray-100">
                  <td className="p-3 border-b">{formatDate(leave.date)}</td>
                  <td className="p-3 border-b">{leaveTypes[leave.leaveType]}</td>
                  <td className={`p-3 border-b ${getStatusColor(leave.status)}`}>
                    {leave.status}
                  </td>
                </tr>
              ))}
              {filteredLeaves.length === 0 && (
                <tr>
                  <td colSpan="3" className="p-4 text-center text-gray-500">
                    No leaves found for selected filters.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* ID Card */}
        <div className="lg:ml-auto mt-6 lg:mt-0">
          <IDCard faculty={facultyData} />
        </div>
      </div>

      {/* Leave Balances Section */}
      <div className="bg-white shadow-lg rounded-lg p-6 mt-6">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">Leave Balances</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Object.entries(leaveBalances).map(([leaveType, balance]) => (
            <div
              key={leaveType}
              className={`flex items-center justify-between p-6 border rounded-lg shadow-md transform transition-all duration-300 ${
                balance === 0
                  ? "bg-red-100 hover:scale-105"
                  : balance <= 3
                  ? "bg-yellow-100 hover:scale-105"
                  : "bg-green-100 hover:scale-110"
              }`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-xl text-gray-700">{leaveIcons[leaveType]}</div>
                <span className="text-lg font-semibold text-gray-800">{leaveTypes[leaveType]}</span>
              </div>
              <span className="text-lg font-semibold text-gray-900">{balance} days</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
