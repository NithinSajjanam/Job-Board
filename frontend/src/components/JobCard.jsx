import React from 'react';
import StatusBadge from './StatusBadge'; // Reusable component for status badges

const JobCard = ({ application, updateStatus }) => {
    if (!application) {
        return <div>Application data is not available</div>;
    }
    return (
        <div className="border rounded-lg shadow-md overflow-hidden">
            <div className="p-6">
                <h2 className="text-xl font-bold mb-2">{application.title}</h2>
                <p className="text-gray-600 mb-4">{application.description}</p>
                
                <div className="space-y-2 mb-4">
                    <p><span className="font-semibold">Company:</span> {application.company}</p>
                    <p><span className="font-semibold">Location:</span> {application.location}</p>
                    <div className="flex items-center">
                        <span className="font-semibold mr-2">Status:</span>
                        <StatusBadge status={application.status} />
                    </div>
                </div>

                <div className="flex flex-wrap gap-2 mt-4">
                    {['Applied', 'Interview', 'Hired', 'Rejected'].map(status => (
                        <button
                            key={status}
                            onClick={() => updateStatus(application._id, status)}
                            className={`px-3 py-1 rounded text-sm ${status === 'Hired' ? 'bg-green-100 text-green-800' : status === 'Rejected' ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'} hover:opacity-80`}
                        >
                            {status}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
};

export default JobCard;
