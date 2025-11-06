import { DataTypes, Model } from "sequelize";
import { sequelize } from "../config.js";

class LeaveRule extends Model {}

LeaveRule.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    leave_type_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    max_days_per_request: DataTypes.INTEGER,
    min_days_per_request: DataTypes.INTEGER,
    max_days_per_year: DataTypes.INTEGER,
    max_days_per_month: DataTypes.INTEGER,
    allow_half_day: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    allow_quarter_day: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    max_consecutive_days: DataTypes.INTEGER,
    min_gap_between_leaves: DataTypes.INTEGER,
    require_prior_approval: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    apply_before_days: DataTypes.INTEGER,
    gender_applicable: {
      type: DataTypes.STRING,
      defaultValue: "all",
    },
    marital_status_applicable: {
      type: DataTypes.STRING,
      defaultValue: "all",
    },
    probation_allowed: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    noticePeriodRequired: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    min_service_months: DataTypes.INTEGER,
    holiday_included: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    weekend_included: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    can_be_combined_with: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    restricted_to_designation: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    restricted_to_department: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    restricted_to_location: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    reason_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    attachment_required: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    approval_chain: {
      type: DataTypes.ARRAY(DataTypes.STRING),
      defaultValue: [],
    },
    auto_approve_if_pending_days: DataTypes.INTEGER,
    encashable: {
      type: DataTypes.BOOLEAN,
      defaultValue: false,
    },
    active: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
    isPaid: {
      type: DataTypes.BOOLEAN,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: "leave_rules",
    timestamps: true,
  }
);

export default LeaveRule;
