import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config.js"; // your sequelize instance

class Admin extends Model {
  // Static method to check field uniqueness
  // static async doesNotExist(field) {
  //   const count = await User.count({ where: field });
  //   return count === 0;
  // }
}

Admin.init(
  {
    user_id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey : true,
      unique: {
        msg: "User_Id already exists",
      },
      validate: {
        async isUnique(value) {
          const exists = await User.count({ where: { username: value } });
          if (exists) {
            throw new Error("User_Id already exists");
          }
        },
      },
    },
    email: {
      type: DataTypes.STRING,
      allowNull: false,
      unique: {
        msg: "Email already exists",
      },
      validate: {
        isEmail: { msg: "Must be a valid email" },
        async isUnique(value) {
          const exists = await User.count({ where: { email: value } });
          if (exists) {
            throw new Error("Email already exists");
          }
        },
      },
    },
    name: {
      type: DataTypes.STRING,
      allowNull: false,
    },
    desig: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Admins",
    timestamps: true,
  }
);

export default Admin;