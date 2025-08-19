export const leaveTypes = {
  casual: { fullName: "Casual Leave", acronym: "CL" },
  medical: { fullName: "Medical Leave", acronym: "ML" },
  specialCasual: { fullName: "Special Casual Leave", acronym: "SCL" },
  extraOrdinary: { fullName: "Extra Ordinary Leave", acronym: "EOL" },
  earned: { fullName: "Earned Leave", acronym: "EL" },
  onDutyExam: {
    fullName: "On Duty(Exam) ",
    acronym: "OD-Exam",
  },
  onDutyOther: { fullName: "On Duty(Other)", acronym: "OD-Other" },
  maternity: { fullName: "Maternity Leave", acronym: "MLv" },
  election: { fullName: "Election Leave", acronym: "ELE" },
  compensatory: { fullName: "Compensatory Leave", acronym: "CPL" },
  withoutPay: { fullName: "Without Pay Leave", acronym: "WPL" },
};

export const getRecent = async () => {
  const response = await fetch("/api/leave/recent", {
    method: "GET",
    credentials: "include", // Include cookies for session
  });
  const data = response.json();
  console.log(data);
  
  return data;
};

export const getLeaveBalance = async () => {
  const response = await fetch("/api/leave/balance", {
    method: "GET",
    credentials: "include",
  });
  const data = response.json();
  console.log(data);

  return data;
};

export const postLeavePending = async (leave) => {
  console.log(leave);

  const response = await fetch("/api/leave/apply", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(leave),
    credentials: "include",
  });
  const data = response.json();
  return data;
};

export const getLeaves = async (query) => {
  console.log("getLeave: ", query);
  const params = new URLSearchParams({
    status: query.statusFilter,
    type: query.typeFilter,
    startDate: query.startDate,
    endDate: query.endDate,
    rangeField: query.rangeField,
    page: query.page,
    limit: query.limit,
  });

  const response = await fetch(`/api/leave/getLeave?${params.toString()}`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    throw new Error("Failed to fetch leaves");
  }

  const data = await response.json();
  return data; // assuming backend returns { leaves: [], total: number }
};

export const cancelLeaves = async (leaveIds) => {
  try {
    const response = await fetch("/api/leave/cancelPending", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(leaveIds) ,
      credentials: "include",
    });
    return response;
  } catch (error) {
    console.error(error);
    throw new Error("Failed to cancel Leaves");
  }
};
