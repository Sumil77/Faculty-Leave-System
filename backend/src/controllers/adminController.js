import {
  User,
  LeaveApproved,
  LeaveRejected,
  LeavePending,
  LeaveBalance,
  CompensatoryLeave,
  LeaveType,
  LeaveBalance_normalized,
  LeaveRule,
  LeaveCreditRule,
} from "../models/index.js";
import { parseError } from "./userController.js";
import { Op, QueryTypes } from "sequelize";
import { sequelize } from "../config.js";
import redis from "../redis.js"; // centralized redis
import { CACHE_KEYS } from "../config/cacheConfig.js";
import { cacheRules } from "../middlewares/cacheHandler.js";
import {
  leaveTypeSchema,
  leaveRuleSchema,
  creditRuleSchema,
} from "../validators/leaveValidations.js";

export const getRequests = async (req, res) => {
  try {
    const {
      status = "All",
      dept = "All",
      search = "",
      leaveType,
      fromDate,
      toDate,
      appliedFrom,
      appliedTo,
      page = 1,
      limit = 10,
      sortKey = "createdAt",
      sortDir = "DESC",
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const limitNum = Math.max(1, parseInt(limit, 10) || 10);
    const offset = (pageNum - 1) * limitNum;

    const allowedSortKeys = new Set([
      "id",
      "user_id",
      "appliedOn",
      "fromDate",
      "toDate",
      "totalDays",
      "leave_type_id",
      "dept",
      "createdAt",
      "updatedAt",
    ]);
    const sortColumn = allowedSortKeys.has(sortKey) ? sortKey : "createdAt";
    const sortDirection = ["ASC", "DESC"].includes(sortDir.toUpperCase())
      ? sortDir.toUpperCase()
      : "DESC";

    // === Status-specific models ===
    if (["Approved", "Rejected", "Pending"].includes(status)) {
      const Model =
        status === "Approved"
          ? LeaveApproved
          : status === "Rejected"
          ? LeaveRejected
          : LeavePending;

      const where = {};

      if (dept !== "All") where.dept = dept;
      if (leaveType && leaveType !== "All") where.leave_type_id = leaveType;
      if (fromDate && toDate)
        where.fromDate = { [Op.between]: [fromDate, toDate] };
      else if (fromDate) where.fromDate = { [Op.gte]: fromDate };
      else if (toDate) where.fromDate = { [Op.lte]: toDate };

      if (appliedFrom && appliedTo)
        where.appliedOn = { [Op.between]: [appliedFrom, appliedTo] };
      else if (appliedFrom) where.appliedOn = { [Op.gte]: appliedFrom };
      else if (appliedTo) where.appliedOn = { [Op.lte]: appliedTo };

      if (search) {
        const n = Number(search);
        where[Op.or] = [
          !isNaN(n) ? { user_id: n } : null,
          { leave_type_id: { [Op.iLike]: `%${search}%` } },
          { "$user.name$": { [Op.iLike]: `%${search}%` } },
        ].filter(Boolean);
      }

      const { rows, count } = await Model.findAndCountAll({
        where,
        include: [{ model: User, as: "user", attributes: ["name"] }],
        limit: limitNum,
        offset,
        order: [[sortColumn, sortDirection]],
      });

      const data = rows.map((r) => ({
        ...r.toJSON(),
        name: r.user?.name || "",
        status,
      }));

      return res.json({
        data,
        pagination: {
          page: pageNum,
          limit: limitNum,
          totalItems: count,
          totalPages: Math.ceil(count / limitNum),
        },
      });
    }

    // === "All" status ===
    const baseUnion = `
      SELECT la.id, la.user_id, u.name, la."appliedOn", la."fromDate", la."toDate",
             la."totalDays", la."leave_type_id", la.dept, la."createdAt", 'Approved' as status
      FROM "LeaveApproved" la JOIN "User" u ON la.user_id = u.user_id
      UNION ALL
      SELECT lr.id, lr.user_id, u.name, lr."appliedOn", lr."fromDate", lr."toDate",
             lr."totalDays", lr."leave_type_id", lr.dept, lr."createdAt", 'Rejected' as status
      FROM "LeaveRejected" lr JOIN "User" u ON lr.user_id = u.user_id
      UNION ALL
      SELECT lp.id, lp.user_id, u.name, lp."appliedOn", lp."fromDate", lp."toDate",
             lp."totalDays", lp."leave_type_id", lp.dept, lp."createdAt", 'Pending' as status
      FROM "LeavePending" lp JOIN "User" u ON lp.user_id = u.user_id
    `;

    // === Build WHERE for union ===
    const unionWhereClauses = [];
    const replacements = { limit: limitNum, offset };

    if (dept !== "All") {
      unionWhereClauses.push(`dept = :dept`);
      replacements.dept = dept;
    }
    if (leaveType && leaveType !== "All") {
      unionWhereClauses.push(`"leave_type_id" = :leaveType`);
      replacements.leaveType = leaveType;
    }

    if (search) {
      unionWhereClauses.push(`
    (
      CAST(user_id AS TEXT) ILIKE :search OR 
      name ILIKE :search OR
      CAST("leave_type_id" AS TEXT) ILIKE :search
    )
  `);
      replacements.search = `%${search}%`;
    }

    if (fromDate && toDate) {
      unionWhereClauses.push(`"fromDate" BETWEEN :fromDate AND :toDate`);
      replacements.fromDate = fromDate;
      replacements.toDate = toDate;
    } else if (fromDate) {
      unionWhereClauses.push(`"fromDate" >= :fromDate`);
      replacements.fromDate = fromDate;
    } else if (toDate) {
      unionWhereClauses.push(`"fromDate" <= :toDate`);
      replacements.toDate = toDate;
    }
    if (appliedFrom && appliedTo) {
      unionWhereClauses.push(`"appliedOn" BETWEEN :appliedFrom AND :appliedTo`);
      replacements.appliedFrom = appliedFrom;
      replacements.appliedTo = appliedTo;
    } else if (appliedFrom) {
      unionWhereClauses.push(`"appliedOn" >= :appliedFrom`);
      replacements.appliedFrom = appliedFrom;
    } else if (appliedTo) {
      unionWhereClauses.push(`"appliedOn" <= :appliedTo`);
      replacements.appliedTo = appliedTo;
    }

    const unionWhereClause = unionWhereClauses.length
      ? `WHERE ${unionWhereClauses.join(" AND ")}`
      : "";

    const unionQuery = `
      SELECT * FROM (${baseUnion}) AS all_requests
      ${unionWhereClause}
      ORDER BY "${sortColumn}" ${sortDirection}
      LIMIT :limit OFFSET :offset;
    `;

    const countQuery = `
      SELECT COUNT(*) AS count FROM (${baseUnion}) AS all_requests
      ${unionWhereClause};
    `;

    const rows = await sequelize.query(unionQuery, {
      replacements,
      type: QueryTypes.SELECT,
    });

    const countRes = await sequelize.query(countQuery, {
      replacements,
      type: QueryTypes.SELECT,
    });

    const totalItems = parseInt(countRes[0]?.count || "0", 10);

    return res.json({
      data: rows,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems,
        totalPages: Math.ceil(totalItems / limitNum),
      },
    });
  } catch (error) {
    console.error("getRequests error:", error);
    return res.status(500).json({ message: "Failed to fetch requests" });
  }
};

export const getUsers = async (req, res) => {
  try {
    // Destructure with defaults
    let {
      searchTerm = "",
      deptFilter = "",
      roleFilter = "",
      page = 1,
      limit = 10,
    } = req.query;

    console.log("Filters received:", {
      searchTerm,
      deptFilter,
      roleFilter,
      page,
      limit,
    });

    // Sanitize inputs
    searchTerm = String(searchTerm).trim();
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100); // cap at 100 per page
    const offset = (pageNum - 1) * limitNum;

    // Build WHERE conditions
    const where = {};

    if (searchTerm) {
      const orConditions = [
        { name: { [Op.iLike]: `%${searchTerm}%` } },
        { email: { [Op.iLike]: `%${searchTerm}%` } },
      ];

      // Only push numeric match if the term is numeric
      if (!isNaN(searchTerm)) {
        orConditions.push({ user_id: Number(searchTerm) });
      }

      where[Op.or] = orConditions;
    }

    if (deptFilter) {
      where.dept = deptFilter;
    }

    if (roleFilter) {
      where.desig = roleFilter;
    }

    // Query with pagination
    const { rows: users, count: totalItems } = await User.findAndCountAll({
      where,
      offset,
      limit: limitNum,
      order: [["user_id", "ASC"]],
      raw: true, // plain JSON output
    });

    const totalPages = Math.ceil(totalItems / limitNum);

    return res.json({
      data: users,
      pagination: {
        page: pageNum,
        limit: limitNum,
        totalItems,
        totalPages,
      },
    });
  } catch (error) {
    console.error("Error fetching users:", error);

    return res.status(500).json({
      message: "Failed to fetch users",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const patchUsers = async (req, res) => {
  const transaction = await sequelize.transaction();
  try {
    const { user_id } = req.body;
    if (!user_id) {
      await transaction.rollback();
      return res.status(400).json({ message: "User ID is required" });
    }

    // Only allow specific fields to be updated
    const allowedFields = [
      "name",
      "dept",
      "desig",
      "phno",
      "dateOfJoining",
      "email",
    ];
    const updates = {};
    allowedFields.forEach((field) => {
      if (req.body[field] !== undefined) updates[field] = req.body[field];
    });

    // Update user
    const [affected] = await User.update(updates, {
      where: { user_id },
      transaction,
      individualHooks: true, // ensures hooks and validations run per instance
    });

    if (affected === 0) {
      await transaction.rollback();
      return res.status(404).json({ message: "User not found" });
    }

    // Fetch updated user
    const updatedUser = await User.findByPk(user_id, {
      transaction,
      raw: true,
    });
    await transaction.commit();

    return res.json({
      message: "User updated successfully",
      data: updatedUser,
    });
  } catch (error) {
    await transaction.rollback();
    console.error("Error updating user:", error);

    // Handle unique constraint (email) violations gracefully
    if (error instanceof Sequelize.UniqueConstraintError) {
      return res.status(400).json({
        message: "Validation error",
        fields: error.errors.map((e) => e.path),
      });
    }

    return res.status(500).json({
      message: "Failed to update user",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const deleteUsers = async (req, res) => {
  try {
    const { ids = [] } = req.body;

    if (!Array.isArray(ids) || ids.length === 0) {
      return res
        .status(400)
        .json({ message: "No user IDs provided for deletion" });
    }

    // Soft delete: sets deletedAt timestamp instead of physically removing
    const deletedCount = await User.destroy({
      where: {
        user_id: { [Op.in]: ids.map(Number) },
      },
    });

    if (deletedCount === 0) {
      return res
        .status(404)
        .json({ message: "No matching users found to delete" });
    }

    return res.json({
      message: `${deletedCount} user(s) deleted successfully (soft delete applied)`,
      deletedCount,
    });
  } catch (error) {
    console.error("Error deleting users:", error);
    return res.status(500).json({
      message: "Failed to delete users",
      error: process.env.NODE_ENV === "development" ? error.message : undefined,
    });
  }
};

export const approveLeaves = async (req, res) => {
  const transaction = await sequelize.transaction();

  const { leaveIds } = req.body;

  if (!leaveIds || !leaveIds.length) {
    return res.status(400).json({ error: "leaveIds is required" });
  }

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

  if (!leaveIds || !leaveIds.length) {
    return res.status(400).json({ error: "leaveIds is required" });
  }
  try {
    const toReject = await LeavePending.findAll({
      where: { id: { [Op.in]: leaveIds } },
      transaction,
      lock: true,
    });

    if (toReject.length === 0) {
      await transaction.rollback();
      return res
        .status(404)
        .json({ error: "No matching pending leaves found" });
    }

    const rejectData = toReject.map((leave) => leave.toJSON());
    await LeaveRejected.bulkCreate(rejectData, { transaction });

    await LeavePending.destroy({
      where: { id: { [Op.in]: leaveIds } },
      transaction,
    });

    await transaction.commit();

    return res.status(200).json({
      success: true,
      message: `${toReject.length} leave(s) rejected.`,
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

export const grantCplV2 = async (req, res) => {
  const transaction = await sequelize.transaction();
  const grantedBy = req.body.grantedBy;
  const grants = req.body.grants;

  try {
    // 1️⃣ Find compensatory leave type
    const compensatoryType = await LeaveType.findOne({
      where: { name: "compensatory" },
      transaction,
    });

    if (!compensatoryType) {
      throw new Error("Compensatory leave type not found in LeaveType table");
    }

    const leaveTypeId = compensatoryType.id;

    // 2️⃣ Process each grant
    for (const { userId, days, reason } of grants) {
      const [balance, created] = await LeaveBalance_normalized.findOrCreate({
        where: { user_id: userId, leave_type_id: leaveTypeId },
        defaults: { balance: 0 },
        transaction,
      });

      const newBalance = balance.balance + days;
      await balance.update({ balance: newBalance }, { transaction });

      await CompensatoryLeave.create(
        {
          user_id: userId,
          days: days,
          reason: reason,
          grantedBy: grantedBy,
          grantedOn: new Date(),
        },
        { transaction }
      );
    }

    await transaction.commit();
    return res
      .status(200)
      .send("✅ Granted Compensatory Leaves Successfully (v2)");
  } catch (error) {
    await transaction.rollback();
    console.error(error);
    return res.status(400).send(parseError(error));
  }
};

/* ----------------------
   Leave Type controllers
   ---------------------- */

export const getAllLeaveTypes = async (req, res) => {
  try {
    // prefer canonical cache key
    const cached = await redis.get(CACHE_KEYS.LEAVE_TYPES);
    if (cached) return res.json(JSON.parse(cached));

    const leaveTypes = await LeaveType.findAll({ where: { active: true } });
    (await redis.setEx)
      ? await redis.setEx(
          CACHE_KEYS.LEAVE_TYPES,
          3600,
          JSON.stringify(leaveTypes)
        )
      : await redis.set(CACHE_KEYS.LEAVE_TYPES, JSON.stringify(leaveTypes));

    return res.json(leaveTypes);
  } catch (err) {
    console.error("getAllLeaveTypes:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const getLeaveTypeById = async (req, res) => {
  try {
    const { id } = req.params;
    const leaveType = await LeaveType.findByPk(id);
    if (!leaveType)
      return res.status(404).json({ error: "Leave type not found" });
    return res.json(leaveType);
  } catch (err) {
    console.error("getLeaveTypeById:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const addLeaveType = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { error } = leaveTypeSchema.validate(req.body);
    if (error) {
      await t.rollback();
      return res.status(400).json({ error: error.message });
    }

    const newType = await LeaveType.create(req.body, { transaction: t });

    // bulk create user balances (safe, transactional)
    const users = await User.findAll({
      attributes: ["user_id"],
      raw: true,
      transaction: t,
    });
    const rows = users.map((u) => ({
      user_id: u.user_id,
      leave_type_id: newType.id,
      balance: newType.defaultBalance || 0,
    }));

    if (rows.length) {
      await LeaveBalance_normalized.bulkCreate(rows, {
        ignoreDuplicates: true,
        transaction: t,
      });
    }

    await t.commit();

    // rebuild caches
    await cacheRules();

    return res.status(201).json(newType);
  } catch (err) {
    await t.rollback();
    console.error("addLeaveType error:", err);
    return res.status(400).json({ error: err.message });
  }
};

export const updateLeaveType = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { error } = leaveTypeSchema.validate(req.body, {
      presence: "optional",
    });
    if (error) {
      await t.rollback();
      return res.status(400).json({ error: error.message });
    }

    const [updated] = await LeaveType.update(req.body, {
      where: { id },
      transaction: t,
    });
    if (!updated) {
      await t.rollback();
      return res.status(404).json({ error: "Leave type not found" });
    }

    await t.commit();
    await cacheRules();
    const updatedType = await LeaveType.findByPk(id);
    return res.json(updatedType);
  } catch (err) {
    await t.rollback();
    console.error("updateLeaveType error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const deactivateLeaveType = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const leaveType = await LeaveType.findByPk(id, { transaction: t });
    if (!leaveType) {
      await t.rollback();
      return res.status(404).json({ error: "Leave type not found" });
    }
    leaveType.active = false;
    await leaveType.save({ transaction: t });
    await t.commit();

    await cacheRules();
    return res.json({ message: "Leave type deactivated" });
  } catch (err) {
    await t.rollback();
    console.error("deactivateLeaveType error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/* ----------------------
   Leave Rule controllers
   ---------------------- */

export const getLeaveRules = async (req, res) => {
  try {
    // support query param leaveTypeId
    const { leaveTypeId } = req.query;

    const cached = await redis.get(CACHE_KEYS.LEAVE_RULES);
    if (cached) {
      const list = JSON.parse(cached);
      if (leaveTypeId)
        return res.json(
          list.filter((r) => r.leave_type_id === Number(leaveTypeId))
        );
      return res.json(list);
    }

    const where = { active: true };
    if (leaveTypeId) where.leave_type_id = leaveTypeId;

    const rules = await LeaveRule.findAll({ where });
    (await redis.setEx)
      ? await redis.setEx(CACHE_KEYS.LEAVE_RULES, 3600, JSON.stringify(rules))
      : await redis.set(CACHE_KEYS.LEAVE_RULES, JSON.stringify(rules));
    console.log("Fetched Leave Rules:", rules);
    return res.json(rules);
  } catch (err) {
    console.error("getLeaveRules:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const addLeaveRule = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { error } = leaveRuleSchema.validate(req.body);
    if (error) {
      await t.rollback();
      return res.status(400).json({ error: error.message });
    }

    // Ensure leave type exists
    const leaveType = await LeaveType.findByPk(req.body.leave_type_id, {
      transaction: t,
    });
    if (!leaveType) {
      await t.rollback();
      return res.status(404).json({ error: "Leave type not found" });
    }

    const newRule = await LeaveRule.create(req.body, { transaction: t });
    await t.commit();

    // refresh caches
    await cacheRules();

    return res.status(201).json(newRule);
  } catch (err) {
    await t.rollback();
    console.error("addLeaveRule error:", err);
    return res.status(400).json({ error: err.message });
  }
};

export const updateLeaveRule = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    console.log(req.body);
    const { id } = req.params;
    const { error } = leaveRuleSchema.validate(req.body, {
      presence: "optional",
    });
    if (error) {
      await t.rollback();
      console.log(error);
      return res.status(400).json({ error: error.message });
    }

    const [updated] = await LeaveRule.update(req.body, {
      where: { id },
      transaction: t,
    });
    if (!updated) {
      await t.rollback();
      return res.status(404).json({ error: "Leave rule not found" });
    }

    await t.commit();
    await cacheRules();
    const updatedRule = await LeaveRule.findByPk(id);
    return res.json(updatedRule);
  } catch (err) {
    await t.rollback();
    console.log("updateLeaveRule error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const deleteLeaveRule = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const r = await LeaveRule.findByPk(id, { transaction: t });
    if (!r) {
      await t.rollback();
      return res.status(404).json({ error: "Leave rule not found" });
    }

    // soft delete
    r.active = false;
    await r.save({ transaction: t });
    await t.commit();

    await cacheRules();
    return res.json({ message: "Leave rule deactivated" });
  } catch (err) {
    await t.rollback();
    console.error("deleteLeaveRule error:", err);
    return res.status(500).json({ error: err.message });
  }
};

/* ----------------------
   Leave Credit Rule controllers
   ---------------------- */

export const getCreditRules = async (req, res) => {
  try {
    const { leaveTypeId } = req.query;
    console.log(leaveTypeId);

    const cached = await redis.get(CACHE_KEYS.CREDIT_RULES);
    if (cached) {
      const list = JSON.parse(cached);
      if (leaveTypeId)
        return res.json(
          list.filter((r) => r.leave_type_id === Number(leaveTypeId))
        );
      return res.json(list);
    }

    const where = { active: true };
    if (leaveTypeId) where.leave_type_id = leaveTypeId;

    const creditRules = await LeaveCreditRule.findAll({ where });
    (await redis.setEx)
      ? await redis.setEx(
          CACHE_KEYS.CREDIT_RULES,
          3600,
          JSON.stringify(creditRules)
        )
      : await redis.set(CACHE_KEYS.CREDIT_RULES, JSON.stringify(creditRules));

    console.log("Fetched Credit Rules:", creditRules);
    return res.json(creditRules);
  } catch (err) {
    console.error("getCreditRules:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const addCreditRule = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { error } = creditRuleSchema.validate(req.body);
    if (error) {
      await t.rollback();
      return res.status(400).json({ error: error.message });
    }

    const leaveType = await LeaveType.findByPk(req.body.leave_type_id, {
      transaction: t,
    });
    if (!leaveType) {
      await t.rollback();
      return res.status(404).json({ error: "Leave type not found" });
    }

    const newRule = await LeaveCreditRule.create(req.body, { transaction: t });
    await t.commit();

    await cacheRules();
    return res.status(201).json(newRule);
  } catch (err) {
    await t.rollback();
    console.error("addCreditRule error:", err);
    return res.status(400).json({ error: err.message });
  }
};

export const updateCreditRule = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const { error } = creditRuleSchema.validate(req.body, {
      presence: "optional",
    });
    if (error) {
      await t.rollback();
      return res.status(400).json({ error: error.message });
    }

    const [updated] = await LeaveCreditRule.update(req.body, {
      where: { id },
      transaction: t,
    });
    if (!updated) {
      await t.rollback();
      return res.status(404).json({ error: "Credit rule not found" });
    }

    await t.commit();
    await cacheRules();
    const updatedRule = await LeaveCreditRule.findByPk(id);
    return res.json(updatedRule);
  } catch (err) {
    await t.rollback();
    console.error("updateCreditRule error:", err);
    return res.status(500).json({ error: err.message });
  }
};

export const deleteCreditRule = async (req, res) => {
  const t = await sequelize.transaction();
  try {
    const { id } = req.params;
    const r = await LeaveCreditRule.findByPk(id, { transaction: t });
    if (!r) {
      await t.rollback();
      return res.status(404).json({ error: "Credit rule not found" });
    }
    r.active = false;
    await r.save({ transaction: t });
    await t.commit();

    await cacheRules();
    return res.json({ message: "Credit rule deactivated" });
  } catch (err) {
    await t.rollback();
    console.error("deleteCreditRule error:", err);
    return res.status(500).json({ error: err.message });
  }
};
