import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config.js"; // your sequelize instance

class LeaveApproved extends Model {
  // Static method to check field uniqueness
  static async doesNotExist(field) {
    const count = await LeaveApproved.count({ where: field });
    return count === 0;
  }
}

LeaveApproved.init(
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
    typeOfLeave:{
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
    modelName: "LeaveApproved",
    timestamps: true,
    hooks: {
    },
  }
);

export default LeaveApproved;
