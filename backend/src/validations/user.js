import Joi from 'joi';

const email = Joi.string().email().required();
const username = Joi.string().alphanum().min(3).max(30).required();

const message = 'password must be between 6-16 characters, have at least one capital letter, one lowercase letter, one digit, and one special character';

const password = Joi.string()
  .pattern(/^(?=.*[A-Za-z])(?=.*\d)(?=.*[!@#$%^&*])[a-zA-Z0-9!@#$%^&*]{6,16}$/)
  .required()
  .messages({
    'string.pattern.base': message,
    'string.empty': 'Password is required',
  });

export const signUp = Joi.object({
  email,
  username,
  password
});

export const signIn = Joi.object({
  email,
  password
});
