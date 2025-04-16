import Joi from "joi";
import express from 'express';
import User from '../models/user.js';
import { signUp } from '../validations/user.js';
import { parseError, sessionizeUser } from "../util/helpers.js";

const userRouter = express.Router();

userRouter.post("", async (req, res) => {
    try {
      const { username, email, password } = req.body;
  
      // Validate with Joi
      await signUp.validateAsync({ username, email, password });
  
      // Create the new user, hashing will be handled in Sequelize hooks
      const newUser = await User.create({ username, email, password });
      const sessionUser = sessionizeUser(newUser);

      req.session.user = sessionUser;
      console.log(req.session)
  
      res.status(201).send(sessionUser);
    } catch (err) {
      console.error(err);
  
      // Handle validation or Sequelize errors
      const status = err.name === "SequelizeValidationError" ? 400 : 500;
      res.status(status).send(parseError(err));
    }
  });
export default userRouter;