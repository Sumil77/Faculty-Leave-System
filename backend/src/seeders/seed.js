import { sequelize } from "../config.js";

// Import all seeders
import * as userSeeder from "./20250925190229-demo-users.js";
import * as credentialsSeeder from "./20250925191610-demo-credentials.js";
import * as adminSeeder from "./20250925190230-demo-admins.js";
import * as leaveTypeSeeder from "./2025102801-seed-leave-types.js";
import * as leaveRuleSeeder from "./2025102802-seed-leave-rules.js";
import * as leaveCreditRuleSeeder from "./2025102803-seed-leave-credit-rules.js";
import * as leaveBalanceSeeder from "./20250925190231-demo-leave-balance.js";
import * as leaveTakenSeeder from "./20250925190236-demo-leave-taken.js";
import * as leaveBalanceNormalizedSeeder from "./2025110701-seed-leave-balance-normalized.js"; // new
import * as leaveStatusSeeder from "./20250925191845-demo-leave-status.js";

async function seedAll() {
  try {
    console.log("🚀 Starting database seeding...");

    const queryInterface = sequelize.getQueryInterface();
    const SequelizeClass = sequelize.constructor;

    async function runSeederSafely(seeder, tableName) {
      console.log(`🌱 Seeding ${tableName}...`);

      try {
        await seeder.up(queryInterface, SequelizeClass);
        console.log(`✅ ${tableName} seeded successfully.`);
      } catch (err) {
        console.warn(`⚠️ Skipped ${tableName}:`, err.message);
      }
    }

    // 🧩 ORDER MATTERS
    // 1️⃣ Core entities
    await runSeederSafely(userSeeder, "User");
    await runSeederSafely(credentialsSeeder, "Credentials");
    await runSeederSafely(adminSeeder, "Admins");

    // 2️⃣ Leave base types
    await runSeederSafely(leaveTypeSeeder, "LeaveTypes");

    // 3️⃣ Rules tied to LeaveTypes
    await runSeederSafely(leaveRuleSeeder, "leave_rules");
    await runSeederSafely(leaveCreditRuleSeeder, "leave_credit_rules");

    // 4️⃣ Balances & Taken leaves tied to Users + LeaveTypes
    await runSeederSafely(leaveBalanceSeeder, "LeaveBalance");
    await runSeederSafely(
      leaveBalanceNormalizedSeeder,
      "LeaveBalances_normalized"
    );
    await runSeederSafely(leaveTakenSeeder, "LeaveTaken");

    // 5️⃣ Leave requests (Pending/Approved/Rejected)
    await leaveStatusSeeder.up(queryInterface, SequelizeClass);

    console.log("🎉 All seeders executed successfully!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during seeding:", err);
    process.exit(1);
  }
}

seedAll();
