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
    fullName:{
      type: DataTypes.STRING,
      allowNull: true,
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
