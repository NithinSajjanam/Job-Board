import React, { useState } from 'react';
import Calendar from 'react-calendar';
import 'react-calendar/dist/Calendar.css';

const DashboardCalendar = () => {
  const [date, setDate] = useState(new Date());          // Selected date
  const [events, setEvents] = useState({});               // All events (date: text)
  const [inputValue, setInputValue] = useState('');       // Event input

  const handleSaveEvent = () => {
    const dateKey = date.toDateString();                  // Example: "Sun Apr 27 2025"
    setEvents(prev => ({
      ...prev,
      [dateKey]: inputValue,                              // Save event for that date
    }));
    setInputValue('');                                     // Clear input after saving
  };

  // Update inputValue when date changes to show existing event or clear
  React.useEffect(() => {
    const dateKey = date.toDateString();
    setInputValue(events[dateKey] || '');
  }, [date, events]);

  // Prepare list of all events for display on right side
  const eventEntries = Object.entries(events);

  return (
    <div className="flex p-4 bg-white shadow-md rounded-md max-w-full gap-6">
      <div className="flex-shrink-0">
        <Calendar 
          onChange={setDate}
          value={date}
        />
      </div>

      <div className="flex-grow max-w-md">
        <h2 className="text-lg font-semibold mb-4">Upcoming Events</h2>

        <div className="mb-4">
          <h3 className="text-md font-semibold mb-2">Selected Date: {date.toDateString()}</h3>

          <input 
            type="text"
            placeholder="Write your event here..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            className="border rounded w-full px-3 py-2 mt-2"
          />

          <button 
            onClick={handleSaveEvent}
            className="mt-2 px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            Save Event
          </button>

          {events[date.toDateString()] && (
            <div className="mt-4 p-3 bg-gray-100 rounded">
              <h4 className="font-semibold">Your Event:</h4>
              <p>{events[date.toDateString()]}</p>
            </div>
          )}
        </div>
      </div>

      <div className="flex-shrink-0 w-64 border-l border-gray-300 pl-4 overflow-y-auto max-h-[400px]">
        <h2 className="text-lg font-semibold mb-4">All Events</h2>
        {eventEntries.length === 0 ? (
          <p className="text-gray-500">No events added yet.</p>
        ) : (
          <ul className="space-y-3">
            {eventEntries.map(([dateKey, eventText]) => (
              <li key={dateKey} className="p-2 bg-gray-50 rounded shadow-sm">
                <div className="font-semibold">{dateKey}</div>
                <div className="text-gray-700">{eventText}</div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default DashboardCalendar;
