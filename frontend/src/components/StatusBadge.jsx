import React from 'react';

const StatusBadge = ({ status }) => {
  const getStatusClasses = () => {
    switch(status) {
      case 'Applied':
        return 'bg-blue-100 text-blue-800';
      case 'Interview':
        return 'bg-purple-100 text-purple-800';
      case 'Hired':
        return 'bg-green-100 text-green-800';
      case 'Rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getStatusClasses()}`}>
      {status}
    </span>
  );
};

export default StatusBadge;
