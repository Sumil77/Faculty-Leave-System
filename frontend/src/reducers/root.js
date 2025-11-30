import { combineReducers } from 'redux';
import errors from './errors/errors.js';
import session from './session/session.js';
import global from '../store/global.js';
import profile from '../store/profile.js';

export default combineReducers({
  session,
  errors,
  global,
  profile
});