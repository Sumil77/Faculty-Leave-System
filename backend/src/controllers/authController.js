import { signIn } from "../validators/userValidations.js";
import { parseError } from "../controllers/userController.js";
import { SESS_NAME } from "../config.js";
import { Credentials, Admin, User } from "../models/index.js";

import {
  getLeaveTypesV2,
  defaultLeaveTypes,
} from "../validators/leaveValidations.js";

const sessionizeUser = async (cred) => {
  // const userMetaData = await User.findOne({ where: { user_id: cred.user_id } });
  // const isAdmin = await Admin.findOne({ where: { user_id: cred.user_id } });
  // return {
  //   user_id: cred.user_id,
  //   userName: cred.name,
  //   dept: cred.dept,
  //   isAdmin: !!isAdmin, // true if found
  //   ...userMetaData?.dataValues,
  // };

  return { user_id: 123, userName: "sumil", dept: "CSE", isAdmin: true };
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
};

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
};

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
};

export const getLeaveTypes = async (req, res) => {
  try {
    const redisTypes = await getLeaveTypesV2();

    let formatted = {};

    if (Array.isArray(redisTypes)) {
      // Redis stored as array (with id, name, acronym, description)
      redisTypes.forEach((t) => {
        formatted[t.name] = {
          fullName: t.name,
          acronym: t.acronym,
          leaveTypeId: t.id, // ✅ add leaveTypeId here
        };
      });
    } else if (redisTypes && typeof redisTypes === "object") {
      // Redis already has normalized object form
      formatted = Object.fromEntries(
        Object.entries(redisTypes).map(([key, val]) => {
          const name = val.name || key;
          return [
            name,
            {
              fullName: name,
              acronym: val.acronym || "",
              leaveTypeId: val.id || key, // ✅ support both numeric ID or key
            },
          ];
        })
      );
    } else {
      // fallback
      formatted = Object.fromEntries(
        Object.entries(defaultLeaveTypes).map(([key, val], idx) => [
          key,
          {
            ...val,
            leaveTypeId: idx + 1, // ✅ give default numeric ID
          },
        ])
      );
    }

    return res.status(200).send(formatted);
  } catch (err) {
    console.error("Error fetching leave types for frontend:", err);
    return res.status(500).json({
      success: false,
      message: "Failed to fetch leave types",
      data: defaultLeaveTypes,
    });
  }
};

export const getDepartmentList = async (req, res) => {
  return res.status(200).send();
};
