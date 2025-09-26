// src/pages/ReportGenerator.jsx (replace file contents with this)
import { useState, useEffect, useCallback } from "react";
import { FiDownload, FiMail, FiSearch, FiArrowLeft, FiBarChart2, FiChevronDown } from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import { leaveTypes } from "../util/leave.js";
import { getLeaveHistory, mailReport, getLeaveSummary, mailHistoryReport, requestDownload, waitForJobReady, formatMap, fetchDownloadFile } from "../util/admin.js";
import SummaryTable from "../components/SummaryTable.jsx";
import HistoryTable from "../components/HistoryTable.jsx";

export default function ReportGenerator() {
  const navigate = useNavigate();

  const [reportType, setReportType] = useState("summary");

  // Filters
  const [searchTerm, setSearchTerm] = useState("");
  const [deptFilter, setDeptFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [typeFilter, setTypeFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [showDownloadMenu, setShowDownloadMenu] = useState(false);
  const [showMailModal, setShowMailModal] = useState(false);
  const [email, setEmail] = useState(""); // pass default email if you have it

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const [entriesPerPage, setEntriesPerPage] = useState(5);
  const [totalPages, setTotalPages] = useState(1);

  // Data
  const [leaves, setLeaves] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-GB", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };


  const safeParseDate = (s) => {
    if (!s) return null;
    // prefer ISO strings; attempt Date parse if needed
    const d = new Date(s);
    return isNaN(d.getTime()) ? null : d;
  };

  // Within loadLeaves() useCallback
  const loadLeaves = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const filters = {
        dept: deptFilter || undefined,
        status: statusFilter || undefined,
        leave_type: typeFilter || undefined,  // ✅ was leaveType
        from: startDate || undefined,
        to: endDate || undefined,
        page: currentPage,
        limit: entriesPerPage,
      };


      const result =
        reportType === "summary"
          ? await getLeaveSummary(filters)
          : await getLeaveHistory(filters);

      // Backend now returns { data: [...], total: number }
      setLeaves(result.data || []);
      const totalPagesCalc = Math.max(1, Math.ceil((result.total || 0) / entriesPerPage));
      setTotalPages(totalPagesCalc);
    } catch (err) {
      console.error("Failed to fetch report data:", err);
      setError(err?.message || "Something went wrong!");
    } finally {
      setLoading(false);
    }
  }, [
    currentPage,
    entriesPerPage,
    reportType,
    deptFilter,
    typeFilter,
    startDate,
    endDate,
    statusFilter
  ]);



  useEffect(() => {
    loadLeaves();
  }, [
    reportType,
    deptFilter,
    statusFilter,
    typeFilter,
    currentPage,
    entriesPerPage,
    startDate,
    endDate
  ]);


  const handleDownload = async (filters, format, type) => {
    try {
      // 1. Start the download job
      const { jobId } = await requestDownload(filters, format, type);

      // 2. Wait until the job is ready
      console.log("Requested format:", format);

      await waitForJobReady(jobId, format);

      // 3. Fetch and trigger the file download
      fetchDownloadFile(jobId, format);
    } catch (err) {
      console.error("Download failed:", err);
    }
  };

  const handleMail = async (toEmail) => {
    if (!toEmail) return;

    console.log("Send mail to:", toEmail);

    const filters = {
      // Include any filters you want for the report
      dept: deptFilter || undefined,
      status: statusFilter || undefined,
      leaveType: typeFilter || undefined,
      from: startDate || undefined,
      to: endDate || undefined,
      page: currentPage,
      limit: entriesPerPage,
    };

    try {
      const result =
        reportType === "summary"
          ? await mailReport({ email: toEmail, filters })
          : await mailHistoryReport({ email: toEmail, filters });

      if (result.success) {
        alert("Email sent successfully!");
      } else {
        alert("Failed to send email: " + result.message);
      }
    } catch (err) {
      console.error("Error sending email:", err);
      alert("Something went wrong while sending email");
    }
  };


  return (
    <div className="p-6 bg-gray-100 min-h-screen">
      <div className="flex items-center justify-between mb-6">
        {/* Left side: Back + Title + Report type */}
        <div className="flex items-center gap-4">
          <button
            onClick={() => navigate(-1)}
            className="flex items-center gap-1 text-gray-500 hover:text-gray-700 transition text-sm"
          >
            <FiArrowLeft className="text-lg" />
          </button>

          <h1 className="text-2xl font-bold flex items-center gap-2 text-gray-800">
            <FiBarChart2 /> Generate Reports
          </h1>

          {/* Report type toggle beside title */}
          <div className="flex gap-2 ml-2">
            <button
              onClick={() => setReportType("summary")}
              className={`px-3 py-1 rounded text-sm ${reportType === "summary"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
                }`}
            >
              Summary
            </button>
            <button
              onClick={() => setReportType("history")}
              className={`px-3 py-1 rounded text-sm ${reportType === "history"
                ? "bg-blue-600 text-white"
                : "bg-gray-200 text-gray-700"
                }`}
            >
              History
            </button>
          </div>
        </div>

        {/* Right side: Download + Mail */}
        <div className="flex items-center gap-3">
          {/* Download dropdown */}
          <div className="relative">
            <button
              onClick={() => setShowDownloadMenu(!showDownloadMenu)}
              className="flex items-center gap-2 px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 transition text-sm"
            >
              <FiDownload /> Download <FiChevronDown className="text-xs" />
            </button>

            {showDownloadMenu && (
              <div className="absolute right-0 mt-1 bg-white border rounded shadow-lg w-32 z-10">
                {["Excel", "PDF", "CSV"].map((format) => (
                  <button
                    key={format}
                    onClick={() => {
                      const filters = {
                        dept: deptFilter || undefined,
                        status: statusFilter || undefined,
                        leaveType: typeFilter || undefined,
                        from: startDate || undefined,
                        to: endDate || undefined,
                      };
                      handleDownload(filters, format.toLowerCase(), reportType);
                      setShowDownloadMenu(false);
                    }}
                    className="block w-full text-left px-4 py-2 text-sm hover:bg-gray-100"
                  >
                    {format}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Send Mail */}
          <button
            onClick={() => setShowMailModal(true)}
            className="flex items-center gap-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 transition text-sm"
          >
            <FiMail /> Send Mail
          </button>
        </div>
      </div>

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

      {/* Table */}
      <div className="overflow-x-auto">
        {loading ? (
          <div className="text-center p-4">Loading...</div>
        ) : error ? (
          <div className="text-center p-4 text-red-500">{error}</div>
        ) : reportType === "summary" ? (
          <SummaryTable leaves={leaves} />
        ) : (
          <HistoryTable leaves={leaves} />
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

      {showMailModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-96">
            <h2 className="text-lg font-semibold mb-4">Send Report via Mail</h2>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full border px-3 py-2 rounded mb-4"
              placeholder="Enter email address"
            />
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowMailModal(false)}
                className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleMail(email);
                  setShowMailModal(false);
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
