import Credentials from "../models/credentials.js";
import User from "../models/user.js";

export const parseError = (err) => {
  if (err.isJoi) {
    return { message: err.details[0].message }; // Return only the message part of the error
  }
  // Handle general error
  if (err instanceof Error) {
    return { message: err.message };
  }
  return { message: "An unknown error occurred" };
};

export const sessionizeUser = (cred) => {
  // const {user_id, name,  dept} = Credentials.find({where : cred.email});
  return { user_id: 123, userName: "sumil", dept: "CSE" };
};

export const getUser = async (req, res) => {
  try {
    const user_id = req.session.user.user_id;
    const user = await User.findByPk(user_id, { raw: true });
    console.log({
      name: user.name,
      email: user.email,
      phno: user.phno,
      desig: user.desig,
      dept: user.dept,
      doj: user.dateOfJoining,
    });

    res.send({
      name: user.name,
      email: user.email,
      phno: user.phno,
      desig: user.desig,
      dept: user.dept,
      doj: user.dateOfJoining,
    });
  } catch (error) {
    console.log("Get User Error:", error);
    return res.status(400).send(parseError(error));
  }
};

export const createUser = async (req, res) => {
  try {
    const { user_id, email, password } = req.body;

    // await signUp.validateAsync({ user_id, email, password });

    const newUser = await Credentials.create({ user_id, email, password });

    res.status(201).send("User created");
  } catch (err) {
    console.error(err);
    // Handle validation or Sequelize errors
    const status = err.name === "SequelizeValidationError" ? 400 : 500;
    res.status(status).send(parseError(err));
  }
};

export const updateUser = async (req, res) => {
  // const user_id = req.session.user.user_id;
  const user_id = req.query.userId;
  const { fields } = req.body;
  const allowedFields = ["name", "desig", "dept", "phno"];
  const updates = Object.keys(fields);

  try {
    const isValidFields = updates.every((field) =>
      allowedFields.includes(field)
    );
    if (!isValidFields) {
      return res.status(400).send("Invalid Fields in update");
    }

    console.log("UserId: ", user_id);
    
    const user = await User.findByPk(user_id);
    console.log(user);
    
    await user.update(fields);
    return res.status(200).send(user);
  } catch (error) {
    console.log(error);
    return res.status(401).send(parseError(error));
  }
};
