// src/pages/ReportGenerator.jsx (replace file contents with this)
import { useState, useEffect, useCallback } from "react";
import { FiDownload, FiMail, FiSearch, FiArrowLeft, FiBarChart2 } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { leaveTypes } from "../util/leave.js";
import { getUsers, getLeaves, downloadReport, mailReport } from "../util/admin.js";

export default function ReportGenerator() {
  const navigate = useNavigate();

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  // Data
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Local cache for users (to enrich leaves)
  const [usersMap, setUsersMap] = useState({});

  const safeParseDate = (s) => {
    if (!s) return null;
    // prefer ISO strings; attempt Date parse if needed
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  const enrichLeavesWithUsers = (rawLeaves, users) => {
    const map = users.reduce((acc, u) => {
      const id = u.user_id ?? u.id ?? u.userId ?? u.uid;
      if (id != null) acc[id] = u;
      return acc;
    }, {});
    // keep usersMap for reuse
    setUsersMap(map);

    return rawLeaves.map((l) => {
      const user = map[l.user_id];
      const faculty = user?.name || user?.fullName || user?.faculty || `User ${l.user_id || ""}`;
      const dept = user?.dept || l.dept || "";
      const typeKey = l.leaveType || l.type || "";
      const appliedOnIso = l.appliedOn ?? l.applied_on ?? null;
      const appliedOnDisplay = l.appliedOnIST ?? appliedOnIso ?? l.appliedOnDisplay ?? "";
      return {
        id: l.id,
        user_id: l.user_id,
        faculty,
        dept,
        type: typeKey,
        status: l.status,
        appliedOnISO: appliedOnIso,
        appliedOn: appliedOnDisplay,
        fromDate: l.fromDate ?? l.from,
        toDate: l.toDate ?? l.to,
        raw: l,
      };
    });
  };

  const loadLeaves = useCallback(async () => {
    setLoading(true);
    setError("");
    try {

      // prepare server query that the handler supports
      const serverQuery = {
        status: statusFilter || "All", // handler expects 'status'
        sortKey: "fromDate", // sensible default (handler sorts by this if available)
        sortDir: "asc",
      };

      // If client-side filters are active, fetch a large page (so we can filter locally).
      // In prod you should request a proper endpoint (or backend should support these filters).
      const fetchAll =
        Boolean(searchTerm?.trim() || deptFilter || typeFilter || startDate || endDate);
      if (fetchAll) {
        serverQuery.page = 1;
        serverQuery.limit = 1000; // reasonably large for dev/mock data
      } else {
        serverQuery.page = currentPage;
        serverQuery.limit = entriesPerPage;
      }

      // call server (handler)
      const result = await getLeaves({
        status: statusFilter || "All",
        sortKey: "fromDate",
        sortDir: "asc",
        page: fetchAll ? 1 : currentPage,
        limit: fetchAll ? 1000 : entriesPerPage,
      });

      const serverLeaves = result?.data || [];
      const pagination = result?.pagination || { totalPages: 1 };

      // fetch users (small set). We try to reuse cached users if present and contains all user_ids;
      // otherwise request users (simple approach: fetch many)
      const userIdsNeeded = Array.from(new Set(serverLeaves.map((l) => l.user_id).filter(Boolean)));
      let usersList = [];
      const cachedHasAll = userIdsNeeded.every((id) => usersMap[id]);
      if (cachedHasAll && Object.keys(usersMap).length > 0) {
        usersList = userIdsNeeded.map((id) => usersMap[id]).filter(Boolean);
      } else {
        // fetch many users; mock handler supports page + limit
        try {
          const usersRes = await getUsers({ page: 1, limit: 1000 });
          usersList = usersRes?.data || usersRes || [];
        } catch (uErr) {
          // don't fail whole flow; continue with empty users
          console.warn("Failed to fetch users for enrichment", uErr);
          usersList = [];
        }
      }

      // enrich rows
      const enriched = enrichLeavesWithUsers(serverLeaves, usersList);

      if (fetchAll) {
        // apply client-side filters and then paginate locally
        let filtered = enriched;

        // global search (faculty name and dept)
        const s = (searchTerm || "").trim().toLowerCase();
        if (s) {
          filtered = filtered.filter(
            (r) =>
              (r.faculty && r.faculty.toLowerCase().includes(s)) ||
              (r.dept && r.dept.toLowerCase().includes(s)) ||
              (r.type && r.type.toLowerCase().includes(s))
          );
        }

        if (deptFilter) {
          filtered = filtered.filter((r) => r.dept === deptFilter);
        }

        if (typeFilter) {
          filtered = filtered.filter((r) => r.type === typeFilter);
        }

        if (startDate) {
          const sdt = safeParseDate(startDate + "T00:00:00");
          if (sdt) {
            filtered = filtered.filter((r) => {
              const a = safeParseDate(r.appliedOnISO || r.fromDate);
              return a && a >= sdt;
            });
          }
        }

        if (endDate) {
          const edt = safeParseDate(endDate + "T23:59:59");
          if (edt) {
            filtered = filtered.filter((r) => {
              const a = safeParseDate(r.appliedOnISO || r.toDate);
              return a && a <= edt;
            });
          }
        }

        const localTotalPages = Math.max(1, Math.ceil(filtered.length / entriesPerPage));
        // ensure current page is in range
        const pageToUse = Math.min(Math.max(1, currentPage), localTotalPages);
        const startIndex = (pageToUse - 1) * entriesPerPage;
        const pageSlice = filtered.slice(startIndex, startIndex + entriesPerPage);

        setLeaves(pageSlice);
        setTotalPages(localTotalPages);
        if (pageToUse !== currentPage) setCurrentPage(pageToUse);
      } else {
        // server-side pagination used
        setLeaves(enriched);
        setTotalPages(pagination.totalPages ?? 1);
      }
    } catch (err) {
      console.error("Failed to fetch report data:", err);
      setError(err?.message || "Something went wrong while fetching data!");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    entriesPerPage,
    statusFilter,
    searchTerm,
    deptFilter,
    typeFilter,
    startDate,
    endDate,
    usersMap,
  ]);

  useEffect(() => {
    loadLeaves();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchTerm, deptFilter, statusFilter, typeFilter, currentPage, entriesPerPage, startDate, endDate]);


  // Backend CSV Download
  const handleDownload = async () => {
    try {
      // The mock may not send a blob; we attempt to call the API and if it returns blob-handling info, handle it.
      // We'll simply call the endpoint and attempt to download if it's a blob.
      const query = {
        status: statusFilter || "All",
        page: 1,
        limit: 1000,
      };
      const resp = await downloadReport(query);
      // apiRequest currently returns parsed JSON; if backend returns a file URL we handle it
      if (resp instanceof Blob) {
        const url = window.URL.createObjectURL(resp);
        const a = document.createElement("a");
        a.href = url;
        a.download = "leave_report.csv";
        a.click();
        URL.revokeObjectURL(url);
      } else if (resp && resp.url) {
        // backend returned URL to download
        window.open(resp.url, "_blank");
      } else {
        console.log("Download response (non-blob):", resp);
        alert("Download initiated (check console/mock).");
      }
    } catch (err) {
      console.error("Download failed:", err);
      alert("Failed to download report!");
    }
  };

  // Backend Mail Report
  const handleMail = async () => {
    try {
      const res = await mailReport({
        status: statusFilter || "All",
        // note: handler doesn't accept other filters; mock just returns a success object
      });
      alert((res && res.message) || "Report mailed to admin!");
    } catch (err) {
      console.error("Mail failed:", err);
      alert("Failed to mail report!");
    }
  };

  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      {/* Back Button */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 px-4 py-2 mb-6 bg-gray-700 text-white rounded hover:bg-gray-800 transition"
      >
        <FiArrowLeft /> Back
      </button>

      <h1 className="text-2xl font-bold mb-6 flex items-center gap-2">
        <FiBarChart2 /> Generate Reports
      </h1>

      {/* Filters */}
      <div className="flex flex-wrap gap-4 mb-6 bg-white p-4 rounded-lg shadow">
        <div className="flex items-center border rounded px-3 py-2 flex-1 min-w-[200px]">
          <FiSearch className="text-gray-500 mr-2" />
          <input
            type="text"
            placeholder="Search Faculty"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            className="outline-none w-full"
          />
        </div>

        <select
          className="p-2 border rounded min-w-[150px]"
          value={deptFilter}
          onChange={(e) => {
            setDeptFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Departments</option>
          <option value="CSE">CSE</option>
          <option value="IT">IT</option>
          <option value="ECE">ECE</option>
          <option value="EEE">EEE</option>
          <option value="ME">ME</option>
        </select>

        <select
          className="p-2 border rounded min-w-[150px]"
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Approved">Approved</option>
          <option value="Rejected">Rejected</option>
        </select>

        <select
          className="p-2 border rounded min-w-[150px]"
          value={typeFilter}
          onChange={(e) => {
            setTypeFilter(e.target.value);
            setCurrentPage(1);
          }}
        >
          <option value="">All Types</option>
          {Object.entries(leaveTypes).map(([key, type]) => (
            <option key={key} value={key}>{type.fullName}</option>
          ))}
        </select>

        <input
          type="date"
          className="p-2 border rounded"
          value={startDate}
          onChange={(e) => {
            setStartDate(e.target.value);
            setCurrentPage(1);
          }}
        />
        <input
          type="date"
          className="p-2 border rounded"
          value={endDate}
          onChange={(e) => {
            setEndDate(e.target.value);
            setCurrentPage(1);
          }}
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

      {/* Actions */}
      <div className="flex gap-4 mb-6">
        <button onClick={handleDownload} className="flex items-center gap-2 px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition">
          <FiDownload /> Download Report
        </button>
        <button onClick={handleMail} className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition">
          <FiMail /> Mail Report
        </button>
      </div>

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center p-4">Loading...</div>
        ) : error ? (
          <div className="text-center p-4 text-red-500">{error}</div>
        ) : (
          <table className="min-w-full bg-white rounded-xl shadow">
            <thead className="bg-gray-200 sticky top-0">
              <tr>
                <th className="px-6 py-3 text-left">Faculty</th>
                <th className="px-6 py-3 text-left">Department</th>
                <th className="px-6 py-3 text-left">Type</th>
                <th className="px-6 py-3 text-left">Status</th>
                <th className="px-6 py-3 text-left">Applied On</th>
                <th className="px-6 py-3 text-left">From</th>
                <th className="px-6 py-3 text-left">To</th>
              </tr>
            </thead>
            <tbody>
              {leaves.length > 0 ? (
                leaves.map((l) => (
                  <tr key={l.id} className="border-b hover:bg-gray-50">
                    <td className="px-6 py-3">{l.faculty}</td>
                    <td className="px-6 py-3">{l.dept}</td>
                    <td className="px-6 py-3">{leaveTypes[l.type]?.fullName || l.type}</td>
                    <td className="px-6 py-3">{l.status}</td>
                    <td className="px-6 py-3">{l.appliedOn ?? l.appliedOnISO}</td>
                    <td className="px-6 py-3">{l.fromDate}</td>
                    <td className="px-6 py-3">{l.toDate}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="7" className="p-4 text-center text-gray-500">No records found.</td>
                </tr>
              )}
            </tbody>
          </table>
        )}
      </div>

      {/* Pagination */}
      <div className="flex justify-between items-center mt-6">
        <button
          className="p-2 px-4 bg-blue-500 text-white rounded disabled:opacity-50"
          disabled={currentPage === 1}
          onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
        >
          Prev
        </button>
        <span>Page {currentPage} of {totalPages}</span>
        <button
          className="p-2 px-4 bg-blue-500 text-white rounded disabled:opacity-50"
          disabled={currentPage === totalPages || totalPages === 0}
          onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
        >
          Next
        </button>
      </div>
    </div>
  );
}
