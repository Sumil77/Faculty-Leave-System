import React from "react";
import { Card } from "../components/Card";
import Button from "../components/Button"; // Default import

const AdminPanel = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col p-6">
      <h1 className="text-4xl font-semibold text-center mb-10">Admin Panel</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Pending Leave Requests Card */}
        <Card className="group min-h-[320px] flex flex-col justify-between rounded-2xl p-6 bg-gray-800 text-white shadow-md transform transition duration-300 hover:bg-gray-200 hover:text-gray-900 hover:shadow-xl">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Pending Leave Requests</h2>
            <p className="text-gray-300 mb-6 transition-colors duration-300 group-hover:text-gray-900">
              There are no pending requests at the moment.
            </p>
          </div>
          <Button className="bg-gray-200 text-gray-900 rounded-md transition duration-300 hover:bg-gray-900 hover:text-white">
            Review Requests
          </Button>
        </Card>

        {/* Manage Users Card */}
        <Card className="group min-h-[320px] flex flex-col justify-between rounded-2xl p-6 bg-gray-800 text-white shadow-md transform transition duration-300 hover:bg-gray-200 hover:text-gray-900 hover:shadow-xl">
          <div>
            <h2 className="text-2xl font-semibold mb-4">Manage Users</h2>
            <p className="text-gray-300 mb-6 transition-colors duration-300 group-hover:text-gray-900">
              Admins can add, remove, or update user information here.
            </p>
          </div>
          <Button className="bg-gray-200 text-gray-900 rounded-md transition duration-300 hover:bg-gray-900 hover:text-white">
            Manage Users
          </Button>
        </Card>
      </div>

      {/* Additional Admin Content */}
      <div className="mt-10 flex justify-center">
        <Card className="group w-full md:w-1/2 min-h-[320px] flex flex-col justify-between rounded-2xl p-6 bg-gray-800 text-white shadow-md transform transition duration-300 hover:bg-gray-200 hover:text-gray-900 hover:shadow-xl">
          <div>
            <h2 className="text-xl font-semibold mb-4">Other Admin Tools</h2>
            <p className="text-gray-300 mb-6 transition-colors duration-300 group-hover:text-gray-900">
              You can configure other settings and tools from here.
            </p>
          </div>
          <Button className="bg-gray-200 text-gray-900 rounded-md transition duration-300 hover:bg-gray-900 hover:text-white">
            Explore More
          </Button>
        </Card>
      </div>
    </div>
  );
};

export default AdminPanel;
