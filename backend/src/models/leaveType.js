// models/LeaveType.js
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config.js";

class LeaveType extends Model {}

LeaveType.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    acronym: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true,
    },
    description: {
      type: DataTypes.STRING,
    },
    maxDaysPerMonth: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    maxDaysPerYear: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    carryForward: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    requiresDocument: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    isPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    genderSpecific: {
      type: DataTypes.STRING,
      allowNull: true, // 'M', 'F', or 'ANY'
    },
    minGapBetweenLeaves: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    maxConsecutiveDays: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    noticePeriodRequired: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "LeaveTypes",
    timestamps: true,
  }
);

export default LeaveType;
