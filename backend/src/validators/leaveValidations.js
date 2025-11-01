import Joi from "joi";
import { LeaveBalance, LeaveBalance_normalized } from "../models/index.js";
import redisClient from "../redis.js"; // your redis connection

// Default leave types (fallback)
export const defaultLeaveTypes = {
  casual: { fullName: "Casual", acronym: "CL" },
  medical: { fullName: "Medical", acronym: "ML" },
  specialCasual: { fullName: "Special Casual", acronym: "SCL" },
  extraOrdinary: { fullName: "Extra Ordinary", acronym: "EOL" },
  earned: { fullName: "Earned", acronym: "EL" },
  onDutyExam: { fullName: "On Duty(Exam)", acronym: "OD-Exam" },
  onDutyOther: { fullName: "On Duty(Other)", acronym: "OD-Other" },
  maternity: { fullName: "Maternity", acronym: "MLv" },
  election: { fullName: "Election", acronym: "ELE" },
  compensatory: { fullName: "Compensatory", acronym: "CPL" },
  withoutPay: { fullName: "Without Pay", acronym: "WPL" },
};

/* ----------------------
   Validation schemas
   ---------------------- */
export const leaveTypeSchema = Joi.object({
  name: Joi.string().max(255).required(),
  acronym: Joi.string().max(20).required(),
  description: Joi.string().allow("", null),
  defaultBalance: Joi.number().integer().min(0).optional(),
  maxDaysPerMonth: Joi.number().integer().min(0).optional(),
  maxDaysPerYear: Joi.number().integer().min(0).optional(),
  carryForward: Joi.boolean().optional(),
  requiresDocument: Joi.boolean().optional(),
  isPaid: Joi.boolean().optional(),
  genderSpecific: Joi.string().valid("M", "F", "ANY", null).optional(),
  minGapBetweenLeaves: Joi.number().integer().optional(),
  maxConsecutiveDays: Joi.number().integer().optional(),
  noticePeriodRequired: Joi.number().integer().optional(),
  active: Joi.boolean().optional(),
});

export const leaveRuleSchema = Joi.object({
  leave_type_id: Joi.number().integer().required(),
  max_days_per_request: Joi.number().integer().optional(),
  min_days_per_request: Joi.number().integer().optional(),
  max_days_per_year: Joi.number().integer().optional(),
  max_days_per_month: Joi.number().integer().optional(),
  allow_half_day: Joi.boolean().optional(),
  allow_quarter_day: Joi.boolean().optional(),
  max_consecutive_days: Joi.number().integer().optional(),
  min_gap_between_leaves: Joi.number().integer().optional(),
  require_prior_approval: Joi.boolean().optional(),
  apply_before_days: Joi.number().integer().optional(),
  gender_applicable: Joi.string().optional(),
  probation_allowed: Joi.boolean().optional(),
  min_service_months: Joi.number().integer().optional(),
  holiday_included: Joi.boolean().optional(),
  weekend_included: Joi.boolean().optional(),
  can_be_combined_with: Joi.array().items(Joi.string()).optional(),
  restricted_to_designation: Joi.array().items(Joi.string()).optional(),
  restricted_to_department: Joi.array().items(Joi.string()).optional(),
  restricted_to_location: Joi.array().items(Joi.string()).optional(),
  reason_required: Joi.boolean().optional(),
  attachment_required: Joi.boolean().optional(),
  approval_chain: Joi.array().items(Joi.string()).optional(),
  auto_approve_if_pending_days: Joi.number().integer().optional(),
  encashable: Joi.boolean().optional(),
  active: Joi.boolean().optional(),
});

export const creditRuleSchema = Joi.object({
  leave_type_id: Joi.number().integer().required(),
  credit_frequency: Joi.string().valid("monthly", "quarterly", "yearly", "dateOfJoining").required(),
  credit_day: Joi.number().integer().optional(),
  credit_amount: Joi.number().precision(2).required(),
  prorate_on_joining: Joi.boolean().optional(),
  probation_excluded: Joi.boolean().optional(),
  department_id: Joi.number().integer().optional(),
  designation_id: Joi.number().integer().optional(),
  carry_forward: Joi.boolean().optional(),
  carry_forward_limit: Joi.number().precision(2).optional(),
  lapse_after_days: Joi.number().integer().optional(),
  max_balance: Joi.number().precision(2).optional(),
  bonus_credit_on_occasion: Joi.object().optional(),
  penalty_rule: Joi.object().optional(),
  auto_reset: Joi.boolean().optional(),
  leave_encashment_allowed: Joi.boolean().optional(),
  encashment_conversion_rate: Joi.number().precision(2).optional(),
  min_balance_for_encashment: Joi.number().precision(2).optional(),
  credit_on_anniversary: Joi.boolean().optional(),
  remarks: Joi.string().optional(),
  active: Joi.boolean().optional(),
});


// Fetch leave types dynamically
export const getLeaveTypes = async () => {
  const cachedTypes = await redisClient.get("leave_types");
  return cachedTypes ? JSON.parse(cachedTypes) : defaultLeaveTypes;
};

export const getValidLeaveTypeKeys = async () => {
  const types = await getLeaveTypes();
  return Object.keys(types);
};

// Joi schema with async extension
export const leaveSchema = Joi.object({
  appliedOn: Joi.date().required().label("Applied On"),

  fromDate: Joi.date()
    .required()
    .label("From Date")
    .custom((value, helpers) => {
      const { appliedOn } = helpers.state.ancestors[0];
      if (new Date(value) < new Date(appliedOn.toDateString())) {
        return helpers.message(`"From Date" cannot be before "Applied On"`);
      }
      return value;
    }),

  toDate: Joi.date()
    .required()
    .label("To Date")
    .custom((value, helpers) => {
      const { fromDate } = helpers.state.ancestors[0];
      if (new Date(value) < new Date(fromDate)) {
        return helpers.message(`"To Date" cannot be before "From Date"`);
      }
      return value;
    }),

  leaveType: Joi.string().required().label("Type of Leave"),

  // 👇 New field for partial leaves
  fraction: Joi.string()
    .valid("full", "half", "quarter")
    .default("full")
    .label("Leave Fraction"),
});

// Validation function combining Joi + Redis
export const validateLeaveRequest = async (leaveData, userId) => {
  // Step 1: Validate structure
  const { error, value } = leaveSchema.validate(leaveData);
  if (error) throw new Error(error.details[0].message);

  // Step 2: Fetch dynamic types
  const leaveTypes = await getLeaveTypes();
  const validKeys = Object.keys(leaveTypes);

  if (!validKeys.includes(value.leaveType)) {
    throw new Error(`"Type of Leave" must be one of: ${validKeys.join(", ")}`);
  }

  // Step 3: Compute day count
  let numDays =
    (new Date(value.toDate) - new Date(value.fromDate)) /
      (1000 * 60 * 60 * 24) +
    1;

  if (value.fraction === "half") numDays = 0.5;
  if (value.fraction === "quarter") numDays = 0.25;

  // Step 4: Check balance
  const balance = await LeaveBalance.findOne({ where: { user_id: userId } });
  if (!balance) throw new Error("Leave balance not found for user.");

  const available = balance[value.leaveType];

  if (available < numDays) {
    throw new Error(
      `Insufficient balance. You have ${available} days available for ${
        leaveTypes[value.leaveType].fullName
      }`
    );
  }

  return { ...value, numDays };
};

export const leaveSchemaV2 = Joi.object({
  appliedOn: Joi.date().required().label("Applied On"),

  fromDate: Joi.date()
    .required()
    .label("From Date")
    .custom((value, helpers) => {
      const { appliedOn } = helpers.state.ancestors[0];
      if (new Date(value) < new Date(appliedOn.toDateString())) {
        return helpers.message(`"From Date" cannot be before "Applied On"`);
      }
      return value;
    }),

  toDate: Joi.date()
    .required()
    .label("To Date")
    .custom((value, helpers) => {
      const { fromDate } = helpers.state.ancestors[0];
      if (new Date(value) < new Date(fromDate)) {
        return helpers.message(`"To Date" cannot be before "From Date"`);
      }
      return value;
    }),

  // 👇 only this field now — accepts either numeric ID or numeric string
  leaveTypeId: Joi.alternatives()
    .try(Joi.number().integer().positive(), Joi.string().regex(/^\d+$/))
    .required()
    .label("Leave Type ID"),

  fraction: Joi.string()
    .valid("full", "half", "quarter")
    .default("full")
    .label("Leave Fraction"),
});

export const getLeaveTypesV2 = async () => {
  const cachedTypes = await redisClient.get("leave_types");
  const parsed = cachedTypes ? JSON.parse(cachedTypes) : defaultLeaveTypes;

  // Normalize array → object keyed by ID
  const normalized = Array.isArray(parsed)
    ? Object.fromEntries(parsed.map((t) => [String(t.id), t]))
    : parsed;

    console.log(normalized);
    

  return normalized;
};

export const getValidLeaveTypeKeysV2 = async () => {
  const types = await getLeaveTypesV2();
  return Object.keys(types); // e.g. ["1", "2", "3", ...]
};

/**
 * Validates a leave request against business rules and user's available balance.
 * Works with new normalized LeaveBalance schema.
 */
export const validateLeaveRequestV2 = async (leaveData, userId) => {
  // Step 1: Joi validation
  const { error, value } = leaveSchemaV2.validate(leaveData);
  if (error) throw new Error(error.details[0].message);

  // Step 2: Fetch leave types from Redis
  const leaveTypes = await getLeaveTypesV2();
  const leaveTypeId = String(value.leaveTypeId);

  if (!leaveTypes[leaveTypeId]) {
    throw new Error(`Invalid leave type ID: ${leaveTypeId}`);
  }

  // Step 3: Compute number of days
  let numDays =
    (new Date(value.toDate) - new Date(value.fromDate)) /
      (1000 * 60 * 60 * 24) +
    1;

  if (value.fraction === "half") numDays = 0.5;
  if (value.fraction === "quarter") numDays = 0.25;

  // Step 4: Fetch and check leave balance
  const balance = await LeaveBalance_normalized.findOne({
    where: { user_id: userId, leave_type_id: leaveTypeId },
  });

  if (!balance) {
    throw new Error(
      `No balance record found for leave type "${leaveTypes[leaveTypeId].name}".`
    );
  }

  const available = balance.balance;
  if (available < numDays) {
    throw new Error(
      `Insufficient balance. You have ${available} days available for "${leaveTypes[leaveTypeId].name}".`
    );
  }

  // Step 5: Return normalized validated data
  return {
    ...value,
    numDays,
    leave_type_id: parseInt(leaveTypeId, 10),
  };
};
