const ApplyLeave = () => {
  return (
    <div className="p-6">
      <h2 className="text-xl font-bold mb-4">Apply for Leave</h2>

      {/* Buttons for Different Leave Types */}
      <div className="space-y-4 mb-6">
        <button className="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600">
          Complete Leave
        </button>
        <button className="w-full bg-green-500 text-white py-2 px-4 rounded hover:bg-green-600">
          Half Day Leave
        </button>
        <button className="w-full bg-red-500 text-white py-2 px-4 rounded hover:bg-red-600">
          Remove Leave
        </button>
      </div>

      {/* Existing Form */}
      <form className="space-y-4">
        <input
          type="text"
          placeholder="Leave Reason"
          className="border p-2 w-full"
        />
        <input type="date" className="border p-2 w-full" />
        <button className="p-2 bg-green-500 text-white w-full rounded">
          Submit
        </button>
      </form>
    </div>
  );
};

export default ApplyLeave;
