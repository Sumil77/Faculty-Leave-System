import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config.js";

class LeaveRejected extends Model {
  static async doesNotExist(field) {
    const count = await LeaveRejected.count({ where: field });
    return count === 0;
  }
}

LeaveRejected.init(
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
      type: DataTypes.DECIMAL(4, 2), // ✅ changed from INTEGER
      allowNull: false,
    },
    fraction: {
      type: DataTypes.ENUM("full", "half", "quarter"), // ✅ added
      defaultValue: "full",
    },
    leave_type_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    dept: {
      type: DataTypes.STRING,
      allowNull: false,
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
    modelName: "LeaveRejected",
    timestamps: true,
    hooks: {
      beforeCreate: (leave) => {
        const days =
          (new Date(leave.toDate) - new Date(leave.fromDate)) /
            (1000 * 60 * 60 * 24) +
          1;

        let fractionMultiplier = 1;
        if (leave.fraction === "half") fractionMultiplier = 0.5;
        else if (leave.fraction === "quarter") fractionMultiplier = 0.25;

        leave.totalDays = days * fractionMultiplier;
      },
    },
  }
);

export default LeaveRejected;
