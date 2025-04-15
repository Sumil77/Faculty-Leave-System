import express from "express";
import User from "../models/user.js";
import { signIn } from "../validations/user.js";
import { parseError, sessionizeUser } from "../util/helpers.js";
import { SESS_NAME } from "../config.js";
const sessionRouter = express.Router();

sessionRouter.post("", async (req, res) => {
    try {
      const { email, password } = req.body
      const { error } = signIn.validate({ email, password });
      if (error) {
        console.log(error);
        return res.status(400).send(parseError(error));
      }
      const user = await User.findOne({where : { email }});
      if (user && user.comparePasswords(password)) {
        const sessionUser = sessionizeUser(user);
        req.session.user = sessionUser
        res.send(sessionUser);
      } else {
        throw new Error('Invalid login credentials');
      }
    } catch (err) {
      return res.status(401).send(parseError(err));
    }
});
sessionRouter.delete("", ({ session }, res) => {
  if (session?.user) {
    session.destroy(err => {
      if (err) {
        console.error("Error destroying session:", err);
        return res.status(500).send({ error: "Failed to logout" });
      }
      res.clearCookie(SESS_NAME);
      return res.status(200).send({ message: "Logged out successfully" });
    });
  } else {
    // No session? Just respond 200 anyway.
    res.clearCookie(SESS_NAME);
    return res.status(200).send({ message: "No session found, but you're logged out" });
  }
});

sessionRouter.get("", ({ session: { user }}, res) => {
    res.status(200).send({ user });
  });
export default sessionRouter;