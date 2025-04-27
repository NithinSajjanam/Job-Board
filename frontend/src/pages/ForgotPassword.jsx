import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

const ForgotPassword = () => {
  const [email, setEmail] = useState("");
  const navigate = useNavigate();

  const handleReset = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("http://localhost:5000/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();
      alert(data.message);
      navigate('/login');
    } catch (error) {
      console.error("Reset error:", error);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 font-sans">
      {/* Applying the animation to the container using motion.div */}
      <motion.div
        className="bg-white p-10 rounded-lg shadow-md w-full max-w-md text-center"
        initial={{ x: -100, opacity: 0 }}  // Starts off-screen to the left
        animate={{ x: 0, opacity: 1 }}     // Slides in to the center
        transition={{
          type: "spring",                  // Spring animation for bounciness
          stiffness: 100,                  // Controls bounce intensity
          damping: 20,                     // Controls how the bounce fades out
          delay: 0.2                       // Small delay for better effect
        }}
      >
        <h2 className="text-2xl font-semibold mb-6 text-gray-800">Reset Password</h2>
        <form onSubmit={handleReset} className="flex flex-col">
          <input
            type="email"
            placeholder="Enter your email"
            className="mb-4 p-3 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-indigo-500"
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <button
            type="submit"
            className="bg-indigo-600 text-white py-3 rounded font-semibold hover:bg-indigo-700 transition-colors"
          >
            Send Reset Link
          </button>
        </form>
      </motion.div>
    </div>
  );
};

export default ForgotPassword;
