import Credentials from "../models/credentials.js";

// helpers.js
export const parseError = (err) => {
  // Check if it's a Joi validation error
  if (err.isJoi) {
    return { message: err.details[0].message }; // Return only the message part of the error
  }

  // Handle general error
  if (err instanceof Error) {
    return { message: err.message }; // Extract the message from the Error object
  }

  // Fallback if the error is not Joi or Error instance
  return { message: "An unknown error occurred" };
};

export const sessionizeUser = (cred) => {
  // const {user_id, name,  dept} = Credentials.find({where : cred.email});
  return { user_id: 123, userName: "sumil", dept : "CSE"};
};
