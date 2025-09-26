'use strict';

import { faker } from "@faker-js/faker";

/** @type {import('sequelize-cli').Migration} */
export async function up(queryInterface, Sequelize) {
  const admins = [];

  for (let i = 1; i <= 10; i++) {
    admins.push({
      user_id: i, // You can assign from User IDs or separate
      name: faker.person.fullName(),
      email: `user${i}@gg.com`,
      desig: faker.person.jobTitle(),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await queryInterface.bulkInsert('Admins', admins);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete('Admins', null, {});
}
