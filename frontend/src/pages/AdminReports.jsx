import { FiBarChart2 } from "react-icons/fi";

export default function AdminReports() {
  const reports = [
    { department: "CSE", leavesTaken: 12 },
    { department: "IT", leavesTaken: 10 },
    { department: "ECE", leavesTaken: 8 },
    { department: "EEE", leavesTaken: 5 },
  ];

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6 flex items-center space-x-2">
        <FiBarChart2 /> <span>Leave Reports</span>
      </h1>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        {reports.map((r, idx) => (
          <div
            key={idx}
            className="bg-white rounded-xl shadow p-6 hover:shadow-xl transition transform hover:scale-105"
          >
            <h2 className="text-xl font-semibold">{r.department}</h2>
            <p className="text-gray-600 mt-2">Leaves Taken This Month</p>
            <p className="text-3xl font-bold mt-4">{r.leavesTaken}</p>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow">
          <thead className="bg-gray-200">
            <tr>
              <th className="px-6 py-3 text-left">Department</th>
              <th className="px-6 py-3 text-left">Leaves Taken</th>
            </tr>
          </thead>
          <tbody>
            {reports.map((r, idx) => (
              <tr key={idx} className="border-b hover:bg-gray-50 transition">
                <td className="px-6 py-3">{r.department}</td>
                <td className="px-6 py-3">{r.leavesTaken}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
