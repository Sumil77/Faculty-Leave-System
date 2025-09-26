import { leaveTypes } from "../util/leave.js";

export default function SummaryTable({ leaves }) {
  return (
    <table className="min-w-full bg-white rounded-xl shadow">
      <thead className="bg-gray-200 sticky top-0">
        <tr>
          <th className="p-2 border">User ID</th>
          <th className="p-2 border text-left">Name</th>
          <th className="p-2 border text-left">Dept.</th>
          {Object.entries(leaveTypes).map(([key, type]) => (
            <th key={key} className="p-2 border text-center" title={type.fullName}>
              {type.acronym}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>
        {leaves.length > 0 ? (
          leaves.map((l) => (
            <tr key={l.user_id} className="border-b hover:bg-gray-50">
              <td className="p-2 border">{l.user_id}</td>
              <td className="p-2 border">{l.name}</td>
              <td className="p-2 border">{l.dept}</td>
              {Object.keys(leaveTypes).map((key) => {
                const backendKey = key === "extraOrdinary" ? "extraordinary" : key;
                const value = l[backendKey];
                return (
                  <td key={key} className="p-2 border text-center">
                    {value === null || value === undefined ? "-" : value}
                  </td>
                );
              })}
            </tr>
          ))
        ) : (
          <tr>
            <td
              colSpan={3 + Object.keys(leaveTypes).length}
              className="p-4 text-center text-gray-500"
            >
              No records found.
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
