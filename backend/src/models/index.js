import User from "./user.js";
import LeaveApproved from "./leaveApproved.js";
import LeaveRejected from "./leaveRejected.js";
import LeavePending from "./leavePending.js";
import LeaveBalance from "./leaveBalance.js";
import LeaveTaken from "./leaveTaken.js";
import CompensatoryLeave from "./CompensatoryLeave.js";
import Credentials from "./credentials.js";
import Admin from "./Admins.js";

// Associations
LeaveApproved.belongsTo(User, { foreignKey: "user_id", as: "user" });
LeaveRejected.belongsTo(User, { foreignKey: "user_id", as: "user" });
LeavePending.belongsTo(User, { foreignKey: "user_id", as: "user" });
LeaveBalance.belongsTo(User, {
  foreignKey: "user_id",
  targetKey: "user_id",
  as: "user",
});
LeaveTaken.belongsTo(User, {
  foreignKey: "user_id",
  targetKey: "user_id",
  as: "user",
});


User.hasMany(LeaveRejected, { foreignKey: "user_id", as: "rejectedLeaves" });
User.hasMany(LeaveApproved, { foreignKey: "user_id", as: "approvedLeaves" });
User.hasMany(LeavePending, { foreignKey: "user_id", as: "pendingLeaves" });
User.hasMany(CompensatoryLeave, {
  foreignKey: "user_id",
  as: "compensatoryLeaves",
});
User.hasOne(LeaveBalance, { foreignKey: "user_id", as: "balanceLeaves" });
User.hasOne(LeaveTaken, { foreignKey: "user_id", as: "takenLeaves" });

export { User, LeaveApproved, LeaveRejected, LeavePending, LeaveBalance, LeaveTaken, CompensatoryLeave, Credentials, Admin};
