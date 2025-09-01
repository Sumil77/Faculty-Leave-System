import { useState } from "react";
import { FiCheckCircle, FiXCircle } from "react-icons/fi";

export default function AdminRequests() {
  const [requests, setRequests] = useState([
    { id: 1, name: "John Doe", from: "2025-08-25", to: "2025-08-27", reason: "Medical", status: "Pending" },
    { id: 2, name: "Jane Smith", from: "2025-08-30", to: "2025-09-01", reason: "Conference", status: "Pending" },
  ]);

  const handleApprove = (id) =>
    setRequests(requests.map((req) => (req.id === id ? { ...req, status: "Approved" } : req)));
  const handleReject = (id) =>
    setRequests(requests.map((req) => (req.id === id ? { ...req, status: "Rejected" } : req)));

  const statusColors = {
    Pending: "bg-yellow-200 text-yellow-800",
    Approved: "bg-green-200 text-green-800",
    Rejected: "bg-red-200 text-red-800",
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <h1 className="text-3xl font-bold mb-6">Pending Leave Requests</h1>
      <div className="overflow-x-auto">
        <table className="min-w-full bg-white rounded-xl shadow">
          <thead className="bg-gray-200">
            <tr>
              {["Faculty Name", "From", "To", "Reason", "Status", "Actions"].map((h, i) => (
                <th key={i} className="px-6 py-3 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {requests.map((req) => (
              <tr key={req.id} className="border-b hover:bg-gray-50 transition">
                <td className="px-6 py-3">{req.name}</td>
                <td className="px-6 py-3">{req.from}</td>
                <td className="px-6 py-3">{req.to}</td>
                <td className="px-6 py-3">{req.reason}</td>
                <td className="px-6 py-3">
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-medium ${statusColors[req.status]}`}
                  >
                    {req.status}
                  </span>
                </td>
                <td className="px-6 py-3 flex space-x-4">
                  {req.status === "Pending" && (
                    <>
                      <button
                        onClick={() => handleApprove(req.id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2 min-w-[100px] rounded-md shadow-md transition flex items-center justify-center space-x-2 text-base"
                      >
                        <FiCheckCircle size={20} />
                        <span>Approve</span>
                      </button>
                      <button
                        onClick={() => handleReject(req.id)}
                        className="bg-red-600 hover:bg-red-700 text-white px-5 py-2 min-w-[100px] rounded-md shadow-md transition flex items-center justify-center space-x-2 text-base"
                      >
                        <FiXCircle size={20} />
                        <span>Reject</span>
                      </button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
