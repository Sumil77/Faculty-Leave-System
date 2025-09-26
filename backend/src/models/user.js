import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config.js"; // your sequelize instance
import LeaveApproved from "./leaveApproved.js";
import LeaveRejected from "./leaveRejected.js";
import LeavePending from "./leavePending.js";
import LeaveBalance from "./leaveBalance.js";
import LeaveTaken from "./leaveTaken.js";
import CompensatoryLeave from "./CompensatoryLeave.js";

class User extends Model {
  // Static method to check field uniqueness
  // static async doesNotExist(field) {
  //   const count = await User.count({ where: field });
  //   return count === 0;
  // }
}

User.init(
  {
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      unique: true,
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: true, // DB-level unique
      validate: {
        isEmail: { msg: "Must be a valid email" },
      },
    },
    name: { type: DataTypes.STRING, allowNull: false },
    desig: { type: DataTypes.STRING, allowNull: false },
    dept: { type: DataTypes.STRING, allowNull: false },
    phno: { type: DataTypes.STRING, allowNull: false },
    dateOfJoining: { type: DataTypes.DATEONLY, allowNull: false },
  },
  {
    sequelize,
    modelName: "User",
    timestamps: true,
    paranoid: true, // enable soft deletes
    deletedAt: "deletedAt",
  }
);


export default User;
