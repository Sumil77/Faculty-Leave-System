import { combineReducers } from 'redux';
import errors from './errors/errors.js';
import session from './session/session.js';
import global from '../store/global.js';

export default combineReducers({
  session,
  errors,
  global
});