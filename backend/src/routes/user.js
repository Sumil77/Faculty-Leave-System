import express from 'express';
import Credentials from '../models/credentials.js';
import { signUp } from '../validations/user.js';
import {parseError} from "../util/helpers.js";

const userRouter = express.Router();

userRouter.post("", async (req, res) => {
    try {
      const {user_id, email, password } = req.body;
  
      // Validate with Joi
      await signUp.validateAsync({ user_id, email, password });
  
      // Create the new user, hashing will be handled in Sequelize hooks
      const newUser = await Credentials.create({user_id, email, password});

      console.log(req.session)
  
      res.status(201).send("User created");
    } catch (err) {
      console.error(err);
      // Handle validation or Sequelize errors
      const status = err.name === "SequelizeValidationError" ? 400 : 500;
      res.status(status).send(parseError(err));
    }
});
export default userRouter;