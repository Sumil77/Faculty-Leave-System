import {
  User,
  LeaveApproved,
  LeaveRejected,
  LeavePending,
  LeaveBalance,
  LeaveTaken,
  LeaveBalance_normalized,
  LeaveType,
} from "../models/index.js";
import { literal, Op } from "sequelize";
import {
  getLeaveTypes,
  validateLeaveRequest,
  validateLeaveRequestV2,
} from "../validators/leaveValidations.js";
import { evaluateLeaveRequest } from "../utils/rulesEngine.js";
import { sequelize } from "../config.js";
import { parseError } from "../controllers/userController.js"; // adjust path if needed

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

export const getLeaveBalanceV2 = async (req, res) => {
  const user_id = req.session.user.user_id;

  const balances = await LeaveBalance_normalized.findAll({
    where: { user_id },
    include: [{ model: LeaveType, attributes: ["name"] }],
    raw: true,
  });

  const formatted = {};
  balances.forEach((item) => {
    formatted[item["LeaveType.name"]] = item.balance;
  });

  return res.status(200).json({ user_id, ...formatted });
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

export const postAppliedLeave = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const user_id = req.session.user.user_id;
    const dept = req.session.user.dept;
    const user = await User.findByPk(user_id); // ✅ fetch for rule checks

    const {
      time: appliedOn,
      from: fromDate,
      to: toDate,
      type: leaveType,
      reason,
      attachment,
      fraction = "full",
    } = req.body;

    // ✅ Step 1: Validate structure + balance using Redis-powered validator
    const validated = await validateLeaveRequest(
      { appliedOn, fromDate, toDate, leaveType, fraction },
      user_id
    );

    const isHalfDay = fraction === "half";
    const isQuarterDay = fraction === "quarter";

    // ✅ Step 2: Fetch leave types dynamically
    const leaveTypes = await getLeaveTypes();
    const leaveTypeId = leaveType; // since we're using keys like 'casual', 'medical' etc.

    // ✅ Step 3: Calculate number of requested days
    let requestedDays =
      (new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24) + 1;

    if (fromDate === toDate) {
      if (isHalfDay) requestedDays = 0.5;
      if (isQuarterDay) requestedDays = 0.25;
    }

    // ✅ Step 4: Validate rules from Redis/DB
    const ruleCheck = await evaluateLeaveRequest(
      { ...user.toJSON(), reason, attachment },
      leaveTypeId,
      requestedDays,
      isHalfDay || isQuarterDay, // replace previous "isHalfDay"
      new Date(appliedOn)
    );

    if (!ruleCheck.valid) {
      throw new Error(ruleCheck.reason);
    }

    // ✅ Step 5: Lock user balance row to prevent race conditions
    const balance = await LeaveBalance.findOne({
      where: { user_id },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });
    if (!balance) throw new Error("Leave balance not found for user.");

    // ✅ Step 6: Deduct leave balance
    const available = balance[leaveType];
    if (available < requestedDays) {
      throw new Error(
        `Insufficient balance. You have ${available} days available for ${leaveTypes[leaveType].fullName}`
      );
    }

    balance[leaveType] = available - requestedDays;
    await balance.save({ transaction });

    // ✅ Step 7: Create a new leave request
    const leaveCreated = await LeavePending.create(
      {
        user_id,
        dept,
        appliedOn,
        fromDate,
        toDate,
        totalDays: requestedDays,
        leaveType,
        reason,
        attachment,
        fraction,
      },
      { transaction }
    );

    // ✅ Step 8: Commit transaction
    await transaction.commit();

    // ✅ Step 9: Return success response
    return res.status(200).json({
      message: `Leave applied successfully. ${requestedDays} day(s) deducted from ${leaveTypes[leaveType].fullName}.`,
      leave: leaveCreated,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("Error applying leave:", err);
    return res.status(400).json({ error: parseError(err) });
  }
};

export const postAppliedLeaveV2 = async (req, res) => {
  const transaction = await sequelize.transaction();

  try {
    const user_id = req.session.user.user_id;
    const dept = req.session.user.dept;
    const user = await User.findByPk(user_id);

    const {
      time: appliedOn,
      from: fromDate,
      to: toDate,
      type: leaveTypeId, // now passed as ID (from frontend or mapping)
      reason,
      attachment,
      fraction = "full",
    } = req.body;

    // ✅ 1. Validate structure & balance
    const validated = await validateLeaveRequestV2(
      { appliedOn, fromDate, toDate, leaveTypeId, fraction },
      user_id
    );

    const isHalfDay = fraction === "half";
    const isQuarterDay = fraction === "quarter";

    // ✅ 2. Fetch leave type details
    const leaveType = await LeaveType.findByPk(leaveTypeId);
    if (!leaveType) throw new Error("Invalid leave type selected.");

    // ✅ 3. Calculate requested days
    let requestedDays =
      (new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24) + 1;

    if (fromDate === toDate) {
      if (isHalfDay) requestedDays = 0.5;
      if (isQuarterDay) requestedDays = 0.25;
    }

    // ✅ 4. Apply business/rule checks
    const ruleCheck = await evaluateLeaveRequest(
      { ...user.toJSON(), reason, attachment },
      leaveTypeId,
      requestedDays,
      isHalfDay || isQuarterDay,
      new Date(appliedOn)
    );

    if (!ruleCheck.valid) throw new Error(ruleCheck.reason);

    // ✅ 5. Fetch & lock specific leave balance
    const balance = await LeaveBalance_normalized.findOne({
      where: { user_id, leave_type_id: leaveTypeId },
      transaction,
      lock: transaction.LOCK.UPDATE,
    });

    if (!balance)
      throw new Error(`No leave balance found for ${leaveType.name}`);

    // ✅ 6. Deduct balance safely
    const available = balance.balance;
    if (available < requestedDays) {
      throw new Error(
        `Insufficient balance. You have ${available} day(s) available for ${leaveType.name}`
      );
    }

    await balance.update(
      { balance: available - requestedDays, last_updated: new Date() },
      { transaction }
    );

    // ✅ 7. Create pending leave request entry
    const leaveCreated = await LeavePending.create(
      {
        user_id,
        dept,
        appliedOn,
        fromDate,
        toDate,
        totalDays: requestedDays,
        leaveType: leaveType.name,
        reason,
        attachment,
        fraction,
      },
      { transaction }
    );

    // ✅ 8. Commit transaction
    await transaction.commit();

    // ✅ 9. Send success response
    return res.status(200).json({
      message: `Leave applied successfully. ${requestedDays} day(s) deducted from ${leaveType.name}.`,
      leave: leaveCreated,
    });
  } catch (err) {
    await transaction.rollback();
    console.error("Error applying leave (v2):", err);
    return res.status(400).json({ error: parseError(err) });
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
