import { faker } from "@faker-js/faker";
import { defaultLeaveTypes } from "../validators/leaveValidations.js";

export async function up(queryInterface, Sequelize) {
  const pending = [];
  const approved = [];
  const rejected = [];

  const leaveKeys = Object.keys(defaultLeaveTypes);
  let globalId = 21;

  // Fetch all users except system one
  const users = await queryInterface.sequelize.query(
    `SELECT user_id, dept FROM "User" WHERE user_id <> 123;`,
    { type: queryInterface.sequelize.QueryTypes.SELECT }
  );

  for (const user of users) {
    const numLeaves = faker.number.int({ min: 1, max: 5 });

    for (let j = 0; j < numLeaves; j++) {
      const from = faker.date.recent({ days: 90 });
      const to = new Date(from);
      to.setDate(to.getDate() + faker.number.int({ min: 0, max: 5 }));

      const leaveKey = faker.helpers.arrayElement(leaveKeys);
      const fraction = faker.helpers.arrayElement(["full", "half", "quarter"]);

      // compute totalDays based on fraction
      const baseDays = Math.ceil((to - from) / (1000 * 60 * 60 * 24)) + 1;
      let fractionMultiplier = 1;
      if (fraction === "half") fractionMultiplier = 0.5;
      else if (fraction === "quarter") fractionMultiplier = 0.25;

      const totalDays = parseFloat((baseDays * fractionMultiplier).toFixed(2));

      const appliedOn = faker.date.between({
        from: new Date(from.getTime() - 7 * 24 * 60 * 60 * 1000),
        to: from,
      });

      const leaveObj = {
        id: globalId++,
        user_id: user.user_id,
        appliedOn,
        fromDate: from,
        toDate: to,
        totalDays,
        fraction,
        leaveType: leaveKey,
        dept: user.dept,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const state = faker.helpers.arrayElement([
        "pending",
        "approved",
        "rejected",
      ]);
      if (state === "pending") pending.push(leaveObj);
      else if (state === "approved") approved.push(leaveObj);
      else rejected.push(leaveObj);
    }
  }

  await queryInterface.bulkInsert("LeavePending", pending);
  await queryInterface.bulkInsert("LeaveApproved", approved);
  await queryInterface.bulkInsert("LeaveRejected", rejected);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("LeavePending", null, {});
  await queryInterface.bulkDelete("LeaveApproved", null, {});
  await queryInterface.bulkDelete("LeaveRejected", null, {});
}
