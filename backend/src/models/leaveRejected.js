import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config.js"; // your sequelize instance

class LeaveRejected extends Model {
  // Static method to check field uniqueness
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
    modelName: "LeaveRejected",
    timestamps: true,
    hooks: {
    },
  }
);

export default LeaveRejected;
