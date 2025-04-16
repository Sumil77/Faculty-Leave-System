import { RECEIVE_CURRENT_USER } from "../../actions/session.js";
import { CLEAR_ERRORS, RECEIVE_ERRORS } from "../../actions/error.js";
export default (state = "", { type, message }) => {
  Object.freeze(state);
  switch (type) {
    case RECEIVE_ERRORS:
      return message;
    case RECEIVE_CURRENT_USER:
    case CLEAR_ERRORS:
      return "";
    default:
      return state;
  }
};