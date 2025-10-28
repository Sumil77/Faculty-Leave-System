import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config.js"; // your sequelize instance
import User from "./user.js";

class LeavePending extends Model {
  // Static method to check field uniqueness
  static async doesNotExist(field) {
    const count = await LeavePending.count({ where: field });
    return count === 0;
  }
}

LeavePending.init(
  {
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    appliedOn: {
      type: DataTypes.DATE,
      allowNull: false,
    },
    fromDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    toDate: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    totalDays: {
      type: DataTypes.DECIMAL(4, 2), // e.g., 0.25, 1.00, 15.75 etc.
      allowNull: false,
    },
    leaveType: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    dept: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    fraction: {
      type: DataTypes.ENUM("full", "half", "quarter"),
      allowNull: false,
      defaultValue: "full",
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    attachment: {
      type: DataTypes.STRING, // or TEXT if storing URLs/base64
      allowNull: true,
    },
  },
  {
    sequelize,
    modelName: "LeavePending",
    timestamps: true,
    hooks: {
      beforeValidate: (leave) => {
        let days =
          (new Date(leave.toDate) - new Date(leave.fromDate)) /
            (1000 * 60 * 60 * 24) +
          1;

        if (leave.fromDate === leave.toDate) {
          if (leave.fraction === "half") days = 0.5;
          if (leave.fraction === "quarter") days = 0.25;
        }

        leave.totalDays = days;
      },
    },
  }
);

export default LeavePending;
