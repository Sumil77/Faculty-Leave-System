import LeaveApproved from "../models/leaveApproved.js";
import LeaveRejected from "../models/leaveRejected.js";
import LeavePending from "../models/leavePending.js";
import LeaveBalance from "../models/leaveBalance.js";
import LeaveTaken from "../models/leaveTaken.js";
import { parseError } from "./helpers.js";
import { Op } from "sequelize";
import {
  leaveSchema,
  validateLeaveBalance,
} from "../validations/leaveValidations.js";

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

  console.log({ user_id, dept, appliedOn, fromDate, toDate, typeOfLeave });

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

export const postCancelPending = async (req, res) => {
  // const user_id = req.session.user.user_id;
  const user_id = req.query.user_id;
  const { leaveIds } = req.body;
  try {
    const leaves = await LeavePending.findAll({
      where: {
        id: { [Op.in]: leaveIds },
        user_id,
      },
    });

    console.log(leaves.map((l) => l.id));
    const today = new Date();
    const toCancel = [];
    const notCanceled = [];

    for (const leave of leaves) {
      const fromDate = new Date(leave.fromDate);
      const fromPlusOne = new Date(fromDate);
      fromPlusOne.setDate(fromPlusOne.getDate() + 1);

      if (today < fromPlusOne) {
        // console.log("to cancel " + leave.id);
        toCancel.push(leave.id);
      } else {
        // console.log("not cancel " + leave.id);
        notCanceled.push(leave.id);
      }
    }

    if (toCancel.length > 0) {
      await LeavePending.destroy({
        where: {
          id: { [Op.in]: toCancel },
          user_id,
        },
      });
    }

    return res.status(200).json({
      cancelled: toCancel,
      notCanceled,
    });

  } catch (error) {
    console.error(error);
    return res.status(500).send(parseError(error));
  }
};