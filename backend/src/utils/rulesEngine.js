// backend/src/utils/rulesEngine.js
import redisClient from "../redis.js";
import { LeaveRule } from "../models/index.js";

/**
 * Fetch leave rules from Redis or DB (fallback)
 */
export async function getLeaveRules() {
  let rules = await redisClient.get("leave_rules");
  if (rules) return JSON.parse(rules);

  // Fallback to DB and update cache
  const dbRules = await LeaveRule.findAll({ where: { active: true } });
  await redisClient.set("leave_rules", JSON.stringify(dbRules));
  return dbRules;
}

/**
 * Validate leave request against dynamic rules
 * @param {Object} user - The user applying for leave
 * @param {number} leaveTypeId - Type ID of the leave
 * @param {number} requestedDays - Number of days requested
 * @param {boolean} [isHalfDay=false] - Whether the leave is half-day
 * @param {Date} [requestDate=new Date()] - Date of leave application
 */
export async function evaluateLeaveRequest(
  user,
  leaveTypeId,
  requestedDays,
  isHalfDay = false,
  requestDate = new Date()
) {
  const rules = await getLeaveRules();
  const rule = rules.find((r) => r.leave_type_id === leaveTypeId);

  if (!rule) return { valid: true }; // No restrictions — default valid

  const fail = (reason) => ({ valid: false, reason });

  // 1. Max/min per request
  if (rule.max_days_per_request && requestedDays > rule.max_days_per_request)
    return fail(`Cannot exceed ${rule.max_days_per_request} days per request.`);
  if (rule.min_days_per_request && requestedDays < rule.min_days_per_request)
    return fail(`Minimum ${rule.min_days_per_request} day(s) required.`);

  // 2. Half-day restriction
  if (!rule.allow_half_day && isHalfDay)
    return fail(`Half-day not allowed for this leave type.`);

  // 3. Gender or marital applicability
  if (
    rule.gender_applicable &&
    rule.gender_applicable !== "all" &&
    user.gender !== rule.gender_applicable
  )
    return fail(`This leave type is not applicable for your gender.`);

  if (
    rule.marital_status_applicable &&
    rule.marital_status_applicable !== "all" &&
    user.marital_status !== rule.marital_status_applicable
  )
    return fail(`This leave type is not applicable for your marital status.`);

  // 4. Minimum service requirement
  if (rule.min_service_months) {
    const joining = new Date(user.joining_date);
    const diffMonths =
      (requestDate.getFullYear() - joining.getFullYear()) * 12 +
      (requestDate.getMonth() - joining.getMonth());

    if (diffMonths < rule.min_service_months)
      return fail(
        `You must complete ${rule.min_service_months} months of service before availing this leave.`
      );
  }

  // 5. Check probation
  if (!rule.probation_allowed && user.is_probation)
    return fail(`This leave cannot be taken during probation.`);

  // 6. Department/designation restriction
  if (
    rule.restricted_to_department?.length &&
    !rule.restricted_to_department.includes(user.department)
  )
    return fail(`This leave is not applicable to your department.`);

  if (
    rule.restricted_to_designation?.length &&
    !rule.restricted_to_designation.includes(user.designation)
  )
    return fail(`This leave is not applicable to your designation.`);

  // 7. Require prior approval or apply-before-days
  if (rule.apply_before_days) {
    const diffDays = Math.ceil(
      (new Date(requestDate) - new Date()) / (1000 * 60 * 60 * 24)
    );
    if (diffDays < rule.apply_before_days)
      return fail(
        `Leave must be applied at least ${rule.apply_before_days} day(s) in advance.`
      );
  }

  // 8. Miscellaneous
  if (rule.reason_required && !user.reason)
    return fail(`Reason is mandatory for this leave.`);
  if (rule.attachment_required && !user.attachment)
    return fail(`Attachment required for this leave.`);

  return { valid: true };
}
