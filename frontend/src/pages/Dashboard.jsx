import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from '../api/axios';
import Navbar from '../components/Navbar';
import JobForm from '../components/JobForm';
import DashboardCalendar from '../components/DashboardCalendar';
import JobCard from '../components/JobCard';
import { CgSpinner } from 'react-icons/cg';
import { useUI } from '../context/UIContext';

const Dashboard = () => {
    const [jobs, setJobs] = useState([]);
    const [loading, setLoading] = useState(true); // For initial load
    const [error, setError] = useState('');
    const [showForm, setShowForm] = useState(false);
    // State to track which job item is currently being processed
    const [processingJobId, setProcessingJobId] = useState(null);
    const navigate = useNavigate();

    const { showCalendar } = useUI();

    // --- Helper function to handle API errors and potential logout ---
    const handleApiError = useCallback((err, defaultMessage) => {
        const errorMessage = err.response?.data?.error || err.message || defaultMessage;
        setError(errorMessage);
        console.error("API Error:", err);
        if (err.response?.status === 401) {
            localStorage.removeItem('token');
            navigate('/login', { state: { message: "Session expired. Please log in again." } });
        }
        // Reset processing state on error
        setProcessingJobId(null);
    }, [navigate]);

    // --- Fetch Jobs ---
    const fetchJobs = useCallback(async () => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        setLoading(true);
        setError('');
        setProcessingJobId(null); // Reset processing state on fresh load
        try {
            const { data } = await axios.get('/jobs', {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            setJobs(data);
        } catch (err) {
            // Use the generalized handler
            handleApiError(err, 'Failed to fetch jobs');
            setJobs([]); // Clear jobs on fetch error maybe? Or leave stale data? Depends on UX preference.
        } finally {
            setLoading(false);
        }
    }, [navigate, handleApiError]); // Added handleApiError dependency

    // --- Handle Job Creation Success ---
    const handleJobCreated = () => {
        setShowForm(false);
        fetchJobs(); // Re-fetch jobs after creation
    };

    // --- Update Job Status ---
    const updateStatus = async (jobId, status) => {
        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        setError('');
        setProcessingJobId(jobId); // Set processing state for this job

        // Store previous state for potential rollback (if not re-fetching on error)
        const previousJobs = [...jobs];
        // Optimistic UI update
        setJobs(prevJobs => prevJobs.map(job =>
            job._id === jobId ? { ...job, status: status } : job
        ));

        try {
            await axios.patch(`/ats/${jobId}`, { status }, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // If successful, the optimistic update is correct.
            // Optionally re-fetch to ensure full consistency if needed: fetchJobs();
        } catch (err) {
            handleApiError(err, 'Failed to update status');
            // Rollback optimistic update on error if not re-fetching
            setJobs(previousJobs);
        } finally {
             // Reset processing state regardless of success/failure
             setProcessingJobId(null);
        }
    };

    // --- Delete Job ---
    const deleteJob = async (jobId) => {
        // Prevent deleting if another operation is in progress for this item
        if (processingJobId === jobId) return;

        if (!window.confirm('Are you sure you want to delete this job application?')) return;

        const token = localStorage.getItem('token');
        if (!token) {
            navigate('/login');
            return;
        }
        setError('');
        setProcessingJobId(jobId); // Set processing state

        // Store previous state for potential rollback
        const previousJobs = [...jobs];
        // Optimistic UI update
        setJobs(prevJobs => prevJobs.filter(job => job._id !== jobId));

        try {
            await axios.delete(`/jobs/${jobId}`, {
                headers: { 'Authorization': `Bearer ${token}` }
            });
            // If successful, the optimistic update is correct.
        } catch (err) {
            handleApiError(err, 'Failed to delete job');
            // Rollback optimistic update on error
            setJobs(previousJobs);
        } finally {
            setProcessingJobId(null); // Reset processing state
        }
    };

    // --- Initial Fetch on Mount ---
    useEffect(() => {
        fetchJobs();
    }, [fetchJobs]);

    // --- Status Options ---
    const statusOptions = [
        { value: 'Applied', label: 'Applied', color: 'bg-blue-100 text-blue-800' },
        { value: 'Screening', label: 'Screening', color: 'bg-yellow-100 text-yellow-800' },
        { value: 'Interview', label: 'Interview', color: 'bg-purple-100 text-purple-800' },
        { value: 'Offer', label: 'Offer', color: 'bg-teal-100 text-teal-800' },
        { value: 'Hired', label: 'Hired', color: 'bg-green-100 text-green-800' },
        { value: 'Rejected', label: 'Rejected', color: 'bg-red-100 text-red-800' },
        { value: 'Withdrawn', label: 'Withdrawn', color: 'bg-gray-100 text-gray-800' },
    ];

    // Helper function to get status color
    const getStatusColor = (status) => {
        return statusOptions.find(s => s.value === status)?.color || 'bg-gray-100 text-gray-800';
    }

    // --- Render ---
    return (
        <>
            <Navbar />
            <div className="container mx-auto p-4">
                {/* Header */}
                <div className="flex justify-between items-center mb-6 flex-wrap gap-4">
                    <h1 className="text-3xl font-bold text-gray-800">Job Dashboard</h1>
                    <div className="flex items-center gap-4">
                        {/*<Link to="/ats" className="text-indigo-600 hover:text-indigo-800 hover:underline transition duration-150 ease-in-out">
                            ATS Tracker
                        </Link>
                        <Link to="/interview-prep" className="text-green-600 hover:text-green-800 hover:underline transition duration-150 ease-in-out">
                            Interview Preparation
                        </Link>
                        */}
                        <button
                            onClick={() => setShowForm(true)}
                            className="bg-indigo-600 text-white px-4 py-2 rounded shadow hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 transition duration-150 ease-in-out"
                            disabled={loading || showForm} // Disable if loading or form is already shown
                        >
                            Add New Job
                        </button>
                    </div>
                </div>

                {/* Error Display */}
                {error && (
                    <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative mb-4 shadow" role="alert">
                        <strong className="font-bold">Error: </strong>
                        <span className="block sm:inline">{error}</span>
                        <span
                            className="absolute top-0 bottom-0 right-0 px-4 py-3 cursor-pointer"
                            onClick={() => setError('')}
                            aria-label="Close error message"
                        >
                            <svg className="fill-current h-6 w-6 text-red-500 hover:text-red-700" role="button" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><title>Close</title><path d="M14.348 14.849a1.2 1.2 0 0 1-1.697 0L10 11.819l-2.651 3.029a1.2 1.2 0 1 1-1.697-1.697l2.758-3.15-2.759-3.152a1.2 1.2 0 1 1 1.697-1.697L10 8.183l2.651-3.031a1.2 1.2 0 1 1 1.697 1.697l-2.758 3.152 2.758 3.15a1.2 1.2 0 0 1 0 1.698z"/></svg>
                        </span>
                    </div>
                )}

                {/* Job Form Modal/Section */}
                {showForm && (
                    <div className="my-6 p-6 border rounded-lg shadow-lg bg-white animate-fade-in"> {/* Optional: Add a subtle animation */}
                        <div className="flex justify-between items-center mb-4">
                           <h2 className="text-2xl font-semibold text-gray-700">Add New Job Application</h2>
                           <button onClick={() => setShowForm(false)} className="text-gray-500 hover:text-gray-700 text-2xl font-bold leading-none p-1">&times;</button>
                        </div>
                        <JobForm
                            onSuccess={handleJobCreated}
                            onCancel={() => setShowForm(false)}
                        />
                    </div>
                )}

            {/* Loading State */}
            {loading ? (
                <div className="flex flex-col justify-center items-center h-64 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-indigo-500 mb-4"></div>
                    <p className="text-lg text-gray-600">Loading Jobs...</p>
                </div>
            // Empty State
            ) : !jobs || jobs.length === 0 ? (
                 <div className="text-center py-10 px-6 bg-gray-50 rounded-lg shadow-sm mt-6">
                    {/* ... empty state SVG and text ... */}
                     <h3 className="mt-2 text-lg font-medium text-gray-900">No job applications found</h3>
                     <p className="mt-1 text-sm text-gray-500">Get started by adding a new job application you've applied for.</p>
                     <div className="mt-6">
                         <button
                             type="button"
                             onClick={() => setShowForm(true)}
                             className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 transition duration-150 ease-in-out"
                         >
                             {/* ... plus icon ... */}
                             Add First Job
                         </button>
                     </div>
                 </div>
            // Jobs Grid
            ) : (
                <>
                    {showCalendar && <DashboardCalendar />}
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                        {jobs.map(job => {
                            const isProcessing = processingJobId === job._id;
                            return (
                                <div
                                    key={job._id}
                                    className={`border rounded-lg shadow-md overflow-hidden flex flex-col bg-white hover:shadow-lg transition-shadow duration-200 ease-in-out ${isProcessing ? 'opacity-75' : ''}`} // Dim card slightly when processing
                                >
                                    <div className="p-5 flex-grow">
                                        <h2 className="text-xl font-semibold text-gray-800 mb-2 truncate" title={job.title}>{job.title}</h2>
                                        <p className="text-gray-700 font-medium mb-3 text-sm">{job.company}</p>
                                        <p className="text-gray-500 mb-4 text-sm">{job.location}</p>

                                        <div className="mb-4 relative">
                                            <label htmlFor={`status-select-${job._id}`} className="block text-sm font-medium text-gray-700 mb-1">Status:</label>
                                            <select
                                                id={`status-select-${job._id}`}
                                                value={job.status}
                                                onChange={(e) => updateStatus(job._id, e.target.value)}
                                                // Disable select while this specific job is processing
                                                disabled={isProcessing}
                                                className={`mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md ${getStatusColor(job.status)} ${isProcessing ? 'cursor-not-allowed' : ''}`}
                                            >
                                                {statusOptions.map(option => (
                                                    <option key={option.value} value={option.value}>
                                                        {option.label}
                                                    </option>
                                                ))}
                                            </select>
                                            {/* Optional: Show spinner inside select when processing */}
                                            {/* {isProcessing && (
                                                <span className="absolute inset-y-0 right-0 pr-8 flex items-center pointer-events-none">
                                                    <CgSpinner className="h-5 w-5 text-gray-500 animate-spin" />
                                                </span>
                                            )} */}
                                        </div>
                                    </div>

                                    <div className="bg-gray-50 px-5 py-3 flex justify-end items-center border-t">
                                        {/* Optional: Show spinner next to delete button */}
                                        {/* {isProcessing && <CgSpinner className="h-5 w-5 text-gray-500 animate-spin mr-2" />} */}
                                        <button
                                            onClick={() => deleteJob(job._id)}
                                            // Disable delete button while this specific job is processing
                                            disabled={isProcessing}
                                            className={`text-red-600 hover:text-red-800 font-medium text-sm transition duration-150 ease-in-out ${isProcessing ? 'cursor-not-allowed text-red-400' : ''}`}
                                            title="Delete Job Application"
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                </>
            )}
            </div>
        </>
    );
};

export default Dashboard;

// Optional: Add simple fade-in animation in your index.css or App.css
/*
@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.animate-fade-in {
  animation: fadeIn 0.3s ease-out forwards;
}
*/
