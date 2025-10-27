import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config.js"; // your sequelize instance
import User from "./user.js";

class CompensatoryLeave extends Model {
  // Static method to check field uniqueness
  // static async doesNotExist(field) {
  //   const count = await User.count({ where: field });
  //   return count === 0;
  // }
}

CompensatoryLeave.init(
  {
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
    },
    days: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: false,
    },
    grantedBy: {
      type: DataTypes.BIGINT,
    },
    grantedOn: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    expiry: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "CompensatoryLeave",
    timestamps: true,
    hooks: {
      beforeValidate: (grant) => {
        if (!grant.expiry) {
          const nextMonth = new Date();
          nextMonth.setMonth(nextMonth.getMonth() + 1);
          grant.expiry = nextMonth;
        }
      },
    },
  }
);


export default CompensatoryLeave;
