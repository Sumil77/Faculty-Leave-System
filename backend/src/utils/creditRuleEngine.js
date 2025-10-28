// backend/src/utils/creditRulesEngine.js
import { sequelize } from '../config.js';
import redisClient from '../config/redis.js';
import { LeaveCreditRule, LeaveBalance, User, LeaveBalance_normalized } from '../models/index.js';

/**
 * Fetch credit rules from Redis cache or DB
 */
export async function getCreditRules() {
  let cached = await redisClient.get('leave_credit_rules');
  if (cached) return JSON.parse(cached);

  const rules = await LeaveCreditRule.findAll({ where: { active: true } });
  await redisClient.set('leave_credit_rules', JSON.stringify(rules));
  return rules;
}

/**
 * Apply all credit rules (run by cron/BullMQ job)
 */
export async function applyCreditRules() {
  const rules = await getCreditRules();

  for (const rule of rules) {
    const eligibleUsers = await getEligibleUsers(rule);

    for (const user of eligibleUsers) {
      await creditLeave(user, rule);
    }
  }
}

/**
 * Filter users based on rule conditions
 */
async function getEligibleUsers(rule) {
  const where = { active: true };

  if (rule.restricted_to_department?.length)
    where.department = rule.restricted_to_department;

  if (rule.restricted_to_designation?.length)
    where.designation = rule.restricted_to_designation;

  // Optional filters for service length, gender, etc.
  if (rule.min_service_months) {
    // Filter manually later if required for perf reasons
    const allUsers = await User.findAll({ where });
    const now = new Date();
    return allUsers.filter(u => {
      const joining = new Date(u.joining_date);
      const diffMonths = (now.getFullYear() - joining.getFullYear()) * 12 + (now.getMonth() - joining.getMonth());
      return diffMonths >= rule.min_service_months;
    });
  }

  return await User.findAll({ where });
}

/**
 * Credit leaves to a user based on rule
 */
async function creditLeave(user, rule) {
  const [balance, created] = await LeaveBalance.findOrCreate({
    where: {
      user_id: user.id,
      leave_type_id: rule.leave_type_id
    },
    defaults: { balance: 0 }
  });

  let newBalance = balance.balance + rule.credit_amount;

  if (rule.max_balance && newBalance > rule.max_balance) {
    newBalance = rule.max_balance;
  }

  await balance.update({ balance: newBalance });
}


/**
 * Credits leave balance for a given user and rule.
 * Automatically caps at rule.max_balance (if defined).
 * Creates a LeaveBalance entry if not found.
 *
 * @param {Object} user - User object containing user.id
 * @param {Object} rule - Rule containing leave_type_id, credit_amount, and max_balance
 * @param {Object} [transaction] - Optional Sequelize transaction
 */
export async function creditLeaveV2(user, rule) {
  const transaction = await sequelize.transaction();
  const [balance, created] = await LeaveBalance_normalized.findOrCreate({
    where: {
      user_id: user.id,
      leave_type_id: rule.leave_type_id,
    },
    defaults: { balance: 0 },
    transaction,
  });

  let newBalance = balance.balance + rule.credit_amount;

  // ✅ Cap at maximum allowed balance if defined
  if (rule.max_balance && newBalance > rule.max_balance) {
    newBalance = rule.max_balance;
  }

  // ✅ Update within the same transaction (if passed)
  await balance.update({ balance: newBalance }, { transaction });

  return {
    user_id: user.id,
    leave_type_id: rule.leave_type_id,
    oldBalance: balance.balance,
    newBalance,
    created,
  };
}


/**
 * Clear cache after any rule modification
 */
export async function invalidateCreditRuleCache() {
  await redisClient.del('leave_credit_rules');
}
