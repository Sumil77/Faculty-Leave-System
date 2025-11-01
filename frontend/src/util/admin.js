// src/util/user.js
import { apiRequest, apiDownload } from "./api.js";

export const dept = ["CSE", "ECE", "ME", "EEE"];

/**
 * Utility to build query strings safely
 */
const buildQuery = (filters = {}) => {
  const query = {};
  if (filters.searchTerm) query.searchTerm = filters.searchTerm;
  if (filters.deptFilter) query.deptFilter = filters.deptFilter;
  if (filters.roleFilter) query.roleFilter = filters.roleFilter;
  if (filters.dept) query.dept = filters.dept;
  if (filters.status) query.status = filters.status;
  if (filters.leaveType) query.leaveType = filters.leaveType;
  if (filters.fromDate) query.fromDate = filters.fromDate;
  if (filters.toDate) query.toDate = filters.toDate;
  if (filters.appliedFrom) query.appliedFrom = filters.appliedFrom;
  if (filters.appliedTo) query.appliedTo = filters.appliedTo;
  if (filters.page) query.page = filters.page;
  if (filters.limit) query.limit = filters.limit;
  if (filters.sortKey) query.sortKey = filters.sortKey;
  if (filters.sortDir) query.sortDir = filters.sortDir;
  return new URLSearchParams(query).toString();
};

// ---------------------
// Leave Actions: Approve / Reject
// ---------------------

/**
 * Approve leave requests
 * @param {number[]} leaveIds - array of leave IDs to approve
 */
export const approveLeaves = async (leaveIds = []) => {
  if (!leaveIds.length) throw new Error("leaveIds is required");
  return apiRequest("/api/admin/approve", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leaveIds }),
  });
};

/**
 * Reject leave requests
 * @param {number[]} leaveIds - array of leave IDs to reject
 */
export const rejectLeaves = async (leaveIds = []) => {
  if (!leaveIds.length) throw new Error("leaveIds is required");
  return apiRequest("/api/admin/reject", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ leaveIds }),
  });
};

// ---------------------
// Leave APIs
// ---------------------
export const getReportSummary = async () => {
  return apiRequest("/api/admin/report-summary", { method: "GET" });
};

export const getLeaveHistory = async (filters = {}) => {
  const queryString = buildQuery(filters);
  return apiRequest(
    `/api/admin/leave-history${queryString ? `?${queryString}` : ""}`,
    { method: "GET" }
  );
};

export const getLeaveSummary = async (filters = {}) => {
  const queryString = buildQuery(filters);
  return apiRequest(
    `/api/admin/leave-summary${queryString ? `?${queryString}` : ""}`,
    { method: "GET" }
  );
};

// ---------------------
// User / Requests APIs
// ---------------------
export const getRequests = async (filters = {}) => {
  const queryString = buildQuery(filters);
  return apiRequest(
    `/api/admin/getRequests${queryString ? `?${queryString}` : ""}`,
    { method: "GET" }
  );
};

export const getUsers = async (filters = {}) => {
  const queryString = buildQuery(filters);
  return apiRequest(
    `/api/admin/getUsers${queryString ? `?${queryString}` : ""}`,
    { method: "GET" }
  );
};

export const postUser = async (user) => {
  return apiRequest("/api/admin/postUser", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
};

export const patchUser = async (user) => {
  return apiRequest("/api/admin/patchUser", {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(user),
  });
};

export const deleteUsers = async (ids) => {
  return apiRequest("/api/admin/deleteUsers", {
    method: "DELETE",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ids }),
  });
};

// ---------------------
// Reports: Download / Mail
// ---------------------
// util/admin.js

// Request a download job
export const formatMap = {
  csv: { ext: "csv", mime: "text/csv" },
  excel: {
    ext: "xlsx",
    mime: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  pdf: { ext: "pdf", mime: "application/pdf" },
};

export const requestDownload = async (filters = {}, format, type) => {
  const queryString = buildQuery(filters) + `&format=${format}&type=${type}`;
  return apiRequest(`/api/admin/download-request?${queryString}`, {
    method: "GET",
  });
};

export const waitForJobReady = async (
  jobId,
  format, // "csv" | "excel" | "pdf"
  intervalMs = 2000,
  timeoutMs = 60000
) => {
  const start = Date.now();

  return new Promise((resolve, reject) => {
    const interval = setInterval(async () => {
      try {
        const res = await apiRequest(
          `/api/admin/download-status/${jobId}?format=${format}` // ✅ pass canonical format, not ext
        );
        if (res.ready) {
          clearInterval(interval);
          resolve();
        } else if (Date.now() - start > timeoutMs) {
          clearInterval(interval);
          reject(new Error("Download timeout"));
        }
      } catch (err) {
        clearInterval(interval);
        reject(err);
      }
    }, intervalMs);
  });
};

export const fetchDownloadFile = async (jobId, format) => {
  const { ext } = formatMap[format];
  const blob = await apiDownload(`/api/admin/downloads/${jobId}.${ext}`);
  const blobUrl = window.URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = blobUrl;
  a.download = `report.${ext}`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  window.URL.revokeObjectURL(blobUrl);
};

export const mailReport = async (filters = {}) => {
  return apiRequest("/api/admin/send-mail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filters),
  });
};

export const mailHistoryReport = async (filters = {}) => {
  return apiRequest("/api/admin/send-history-mail", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(filters),
  });
};


// ---------------------
// Leave Type Management
// ---------------------

/**
 * Get all active leave types (cached in Redis for 1 hour)
 */
export const getLeaveTypes = async () => {
  return apiRequest("/api/admin/leave-types", { method: "GET" });
};

/**
 * Add a new leave type
 * @param {Object} leaveType - e.g. { name: "Casual Leave", defaultBalance: 12 }
 */
export const addLeaveType = async (leaveType) => {
  if (!leaveType || !leaveType.name) throw new Error("Invalid leave type data");
  return apiRequest("/api/admin/leave-types", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(leaveType),
  });
};

/**
 * Update an existing leave type
 * @param {number|string} id - leave type ID
 * @param {Object} data - updated fields, e.g. { name: "Updated Name", defaultBalance: 15 }
 */
export const updateLeaveType = async (id, data) => {
  if (!id) throw new Error("Leave type ID required");
  return apiRequest(`/api/admin/leave-types/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

/**
 * Deactivate (soft delete) a leave type
 * @param {number|string} id - leave type ID
 */
export const deactivateLeaveType = async (id) => {
  if (!id) throw new Error("Leave type ID required");
  return apiRequest(`/api/admin/leave-types/${id}`, {
    method: "DELETE",
  });
};


// ---------------------
// Leave Rules Management
// ---------------------

/**
 * Get all leave rules for all types
 * Optionally filtered by leaveTypeId
 */
export const getLeaveRules = async (leaveTypeId = null) => {
  const url = leaveTypeId
    ? `/api/admin/leave-rules?leaveTypeId=${leaveTypeId}`
    : `/api/admin/leave-rules`;
  return apiRequest(url, { method: "GET" });
};

/**
 * Add a new leave rule
 * @param {Object} rule - e.g. { leaveTypeId, minGap, maxConsecutive, carryForward, genderRestriction }
 */
export const addLeaveRule = async (rule) => {
  if (!rule || !rule.leaveTypeId)
    throw new Error("Leave rule data or leaveTypeId missing");
  return apiRequest("/api/admin/leave-rules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rule),
  });
};

/**
 * Update an existing leave rule
 * @param {number|string} id - rule ID
 * @param {Object} data - fields to update
 */
export const updateLeaveRule = async (id, data) => {
  if (!id) throw new Error("Rule ID required");
  return apiRequest(`/api/admin/leave-rules/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

/**
 * Delete or deactivate a leave rule
 * @param {number|string} id - rule ID
 */
export const deleteLeaveRule = async (id) => {
  if (!id) throw new Error("Rule ID required");
  return apiRequest(`/api/admin/leave-rules/${id}`, {
    method: "DELETE",
  });
};


// ---------------------
// Leave Credit Rules Management
// ---------------------

/**
 * Get all credit rules (monthly/annual auto-credits)
 * Optionally filtered by leaveTypeId
 */
export const getCreditRules = async (leaveTypeId = null) => {
  const url = leaveTypeId
    ? `/api/admin/credit-rules?leaveTypeId=${leaveTypeId}`
    : `/api/admin/credit-rules`;
  return apiRequest(url, { method: "GET" });
};

/**
 * Add a new credit rule
 * @param {Object} rule - e.g. { leaveTypeId, frequency: 'monthly', amount: 1, carryForwardCap: 30 }
 */
export const addCreditRule = async (rule) => {
  if (!rule || !rule.leaveTypeId)
    throw new Error("Credit rule data or leaveTypeId missing");
  return apiRequest("/api/admin/credit-rules", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(rule),
  });
};

/**
 * Update an existing credit rule
 * @param {number|string} id - rule ID
 * @param {Object} data - updated fields
 */
export const updateCreditRule = async (id, data) => {
  if (!id) throw new Error("Credit rule ID required");
  return apiRequest(`/api/admin/credit-rules/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
};

/**
 * Delete a credit rule
 * @param {number|string} id - rule ID
 */
export const deleteCreditRule = async (id) => {
  if (!id) throw new Error("Credit rule ID required");
  return apiRequest(`/api/admin/credit-rules/${id}`, {
    method: "DELETE",
  });
};


