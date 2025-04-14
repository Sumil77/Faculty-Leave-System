import React from "react";
import leaveImage from "../../src/assets/Leave-info.png"; // Ensure the path is correct

function LeaveInfo() {
  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <img
        src={leaveImage} alt="Leave Information"
        className="w-3/4 max-w-lg border-2 border-gray-300 rounded-lg shadow-lg"
      />
    </div>    
  );
}

export default LeaveInfo;
