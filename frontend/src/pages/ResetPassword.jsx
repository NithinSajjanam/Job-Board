import React, { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";

const ResetPassword = () => {
  const { token } = useParams();
  const navigate = useNavigate();
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");

  const handleResetPassword = async (e) => {
    e.preventDefault();
    console.log("Sending reset password request with token:", token); // Log the token
    console.log("New password:", password); // Log the new password

    try {
      const response = await fetch(`http://localhost:5000/api/auth/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword: password }), // Send token in the body
      });

      const data = await response.json();
      setMessage(data.message);
      if (response.ok) {
        setTimeout(() => navigate("/login"), 2000);
      }
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 font-sans">
      <div className="bg-white p-10 rounded-lg shadow-md w-full max-w-md text-center">
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Reset Password</h2>
        <form onSubmit={handleResetPassword} className="flex flex-col">
          <input
            type="password"
            placeholder="Enter new password"
            className="mb-4 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onChange={(e) => setPassword(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white py-3 rounded font-semibold hover:bg-indigo-700 transition-colors"
          >
            Reset Password
          </button>
        </form>
        {message && <p className="mt-4 text-green-600 text-sm">{message}</p>}
      </div>
    </div>
  );
};

export default ResetPassword;
