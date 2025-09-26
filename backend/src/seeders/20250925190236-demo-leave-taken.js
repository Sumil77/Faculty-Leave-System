'use strict';

import { faker } from "@faker-js/faker";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  const leaveTaken = [];

  for (let i = 1; i <= 50; i++) {
    leaveTaken.push({
      user_id: i,
      dateOfJoining: faker.date.past({ years: 5 }),
      casual: faker.number.int({ min: 0, max: 12 }),
      medical: faker.number.int({ min: 0, max: 12 }),
      specialCasual: faker.number.int({ min: 0, max: 12 }),
      extraOrdinary: faker.number.int({ min: 0, max: 12 }),
      earned: faker.number.int({ min: 0, max: 12 }),
      onDutyExam: faker.number.int({ min: 0, max: 5 }),
      onDutyOther: faker.number.int({ min: 0, max: 5 }),
      maternity: faker.number.int({ min: 0, max: 5 }),
      election: faker.number.int({ min: 0, max: 5 }),
      compensatory: faker.number.int({ min: 0, max: 5 }),
      withoutPay: faker.number.int({ min: 0, max: 5 }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await queryInterface.bulkInsert('LeaveTaken', leaveTaken);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete('LeaveTaken', null, {});
}
