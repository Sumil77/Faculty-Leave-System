const ApplyLeave = () => {
    return (
      <div className="p-6">
        <h2 className="text-xl font-bold mb-4">Apply for Leave</h2>
        <form className="space-y-4">
          <input type="text" placeholder="Leave Reason" className="border p-2 w-full" />
          <input type="date" className="border p-2 w-full" />
          <button className="p-2 bg-green-500 text-white w-full rounded">Submit</button>
        </form>
      </div>
    );
  };
  
  export default ApplyLeave;
  