// AdminRequests_fixed_part1.jsx
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
import * as leaveController from "../util/leave"
import { useSelector } from "react-redux";

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
    leaveType: undefined, // will hold leave_type_id (number) or undefined
  });
  const [page, setPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);
  const [sortConfig, setSortConfig] = useState({ key: "fromDate", direction: "asc" });
  const [selectedIds, setSelectedIds] = useState([]);
  const [modalOpen, setModalOpen] = useState(false);
  const [modalAction, setModalAction] = useState(null);
  const [selectedId, setSelectedId] = useState(null);
  const [reason, setReason] = useState("");
  const [searchInput, setSearchInput] = useState("");
  // Instead of building depts dynamically from current page:
  const allDepartments = ["All", "CSE", "ECE", "ME", "CE"]; // or fetch from backend
  const [depts, setDepts] = useState(allDepartments);

  // leaveTypes in redux is an object keyed by names: { casual: { leaveTypeId:1, acronym:'CL', ...}, ...}
  const leaveTypes = useSelector((s) => s.global.leaveTypes || {});

  // derived map: leave_type_id (number) -> leaveType object
  const leaveTypeById = useMemo(() => {
    const map = {};
    Object.values(leaveTypes || {}).forEach((t) => {
      if (t && typeof t.leaveTypeId !== "undefined") map[t.leaveTypeId] = t;
    });
    return map;
  }, [leaveTypes]);

  // Debounce search input
  useEffect(() => {
    const t = setTimeout(() => setFilters((f) => ({ ...f, search: searchInput })), 300);
    return () => clearTimeout(t);
  }, [searchInput]);

  // Reset page when filters change
  useEffect(() => setPage(1), [filters, rowsPerPage]);

  // helper to enrich incoming request rows with derived fields used by UI (leaveTypeAcronym)
  const enrichRequests = (rows) => {
    if (!Array.isArray(rows)) return [];
    return rows.map((r) => {
      const acronym = leaveTypeById[r.leave_type_id]?.acronym || "—";
      return { ...r, _leaveTypeAcronym: acronym };
    });
  };

  // Fetch requests from server
  const loadRequests = async () => {
    try {
      const queryFilters = {
        search: filters.search || undefined,
        status: filters.status !== "All" ? filters.status : undefined,
        dept: filters.dept !== "All" ? filters.dept : undefined,
        // backend expects leave_type_id - our API util uses 'leaveType' param name; we keep that but pass numeric id
        leaveType: filters.leaveType || undefined,
        from: filters.fromDate || undefined,
        to: filters.toDate || undefined,
        appliedFrom: filters.appliedFrom || undefined,
        appliedTo: filters.appliedTo || undefined,
        page,
        limit: rowsPerPage,
        sortKey: sortConfig.key,
        sortDir: sortConfig.direction,
      };

      const json = await adminController.getRequests(queryFilters);
      // if backend returns { data: [...], pagination: {...} }
      const dataRows = json?.data || [];
      const enriched = enrichRequests(dataRows);
      setRequests(enriched);
      // reset selection because page/filter changed and selection should be page-scoped
      setSelectedIds([]);
      setSelectedId(null);
      setTotalPages(json?.pagination?.totalPages || 1);
    } catch (err) {
      console.error("Failed to fetch requests", err);
    }
  };

  // re-enrich requests when leaveTypes mapping changes (so acronyms update)
  useEffect(() => {
    if (!requests.length) return;
    setRequests((prev) => enrichRequests(prev));
    // don't reset pagination or selectedIds here
    // but we do clear selectedIds to avoid mismatches with updated types
    setSelectedIds([]);
  }, [leaveTypeById]); // eslint-disable-line

  // Whenever filters, page, rowsPerPage, or sortConfig changes, reload
  useEffect(() => {
    loadRequests();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters, page, rowsPerPage, sortConfig]);

  // Approve / Reject / Cancel actions
  const handleAction = async (actionType, ids) => {
    if (!ids || !ids.length) return;
    try {
      if (actionType === "Approved") {
        await adminController.handleAction("approve", ids, { reason });
      } else if (actionType === "Rejected") {
        await adminController.handleAction("reject", ids, { reason });
      } else if (actionType === "Cancelled") {
        // if backend supports cancel; try use "cancel"
        await adminController.handleAction("cancel", ids, { reason });
      }

      setModalOpen(false);
      setSelectedIds([]);
      setSelectedId(null);
      setReason("");

      // reload (fresh)
      await loadRequests();
    } catch (err) {
      console.error(`${actionType} action failed`, err);
      alert(`Failed to ${actionType.toLowerCase()} leave(s).`);
    }
  };

  // Confirm action from modal
  const confirmAction = () => {
    const idsToUpdate = selectedIds.length ? selectedIds : selectedId ? [selectedId] : [];
    if (!idsToUpdate.length) return;
    handleAction(modalAction, idsToUpdate);
  };

  // Reset selection when status filter changes
  useEffect(() => {
    setSelectedIds([]);
    setSelectedId(null);
  }, [filters.status]);

  // Column mapping for sort keys (use backend fields)
  const columnMap = {
    ID: "id",
    name: "name",
    "dept.": "dept",
    from: "fromDate",
    to: "toDate",
    applied: "appliedOn",
    LeaveType: "leave_type_id",
    status: "status",
  };

  const requestSort = (key) => {
    const backendKey = columnMap[key] || key;
    setSortConfig((prev) => ({
      key: backendKey,
      direction: prev.key === backendKey && prev.direction === "asc" ? "desc" : "asc",
    }));
  };

  // Export CSV using currently displayed requests (correct fields)
  const exportCSV = () => {
    const header = ["ID", "Name", "Dept.", "From", "To", "Applied", "LeaveType", "Status"];
    const rows = requests.map((r) => {
      const leaveType = r._leaveTypeAcronym || leaveTypeById[r.leave_type_id]?.acronym || "—";
      return [
        r.id,
        r.name || r.user?.name || "",
        r.dept || "",
        r.fromDate || "",
        r.toDate || "",
        r.appliedOn || "",
        leaveType,
        r.status || "",
      ];
    });
    const csvRows = [header, ...rows];
    const csv = csvRows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = "leave_requests.csv"; a.click(); URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setFilters({ search: "", status: "All", dept: "All", fromDate: "", toDate: "", appliedFrom: "", appliedTo: "", leaveType: undefined });
    setSearchInput("");
  };

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
              onClick={loadRequests}
              className="p-2 bg-white border rounded shadow-sm"
              title="Refresh"
            >
              <FiRefreshCw />
            </button>
          </div>

        </div>

        {/* Filters */}
        <div className="bg-white p-4 rounded-2xl shadow mb-6">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
            {/* Search */}
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

            {/* Status */}
            <div>
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

            {/* Department */}
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

            {/* Leave Type */}
            <div>
              <select
                value={(typeof filters.leaveType === "undefined") ? "All" : filters.leaveType}
                onChange={(e) => {
                  const v = e.target.value;
                  if (v === "All") {
                    setFilters((f) => ({ ...f, leaveType: undefined }));
                  } else {
                    // v could be the key from Object.entries(leaveTypes) earlier; we will try to parse numeric id or lookup
                    // if user selected an object key (like 'casual'), translate to its id
                    const asNumber = Number(v);
                    if (!Number.isNaN(asNumber) && asNumber > 0) {
                      setFilters((f) => ({ ...f, leaveType: asNumber }));
                    } else {
                      // if v is a key in leaveTypes object, map to its id
                      const mapped = leaveTypes?.[v]?.leaveTypeId;
                      if (mapped) setFilters((f) => ({ ...f, leaveType: mapped }));
                      else setFilters((f) => ({ ...f, leaveType: undefined }));
                    }
                  }
                }}
                className="w-full px-3 py-2 border rounded-lg shadow-sm"
              >
                <option value="All">All Leave Types</option>
                {/* show both numeric id and named keys so select value can be numeric id OR key (backwards compatible) */}
                {Object.entries(leaveTypes).map(([key, val]) => (
                  <option key={key} value={val?.leaveTypeId ?? key}>
                    {val?.acronym} ({key})
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
          {requests.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="table-auto text-sm text-left w-full">
                <thead className="bg-gray-100 text-gray-700">
                  <tr>
                    <th className="px-6 py-3">
                      <input
                        type="checkbox"
                        disabled={filters.status === "All"}
                        checked={requests.length > 0 && requests.every((r) => selectedIds.includes(r.id))}
                        onChange={(e) =>
                          setSelectedIds(e.target.checked ? requests.map((r) => r.id) : [])
                        }
                      />
                    </th>

                    {["ID", "name", "dept.", "from", "to", "totalDays", "applied", "LeaveType", "status"].map((key, i) => (
                      <th
                        key={i}
                        onClick={() => {
                          requestSort(key);
                        }}
                        className="px-4 py-4 font-semibold cursor-pointer select-none"
                      >
                        {key.charAt(0).toUpperCase() + key.slice(1)}
                        {sortConfig.key === (key === "from" ? "fromDate" : key === "to" ? "toDate" : key === "applied" ? "appliedOn" : (key === "LeaveType" ? "leave_type_id" : key)) &&
                          (sortConfig.direction === "asc" ? <FiChevronUp className="inline ml-1" /> : <FiChevronDown className="inline ml-1" />)}
                      </th>
                    ))}
                    <th className="px-6 py-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((req) => (
                    <tr
                      key={req.id}
                      className={`border-b last:border-none hover:bg-gray-50 ${selectedIds.includes(req.id) ? "bg-blue-50" : ""}`}
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

                      {/* ID (request id) */}
                      <td className="px-4 py-4 whitespace-nowrap">{req.id}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{req.name}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{req.dept}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{req.fromDate}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{req.toDate}</td>
                      <td className="px-4 py-4 whitespace-nowrap">{req.totalDays}</td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        {req.appliedOn
                          ? new Date(req.appliedOn).toLocaleString("en-IN", {
                            day: "2-digit",
                            month: "short",
                            year: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                            hour12: true,
                          }).replace(",", "")
                          : ""}
                      </td>

                      <td className="px-4 py-4 whitespace-nowrap">
                        {req._leaveTypeAcronym || leaveTypeById[req.leave_type_id]?.acronym || "—"}
                      </td>

                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${statusColors[req.status]}`}>
                          {req.status}
                        </span>
                      </td>

                      <td className="px-3 py-4 flex gap-2">
                        {req.status === "Pending" && (
                          <>
                            <button
                              title="Approve"
                              onClick={() => {
                                setSelectedId(req.id);
                                setModalAction("Approved");
                                setModalOpen(true);
                              }}
                              className="p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white shadow-sm"
                            >
                              <FiCheckCircle size={16} />
                            </button>
                            <button
                              title="Reject"
                              onClick={() => {
                                setSelectedId(req.id);
                                setModalAction("Rejected");
                                setModalOpen(true);
                              }}
                              className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm"
                            >
                              <FiXCircle size={16} />
                            </button>
                            <button
                              title="Cancel"
                              onClick={() => {
                                setSelectedId(req.id);
                                setModalAction("Cancelled");
                                setModalOpen(true);
                              }}
                              className="p-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white shadow-sm"
                            >
                              <FiUser size={16} />
                            </button>
                          </>
                        )}

                        {req.status === "Approved" && (
                          <>
                            <button
                              title="Reject"
                              onClick={() => {
                                setSelectedId(req.id);
                                setModalAction("Rejected");
                                setModalOpen(true);
                              }}
                              className="p-2 rounded-lg bg-red-600 hover:bg-red-700 text-white shadow-sm"
                            >
                              <FiXCircle size={16} />
                            </button>
                            <button
                              title="Cancel"
                              onClick={() => {
                                setSelectedId(req.id);
                                setModalAction("Cancelled");
                                setModalOpen(true);
                              }}
                              className="p-2 rounded-lg bg-gray-600 hover:bg-gray-700 text-white shadow-sm"
                            >
                              <FiUser size={16} />
                            </button>
                          </>
                        )}

                        {req.status === "Rejected" && (
                          <button
                            title="Approve"
                            onClick={() => {
                              setSelectedId(req.id);
                              setModalAction("Approved");
                              setModalOpen(true);
                            }}
                            className="p-2 rounded-lg bg-green-600 hover:bg-green-700 text-white shadow-sm"
                          >
                            <FiCheckCircle size={16} />
                          </button>
                        )}
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
          <div className="flex gap-2 items-center">
            <button disabled={page === 1} onClick={() => setPage(1)} className="px-3 py-1 border rounded disabled:opacity-50">
              First
            </button>
            <button disabled={page === 1} onClick={() => setPage((p) => Math.max(1, p - 1))} className="px-3 py-1 border rounded disabled:opacity-50">
              Previous
            </button>
            <input
              type="number"
              min={1}
              max={totalPages}
              value={page}
              onChange={(e) => setPage(Math.min(Math.max(1, Number(e.target.value || 1)), totalPages))}
              className="w-16 px-2 py-1 border rounded text-center"
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
