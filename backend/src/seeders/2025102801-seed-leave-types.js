'use strict';

export async function up(queryInterface, Sequelize) {
  await queryInterface.bulkInsert("LeaveTypes", [
    {
      name: "casual",
      description: "Casual Leave for short absences",
      fullName: "Casual Leave",
      acronym: "CL",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "medical",
      description: "Medical Leave for sickness or injury",
      fullName: "Medical Leave",
      acronym: "ML",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "specialCasual",
      description: "Special casual leave for special duties",
      fullName: "Special Casual Leave",
      acronym: "SCL",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "extraOrdinary",
      description: "Extraordinary leave without pay",
      fullName: "Extraordinary Leave",
      acronym: "EOL",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "earned",
      description: "Earned Leave for long-term rest",
      fullName: "Earned Leave",
      acronym: "EL",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "onDutyExam",
      description: "On Duty leave for examinations",
      fullName: "On Duty Exam Leave",
      acronym: "ODE",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "onDutyCollege",
      description: "On Duty leave for official work",
      fullName: "On Duty College Leave",
      acronym: "ODC",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "maternity",
      description: "Leave for maternity (female only)",
      fullName: "Maternity Leave",
      acronym: "MatL",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "election",
      description: "Leave for voting or election duties",
      fullName: "Election Leave",
      acronym: "ELe",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "compensatory",
      description: "Leave credited against extra work",
      fullName: "Compensatory Leave",
      acronym: "CompL",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      name: "withoutPay",
      description: "Leave without pay",
      fullName: "Leave Without Pay",
      acronym: "LWP",
      active: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  ]);
}

export async function down(queryInterface, Sequelize) {
  await queryInterface.bulkDelete("LeaveTypes", null, {});
}
