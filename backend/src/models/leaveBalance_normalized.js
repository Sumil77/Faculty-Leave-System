// src/models/LeaveBalance.js
import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config.js";

class LeaveBalance_normalized extends Model {}

LeaveBalance_normalized.init(
  {
    id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
    user_id: { type: DataTypes.BIGINT, allowNull: false },
    leave_type_id: { type: DataTypes.INTEGER, allowNull: false },
    balance: { type: DataTypes.DECIMAL(4,2), defaultValue: 0 },
    // optional: track last credited date
    last_updated: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    modelName: "LeaveBalance_normalized",
    tableName: "LeaveBalances_normalized", // choose name so it doesn't clash with old table
    timestamps: true,
    indexes: [
      { fields: ["user_id"] },
      { fields: ["leave_type_id"] },
      { unique: true, fields: ["user_id", "leave_type_id"] },
    ],
  }
);


export default LeaveBalance_normalized;
