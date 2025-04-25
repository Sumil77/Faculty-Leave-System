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
    body : JSON.stringify(leave),
    credentials: "include",
  });
  const data = response.json();
  return data;
};
