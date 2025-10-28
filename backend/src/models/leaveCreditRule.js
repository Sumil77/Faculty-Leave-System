import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config.js";
import e from "express";

class LeaveCreditRule extends Model {}

LeaveCreditRule.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    leave_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    credit_frequency: {
      type: DataTypes.ENUM("monthly", "quarterly", "yearly", "dateOfJoining"),
      allowNull: false,
      defaultValue: "monthly",
    },
    credit_day: {
      type: DataTypes.INTEGER,
      defaultValue: 1,
    },
    credit_amount: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: false,
      defaultValue: 0,
    },
    prorate_on_joining: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    probation_excluded: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    department_id: DataTypes.INTEGER,
    designation_id: DataTypes.INTEGER,
    carry_forward: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    carry_forward_limit: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    lapse_after_days: DataTypes.INTEGER,
    max_balance: DataTypes.DECIMAL(5, 2),
    bonus_credit_on_occasion: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    penalty_rule: {
      type: DataTypes.JSONB,
      defaultValue: {},
    },
    auto_reset: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    leave_encashment_allowed: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    encashment_conversion_rate: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 1.0,
    },
    min_balance_for_encashment: {
      type: DataTypes.DECIMAL(5, 2),
      defaultValue: 0,
    },
    credit_on_anniversary: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    remarks: DataTypes.TEXT,
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "leave_credit_rules",
    timestamps: true,
  }
);

export default LeaveCreditRule;