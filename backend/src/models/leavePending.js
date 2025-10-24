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
        allowNull:false,
    },
    fromDate:{
        type:DataTypes.DATEONLY,
        allowNull: false
    },
    toDate:{
        type:DataTypes.DATEONLY,
        allowNull:false
    },
    totalDays: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    leaveType:{
        type:DataTypes.STRING,
        allowNull: false
    },
    dept:{
        type:DataTypes.STRING,
        allowNull:false
    }
  },
  {
    sequelize,
    modelName: "LeavePending",
    timestamps: true,
    hooks: {
      beforeCreate: (leave) => {
        leave.totalDays =
          (new Date(leave.toDate) - new Date(leave.fromDate)) /
            (1000 * 60 * 60 * 24) +
          1;
      },
    },
  }
);


export default LeavePending;
