import LeaveApproved from "../models/leaveApproved.js";
import LeaveRejected from "../models/leaveRejected.js";
import LeavePending from "../models/leavePending.js";
import LeaveBalance from "../models/leaveBalance.js";
import LeaveTaken from "../models/leaveTaken.js";
import CompensatoryLeave from "../models/CompensatoryLeave.js";
import { parseError } from "./userController.js";
import { col, fn, literal, Op } from "sequelize";
import {
  leaveSchema,
  validateLeaveBalance,
} from "../validators/leaveValidations.js";
import { sequelize } from "../config.js";

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

  console.log("backend", {
    status,
    type,
    rangeField,
    startDate,
    endDate,
    page,
    limit,
  });

  const attrList = [
    [
      literal(
        `TO_CHAR("appliedOn" AT TIME ZONE 'Asia/Kolkata', 'DD Mon YYYY, HH12:MI AM')`
      ),
      "appliedOnIST",
    ], // Convert to IST
    "leaveType",
    "fromDate",
    "toDate",
    "id",
  ];

  if (rangeField && startDate && endDate) {
    const from = new Date(startDate);
    const to = new Date(endDate);
    whereClause[rangeField] = { [Op.between]: [from, to] };
  }

  if (type && type !== "") {
    whereClause.leaveType = type;
  }

  let totalEntries = null;
  let data = {};
  let orderBy = [["appliedOn", "DESC"]];

  try {
    if (status === "Pending") {
      totalEntries = await LeavePending.count({ where: whereClause });
      data = await LeavePending.findAll({
        where: whereClause,
        attributes: attrList,
        order: orderBy,
        limit: limit,
        offset: offset,
      });
    } else if (status === "Approved") {
      totalEntries = await LeaveApproved.count({ where: whereClause });
      data = await LeaveApproved.findAll({
        where: whereClause,
        attributes: attrList,
        order: orderBy,
        limit: limit,
        offset: offset,
      });
    } else if (status === "Rejected") {
      totalEntries = await LeaveRejected.count({ where: whereClause });
      data = await LeavePending.findAll({
        where: whereClause,
        attributes: attrList,
        order: orderBy,
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
  const user_id = req.session.user.user_id;
  const leaveIds = req.body;

  const transaction = await sequelize.transaction();
  try {
    const leaves = await LeavePending.findAll({
      where: {
        id: { [Op.in]: leaveIds },
        user_id,
      },
      lock: transaction.LOCK.UPDATE,
      transaction,
    });

    const today = new Date();
    const toCancel = [];
    const notCanceled = [];

    for (const leave of leaves) {
      const fromDate = new Date(leave.fromDate);
      const fromPlusOne = new Date(fromDate);
      fromPlusOne.setDate(fromPlusOne.getDate() + 1);

      if (today < fromPlusOne) {
        toCancel.push(leave.id);
      } else {
        notCanceled.push(leave.id);
      }
    }

    if (toCancel.length > 0) {
      await LeavePending.destroy({
        where: {
          id: { [Op.in]: toCancel },
          user_id,
        },
        transaction,
      });
    }

    await transaction.commit();

    return res.status(200).json({
      cancelled: toCancel,
      notCanceled,
    });
  } catch (error) {
    await transaction.rollback();
    console.log("Cancel Leave Failed:", error);
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

export const approveLeaves = async (req, res) => {
  const transaction = await sequelize.transaction();

  const { leaveIds } = req.body;
  console.log("Approve leaves: ", leaveIds);
  try {
    const toApprove = await LeavePending.findAll({
      where: {
        id: { [Op.in]: leaveIds },
      },
      transaction,
      lock: true,
    });

    if (toApprove.length === 0) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ error: "No matching pending leaves found" });
    }

    const approvedData = toApprove.map((leave) => leave.toJSON());
    await LeaveApproved.bulkCreate(approvedData, { transaction });
    await LeavePending.destroy({
      where: { id: { [Op.in]: leaveIds } },
      transaction,
    });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: `${toApprove.length} leave(s) approved.`,
    });
  } catch (error) {
    await transaction.rollback();
    console.log("Approve Transaction Failed", error);
    return res.status(400).send(parseError(error));
  }
};

export const rejectLeaves = async (req, res) => {
  const transaction = await sequelize.transaction();

  const { leaveIds } = req.body;
  console.log("Approve leaves: ", leaveIds);
  try {
    const toReject = await LeavePending.findAll({
      where: {
        id: { [Op.in]: leaveIds },
      },
      transaction,
      lock: true,
    });

    if (toApprove.length === 0) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ error: "No matching pending leaves found" });
    }

    const approvedData = toApprove.map((leave) => leave.toJSON());
    await LeaveRejected.bulkCreate(approvedData, transaction);
    await LeavePending.destroy({
      where: { id: { [Op.in]: leaveIds } },
      transaction,
    });

    await transaction.commit();

    res.status(200).json({
      success: true,
      message: `${toApprove.length} leave(s) rejected.`,
    });
  } catch (error) {
    await transaction.rollback();
    console.log("Reject Transaction Failed", error);
    return res.status(400).send(parseError(error));
  }
};

export const grantCpl = async (req, res) => {
  // const grantedBy = req.session.user.user_id;
  const transaction = await sequelize.transaction();
  const grantedBy = req.body.grantedBy;
  const grants = req.body.grants;
  try {
    for (const { userId, days, reason } of grants) {
      await LeaveBalance.increment(
        { compensatory: days },
        { where: { user_id: userId }, transaction }
      );

      await CompensatoryLeave.create({
        user_id: userId,
        days: days,
        reason: reason,
        grantedBy: grantedBy,
        grantedOn: new Date(),
      });
    }

    await transaction.commit();
    return res.status(200).send("Granted Compensatory Leaves Successfully");
  } catch (error) {
    await transaction.rollback();
    console.log(error);

    return res.status(400).send(parseError(error));
  }
};