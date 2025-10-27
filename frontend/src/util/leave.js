import { apiRequest } from "./api.js";

export const leaveTypes = {
  casual: { fullName: "Casual Leave", acronym: "CL" },
  medical: { fullName: "Medical Leave", acronym: "ML" },
  specialCasual: { fullName: "Special Casual Leave", acronym: "SCL" },
  extraOrdinary: { fullName: "Extra Ordinary Leave", acronym: "EOL" },
  earned: { fullName: "Earned Leave", acronym: "EL" },
  onDutyExam: { fullName: "On Duty(Exam)", acronym: "OD-Exam" },
  onDutyOther: { fullName: "On Duty(Other)", acronym: "OD-Other" },
  maternity: { fullName: "Maternity Leave", acronym: "MLv" },
  election: { fullName: "Election Leave", acronym: "ELE" },
  compensatory: { fullName: "Compensatory Leave", acronym: "CPL" },
  withoutPay: { fullName: "Without Pay Leave", acronym: "WPL" },
};

export const getRecent = async () => {
  return apiRequest("/api/leave/recent", { method: "GET" });
};

export const getLeaveBalance = async () => {
  return apiRequest("/api/leave/balance", { method: "GET" });
};

export const postLeavePending = async (leave) => {
  return apiRequest("/api/leave/apply", {
    method: "POST",
    body: leave,
  });
};

export const getLeaves = async (query) => {
  const params = new URLSearchParams({
    status: query.statusFilter || "",
    type: query.typeFilter || "",
    startDate: query.startDate || "",
    endDate: query.endDate || "",
    rangeField: query.rangeField || "appliedOn",
    page: query.page || 1,
    limit: query.limit || 10,
  });

  return apiRequest(`/api/leave/getLeave?${params.toString()}`, {
    method: "GET",
  });
};

export const cancelLeaves = async (leaveIds) => {
  return apiRequest("/api/leave/cancelPending", {
    method: "POST",
    body: leaveIds,
  });
};
