import { useState } from "react";
import { Calendar, momentLocalizer } from "react-big-calendar";
import moment from "moment";
import "react-big-calendar/lib/css/react-big-calendar.css";

// Initialize moment for calendar localization
const localizer = momentLocalizer(moment);

// Define leave types with exact hex color codes
const leaveTypes = {
  "Medical Leave": "#3B82F6", // Tailwind bg-blue-500
  "Casual Leave": "#22C55E", // Tailwind bg-green-500
  "Child Care Leave": "#EAB308", // Tailwind bg-yellow-500
  "Earned Leave": "#A855F7" // Tailwind bg-purple-500
};

// Get today's date (without time)
const today = new Date();
today.setHours(0, 0, 0, 0);

// Sample leave data (only leaves in the past)
const leaveBalance = [
  { type: "Medical Leave", date: "2025-03-05" },
  { type: "Casual Leave", date: "2025-03-10" },
  { type: "Child Care Leave", date: "2025-02-28" },
  { type: "Earned Leave", date: "2025-03-01" },
  { type: "Medical Leave", date: "2025-03-08" }
].filter(leave => new Date(leave.date) <= today); // Filter out future leaves

// Public Holidays in 2025
const holidays = [
  { title: "Republic Day", start: new Date(2025, 0, 26), end: new Date(2025, 0, 26), color: "#FF4D4D" },
  { title: "Maha Shivratri", start: new Date(2025, 1, 26), end: new Date(2025, 1, 26), color: "#FF4D4D" },
  { title: "Holi", start: new Date(2025, 2, 14), end: new Date(2025, 2, 14), color: "#FF4D4D" },
  { title: "Id-ul Fitr", start: new Date(2025, 2, 31), end: new Date(2025, 2, 31), color: "#FF4D4D" },
  { title: "Mahavir Jayanti", start: new Date(2025, 3, 10), end: new Date(2025, 3, 10), color: "#FF4D4D" },
  { title: "Good Friday", start: new Date(2025, 3, 18), end: new Date(2025, 3, 18), color: "#FF4D4D" },
  { title: "Buddha Purnima", start: new Date(2025, 4, 12), end: new Date(2025, 4, 12), color: "#FF4D4D" },
  { title: "Id-ul-Zuha", start: new Date(2025, 5, 7), end: new Date(2025, 5, 7), color: "#FF4D4D" },
  { title: "Muharram", start: new Date(2025, 6, 6), end: new Date(2025, 6, 6), color: "#FF4D4D" },
  { title: "Independence Day", start: new Date(2025, 7, 15), end: new Date(2025, 7, 15), color: "#FF4D4D" },
  { title: "Janmashtami", start: new Date(2025, 7, 16), end: new Date(2025, 7, 16), color: "#FF4D4D" },
  { title: "Id-e-Milad", start: new Date(2025, 8, 5), end: new Date(2025, 8, 5), color: "#FF4D4D" },
  { title: "Gandhi Jayanti", start: new Date(2025, 9, 2), end: new Date(2025, 9, 2), color: "#FF4D4D" },
  { title: "Dussehra", start: new Date(2025, 9, 2), end: new Date(2025, 9, 2), color: "#FF4D4D" },
  { title: "Maharishi Valmiki Jayanti", start: new Date(2025, 9, 7), end: new Date(2025, 9, 7), color: "#FF4D4D" },
  { title: "Diwali", start: new Date(2025, 9, 20), end: new Date(2025, 9, 20), color: "#FF4D4D" },
  { title: "Guru Nanak Jayanti", start: new Date(2025, 10, 5), end: new Date(2025, 10, 5), color: "#FF4D4D" },
  { title: "Christmas Day", start: new Date(2025, 11, 25), end: new Date(2025, 11, 25), color: "#FF4D4D" }
];

// Convert leaveBalance into events with color mapping
const leaveEvents = leaveBalance.map((leave) => ({
  title: leave.type,
  start: new Date(leave.date),
  end: new Date(leave.date),
  color: leaveTypes[leave.type] || "#FF0000" // Default to red if type is missing
}));

// Combine fixed holidays and leave events
const events = [...holidays, ...leaveEvents];

// Custom toolbar to remove the view buttons and add next/previous buttons
const CustomToolbar = ({ date, onNavigate, onDateJump }) => {
  const monthYear = moment(date).format("MMMM YYYY"); // Format the current month and year

  return (
    <div className="flex justify-between items-center mb-4">
      <button
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        onClick={() => onNavigate("PREV")}
      >
        Previous
      </button>
      <span className="text-xl font-semibold text-gray-700">{monthYear}</span> {/* Show month and year */}
      <button
        className="bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        onClick={() => onNavigate("NEXT")}
      >
        Next
      </button>

      {/* Jump to Date Input */}
      <input
        type="date"
        onChange={(e) => onDateJump(e.target.value)}
        className="py-1 px-2 rounded border border-gray-300"
      />
    </div>
  );
};

const HolidayCalendar = () => {
  const [date, setDate] = useState(new Date());

  // Function to handle the jump to a specific date
  const handleDateJump = (selectedDate) => {
    if (selectedDate) {
      setDate(new Date(selectedDate));
    }
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <h2 className="text-3xl font-bold text-center text-blue-700 my-4">Holiday & Leave Calendar</h2>

      {/* Calendar Component */}
      <div className="bg-white shadow-lg rounded-lg p-4 h-[70vh] overflow-auto mx-auto w-[90%]">
        <Calendar
          localizer={localizer}
          events={events}
          startAccessor="start"
          endAccessor="end"
          style={{ height: "100%", width: "100%" }}
          defaultView="month"
          step={60}
          date={date}
          onNavigate={(newDate) => setDate(newDate)}
          selectable
          eventPropGetter={(event) => ({
            style: { 
              backgroundColor: event.color, // Apply hex color here
              color: "white", 
              borderRadius: "5px", 
              padding: "4px",
              textAlign: "center"
            }
          })}
          dayPropGetter={(date) => {
            const dayOfWeek = date.getDay();
            // For Sundays and holidays, apply a special background color and holiday name
            const holiday = holidays.find(holiday => moment(date).isSame(holiday.start, "day"));
            if (dayOfWeek === 0 || holiday) {
              return {
                style: {
                  backgroundColor: "#FFEBEB", // Light red for Sundays and holidays
                  color: "red",
                },
                children: holiday ? holiday.title : ''
              };
            }

            // Apply hover effect style for other dates with Tailwind CSS classes
            return {
              style: {
                position: "relative",
                cursor: "pointer",
                transition: "background-color 0.3s ease", // Smooth hover effect transition
              },
              className: "hover:bg-gray-200" // Tailwind hover effect on date cells
            };
          }}
          components={{
            toolbar: (props) => <CustomToolbar {...props} date={date} onNavigate={props.onNavigate} onDateJump={handleDateJump} /> // Pass onDateJump function to toolbar component
          }}
        />
      </div>

      {/* Leave Type Legend */}
      <div className="flex justify-center gap-4 mt-4">
        {Object.entries(leaveTypes).map(([type, color]) => (
          <div key={type} className="flex items-center gap-2">
            <span className="w-4 h-4 rounded" style={{ backgroundColor: color }}></span>
            <span className="text-gray-700">{type}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

export default HolidayCalendar;
