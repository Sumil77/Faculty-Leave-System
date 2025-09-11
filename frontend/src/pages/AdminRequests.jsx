import React, { useState, useMemo, useEffect } from "react";
import {
  FiCheckCircle,
  FiXCircle,
  FiUser,
  FiSearch,
  FiFilter,
  FiChevronUp,
  FiChevronDown,
  FiRefreshCw,
  FiDownload,
} from "react-icons/fi";
import * as adminController from "../util/admin"

export default function AdminRequests() {
  const [requests, setRequests] = useState([]);
  const [filters, setFilters] = useState({
    search: "",
    status: "All",
    dept: "All",
    fromDate: "",
    toDate: "",
    appliedFrom: "",
    appliedTo: "",
  });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: "from", direction: "asc" });
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [reason, setReason] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [depts, setDepts] = useState(["All"]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setFilters(f => ({ ...f, search: searchInput })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset page when filters change
  useEffect(() => setPage(1), [filters, rowsPerPage]);

  // Fetch requests from server
  const loadRequests = async () => {
    try {
      const queryFilters = {};

      // Only include filters if they are active
      if (filters.status !== "All") queryFilters.status = filters.status;
      if (filters.dept !== "All") queryFilters.dept = filters.dept;
      if (filters.search) queryFilters.search = filters.search;
      if (filters.fromDate) queryFilters.fromDate = filters.fromDate;
      if (filters.toDate) queryFilters.toDate = filters.toDate;
      if (filters.appliedFrom) queryFilters.appliedFrom = filters.appliedFrom;
      if (filters.appliedTo) queryFilters.appliedTo = filters.appliedTo;

      // Always include pagination & sorting
      queryFilters.page = page;
      queryFilters.limit = rowsPerPage;
      queryFilters.sortKey = sortConfig.key;
      queryFilters.sortDir = sortConfig.direction;

      const json = await adminController.getLeaves(queryFilters);

      console.log(json);
      

      setRequests(json.data || []);
      setTotalPages(json.pagination?.totalPages || 1);
      setDepts(["All", ...Array.from(new Set((json.data || []).map(r => r.dept)))]);
    } catch (err) {
      console.error("Failed to fetch requests", err);
    }
  };


  useEffect(() => { loadRequests(); }, [filters, page, rowsPerPage, sortConfig]);

  // Approve / Reject / Cancel actions
  const handleAction = async (actionType, ids) => {
    try {
      await Promise.all(ids.map(id =>
        fetch(`/api/admin/leaves/${id}`, {
          method: "PATCH",
          body: JSON.stringify({ status: actionType, actionReason: reason }),
          headers: { "Content-Type": "application/json" },
        })
      ));
      setModalOpen(false); setSelectedIds([]); setSelectedId(null); setReason("");
      loadRequests();
    } catch (err) {
      console.error(err);
    }
  };

  const confirmAction = () => {
    const idsToUpdate = selectedIds.length ? selectedIds : [selectedId];
    handleAction(modalAction, idsToUpdate);
  };

  // Reset selection when status filter changes
  useEffect(() => { setSelectedIds([]); }, [filters.status]);

  const requestSort = (key) => {
    setSortConfig(prev => ({ key, direction: prev.key === key && prev.direction === "asc" ? "desc" : "asc" }));
  };

  // Export CSV using currently displayed requests
  const exportCSV = () => {
    const rows = [["ID", "Name", "Dept.", "From", "To", "Applied", "Reason", "Status"], ...requests.map(r => [r.id, r.name, r.dept, r.from, r.to, r.applied, r.reason, r.status])];
    const csv = rows.map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "leave_requests.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilters({ search: "", status: "All", dept: "All", fromDate: "", toDate: "", appliedFrom: "", appliedTo: "" });
    setSearchInput("");
  };

  // Filtered and sorted requests (used for checkboxes & pagination)
  const filtered = useMemo(() => {
    let data = [...requests];

    // Filter by status
    if (filters.status !== "All") data = data.filter(r => r.status === filters.status);

    // Filter by dept
    if (filters.dept !== "All") data = data.filter(r => r.dept === filters.dept);

    // Filter by search
    if (filters.search) {
      const s = filters.search.toLowerCase();
      data = data.filter(
        r =>
          r.name.toLowerCase().includes(s) ||
          r.reason.toLowerCase().includes(s) ||
          r.dept.toLowerCase().includes(s) ||
          r.status.toLowerCase().includes(s)
      );
    }

    // Sorting
    if (sortConfig.key) {
      data.sort((a, b) => {
        const aVal = a[sortConfig.key] ?? "";
        const bVal = b[sortConfig.key] ?? "";
        if (aVal < bVal) return sortConfig.direction === "asc" ? -1 : 1;
        if (aVal > bVal) return sortConfig.direction === "asc" ? 1 : -1;
        return 0;
      });
    }

    return data;
  }, [requests, filters, sortConfig]);

  // Paginated requests
  const paginated = useMemo(() => {
    const start = (page - 1) * rowsPerPage;
    return filtered.slice(start, start + rowsPerPage);
  }, [filtered, page, rowsPerPage]);

  const statusColors = {
    Pending: "bg-yellow-100 text-yellow-800 border border-yellow-300",
    Approved: "bg-green-100 text-green-800 border border-green-300",
    Rejected: "bg-red-100 text-red-800 border border-red-300",
    Cancelled: "bg-gray-100 text-gray-700 border border-gray-300",
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold">Leave Requests</h1>
          <div className="flex items-center gap-2">
            {selectedIds.length > 0 && filters.status !== "All" && (
              <>
                {filters.status === "Pending" && (
                  <>
                    <button
                      onClick={() => {
                        setModalAction("Approved");
                        setModalOpen(true);
                      }}
                      className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm"
                    >
                      Bulk Approve ({selectedIds.length})
                    </button>
                    <button
                      onClick={() => {
                        setModalAction("Rejected");
                        setModalOpen(true);
                      }}
                      className="bg-red-600 hover:bg-red-700 text-white px-3 py-2 rounded-lg text-sm"
                    >
                      Bulk Reject ({selectedIds.length})
                    </button>
                    <button
                      onClick={() => {
                        setModalAction("Cancelled");
                        setModalOpen(true);
                      }}
                      className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                    >
                      Bulk Cancel ({selectedIds.length})
                    </button>
                  </>
                )}

                {filters.status === "Approved" && (
                  <button
                    onClick={() => {
                      setModalAction("Cancelled");
                      setModalOpen(true);
                    }}
                    className="bg-gray-600 hover:bg-gray-700 text-white px-3 py-2 rounded-lg text-sm"
                  >
                    Bulk Cancel ({selectedIds.length})
                  </button>
                )}

                {filters.status === "Rejected" && (
                  <button
                    onClick={() => {
                      setModalAction("Approved");
                      setModalOpen(true);
                    }}
                    className="bg-green-600 hover:bg-green-700 text-white px-3 py-2 rounded-lg text-sm"
                  >
                    Bulk Approve ({selectedIds.length})
                  </button>
                )}
              </>
            )}

            <button
              onClick={exportCSV}
              className="flex items-center gap-2 px-3 py-2 bg-white border rounded shadow-sm text-sm"
            >
              <FiDownload /> Export CSV
            </button>
            <button
              onClick={() => setRequests((r) => [...r])}
              className="p-2 bg-white border rounded shadow-sm"
              title="Refresh"
            >
              <FiRefreshCw />
            </button>
          </div>

        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative md:col-span-2">
              <FiSearch className="absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                placeholder="Search name / reason / dept / status..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border rounded-lg shadow-sm"
                aria-label="Search requests"
              />
            </div>

            <div className="flex items-center gap-2">
              <FiFilter className="text-gray-500" />
              <select
                value={filters.status}
                onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg shadow-sm"
              >
                <option value="All">All Status</option>
                <option value="Pending">Pending</option>
                <option value="Approved">Approved</option>
                <option value="Rejected">Rejected</option>
              </select>
            </div>

            <div>
              <select
                value={filters.dept}
                onChange={(e) => setFilters((f) => ({ ...f, dept: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg shadow-sm"
              >
                {depts.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Date ranges */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-4">
            <div>
              <label className="block text-sm text-gray-600 mb-1">Leave From</label>
              <input
                type="date"
                value={filters.fromDate}
                onChange={(e) => setFilters((f) => ({ ...f, fromDate: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Leave To</label>
              <input
                type="date"
                value={filters.toDate}
                onChange={(e) => setFilters((f) => ({ ...f, toDate: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg shadow-sm"
              />
            </div>

            <div>
              <label className="block text-sm text-gray-600 mb-1">Applied From</label>
              <input
                type="date"
                value={filters.appliedFrom}
                onChange={(e) => setFilters((f) => ({ ...f, appliedFrom: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg shadow-sm"
              />
            </div>
            <div>
              <label className="block text-sm text-gray-600 mb-1">Applied To</label>
              <input
                type="date"
                value={filters.appliedTo}
                onChange={(e) => setFilters((f) => ({ ...f, appliedTo: e.target.value }))}
                className="w-full px-3 py-2 border rounded-lg shadow-sm"
              />
            </div>

          </div>

          <div className="flex items-center gap-2 mt-4">
            <button
              onClick={clearFilters}
              className="px-3 py-2 bg-white border rounded shadow-sm text-sm"
            >
              Clear Filters
            </button>

            <div className="ml-auto flex items-center gap-2">
              <label className="text-sm text-gray-600">Rows</label>
              <select
                value={rowsPerPage}
                onChange={(e) => setRowsPerPage(Number(e.target.value))}
                className="px-3 py-2 border rounded-lg shadow-sm"
              >
                {[5, 10, 20, 50].map((n) => (
                  <option key={n} value={n}>
                    {n}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl shadow-md overflow-hidden">
          {paginated.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="min-w-full text-sm text-left">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-6 py-3">
                      <input
                        type="checkbox"
                        disabled={filters.status === "All"}
                        checked={selectedIds.length === filtered.length && filtered.length > 0}
                        onChange={(e) =>
                          setSelectedIds(e.target.checked ? filtered.map((r) => r.id) : [])
                        }
                      />
                    </th>
                    {["name", "dept.", "from", "to", "applied", "reason", "status"].map((key, i) => (
                      <th
                        key={i}
                        onClick={() => requestSort(key)}
                        className="px-4 py-4 font-semibold cursor-pointer select-none"
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                        {sortConfig.key === key && (sortConfig.direction === "asc" ? <FiChevronUp className="inline ml-1" /> : <FiChevronDown className="inline ml-1" />)}
                      </th>
                    ))}
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((req) => (
                    <tr
                      key={req.id}
                      className={`border-b last:border-none hover:bg-gray-50 ${selectedIds.includes(req.id) ? "bg-blue-50" : ""
                        }`}
                    >
                      <td className="px-6 py-3">
                        <input
                          type="checkbox"
                          disabled={filters.status === "All"}
                          checked={selectedIds.includes(req.id)}
                          onChange={(e) =>
                            setSelectedIds((prev) =>
                              e.target.checked ? [...prev, req.id] : prev.filter((id) => id !== req.id)
                            )
                          }
                        />
                      </td>

                      <td className="px-4 py-4 flex items-center">{req.name}</td>
                      <td className="px-4 py-4">{req.dept}</td>
                      <td className="px-4 py-4">{req.from}</td>
                      <td className="px-4 py-4">{req.to}</td>
                      <td className="px-4 py-4">{req.applied}</td>
                      <td className="px-4 py-4">{req.reason}</td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[req.status]}`}>
                          {req.status}
                        </span>
                      </td>
                      <td className="px-3 py-4 flex gap-3">
                        {req.status === "Pending" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedId(req.id);
                                setModalAction("Approved");
                                setModalOpen(true);
                              }}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm shadow-sm"
                            >
                              <FiCheckCircle size={18} /> Approve
                            </button>
                            <button
                              onClick={() => {
                                setSelectedId(req.id);
                                setModalAction("Rejected");
                                setModalOpen(true);
                              }}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm shadow-sm"
                            >
                              <FiXCircle size={18} /> Reject
                            </button>
                            <button
                              onClick={() => {
                                setSelectedId(req.id);
                                setModalAction("Cancelled");
                                setModalOpen(true);
                              }}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-sm shadow-sm"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {req.status === "Approved" && (
                          <>
                            <button
                              onClick={() => {
                                setSelectedId(req.id);
                                setModalAction("Rejected");
                                setModalOpen(true);
                              }}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-red-600 hover:bg-red-700 text-white text-sm shadow-sm"
                            >
                              <FiXCircle size={18} /> Reject
                            </button>
                            <button
                              onClick={() => {
                                setSelectedId(req.id);
                                setModalAction("Cancelled");
                                setModalOpen(true);
                              }}
                              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white text-sm shadow-sm"
                            >
                              Cancel
                            </button>
                          </>
                        )}

                        {req.status === "Rejected" && (
                          <button
                            onClick={() => {
                              setSelectedId(req.id);
                              setModalAction("Approved");
                              setModalOpen(true);
                            }}
                            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm shadow-sm"
                          >
                            <FiCheckCircle size={18} /> Approve
                          </button>
                        )}
                        {/* Cancelled → No actions */}
                      </td>


                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="p-10 text-center text-gray-500">No requests match your filters.</div>
          )}
        </div>

        {/* Pagination Controls */}
        <div className="flex justify-between items-center mt-4">
          <span className="text-sm text-gray-600">
            Page {page} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button disabled={page === 1} onClick={() => setPage(1)} className="px-3 py-1 border rounded disabled:opacity-50">
              First
            </button>
            <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border rounded disabled:opacity-50">
              Previous
            </button>

            <div className="flex items-center gap-2">
              <input
                type="number"
                min={1}
                max={totalPages}
                value={page}
                onChange={(e) => setPage(Math.min(Math.max(1, Number(e.target.value || 1)), totalPages))}
                className="w-16 px-2 py-1 border rounded text-center"
                aria-label="Page number"
              />
              <button disabled={page === totalPages} onClick={() => setPage((p) => Math.min(totalPages, p + 1))} className="px-3 py-1 border rounded disabled:opacity-50">
                Next
              </button>
              <button disabled={page === totalPages} onClick={() => setPage(totalPages)} className="px-3 py-1 border rounded disabled:opacity-50">
                Last
              </button>
            </div>
          </div>
        </div>
      </div>
      {modalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg w-full max-w-md p-6">
            <h2 className="text-xl font-semibold mb-4">
              Confirm {modalAction} {selectedIds.length > 1 ? `${selectedIds.length} requests` : "request"}
            </h2>

            <p className="text-sm text-gray-600 mb-4">
              Please provide a reason for this action. This will be recorded.
            </p>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Enter reason..."
              className="w-full border rounded-lg p-2 mb-4 focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setReason("");
                  setModalOpen(false);
                }}
                className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-100"
              >
                Cancel
              </button>
              <button
                onClick={confirmAction}
                disabled={!reason.trim()}
                className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-700 text-white disabled:opacity-50"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
