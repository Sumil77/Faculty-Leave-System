import { sequelize } from "../config.js";

// Import all seeders
import * as userSeeder from "./20250925190229-demo-users.js";
import * as adminSeeder from "./20250925190230-demo-admins.js";
import * as leaveBalanceSeeder from "./20250925190231-demo-leave-balance.js";
import * as leaveTakenSeeder from "./20250925190236-demo-leave-taken.js";
import * as credentialsSeeder from "./20250925191610-demo-credentials.js";
import * as leaveStatusSeeder from "./20250925191845-demo-leave-status.js";

async function seedAll() {
  try {
    console.log("Starting database seeding...");

    const queryInterface = sequelize.getQueryInterface();
    const SequelizeClass = sequelize.constructor;

    // Helper to run seeder safely
    async function runSeederSafely(seeder, tableName) {
      console.log(`Seeding ${tableName}...`);
      // Read all existing IDs/emails for that table
      const [existingRows] = await sequelize.query(
        `SELECT * FROM "${tableName}";`
      );
      const existingIds = new Set(existingRows.map((r) => r.user_id || r.id));

      // Monkey patch queryInterface.bulkInsert to skip duplicates
      const originalBulkInsert = queryInterface.bulkInsert.bind(queryInterface);
      queryInterface.bulkInsert = async (tbl, records, options) => {
        const filtered = records.filter((r) => !existingIds.has(r.user_id));
        if (filtered.length > 0) {
          await originalBulkInsert(tbl, filtered, options);
        } else {
          console.log(`✅ No new ${tableName} to insert.`);
        }
      };

      await seeder.up(queryInterface, SequelizeClass);

      // Restore original
      queryInterface.bulkInsert = originalBulkInsert;
    }

    await runSeederSafely(userSeeder, "User");
    await runSeederSafely(adminSeeder, "Admins");
    await runSeederSafely(credentialsSeeder, "Credentials");
    await runSeederSafely(leaveBalanceSeeder, "LeaveBalance");
    await runSeederSafely(leaveTakenSeeder, "LeaveTaken");
    await leaveStatusSeeder.up(
      sequelize.getQueryInterface(),
      sequelize.constructor
    );

    console.log("✅ All seeders executed safely!");
    process.exit(0);
  } catch (err) {
    console.error("❌ Error during seeding:", err);
    process.exit(1);
  }
}

seedAll();
