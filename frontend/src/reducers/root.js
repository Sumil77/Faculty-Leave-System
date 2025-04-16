import { combineReducers } from 'redux';
import errors from './errors/errors.js';
import session from './session/session.js';
export default combineReducers({
  session,
  errors,
});