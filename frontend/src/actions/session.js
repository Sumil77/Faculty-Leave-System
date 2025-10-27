import * as apiUtil from "../util/session.js";
import { receiveErrors } from "./error.js";

export const RECEIVE_CURRENT_USER = "RECEIVE_CURRENT_USER";
export const LOGOUT_CURRENT_USER = "LOGOUT_CURRENT_USER";

export const receiveCurrentUser = (user) => ({
  type: RECEIVE_CURRENT_USER,
  user,
});

export const logoutCurrentUser = () => ({
  type: LOGOUT_CURRENT_USER,
});

export const login = (user) => async (dispatch) => {
  try {
    const data = await apiUtil.login(user); // already parsed JSON
    dispatch(receiveCurrentUser(data));
    return data; // <-- important: allows caller to await login
  } catch (err) {
    dispatch(receiveErrors(err.message || "Login failed"));
    throw err;
  }
};

export const signup = (user) => async (dispatch) => {
  try {
    const data = await apiUtil.signup(user); // already parsed JSON
    return dispatch(receiveCurrentUser(data));
  } catch (err) {
    return dispatch(receiveErrors(err.message || "Signup failed"));
  }
};

export const logout = () => async (dispatch) => {
  try {
    const data = await apiUtil.logout(); // already parsed JSON
    return dispatch(logoutCurrentUser());
  } catch (err) {
    return dispatch(receiveErrors(err.message || "Logout failed"));
  }
};
