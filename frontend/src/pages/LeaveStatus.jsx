import { useState, useEffect } from "react";
import * as leaveController from "../util/leave.js";

const LeaveStatus = () => {
  const [leaves, setLeaves] = useState([]);
  const [statusFilter, setStatusFilter] = useState("Approved");
  const [typeFilter, setTypeFilter] = useState(null);
  const [selectedLeaves, setSelectedLeaves] = useState([]);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [dateField, setDateField] = useState("appliedOn");
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const loadLeaves = async () => {
    try {
      setLoading(true);
      setError("");

      const { data, pagination } = await leaveController.getLeaves({
        statusFilter,
        typeFilter,
        page: currentPage,
        limit: entriesPerPage,
        rangeField: dateField,
        startDate,
        endDate,
      });

      setLeaves(data);
      setTotalPages(pagination.totalPages);
    } catch (err) {
      console.error("Failed to fetch leaves:", err);
      setError("Something went wrong while fetching leaves!");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadLeaves();
  }, [statusFilter, typeFilter, currentPage, entriesPerPage, dateField, startDate, endDate]);

  const handleSelectLeave = (id) => {
    if (selectedLeaves.includes(id)) {
      setSelectedLeaves(selectedLeaves.filter((leaveId) => leaveId !== id));
    } else {
      setSelectedLeaves([...selectedLeaves, id]);
    }
  };

  const handleCancelSelected = () => {
    setLeaves(leaves.filter((leave) => !selectedLeaves.includes(leave.id)));
    setSelectedLeaves([]);
  };

  return (
    <div className="p-6">
      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6">
        <select
          className="p-2 border rounded"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
            setSelectedLeaves([]);
          }}
        >
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>

        <select
          className="p-2 border rounded"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="*">All Types</option>
          <option value="Sick Leave">Sick Leave</option>
          <option value="Casual Leave">Casual Leave</option>
          {/* Add more if needed */}
        </select>

        <select
          className="p-2 border rounded"
          value={dateField}
          onChange={(e) => setDateField(e.target.value)}
        >
          <option value="appliedOn">Applied On</option>
          <option value="fromDate">From Date</option>
          <option value="toDate">To Date</option>
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

        <select
          className="p-2 border rounded"
          value={entriesPerPage}
          onChange={(e) => {
            setEntriesPerPage(Number(e.target.value));
            setCurrentPage(1);
          }}
        >
          <option value={5}>5 per page</option>
          <option value={10}>10 per page</option>
          <option value={20}>20 per page</option>
        </select>
      </div>

      {/* Cancel Button */}
      {statusFilter === "Pending" && (
        <button
          className={`mb-4 p-2 px-4 rounded ${selectedLeaves.length > 0
            ? "bg-red-500 hover:bg-red-600 text-white"
            : "bg-gray-400 cursor-not-allowed"
            }`}
          disabled={selectedLeaves.length === 0}
          onClick={handleCancelSelected}
        >
          Cancel Selected Leaves
        </button>
      )}

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center p-4">Loading...</div>
        ) : error ? (
          <div className="text-center p-4 text-red-500">{error}</div>
        ) : (
          <div className="max-h-96 overflow-y-auto">
            <table className="w-full border-collapse">
              <thead className="sticky top-0 bg-gray-200 z-10">
                <tr>
                  {statusFilter === "Pending" && <th className="p-2 border bg-gray-200">Select</th>}
                  <th className="p-2 border bg-gray-200">Applied On</th>
                  <th className="p-2 border bg-gray-200">Type</th>
                  <th className="p-2 border bg-gray-200">From Date</th>
                  <th className="p-2 border bg-gray-200">To Date</th>
                  <th className="p-2 border bg-gray-200">Status</th>
                </tr>
              </thead>
              <tbody>
                {leaves.length > 0 ? (
                  leaves.map((leave) => (
                    <tr key={leave.id} className="text-center">
                      {statusFilter === "Pending" && (
                        <td className="p-2 border">
                          <input
                            type="checkbox"
                            checked={selectedLeaves.includes(leave.id)}
                            onChange={() => handleSelectLeave(leave.id)}
                          />
                        </td>
                      )}
                      <td className="p-2 border">{leave.appliedOn}</td>
                      <td className="p-2 border">{leaveController.leaveTypes[leave.leaveType].fullName}</td>
                      <td className="p-2 border">{leave.fromDate}</td>
                      <td className="p-2 border">{leave.toDate}</td>
                      <td className="p-2 border">{statusFilter}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={statusFilter === "Pending" ? 6 : 5} className="p-4">
                      No leaves found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

        )}
      </div>

      {/* Pagination Controls */}
      <div className="flex justify-between items-center mt-6">
        <button
          className="p-2 px-4 bg-blue-500 text-white rounded disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((prev) => prev - 1)}
        >
          Prev
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          className="p-2 px-4 bg-blue-500 text-white rounded disabled:opacity-50"
          disabled={currentPage === totalPages}
          onClick={() => setCurrentPage((prev) => prev + 1)}
        >
          Next
        </button>
      </div>
    </div>
  );
};

export default LeaveStatus;
