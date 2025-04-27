import React from 'react';
import Navbar from '../components/Navbar';
import DashboardCalendar from '../components/DashboardCalendar';

const CalendarPage = () => {
  return (
    <>
      <Navbar />
      <div className="container mx-auto p-4">
        <h1 className="text-3xl font-bold mb-6">Calendar</h1>
        <DashboardCalendar />
      </div>
    </>
  );
};

export default CalendarPage;
