import {
  User,
  LeaveType,
  LeaveBalance_normalized,
  LeaveBalance,
} from "../models/index.js";
import { sequelize } from "../config.js";


const migrateLeaveBalances = async () => {
  try {
    await sequelize.authenticate();
    console.log("✅ Connected to DB");

    const leaveTypes = await LeaveType.findAll();
    const typeMap = {};
    leaveTypes.forEach((t) => (typeMap[t.name.toLowerCase()] = t.id));

    const oldBalances = await LeaveBalance.findAll({ raw: true });

    for (const old of oldBalances) {
      const userId = old.user_id;

      // iterate over each column in the old table (except user_id)
      for (const [key, value] of Object.entries(old)) {
        if (key === "user_id" || value == null) continue;

        const leaveTypeId = typeMap[key.toLowerCase()];
        if (!leaveTypeId) {
          console.warn(`⚠️ No matching leave type found for column "${key}"`);
          continue;
        }

        await LeaveBalance_normalized.create({
          user_id: userId,
          leave_type_id: leaveTypeId,
          balance: value || 0,
        });
      }

      console.log(`✅ Migrated balances for user ${userId}`);
    }

    console.log("🎉 Migration complete");
  } catch (err) {
    console.error("❌ Migration failed:", err);
  } finally {
    await sequelize.close();
  }
};

migrateLeaveBalances();
