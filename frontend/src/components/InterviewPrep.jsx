import React, { useState } from 'react';
import axios from '../api/axios';
import '@fontsource/inter'; // Make sure this is installed in your project

function InterviewPrep() {
  const [resume, setResume] = useState(null);
  const [jobDesc, setJobDesc] = useState('');
  const [questions, setQuestions] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async () => {
    if (!resume) {
      setError('Please upload a resume file.');
      return;
    }
    if (!jobDesc.trim()) {
      setError('Please enter a job description.');
      return;
    }
    setError(null);
    setLoading(true);
    setQuestions(null);

    const formData = new FormData();
    formData.append('resume', resume);
    formData.append('jobDescription', jobDesc);

    try {
      const response = await axios.post('/interview-prep/interview-questions', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setQuestions(response.data.interviewQuestions);
    } catch (err) {
      setError(err.response?.data?.error || 'Failed to generate interview questions');
      setQuestions(null);
    } finally {
      setLoading(false);
    }
  };

  const handleClear = () => {
    setResume(null);
    setJobDesc('');
    setQuestions(null);
    setError(null);
  };

  return (
    <div className="container mx-auto px-6 py-10 font-[Inter] max-w-4xl">
      <h2 className="text-3xl font-extrabold mb-8 text-center text-green-800">Interview Preparation </h2>

      <div className="mb-6">
        <label className="block text-lg font-medium mb-2 text-gray-700">Upload Resume</label>
        <input
          type="file"
          accept=".pdf,.doc,.docx"
          onChange={(e) => setResume(e.target.files[0])}
          className="block w-full text-sm text-gray-500 file:mr-4 file:py-3 file:px-6
            file:rounded-lg file:border-0 file:text-sm file:font-semibold
            file:bg-green-100 file:text-green-700 hover:file:bg-green-200"
        />
      </div>

      <div className="mb-6">
        <label className="block text-lg font-medium mb-2 text-gray-700">Job Description</label>
        <textarea
          placeholder="Paste Job Description here"
          value={jobDesc}
          onChange={(e) => setJobDesc(e.target.value)}
          rows={10}
          className="w-full p-4 text-base border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-2 focus:ring-green-500"
        />
      </div>

      <div className="flex gap-4 mb-8">
        <button
          onClick={handleSubmit}
          disabled={loading}
          className="flex-grow bg-green-600 text-white text-lg px-6 py-3 rounded-lg hover:bg-green-700 disabled:opacity-50 transition"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"></path>
              </svg>
              Generating...
            </span>
          ) : (
            'Generate Interview Questions'
          )}
        </button>
        <button
          onClick={handleClear}
          disabled={loading && !questions}
          className="flex-grow bg-gray-300 text-gray-800 text-lg px-6 py-3 rounded-lg hover:bg-gray-400 disabled:opacity-50 transition"
        >
          Clear
        </button>
      </div>

      {error && (
        <p className="text-red-600 mb-6 text-center text-lg font-semibold">{error}</p>
      )}

      {questions && (
        <div className="space-y-6 bg-white p-6 rounded-2xl shadow-lg border border-gray-200">
          <div className="p-4 bg-green-50 rounded-lg shadow-inner">
            <h3 className="text-xl font-bold mb-2 text-green-800">Generated Interview Questions</h3>
            <pre className="whitespace-pre-wrap text-base text-gray-700">{questions}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

export default InterviewPrep;
