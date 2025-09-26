import { faker } from "@faker-js/faker";
import { User } from "../models/index.js";

/** @type {import('sequelize-cli').Migration} **/
export async function up(queryInterface, Sequelize) {
  const users = [];

  for (let i = 1; i <= 50; i++) {
    users.push({
      user_id: i,
      name: faker.person.fullName(),
      email: `user${i}@gg.com`,
      desig: faker.person.jobTitle(),
      dept: faker.helpers.arrayElement(['CSE', 'ECE', 'ME', 'CE']),
      phno: faker.phone.number('##########'),
      dateOfJoining: faker.date.past({ years: 5 }),
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await queryInterface.bulkInsert('User', users); // Table name must match actual table
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete('User', null, {});
}
