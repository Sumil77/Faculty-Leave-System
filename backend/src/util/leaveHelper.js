import LeaveApproved from "../models/leaveApproved.js";
import LeaveRejected from "../models/leaveRejected.js";
import LeavePending from "../models/leavePending.js";
import LeaveBalance from "../models/leaveBalance.js";
import LeaveTaken from "../models/leaveTaken.js";
import {
  leaveSchema,
  validateLeaveBalance,
} from "../validations/leaveValidations.js";
import { parseError } from "./helpers.js";

export const getLeaveApproved = async (req, res) => {
  const user_id = req.session.user.user_id;
  const limit = req.param.limit;
  const page = parseInt(req.param.page) || 1;
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
  const user_id = req.session.user.user_id;
  const limit = req.param.limit;
  const page = parseInt(req.param.page) || 1;
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
  const user_id = req.session.user.user_id;
  const limit = req.param.limit;
  const page = parseInt(req.param.page) || 1;
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
  const user_id = req.session.user.user_id;
  const data = await LeaveBalance.find({
    where: { user_id },
  });

  res.json({
    data,
  });
};

export const getLeaveTaken = async (req, res) => {
  const user_id = req.session.user.user_id;
  const data = await LeaveTaken.find({
    where: { user_id },
  });

  res.json({
    data,
  });
};

export const postAppliedLeave = async (req, res) => {
  const user_id = req.session.user.user_id;
  const dept = req.session.user.dept;
  const appliedOn = req.query.time;
  const fromDate = req.query.from;
  const toDate = req.query.to;
  const typeOfLeave = req.query.type;

  console.log({user_id,dept,appliedOn,fromDate,toDate,typeOfLeave});

  try {

    await leaveSchema.validateAsync({
      appliedOn,
      fromDate,
      toDate,
      typeOfLeave,
    });  
    
    await validateLeaveBalance(user_id, typeOfLeave, fromDate, toDate);
    
    const leaveCreated = await LeavePending.create({
      user_id,
      appliedOn,
      fromDate,
      toDate,
      typeOfLeave,
      dept,
    });

    return res.status(200).send(leaveCreated);
  } catch (err) {
    return res.status(401).send(parseError(err));
  }
};
