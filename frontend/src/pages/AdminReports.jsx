import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { getLeaves, downloadReport, mailReport } from "../util/admin";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FiDownload, FiMail, FiFileText } from "react-icons/fi";

const AdminReports = () => {
  const navigate = useNavigate();

  const [stats, setStats] = useState({
    totalLeaves: 0,
    pending: 0,
    approvedPercent: 0,
    topDept: "-",
  });

  const [deptReports, setDeptReports] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // 🚀 Load stats from API
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const res = await getLeaves({ summary: true }); // ✅ backend should return summary + dept breakdown
        setStats(res.stats || {});
        setDeptReports(res.deptReports || []);
      } catch (err) {
        setError("Failed to load reports");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  if (loading) {
    return <div className="p-6 animate-pulse">Loading reports...</div>;
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>;
  }

  return (
    <div className="p-6">
      {/* 🔹 Page Title */}
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">Admin Reports Dashboard</h2>
        <div className="flex gap-3">
          <button
            onClick={() => navigate("/admin/reports/generator")}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow"
          >
            <FiFileText /> Generate Reports
          </button>
          <button
            onClick={() => mailReport({})}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 shadow"
          >
            <FiMail /> Mail Report
          </button>
        </div>
      </div>

      {/* 🔹 Quick Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="p-4 bg-blue-50 rounded-xl shadow">
          <h4 className="text-sm font-medium">Total Leaves</h4>
          <p className="text-2xl font-bold">{stats.totalLeaves}</p>
        </div>
        <div className="p-4 bg-yellow-50 rounded-xl shadow">
          <h4 className="text-sm font-medium">Pending</h4>
          <p className="text-2xl font-bold">{stats.pending}</p>
        </div>
        <div className="p-4 bg-green-50 rounded-xl shadow">
          <h4 className="text-sm font-medium">Approved %</h4>
          <p className="text-2xl font-bold">{stats.approvedPercent}%</p>
        </div>
        <div className="p-4 bg-purple-50 rounded-xl shadow">
          <h4 className="text-sm font-medium">Top Dept</h4>
          <p className="text-xl font-bold">{stats.topDept}</p>
        </div>
      </div>

      {/* 🔹 Department Trend Chart */}
      <div className="bg-white rounded-xl shadow p-4 mb-6">
        <h3 className="text-lg font-semibold mb-4">Leaves by Department</h3>
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={deptReports}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="leaves" fill="#3b82f6" radius={[8, 8, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 🔹 Department Summary Cards */}
      <h3 className="text-xl font-semibold mb-4">Department Summary</h3>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {deptReports.map((dept, idx) => (
          <div
            key={idx}
            className="p-4 bg-gray-50 rounded-xl shadow flex flex-col"
          >
            <h4 className="text-lg font-bold mb-2">{dept.name}</h4>
            <p>Total Leaves: {dept.leaves}</p>
            <p>Approved: {dept.approved}</p>
            <p>Rejected: {dept.rejected}</p>
            <p>Pending: {dept.pending}</p>
            <button
              onClick={() => downloadReport({ dept: dept.name })}
              className="mt-3 flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow"
            >
              <FiDownload /> Download CSV
            </button>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminReports;
