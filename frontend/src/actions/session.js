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
  const response = await apiUtil.login(user);

  const data = await response.json();
  console.log(data);
  if (response.ok) {
    return dispatch(receiveCurrentUser(data));
  }
  console.log(data);
  return dispatch(receiveErrors(data.message));
};


export const signup = (user) => async (dispatch) => {
  const response = await apiUtil.signup(user);
  const data = await response.json();

  if (response.ok) {
    return dispatch(receiveCurrentUser(data));
  }
  return dispatch(receiveErrors(data));
};

export const logout = () => async (dispatch) => {
  const response = await apiUtil.logout();
  console.log("logout triggered");
  const data = await response.json();
  if (response.ok) {
    return dispatch(logoutCurrentUser());
  }
  return dispatch(receiveErrors(data));
};
