import { useState, useEffect } from "react";
import TypeOfLeaveImg from "../assets/Leaves.png";
import { useSelector } from "react-redux";

const ApplyLeave = () => {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({
    leaveType: "",
    fromDate: "",
    toDate: "",
    fraction: "full",
    reason: "",
    attachment: null,
  });

  const [daysCount, setDaysCount] = useState(0);
  const [submittedLeave, setSubmittedLeave] = useState(null);
  const [isCancelEnabled, setIsCancelEnabled] = useState(false);
  const leaveTypes = useSelector((state) => state.global.leaveTypes);

  // Calculate total leave days for full-day leaves
  useEffect(() => {
    if (form.fromDate && form.toDate && form.fraction === "full") {
      const from = new Date(form.fromDate);
      const to = new Date(form.toDate);
      if (from > to) {
        setDaysCount(0);
        return;
      }
      const diff = (to - from) / (1000 * 60 * 60 * 24) + 1;
      setDaysCount(diff);
    } else {
      setDaysCount(0);
    }
  }, [form.fromDate, form.toDate, form.fraction]);

  // Handle form input changes
  const handleChange = (e) => {
    const { name, value, files } = e.target;
    if (files) {
      setForm({ ...form, [name]: files[0] });
    } else {
      setForm({ ...form, [name]: value });
    }
  };

  // Submit leave
  const handleSubmit = async (e) => {
    e.preventDefault();
    const { leaveType, fromDate, toDate, reason, fraction } = form;

    if (!leaveType || !fromDate || !toDate || !reason) {
      alert("Please fill all mandatory fields!");
      return;
    }

    if (new Date(fromDate) > new Date(toDate)) {
      alert("From date cannot be after To date!");
      return;
    }

    try {
      const leave = {
        time: new Date().toISOString(),
        from: fromDate,
        to: toDate,
        type: leaveType,
        reason,
        fraction,
        attachment: form.attachment,
      };

      await leaveController.postLeavePending(leave);

      setSubmittedLeave({
        ...leave,
        totalDays: fraction === "full" ? daysCount : fraction === "half" ? 0.5 : 0.25,
      });


      setShowForm(false);
      setIsCancelEnabled(true);
      setTimeout(() => setIsCancelEnabled(false), 15 * 60 * 1000);
      setForm({ leaveType: "", fromDate: "", toDate: "", fraction: "full", reason: "", attachment: null });
    } catch (err) {
      console.error(err);
      alert("Error applying leave. Please try again.");
    }
  };

  const handleCancel = () => {
    setSubmittedLeave(null);
    setIsCancelEnabled(false);
  };

  return (
    <div className="bg-gradient-to-b from-blue-100 to-white min-h-screen py-10 px-6">
      <h2 className="text-3xl font-extrabold mb-6 text-center text-blue-800">
        Leave Management System
      </h2>

      <div className="flex justify-center gap-6 mb-10">
        <button
          className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700"
          onClick={() => setShowForm(true)}
        >
          Apply Leave
        </button>
        <button
          disabled={!isCancelEnabled}
          onClick={handleCancel}
          className={`px-6 py-3 rounded-lg shadow ${isCancelEnabled
            ? "bg-red-500 text-white hover:bg-red-600"
            : "bg-gray-300 text-gray-700 cursor-not-allowed"
            }`}
        >
          Cancel Leave
        </button>
      </div>

      {!showForm && !submittedLeave && (
        <div className="flex justify-center mt-6">
          <img
            src={TypeOfLeaveImg}
            alt="Leave Info"
            className="max-w-xl w-full rounded-xl shadow"
          />
        </div>
      )}

      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white p-8 rounded-xl shadow-md max-w-lg mx-auto space-y-6 border-t-8 border-blue-600"
        >
          {/* Leave Type */}
          <div>
            <label className="block mb-2 font-semibold text-blue-800">
              Leave Type
            </label>
            <select
              name="leaveType"
              value={form.leaveType}
              onChange={handleChange}
              className="border rounded-lg p-3 w-full"
            >
              <option value="">Select Leave Type</option>
              {Object.entries(leaveTypes).map(([key, val]) => (
                <option key={key} value={key}>
                  {val.fullName}
                </option>
              ))}
            </select>
          </div>

          {/* Fraction */}
          <div>
            <label className="block mb-2 font-semibold text-blue-800">
              Duration
            </label>
            <select
              name="fraction"
              value={form.fraction}
              onChange={handleChange}
              className="border rounded-lg p-3 w-full"
            >
              <option value="full">Full Day</option>
              <option value="half">Half Day</option>
              <option value="quarter">Quarter Day</option>
            </select>
          </div>

          {/* Dates */}
          <div>
            <label className="block mb-2 font-semibold text-blue-800">
              From Date
            </label>
            <input
              type="date"
              name="fromDate"
              value={form.fromDate}
              min={new Date().toLocaleDateString("en-CA")}
              onChange={handleChange}
              className="border rounded-lg p-3 w-full"
            />
          </div>

          <div>
            <label className="block mb-2 font-semibold text-blue-800">
              To Date
            </label>
            <input
              type="date"
              name="toDate"
              value={form.toDate}
              min={form.fromDate || new Date().toLocaleDateString("en-CA")}
              onChange={handleChange}
              className="border rounded-lg p-3 w-full"
              disabled={form.fraction !== "full"}
            />
          </div>

          {/* Days count (Full day only) */}
          {form.fraction === "full" && daysCount > 0 && (
            <div>
              <label className="block mb-2 font-semibold text-blue-800">
                Total Days
              </label>
              <input
                type="text"
                readOnly
                value={daysCount}
                className="border rounded-lg p-3 w-full bg-gray-100"
              />
            </div>
          )}

          {/* Reason */}
          <div>
            <label className="block mb-2 font-semibold text-blue-800">
              Reason
            </label>
            <textarea
              name="reason"
              value={form.reason}
              onChange={handleChange}
              rows={3}
              className="border rounded-lg p-3 w-full"
            />
          </div>

          {/* File attachment (optional) */}
          <div>
            <label className="block mb-2 font-semibold text-blue-800">
              Attachment (optional)
            </label>
            <input
              type="file"
              name="attachment"
              accept="image/*,.pdf"
              onChange={handleChange}
              className="border rounded-lg p-3 w-full"
            />
          </div>

          <div className="flex justify-center">
            <button
              type="submit"
              className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow hover:bg-blue-700"
            >
              Submit Leave
            </button>
          </div>
        </form>
      )}

      {submittedLeave && (
        <div className="mt-8 bg-white p-6 rounded-xl shadow-md max-w-lg mx-auto space-y-3">
          <h3 className="text-xl font-bold text-blue-800">Leave Submitted ✅</h3>
          <p><strong>Type:</strong> {submittedLeave.type}</p>
          <p><strong>Duration:</strong> {submittedLeave.fraction}</p>
          <p><strong>Reason:</strong> {submittedLeave.reason}</p>
          <p><strong>From:</strong> {submittedLeave.from}</p>
          <p><strong>To:</strong> {submittedLeave.to}</p>
          <p><strong>Total:</strong> {submittedLeave.totalDays} day(s)</p>
        </div>
      )}
    </div>
  );
};

export default ApplyLeave;
