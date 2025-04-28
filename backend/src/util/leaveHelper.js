import LeaveApproved from "../models/leaveApproved.js";
import LeaveRejected from "../models/leaveRejected.js";
import LeavePending from "../models/leavePending.js";
import LeaveBalance from "../models/leaveBalance.js";
import LeaveTaken from "../models/leaveTaken.js";
import { parseError } from "./helpers.js";
import { col, fn, literal, Op } from "sequelize";
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

export const getLeave = async (req, res) => {
  const user_id = req.session.user.user_id;
  const {
    status,
    type,
    rangeField,
    startDate,
    endDate,
    page = 1,
    limit = 5,
  } = req.query;
  const offset = (page - 1) * limit;
  const whereClause = { user_id };

  console.log("backend",{
    status,
    type,
    rangeField,
    startDate,
    endDate,
    page,
    limit ,
  } );

  const attrList = [
    [literal(`TO_CHAR("appliedOn" AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM')`), 'appliedOn'],  // Convert to IST
    'leaveType',
    'fromDate',
    'toDate',
    'id'
  ]
  

  if (rangeField && startDate && endDate) {
    const from = new Date(startDate);
    const to = new Date(endDate);
    whereClause[rangeField] = { [Op.between]: [from,to] };
  }

  if (type && type !== 'null') {
    whereClause.leaveType = type;
  }

  let totalEntries = null;
  let data = {};
  let orderBy = [['appliedOn', 'DESC']];

  try {
    if (status === "Pending") {
      totalEntries = await LeavePending.count({ where: { user_id: user_id } });
      data = await LeavePending.findAll({
        where: whereClause,
        attributes: attrList,
        order : orderBy,
        limit: limit,
        offset: offset,
      });
    } else if (status === "Approved") {
      totalEntries = await LeaveApproved.count({ where: { user_id: user_id } });
      data = await LeaveApproved.findAll({
        where: whereClause,
        attributes: attrList,
        order : orderBy,
        limit: limit,
        offset: offset,
      });
    } else if (status === "Rejected") {
      totalEntries = await LeaveRejected.count({ where: { user_id: user_id } });
      data = await LeavePending.findAll({
        where: whereClause,
        attributes: attrList,
        order : orderBy,
        limit: limit,
        offset: offset,
      });
    } else {
      throw new Error("Invalid Status.");
    }

    console.log(data);
    

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
  } catch (err) {
    console.error("Error GetLeave : ", err);
    return res.status(401).send(parseError(err));
  }
};

export const getLeaveBalance = async (req, res) => {
  const user_id = req.session.user.user_id;
  const data = await LeaveBalance.findAll({
    where: { user_id },
    raw: true,
  });
  console.log(data);

  return res.status(200).json(data);
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
  const appliedOn = req.body.time;
  const fromDate = req.body.from;
  const toDate = req.body.to;
  const leaveType = req.body.type;

  try {
    await leaveSchema.validateAsync({
      appliedOn,
      fromDate,
      toDate,
      leaveType,
    });
    console.log("ok");

    await validateLeaveBalance(user_id, leaveType, fromDate, toDate);

    const leaveCreated = await LeavePending.create({
      user_id,
      appliedOn,
      fromDate,
      toDate,
      leaveType,
      dept,
    });

    return res.status(200).json(leaveCreated);
  } catch (err) {
    console.error(err);

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

export const getRecentLeaves = async (req, res) => {
  try {
    // const user_id = req.query.user_id;
    const user = req.session.user;

    const today = new Date();
    const monthAgo = new Date();
    monthAgo.setMonth(today.getMonth() - 1);
    const [pending, approved] = await Promise.all([
      LeavePending.findAll({
        where: {
          user_id: user.user_id,
          fromDate: { [Op.between]: [monthAgo, today] },
        },
      }),
      LeaveApproved.findAll({
        where: {
          user_id: user.user_id,
          fromDate: { [Op.between]: [monthAgo, today] },
        },
      }),
    ]);

    const tagged = pending
      .map((p) => ({ ...p.dataValues, status: "Pending" }))
      .concat(approved.map((a) => ({ ...a.dataValues, status: "Approved" })));

    const recents = tagged.sort(
      (a, b) => new Date(b.appliedOn) - new Date(a.appliedOn)
    );

    console.log(recents.map((l) => l.id));

    return res.status(200).json(recents);
  } catch (error) {
    console.error("Error Recent Leaves:", error);

    return res.status(500).send(parseError(error));
  }
};
