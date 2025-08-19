import { signIn } from "../validators/userValidations.js";
import { parseError } from "../controllers/userController.js";
import { SESS_NAME } from "../config.js";
import Credentials from "../models/credentials.js";

const sessionizeUser = (cred) => {
  // const {user_id, name,  dept} = Credentials.find({where : cred.email});
  return { user_id: 123, userName: "sumil", dept: "CSE" };
};

export const login = async (req, res) => {
  try {
    const { email, password } = req.body;
    const { error } = signIn.validate({ email, password });
    if (error) {
      console.log(error);
      return res.status(400).send(parseError(error));
    }
    const user = await Credentials.findOne({ where: { email } });
    console.log(user);
    
    if (user && user.comparePasswords(password)) {
      const sessionUser = sessionizeUser(user);
      req.session.user = sessionUser;
      res.send(sessionUser);
    } else {
      throw new Error("Invalid login credentials");
    }
  } catch (err) {
    console.log(err);
    return res.status(401).send(parseError(err));
  }
}

export const logout = ({ session }, res) => {
  if (session?.user) {
    session.destroy((err) => {
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
    return res
      .status(200)
      .send({ message: "No session found, but you're logged out" });
  }
}

export const getSession = async (req, res) => {
  const { user, cookie } = req.session;

  if (!user) {
    return res.status(401).send({ error: "Not logged in" });
  }

  const now = new Date();
  const expiry = new Date(cookie.expires);

  // 🔥 Explicit expiry check
  if (expiry < now) {
    req.session.destroy(() => {
      res.clearCookie(SESS_NAME);
      console.log("⛔ Session expired (by manual check), destroying session.");
      return res.status(401).send({ error: "Session expired" });
    });
  } else {
    return res.status(200).send({ user });
  }
}