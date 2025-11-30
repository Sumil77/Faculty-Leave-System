import { useSelector } from "react-redux";

export default function SummaryTable({ leaves }) {
  const leaveTypes = useSelector((state) => state.global.leaveTypes); // stored on login
  if (!leaves || leaves.length === 0) {
    return (
      <div className="p-4 text-center text-gray-500">No records found.</div>
    );
  }

  // Get all leave type keys from the first row (assumes all rows have same keys)
  const leaveTypeKeys = Object.keys(leaves[0]).filter(
    (k) => !['user_id', 'name', 'dept', 'Total'].includes(k)
  );

  return (
    <table className="min-w-full bg-white rounded-xl shadow">
      <thead className="bg-gray-200 sticky top-0">
        <tr>
          <th className="p-2 border">UID</th>
          <th className="p-2 border text-left">Name</th>
          <th className="p-2 border text-left">Dept.</th>
          {leaveTypeKeys.map((key) => {
            const type = Object.values(leaveTypes).find(
              (t) => t.fullName === key
            );
            return (
              <th key={key} className="p-2 border text-center" title={type?.fullName}>
                {type?.acronym || key}
              </th>
            );
          })}
          <th className="p-2 border text-center">Total</th>
        </tr>
      </thead>
      <tbody>
        {leaves.map((l) => (
          <tr key={l.user_id} className="border-b hover:bg-gray-50">
            <td className="p-2 border">{l.user_id}</td>
            <td className="p-2 border">{l.name}</td>
            <td className="p-2 border">{l.dept}</td>
            {leaveTypeKeys.map((key) => (
              <td key={key} className="p-2 border text-center">
                {typeof l[key] === "object" && l[key] !== null ? "-" : l[key] ?? "-"}
              </td>

            ))}
            <td className="p-2 border text-center">{l.Total ?? '-'}</td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
