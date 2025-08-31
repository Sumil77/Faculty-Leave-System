import React from "react";
import { FaPhoneAlt, FaEnvelope } from "react-icons/fa";
import profilePic from "../assets/profile.avif";

const IDCard = ({ faculty }) => {
  console.log("IDCard rendered with:", faculty);

  if (!faculty) {
    return <div>Loading ID Card...</div>;
  }

  return (
    <div className="relative bg-gradient-to-r from-blue-500 via-indigo-500 to-purple-500 w-[450px] p-8 rounded-3xl shadow-xl flex flex-row items-center space-x-6 hover:scale-105 transition-transform duration-300 ease-in-out mx-auto mb-10">
      {/* Left side (text information) */}
      <div className="flex flex-col space-y-4 w-3/4">
        <h2 className="text-3xl font-extrabold text-white truncate">{faculty.name}</h2>
        <p className="text-md text-white">
          <strong className="font-semibold">Designation:</strong> {faculty.desig}
        </p>
        <p className="text-md text-white">
          <strong className="font-semibold">Department:</strong> {faculty.dept}
        </p>
        <div className="flex items-center text-white">
          <FaEnvelope className="mr-2 text-xl" />
          <p className="text-md">{faculty.email}</p>
        </div>
        <div className="flex items-center text-white">
          <FaPhoneAlt className="mr-2 text-xl" />
          <p className="text-md">{faculty.phno}</p>
        </div>
        <p className="text-md text-white">
          <strong className="font-semibold">Date of Joining:</strong> {faculty.doj}
        </p>
      </div>

      {/* Right side (photo) */}
      <div className="w-1/4">
        <img
          src={profilePic}
          alt="Profile"
          className="w-full h-full object-cover rounded-full border-4 border-white"
        />
      </div>
    </div>
  );
};

export default IDCard;
