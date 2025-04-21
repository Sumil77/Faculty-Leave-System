import Joi from "joi";
import LeaveBalance from "../models/leaveBalance.js";

export const leaveTypes = {
  casual: { fullName: "Casual", acronym: "CL" },
  medical: { fullName: "Medical", acronym: "ML" },
  special: { fullName: "Special Casual", acronym: "SCL" },
  extraOrdinary: { fullName: "Extra Ordinary", acronym: "EOL" },
  earned: { fullName: "Earned", acronym: "EL" },
  onDutyExam: {
    fullName: "On Duty(Exam)",
    acronym: "OD-Exam",
  },
  onDutyOther: { fullName: "On Duty(Other)", acronym: "OD-Other" },
  maternity: { fullName: "Maternity", acronym: "MLv" },
  election: { fullName: "Election", acronym: "ELE" },
  compensatory: { fullName: "Compensatory", acronym: "CPL" },
  withoutPay: { fullName: "withoutPay", acronym: "CPL" },
};


// Step 1: Extract valid leave types
const validLeaveTypes = Object.keys(leaveTypes);

// Step 2: Create schema
export const leaveSchema = Joi.object({
  appliedOn: Joi.date().required().label("Applied On"),
  fromDate: Joi.date()
    .min(Joi.ref("appliedOn"))
    .required()
    .label("From Date")
    .messages({
      "date.min": `"From Date" cannot be before "Applied On"`,
    }),
  toDate: Joi.date()
    .min(Joi.ref("fromDate"))
    .required()
    .label("To Date")
    .messages({
      "date.min": `"To Date" cannot be before "From Date"`,
    }),
  typeOfLeave: Joi.string()
    .valid(...validLeaveTypes)
    .required()
    .label("Type of Leave")
    .messages({
      "any.only": `"Type of Leave" must be one of: ${validLeaveTypes.join(
        ", "
      )}`,
    }),
});

export const validateLeaveBalance = async (
  userId,
  typeOfLeave,
  fromDate,
  toDate
) => {

  
  const balance = await LeaveBalance.findOne({
    where: { user_id: userId },
  });
  
  if (!balance) {
    throw new Error("Leave balance not found for user.");
  }
  console.log(validLeaveTypes.includes(typeOfLeave));
  
  if (!validLeaveTypes.includes(typeOfLeave)) {
    throw new Error("Invalid leave type provided.");
  }
  
  const leaveBalanceAvailable = balance[typeOfLeave];

  const numDays =
    (new Date(toDate) - new Date(fromDate)) / (1000 * 60 * 60 * 24) + 1;

  if (leaveBalanceAvailable < numDays) {
    throw new Error(
      "Insufficient balance. You have "+ leaveBalanceAvailable + " days available for " + leaveTypes[typeOfLeave].fullName
    );
  }
};
