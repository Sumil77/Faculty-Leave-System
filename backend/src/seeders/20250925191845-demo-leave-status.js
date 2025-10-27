import { faker } from "@faker-js/faker";
import { leaveTypes } from "../validators/leaveValidations.js";

export async function up(queryInterface, Sequelize) {
  const pending = [];
  const approved = [];
  const rejected = [];
  const leaveKeys = Object.keys(leaveTypes);

  let globalId = 21; // cumulative unique ID

  // Step 1: Fetch all users with their department
  const users = await queryInterface.sequelize.query(
    `SELECT user_id, dept FROM "User" where user_id <> 123;`,
    { type: queryInterface.sequelize.QueryTypes.SELECT }
  );

  for (const user of users) {
    const numLeaves = faker.number.int({ min: 1, max: 5 });

    for (let j = 0; j < numLeaves; j++) {
      // Generate leave dates
      const from = faker.date.recent({ days: 90 });
      const to = new Date(from);
      to.setDate(to.getDate() + faker.number.int({ min: 1, max: 5 }));

      const leaveKey = faker.helpers.arrayElement(leaveKeys);
      const totalDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
      const appliedOn = faker.date.between({
        from: new Date(from.getTime() - 7 * 24 * 60 * 60 * 1000),
        to: from,
      });

      const leaveObj = {
        id: globalId++, // unique ID across all tables
        user_id: user.user_id,
        appliedOn,
        fromDate: from,
        toDate: to,
        totalDays,
        leaveType: leaveKey,
        dept: user.dept, // consistent with user
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      // Simulate workflow: most leaves start as pending
      const workflowState = faker.helpers.arrayElement(["pending", "approved", "rejected"]);

      if (workflowState === "pending") pending.push(leaveObj);
      else if (workflowState === "approved") approved.push(leaveObj);
      else rejected.push(leaveObj);
    }
  }

  // Step 2: Bulk insert
  await queryInterface.bulkInsert("LeavePending", pending);
  await queryInterface.bulkInsert("LeaveApproved", approved);
  await queryInterface.bulkInsert("LeaveRejected", rejected);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("LeavePending", null, {});
  await queryInterface.bulkDelete("LeaveApproved", null, {});
  await queryInterface.bulkDelete("LeaveRejected", null, {});
}
