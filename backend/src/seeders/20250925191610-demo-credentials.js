import { faker } from "@faker-js/faker";
import bcrypt from "bcryptjs";

export async function up(queryInterface, Sequelize) {
  const creds = [];

  for (let i = 1; i <= 50; i++) {
    let role;
    if (i === 1) role = "admin";
    else if (i >= 2 && i <= 5) role = "hod";
    else role = "faculty";

    const plainPassword = "passs123";
    const hashedPassword = await bcrypt.hash(plainPassword, 10);

    creds.push({
      user_id: i,
      email: `user${i}@gg.com`,
      password: hashedPassword, // hashed manually
      role: role,
      status: "active",
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  await queryInterface.bulkInsert("Credentials", creds);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("Credentials", null, {});
}
