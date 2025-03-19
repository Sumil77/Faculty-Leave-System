import React, { useState } from "react";

const departments = ["CSE", "IT", "ECE", "EEE"]; // Updated departments

const generateCaptcha = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array(6)
    .fill("")
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
};

const Login = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [userCaptcha, setUserCaptcha] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!department || !username || !password || !userCaptcha) {
      setError("All fields are required!");
      return;
    }

    if (userCaptcha !== captcha) {
      setError("Invalid Captcha. Please try again.");
      setCaptcha(generateCaptcha()); // Reset captcha
      setUserCaptcha("");
      return;
    }

    setError(""); // Clear errors

    // Mock authentication (Replace this with API call)
    console.log(`Logging in as ${username} from ${department}`);
    alert("Login Successful!");

    // Redirect to dashboard or next page (Replace with actual navigation)
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold text-center text-blue-700">Login</h2>

        {error && <p className="text-red-500 text-sm text-center">{error}</p>}

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Department Selection */}
          <div>
            <label className="block text-gray-700">Department</label>
            <select
              className="w-full p-2 border rounded"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
            >
              <option value="">Select Department</option>
              {departments.map((dept, index) => (
                <option key={index} value={dept}>
                  {dept}
                </option>
              ))}
            </select>
          </div>

          {/* Username Input */}
          <div>
            <label className="block text-gray-700">Username</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Enter username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
          </div>

          {/* Password Input */}
          <div>
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              className="w-full p-2 border rounded"
              placeholder="Enter password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
          </div>

          {/* Captcha Input */}
          <div>
            <label className="block text-gray-700">Enter Captcha</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Enter captcha"
              value={userCaptcha}
              onChange={(e) => setUserCaptcha(e.target.value)}
            />
            {/* Captcha Display */}
            <div className="flex items-center justify-center mt-2">
              <span className="font-bold text-lg bg-gray-200 px-4 py-2 rounded">
                {captcha}
              </span>
              <button
                type="button"
                className="text-blue-500 underline ml-2"
                onClick={() => setCaptcha(generateCaptcha())}
              >
                Refresh
              </button>
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            className="w-full bg-blue-500 text-white p-2 rounded hover:bg-blue-700"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;
