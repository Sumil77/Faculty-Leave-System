import {
  User,
  LeaveApproved,
  LeaveRejected,
  LeavePending,
  LeaveBalance,
  LeaveTaken,
  CompensatoryLeave,
} from "../models/index.js";
import { parseError } from "./userController.js";
import { col, fn, literal, Op, QueryTypes } from "sequelize";
import {
  leaveSchema,
  validateLeaveBalance,
} from "../validators/leaveValidations.js";
import { sequelize } from "../config.js";


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
      "leaveType",
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
      if (leaveType && leaveType !== "All") where.leaveType = leaveType;
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
          { leaveType: { [Op.iLike]: `%${search}%` } },
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
             la."totalDays", la."leaveType", la.dept, la."createdAt", 'Approved' as status
      FROM "LeaveApproved" la JOIN "User" u ON la.user_id = u.user_id
      UNION ALL
      SELECT lr.id, lr.user_id, u.name, lr."appliedOn", lr."fromDate", lr."toDate",
             lr."totalDays", lr."leaveType", lr.dept, lr."createdAt", 'Rejected' as status
      FROM "LeaveRejected" lr JOIN "User" u ON lr.user_id = u.user_id
      UNION ALL
      SELECT lp.id, lp.user_id, u.name, lp."appliedOn", lp."fromDate", lp."toDate",
             lp."totalDays", lp."leaveType", lp.dept, lp."createdAt", 'Pending' as status
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
      unionWhereClauses.push(`"leaveType" = :leaveType`);
      replacements.leaveType = leaveType;
    }
    if (search) {
      unionWhereClauses.push(
        `(CAST(user_id AS TEXT) ILIKE :search OR name ILIKE :search OR "leaveType" ILIKE :search)`
      );
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
    
    console.log("Filters received:", { searchTerm, deptFilter, roleFilter, page, limit });


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

export const getLeaves = async (req, res) => {};

export const getSummary = async (req, res) => {};

export const downloadReport = async (req, res) => {};

export const postUser = async (req, res) => {};

export const mailReport = async (req, res) => {};

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
