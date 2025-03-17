import React from "react";

const LeaveBalance = () => {
  const leaveData = [
    { type: "Medical Leave", used: 2, total: 10, color: "bg-blue-500" },
    { type: "Casual Leave", used: 3, total: 12, color: "bg-green-500" },
    { type: "Child Care Leave", used: 1, total: 5, color: "bg-yellow-500" },
    { type: "Earned Leave", used: 2, total: 8, color: "bg-purple-500" },
  ];

  return (
    <div className="bg-white shadow-lg p-4 rounded-lg w-full max-w-xs mx-auto">
      <h2 className="text-md font-semibold text-gray-700 mb-3 text-center">Leave Balance</h2>

      <div className="space-y-3">
        {leaveData.map((leave, index) => {
          const remaining = leave.total - leave.used;
          const percentage = Math.round((remaining / leave.total) * 100);

          return (
            <div key={index} className="w-full">
              <p className="text-gray-600 font-medium text-xs">
                {leave.type}: <span className="text-gray-800 font-bold">{remaining}</span> / {leave.total}
              </p>
              <div className="relative w-3/4 bg-gray-200 rounded-full h-2 overflow-hidden mx-auto">
                <div
                  className={`${leave.color} h-full rounded-full transition-all duration-500`}
                  style={{ width: `${percentage}%`, maxWidth: "100%" }}
                ></div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default LeaveBalance;
