import { DataTypes, Model } from 'sequelize';
import bcrypt from 'bcryptjs';
import { sequelize } from '../config.js'; // your sequelize instance

class User extends Model {
    // Instance method to compare password
    comparePasswords(password) {
      return bcrypt.compareSync(password, this.password);
    }
  
    // Static method to check field uniqueness
    static async doesNotExist(field) {
      const count = await User.count({ where: field });
      return count === 0;
    }
  }
  
  User.init(
    {
      username: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: 'Username already exists',
        },
        validate: {
          async isUnique(value) {
            const exists = await User.count({ where: { username: value } });
            if (exists) {
              throw new Error('Username already exists');
            }
          },
        },
      },
      email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: {
          msg: 'Email already exists',
        },
        validate: {
          isEmail: { msg: 'Must be a valid email' },
          async isUnique(value) {
            const exists = await User.count({ where: { email: value } });
            if (exists) {
              throw new Error('Email already exists');
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
      modelName: 'User',
      timestamps: true,
      hooks: {
        beforeCreate: async (user) => {
          user.password = await bcrypt.hash(user.password, 10);
        },
        beforeUpdate: async (user) => {
          if (user.changed('password')) {
            user.password = await bcrypt.hash(user.password, 10);
          }
        },
      },
    }
  );
  
  export default User;