import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config.js";
import User from "./user.js";

class LeaveBalance extends Model {}

LeaveBalance.init(
  {
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
    },
    dateOfJoining: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    casual: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    medical: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    specialCasual: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    extraOrdinary: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    earned: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    onDutyExam: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    onDutyOther: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    maternity: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    election: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    compensatory: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    withoutPay: {
      type: DataTypes.INTEGER,
      defaultValue: 0,
    },
    totals: {
      type: DataTypes.VIRTUAL,
      get() {
        return (
          this.casual +
          this.medical +
          this.specialCasual +
          this.extraOrdinary +
          this.earned +
          this.onDutyExam +
          this.onDutyOther +
          this.maternity +
          this.election +
          this.compensatory+
          this.withoutPay
        );
      },
    },
  },
  {
    sequelize,
    modelName: "LeaveBalance",
    timestamps: true,
  }
);

export default LeaveBalance;
