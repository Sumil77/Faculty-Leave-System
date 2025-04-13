import { useState, useEffect } from "react";
import TypeOfLeaveImg from '../assets/Leaves.png';


const ApplyLeave = () => {
  const [showForm, setShowForm] = useState(false);
  const [leaveType, setLeaveType] = useState("");
  const [leaveDurationFrom, setLeaveDurationFrom] = useState("");
  const [leaveDurationTo, setLeaveDurationTo] = useState("");
  const [leaveReason, setLeaveReason] = useState("");
  const [leaveDuration, setLeaveDuration] = useState("");
  const [timeFrom, setTimeFrom] = useState("");
  const [timeTo, setTimeTo] = useState("");
  const [daysCount, setDaysCount] = useState("");
  const [leaveHours, setLeaveHours] = useState(0); // Added state for leave hours
  const [isCancelEnabled, setIsCancelEnabled] = useState(false);
  const [submittedLeave, setSubmittedLeave] = useState(null);

  const leaveTypes = [
    "Casual Leave",
    "Medical Leave",
    "Special Casual Leave",
    "Extra Ordinary Leave",
    "Earned Leave",
    "On Duty Leave (Exam Purpose)",
    "On Duty Leave (Other)",
    "Maternity Leave",
    "Election Leave",
    "Compensatory Leave",
    "Without Pay Leave",
  ];

  const generateTimeOptions = () => {
    const times = [];
    let hour = 8;
    let minute = 0;

    while (hour < 17 || (hour === 16 && minute <= 30)) {
      const value = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
      let displayHour = hour > 12 ? hour - 12 : hour;
      const suffix = hour < 12 ? "AM" : "PM";
      if (displayHour === 0) displayHour = 12;

      const label = `${displayHour}:${minute.toString().padStart(2, "0")} ${suffix}`;
      times.push({ value, label });

      minute += 30;
      if (minute >= 60) {
        hour += 1;
        minute = 0;
      }
    }

    return times;
  };


  const getTodayDateLocal = () => {
    const today = new Date();
    today.setMinutes(today.getMinutes() - today.getTimezoneOffset());
    return today.toISOString().split("T")[0];
  };

  // Function to calculate total leave days (for Full Day leave only)
  const calculateLeaveDays = () => {
    if (leaveDuration === "Full Day") {
      if (leaveDurationFrom && leaveDurationTo) {
        const from = new Date(leaveDurationFrom);
        const to = new Date(leaveDurationTo);
        if (from > to) {
          setDaysCount(0);
          return;
        }
        const diffInTime = to.getTime() - from.getTime();
        const days = Math.floor(diffInTime / (1000 * 3600 * 24)) + 1;
        setDaysCount(days);
      } else {
        setDaysCount(0);
      }
    }
  };

  useEffect(() => {
    calculateLeaveDays();
  }, [leaveDurationFrom, leaveDurationTo, leaveDuration]);

  // Helper function to correct time within range (08:00 AM to 04:30 PM)
  const correctTimeWithinRange = (time) => {
    const [hours, minutes] = time.split(":").map(Number);
    const totalMinutes = hours * 60 + minutes;

    const minMinutes = 8 * 60;        // 08:00 AM
    const maxMinutes = 16 * 60 + 30;  // 04:30 PM

    if (totalMinutes < minMinutes) return "08:00";
    if (totalMinutes > maxMinutes) return "16:30";
    return time;
  };

  // Handle submit logic
  const handleSubmit = (e) => {
    e.preventDefault();

    if (new Date(leaveDurationFrom) > new Date(leaveDurationTo)) {
      alert("The 'From' date must be earlier than or equal to the 'To' date.");
      return;
    }

    if (!leaveType || !leaveDurationFrom || !leaveDurationTo || !leaveReason || !leaveDuration) {
      alert("Please fill in all fields!");
      return;
    }

    // Time validation (for Half/Quarter Day)
    if (leaveDuration === "Half Day" || leaveDuration === "Quarter Day") {
      if (!timeFrom || !timeTo) {
        alert("Please enter both start and end time.");
        return;
      }

      const [fromH, fromM] = timeFrom.split(":").map(Number);
      const [toH, toM] = timeTo.split(":").map(Number);

      const totalFrom = fromH * 60 + fromM;
      const totalTo = toH * 60 + toM;

      // Validate within working hours: 8:00 AM (480 min) to 4:30 PM (990 min)
      const collegeStart = 8 * 60;
      const collegeEnd = 16 * 60 + 30;

      if (totalFrom < collegeStart || totalTo > collegeEnd) {
        alert("Please select time between 08:00 AM and 04:30 PM.");
        return;
      }

      if (totalFrom >= totalTo) {
        alert("Start time must be before end time.");
        return;
      }

      const diffMin = totalTo - totalFrom;
      const hours = diffMin / 60;
      setLeaveHours(hours); // Set the calculated leave hours

      // Enforce leave type match with hours
      if (hours <= 1.875 && leaveDuration !== "Quarter Day") {
        alert("Timing indicates Quarter Day. Please change the leave type.");
        return;
      } else if (hours > 1.875 && hours <= 4.25 && leaveDuration !== "Half Day") {
        alert("Timing indicates Half Day. Please change the leave type.");
        return;
      } else if (hours > 4.25 && leaveDuration !== "Full Day") {
        alert("Timing exceeds Half Day. Please select Full Day leave.");
        return;
      }
    }

    // Calculate leave days taken
    let totalLeaveTaken = 0;
    if (leaveDuration === "Full Day") {
      totalLeaveTaken = daysCount;
    } else if (leaveDuration === "Half Day") {
      totalLeaveTaken = 0.5;
    } else if (leaveDuration === "Quarter Day") {
      totalLeaveTaken = 0.25;
    }

    // Set submission data
    setSubmittedLeave({
      type: leaveType,
      from: leaveDurationFrom,
      to: leaveDurationTo,
      duration: leaveDuration,
      reason: leaveReason,
      totalDays: totalLeaveTaken,
      leaveHours: leaveHours, // Include calculated leave hours
    });

    setIsCancelEnabled(true);
    setTimeout(() => setIsCancelEnabled(false), 15 * 60 * 1000);

    // Reset form
    setLeaveType("");
    setLeaveDurationFrom("");
    setLeaveDurationTo("");
    setLeaveReason("");
    setLeaveDuration("");
    setTimeFrom("");
    setTimeTo("");
    setShowForm(false);
    setDaysCount("");
    setLeaveHours(0); // Reset leave hours
  };

  // Handle cancel logic
  const handleCancelLeave = () => {
    setSubmittedLeave(null);
    setIsCancelEnabled(false);
  };

  return (
    <div className="bg-gradient-to-b from-blue-100 to-white min-h-screen py-10 px-6">
      <h2 className="text-3xl font-extrabold mb-6 text-center text-blue-800">
        Leave Management System
      </h2>

      <div className="flex gap-6 justify-center mb-10">
        <button
          className="bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-600 hover:shadow-xl transition-all"
          onClick={() => setShowForm(true)}
        >
          Apply Leave
        </button>
        <button
          className={`px-6 py-3 rounded-full shadow-lg ${isCancelEnabled
            ? "bg-red-500 text-white hover:bg-red-600 hover:shadow-xl transition-all"
            : "bg-gray-400 text-gray-700 cursor-not-allowed"
            }`}
          onClick={handleCancelLeave}
          disabled={!isCancelEnabled}
        >
          Cancel Leave
        </button>
      </div>
      {!showForm && !submittedLeave && (
  <div className="flex justify-center mt-6">
    <img
      src={TypeOfLeaveImg}
      alt="Types of Leave"
      className="max-w-full md:max-w-2xl h-auto rounded-xl shadow-lg"
    />
  </div>
)}





      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-2xl shadow-xl max-w-xl mx-auto space-y-6 border-t-8 border-blue-500"
        >
          {/* Leave Type */}
          <div>
            <label className="block mb-2 text-lg font-semibold text-blue-800">Type of Leave:</label>
            <select
              value={leaveType}
              onChange={(e) => setLeaveType(e.target.value)}
              className="border rounded-lg p-3 w-full"
            >
              <option value="">Select Leave Type</option>
              {leaveTypes.map((type, idx) => (
                <option key={idx} value={type}>{type}</option>
              ))}
            </select>
          </div>

          {/* Leave Duration Type */}
          <div>
            <label className="block mb-2 text-lg font-semibold text-blue-800">Duration:</label>
            <select
              value={leaveDuration}
              onChange={(e) => setLeaveDuration(e.target.value)}
              className="border rounded-lg p-3 w-full"
            >
              <option value="">Select Leave Duration</option>
              <option value="Full Day">Full Day</option>
              <option value="Half Day">Half Day</option>
              <option value="Quarter Day">Quarter Day</option>
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="block mb-2 text-lg font-semibold text-blue-800">Duration (From):</label>
            <input
              type="date"
              value={leaveDurationFrom}
              min={new Date().toLocaleDateString('en-CA')}
              onChange={(e) => {
                const selectedDate = e.target.value;
                setLeaveDurationFrom(selectedDate);

                if (leaveDuration === "Half Day" || leaveDuration === "Quarter Day") {
                  setLeaveDurationTo(selectedDate);
                } else {
                  setLeaveDurationTo("");
                }

                calculateLeaveDays();
              }}
              className="border rounded-lg p-3 w-full"
            />
          </div>

          {/* To Date */}
          <div>
            <label className="block mb-2 text-lg font-semibold text-blue-800">Duration (To):</label>
            <input
              type="date"
              value={leaveDurationTo}
              min={leaveDurationFrom || new Date().toLocaleDateString('en-CA')}
              onChange={(e) => {
                setLeaveDurationTo(e.target.value);
                calculateLeaveDays();
              }}
              className="border rounded-lg p-3 w-full"
              disabled={leaveDuration === "Half Day" || leaveDuration === "Quarter Day"}
            />
          </div>

          {/* Read-only Days Count */}
          {daysCount && leaveDuration === "Full Day" && (
            <div>
              <label className="block mb-2 text-lg font-semibold text-blue-800">Total Days:</label>
              <input
                type="text"
                value={daysCount}
                readOnly
                className="border rounded-lg p-3 w-full bg-gray-100"
              />
            </div>
          )}

          {/* Time Fields for Half or Quarter Day */}
          {(leaveDuration === "Half Day" || leaveDuration === "Quarter Day") && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block mb-2 text-lg font-semibold text-blue-800">Time From:</label>
                <select
                  value={timeFrom}
                  onChange={(e) => setTimeFrom(e.target.value)}
                  className="border rounded-lg p-3 w-full"
                >
                  <option value="">Select Time From</option>
                  {generateTimeOptions().map((time, idx) => (
                    <option key={idx} value={time.value}>{time.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block mb-2 text-lg font-semibold text-blue-800">Time To:</label>
                <select
                  value={timeTo}
                  onChange={(e) => setTimeTo(e.target.value)}
                  className="border rounded-lg p-3 w-full"
                >
                  <option value="">Select Time To</option>
                  {generateTimeOptions().map((time, idx) => (
                    <option key={idx} value={time.value}>{time.label}</option>
                  ))}
                </select>
              </div>
            </div>
          )}


          {/* Reason for Leave */}
          <div>
            <label className="block mb-2 text-lg font-semibold text-blue-800">Reason:</label>
            <textarea
              value={leaveReason}
              onChange={(e) => setLeaveReason(e.target.value)}
              className="border rounded-lg p-3 w-full"
              rows="3"
            />
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-blue-500 text-white px-6 py-3 rounded-full shadow-lg hover:bg-blue-600 hover:shadow-xl transition-all"
            >
              Submit Leave
            </button>
          </div>
        </form>
      )}

      {/* Display Submitted Leave Info */}
      {submittedLeave && (
        <div className="mt-8 bg-white p-6 rounded-2xl shadow-xl space-y-6 max-w-lg mx-auto">
          <h3 className="text-2xl font-bold text-blue-800 flex items-center gap-2">
            <span>✅</span> <span>Submitted Leave:</span>
          </h3>
          <div className="space-y-2">
            <p className="text-lg font-medium">
              <span role="img" aria-label="Leave Type" className="mr-2">🌴</span>
              Leave Type: <strong>{submittedLeave.type}</strong>
            </p>
            <p className="text-lg font-medium">
              <span role="img" aria-label="Leave Duration" className="mr-2">⏳</span>
              Leave Duration: <strong>{submittedLeave.duration}</strong>
            </p>
            <p className="text-lg font-medium">
              <span role="img" aria-label="Reason" className="mr-2">📝</span>
              Leave Reason: <strong>{submittedLeave.reason}</strong>
            </p>
            <p className="text-lg font-medium">
              <span role="img" aria-label="From" className="mr-2">📅</span>
              From: <strong>{submittedLeave.from}</strong>
            </p>
            <p className="text-lg font-medium">
              <span role="img" aria-label="To" className="mr-2">📅</span>
              To: <strong>{submittedLeave.to}</strong>
            </p>
            {/* Conditionally render Time only if it's NOT Full Day */}
            {submittedLeave.duration !== "Full Day" && (
              <>
                <p className="text-lg font-medium">
                  <span role="img" aria-label="Leave Time" className="mr-2">⏰</span>
                  Leave Time: <strong>{`${timeFrom} - ${timeTo}`}</strong>
                </p>
              </>
            )}
            <p className="text-lg font-medium">
              <span role="img" aria-label="Total Leave" className="mr-2">📊</span>
              Total Leave: <strong>{submittedLeave.totalDays} day(s)</strong>
            </p>
          </div>

          {/* Fun Emoji */}
          <div className="flex justify-center">
            <span role="img" aria-label="Happy" className="text-4xl">🎉</span>
          </div>
        </div>
      )}


    </div>
  );
};

export default ApplyLeave;
