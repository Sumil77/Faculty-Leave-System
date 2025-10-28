'use strict';

export async function up(queryInterface, Sequelize) {
  const [leaveTypes] = await queryInterface.sequelize.query(
    `SELECT "id", "name" FROM "LeaveTypes";`
  );

  const rules = leaveTypes.map((type) => ({
    leave_type_id: type.id,
    max_days_per_request:
      type.name === "casual"
        ? 5
        : type.name === "medical"
        ? 10
        : type.name === "earned"
        ? 15
        : type.name === "maternity"
        ? 180
        : type.name === "election"
        ? 2
        : 10,
    min_days_per_request: 1,
    allow_half_day: ["casual", "medical", "earned"].includes(type.name),
    allow_quarter_day: type.name === "casual",
    require_prior_approval: true,
    reason_required: true,
    attachment_required: ["medical", "maternity"].includes(type.name),
    active: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  }));

  await queryInterface.bulkInsert("leave_rules", rules);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("leave_rules", null, {});
}
