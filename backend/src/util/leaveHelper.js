import LeaveApproved from "../models/leaveApproved.js";
import LeaveRejected from "../models/leaveRejected.js";
import LeavePending from "../models/leavePending.js";
import LeaveBalance from "../models/leaveBalance.js";
import LeaveTaken from "../models/leaveTaken.js";

export const leaveTypes = {
  casual: { fullName: "Casual", acronym: "CL" },
  medical: { fullName: "Medical", acronym: "ML" },
  special: { fullName: "Special Casual", acronym: "SCL" },
  extraOrdinary: { fullName: "Extra Ordinary", acronym: "EOL" },
  earned: { fullName: "Earned", acronym: "EL" },
  onDutyExam: {
    fullName: "On Duty(Exam)",
    acronym: "OD-Exam",
  },
  onDutyOther: { fullName: "On Duty(Other)", acronym: "OD-Other" },
  maternity: { fullName: "Maternity", acronym: "MLv" },
  election: { fullName: "Election", acronym: "ELE" },
  compensatory: { fullName: "Compensatory", acronym: "CPL" },
  withoutPay: { fullName: "withoutPay", acronym: "CPL" },
};

export const getLeaveApproved = async (req, res) => {
  const user_id = req.body.user_id;
  const limit = req.body.query.limit;
  const page = parseInt(req.body.query.page) || 1;
  const offset = (page - 1) * limit;

  console.log({ user_id, limit, page, offset });

  let totalEntries = await LeaveApproved.count({ where: { user_id } });

  const data = await LeaveApproved.findAll({
    where: { user_id },
    limit,
    offset,
  });

  const totalPages = Math.ceil(totalEntries / limit);

  res.json({
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalEntries,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

export const getLeaveRejected = async (req, res) => {
  const user_id = req.session.user_id;
  const limit = req.query.limit;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  let totalEntries = await LeaveRejected.count({ where: user_id });

  const data = await LeaveRejected.findAll({
    where: { user_id },
    limit,
    offset,
  });

  const totalPages = Math.ceil(totalEntries / limit);

  res.json({
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalEntries,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

export const getLeavePending = async (req, res) => {
  const user_id = req.session.user_id;
  const limit = req.query.limit;
  const page = parseInt(req.query.page) || 1;
  const offset = (page - 1) * limit;

  let totalEntries = await LeavePending.count({ where: user_id });

  const data = await LeavePending.findAll({
    where: { user_id },
    limit,
    offset,
  });

  const totalPages = Math.ceil(totalEntries / limit);

  res.json({
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalEntries,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    },
  });
};

export const getLeaveBalance = async (req, res) => {
  const data = await LeaveBalance.find({
    where: { user_id },
  });

  res.json({
    data,
  });
};

export const getLeaveTaken = async (req, res) => {
  const data = await LeaveTaken.find({
    where: { user_id },
  });

  res.json({
    data,
  });
};
