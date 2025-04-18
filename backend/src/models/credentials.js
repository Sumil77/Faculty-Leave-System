import { DataTypes, Model } from "sequelize";
import bcrypt from "bcryptjs";
import { sequelize } from "../config.js"; // your sequelize instance

class Credentials extends Model {
  // Instance method to compare password
  comparePasswords(password) {
    return bcrypt.compareSync(password, this.password);
  }

  // Static method to check field uniqueness
  static async doesNotExist(field) {
    const count = await Credentials.count({ where: field });
    return count === 0;
  }
}

Credentials.init(
  {
    user_id: {
      type: DataTypes.NUMBER,
      allowNull: false,
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
    password: {
      type: DataTypes.STRING,
      allowNull: false,
    },
  },
  {
    sequelize,
    modelName: "Credentials",
    timestamps: true,
    hooks: {
      beforeCreate: async (cred) => {
        cred.password = await bcrypt.hash(cred.password, 10);
      },
      beforeUpdate: async (cred) => {
        if (cred.changed("password")) {
          cred.password = await bcrypt.hash(cred.password, 10);
        }
      },
    },
  }
);

export default Credentials;
