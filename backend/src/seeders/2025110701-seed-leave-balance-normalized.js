'use strict';

export async function up(queryInterface, Sequelize) {
  const transaction = await queryInterface.sequelize.transaction();

  try {
    // Fetch users and leave types
    const [users] = await queryInterface.sequelize.query(
      `SELECT "id" FROM "Users";`,
      { transaction }
    );

    const [leaveTypes] = await queryInterface.sequelize.query(
      `SELECT "id", "name" FROM "LeaveTypes";`,
      { transaction }
    );

    if (!users.length || !leaveTypes.length) {
      console.warn("⚠️ No users or leave types found. Seeder skipped.");
      await transaction.rollback();
      return;
    }

    // Create balances for each user × leave type pair
    const leaveBalances = [];

    for (const user of users) {
      for (const type of leaveTypes) {
        leaveBalances.push({
          user_id: user.id,
          leave_type_id: type.id,
          balance:
            type.name === "earned"
              ? 10 // e.g. earned leaves start with 10
              : type.name === "casual"
              ? 5
              : type.name === "medical"
              ? 8
              : 0,
          last_updated: new Date(),
          createdAt: new Date(),
          updatedAt: new Date(),
        });
      }
    }

    await queryInterface.bulkInsert(
      "LeaveBalances_normalized",
      leaveBalances,
      { transaction }
    );

    await transaction.commit();
    console.log(`✅ Inserted ${leaveBalances.length} leave balance records.`);
  } catch (error) {
    await transaction.rollback();
    console.error("❌ Leave balance seeder failed:", error);
    throw error;
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("LeaveBalances_normalized", null, {});
}
