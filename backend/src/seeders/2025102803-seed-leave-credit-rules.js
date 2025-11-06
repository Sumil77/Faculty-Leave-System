"use strict";

export async function up(queryInterface, Sequelize) {
  // Wrap in a transaction for safety
  const transaction = await queryInterface.sequelize.transaction();
  try {
    // Fetch all leave types (id + name)
    const [leaveTypes] = await queryInterface.sequelize.query(
      `SELECT "id", "name" FROM "LeaveTypes";`,
      { transaction }
    );

    // Build rule objects for each leave type
    const rules = leaveTypes.map((type) => ({
      leave_type_id: type.id, // ✅ use foreign key now
      credit_frequency:
        type.name === "casual" || type.name === "earned"
          ? "monthly"
          : type.name === "medical"
          ? "quarterly"
          : "dateOfJoining",
      credit_day: 1,
      credit_amount:
        type.name === "casual"
          ? 1
          : type.name === "earned"
          ? 2.5
          : type.name === "medical"
          ? 1.25
          : 0,
      carry_forward: ["earned", "medical"].includes(type.name),
      carry_forward_limit: type.name === "earned" ? 30 : 0,
      max_balance: type.name === "earned" ? 60 : 0,
      remarks: `Default credit rule for ${type.name}`,
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    }));

    // Insert into leave_credit_rules table
    await queryInterface.bulkInsert("leave_credit_rules", rules, {
      transaction,
    });

    await transaction.commit();
  } catch (error) {
    await transaction.rollback();
    throw error;
  }
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("leave_credit_rules", null, {});
}
