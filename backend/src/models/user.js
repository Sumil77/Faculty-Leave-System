import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config.js"; // your sequelize instance

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
    maritalStatus: {
      type: DataTypes.ENUM("single", "married", "divorced", "widowed"),
      defaultValue: "single",
    },
    isProbation: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
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
