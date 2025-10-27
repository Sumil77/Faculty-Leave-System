import { leaveTypes } from "../util/leave.js";

const formatDate = (dateString) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

export default function HistoryTable({ leaves = [] }) {
  return (
    <table className="min-w-full bg-white rounded-xl shadow overflow-hidden">
      <thead className="bg-gray-200 sticky top-0 z-10">
        <tr>
          <th className="p-2 border">User ID</th>
          <th className="p-2 border text-left">Name</th>
          <th className="p-2 border text-left">Dept.</th>
          <th className="p-2 border text-left">Type</th>
          <th className="p-2 border text-left">Applied On</th>
          <th className="p-2 border text-left">From</th>
          <th className="p-2 border text-left">To</th>
          <th className="p-2 border text-left">Days</th>
        </tr>
      </thead>
      <tbody>
        {leaves.length > 0 ? (
          leaves.map((leave, idx) => (
            <tr key={idx} className="border-b hover:bg-gray-50">
              <td className="p-2 border">{leave.user_id}</td>
              <td className="p-2 border">{leave.name || "-"}</td>
              <td className="p-2 border">{leave.dept || "-"}</td>
              <td
                className="p-2 border"
                title={leaveTypes[leave.leaveType]?.fullName || leave.leaveType || "-"}
              >
                {leaveTypes[leave.leaveType]?.acronym || leave.leaveType || "-"}
              </td>
              <td className="p-2 border">{formatDate(leave.appliedOn)}</td>
              <td className="p-2 border">{formatDate(leave.fromDate)}</td>
              <td className="p-2 border">{formatDate(leave.toDate)}</td>
              <td className="p-2 border text-center">{leave.totalDays ?? "-"}</td>
            </tr>
          ))
        ) : (
          <tr>
            <td colSpan={8} className="p-4 text-center text-gray-500">
              No records found.
            </td>
          </tr>
        )}

      </tbody>
    </table>
  );
}
