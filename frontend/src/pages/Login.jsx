import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { login } from "../actions/session.js";
const departments = ["CSE", "IT", "ECE", "EEE"]; // Updated departments

const generateCaptcha = () => {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  return Array(6)
    .fill("")
    .map(() => chars[Math.floor(Math.random() * chars.length)])
    .join("");
};

const Login = () => {
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [department, setDepartment] = useState("");
  const [captcha, setCaptcha] = useState(generateCaptcha());
  const [userCaptcha, setUserCaptcha] = useState("");

  const dispatch = useDispatch();
  const errors = useSelector((state) => state.errors); // Assuming errors are stored in state.errors

  const handleSubmit = async (e) => {
    e.preventDefault();

    const user = { email, password };

    try {
      const data = await dispatch(login(user));
      if (data?.user_id) {
        navigate("/dashboard"); // navigate only after successful login
      } else {
        setError("Invalid credentials");
      }
    } catch (err) {
      setError(err.message || "Login failed");
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-96">
        <h2 className="text-2xl font-bold text-center text-blue-700">Login</h2>

        {(error || errors) && <p className="text-red-500 text-sm text-center">{error || errors}</p>}

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
            <label className="block text-gray-700">Email</label>
            <input
              type="text"
              className="w-full p-2 border rounded"
              placeholder="Enter email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
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
