import React, { useState, useEffect } from "react";
import IDCard from "../components/IdCard";
import * as leaveController from "../util/leave.js";
import { FaRegCalendarAlt, FaRegHandPaper, FaHospital, FaUserShield, FaRegClock } from "react-icons/fa";

const facultyData = {
  name: "Dr. Anjali Sharma",
  designation: "Assistant Professor",
  department: "Computer Science",
  email: "anjali.sharma@college.edu",
  phone: "+91-9876543210",
  dateOfJoining: "2020-08-15",
};

const leaveObj = leaveController.leaveTypes

const leaveTypes = Object(leaveObj)

// Icons for leave types
const leaveIcons = {
  casual: <FaRegCalendarAlt />,
  medical: <FaHospital />,
  special: <FaRegHandPaper />,
  extraOrdinary: <FaUserShield />,
  earned: <FaRegClock />,
  onDutyExam: <FaRegCalendarAlt />,
  onDutyOther: <FaRegCalendarAlt />,
  maternity: <FaRegHandPaper />,
  election: <FaUserShield />,
  compensatory: <FaRegClock />,
  withoutPay: <FaRegHandPaper />,
};

// Sample leave balance data

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
  const [recentLeaves, setRecentLeaves] = useState([]);
  const [leaveBalances, setLeaveBalance] = useState([]);
  const [sortAsc, setSortAsc] = useState(true);


  useEffect(() => {
    const fetchLeaveBalance = async () => {
      const data = await leaveController.getLeaveBalance();
      if (Array.isArray(data) && data.length > 0) {

        setLeaveBalance(data[0]); // extract the actual data
      }
    };

    const fetchRecentLeaves = async () => {
      const data = await leaveController.getRecent();
      setRecentLeaves(data);
    };

    fetchLeaveBalance();
    fetchRecentLeaves();

    console.log(leaveBalances[0]);

  }, []);

  const getFilteredLeaves = () => {
    let filtered = [...recentLeaves];

    if (yearFilter !== "All") {
      filtered = filtered.filter(
        (leave) => new Date(leave.fromDate).getFullYear().toString() === yearFilter
      );
    }

    if (monthFilter !== "All") {
      filtered = filtered.filter(
        (leave) => new Date(leave.fromDate).getMonth().toString() === monthFilter
      );
    }

    filtered.sort((a, b) => {
      const dateA = new Date(a.fromDate);
      const dateB = new Date(b.fromDate);
      return sortAsc ? dateA - dateB : dateB - dateA;
    });

    return filtered;
  };

  const filteredLeaves = getFilteredLeaves();

  const years = [...new Set(recentLeaves.map((l) => new Date(l.fromDate).getFullYear().toString()))];
  const months = [
    "January", "February", "March", "April", "May", "June",
    "July", "August", "September", "October", "November", "December",
  ];

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Dashboard Heading */}
      <h2 className="text-3xl font-bold text-gray-800 mb-6 flex justify-center">Faculty Dashboard</h2>

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
          {/* Scrollable Table Container */}
          <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
            <table className="w-full text-left border-collapse">
              <thead className="sticky top-0 bg-gray-200 z-10">
                <tr className="text-gray-700">
                  <th className="p-3 border-b">Date</th>
                  <th className="p-3 border-b">Leave Type</th>
                  <th className="p-3 border-b">Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredLeaves.map((leave, index) => (
                  <tr key={index} className="hover:bg-gray-100">
                    <td className="p-3 border-b">{formatDate(leave.fromDate)}</td>
                    <td className="p-3 border-b">{leaveTypes[leave.leaveType]?.fullName || "Unknown"}</td>
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

        </div>

        {/* ID Card */}
        <div className="lg:ml-auto mt-6 lg:mt-0">
          <IDCard faculty={facultyData} />
        </div>
      </div>

      {/* Leave Balances Section */}
      <div className="bg-white shadow-lg rounded-lg p-6 mt-6">
        <h3 className="text-2xl font-bold mb-4 text-gray-800">Leave Balance (In Days)</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {Object.entries(leaveBalances).filter(([leaveType]) => leaveType in leaveTypes).map(([leaveType, balance]) => (
            <div
              key={leaveType}
              className={`flex items-center justify-between p-6 border rounded-lg shadow-md transform transition-all duration-300 ${balance === 0
                ? "bg-red-100 hover:scale-105"
                : balance <= 3
                  ? "bg-yellow-100 hover:scale-105"
                  : "bg-green-100 hover:scale-110"
                }`}
            >
              <div className="flex items-center space-x-3">
                <div className="text-xl text-gray-700">{leaveIcons[leaveType]}</div>
                <span className="text-lg font-semibold text-gray-800">{leaveObj[leaveType].fullName}: </span>
              </div>
              <span className="text-lg font-semibold text-gray-900">{balance}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
