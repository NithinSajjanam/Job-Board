import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import welcomeImg from "../assets/Welcome Illustration.jpg"; // replace with your image path

const jobIcons = ['💼', '📝', '💻', '📊', '📈', '📅', '📋', '👔', '🏢', '📧', '🗞️', '🪄', '🖥️'];

const Welcome = () => {
  return (
    <div className="min-h-screen relative overflow-hidden flex items-center justify-center">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 animate-gradient-background"></div>

      {/* Floating particles */}
      <div className="absolute inset-0 overflow-hidden z-0">
        {[...Array(30)].map((_, i) => {
          const size = Math.random() * 15 + 5;
          const duration = Math.random() * 15 + 15;
          const delay = Math.random() * 10;
          const color = `rgba(99, 102, 241, ${Math.random() * 0.3 + 0.1})`;

          return (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                width: `${size}px`,
                height: `${size}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                backgroundColor: color,
                animation: `float ${duration}s ease-in-out infinite both`,
                animationDelay: `${delay}s`,
                filter: "blur(1px)",
              }}
            />
          );
        })}
      </div>

      {/* Floating emojis */}
      <div className="absolute inset-0 overflow-hidden z-0">
        {[...Array(15)].map((_, i) => {
          const size = Math.random() * 24 + 16;
          const duration = Math.random() * 25 + 20;
          const delay = Math.random() * 15;
          const icon = jobIcons[Math.floor(Math.random() * jobIcons.length)];

          return (
            <div
              key={`icon-${i}`}
              className="absolute text-2xl opacity-20 hover:opacity-40 transition-opacity"
              style={{
                fontSize: `${size}px`,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
                animation: `float-icons ${duration}s ease-in-out infinite both`,
                animationDelay: `${delay}s`,
                transform: `rotate(${Math.random() * 360}deg)`,
              }}
            >
              {icon}
            </div>
          );
        })}
      </div>

      {/* Main content */}
      <div className="container mx-auto px-4 py-20 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="max-w-5xl mx-auto bg-white/80 backdrop-blur-md rounded-xl shadow-lg p-8 md:p-12 flex flex-col md:flex-row items-center gap-10 hover:shadow-xl hover:scale-[1.01]"
        >
          {/* Left image */}
          <div className="w-full md:w-1/2 flex justify-center">
            <img
              src={welcomeImg}
              alt="Welcome Illustration"
              className="w-full max-w-[300px]"
            />
          </div>

          {/* Right content */}
          <div className="w-full md:w-1/2 text-center md:text-left">
            <motion.h1
              initial={{ x: -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.2, duration: 0.6 }}
              className="text-4xl md:text-5xl font-bold text-gray-800 mb-4"
            >
              Welcome Back <span className="inline-block">👋</span>
            </motion.h1>

            <motion.p
              initial={{ x: 100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              transition={{ delay: 0.4, duration: 0.6 }}
              className="text-lg text-gray-600 mb-6"
            >
              Start your journey by logging in or creating an account
            </motion.p>

            <motion.div
              initial={{ y: 50, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ delay: 0.6, duration: 0.7 }}
              className="flex flex-col sm:flex-row justify-center md:justify-start gap-4"
            >
              <Link
                to="/login"
                className="px-6 py-3 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-all hover:scale-105 active:scale-95 font-medium shadow-md hover:shadow-lg text-center"
              >
                Login
              </Link>
              <Link
                to="/register"
                className="px-6 py-3 bg-white text-indigo-600 border border-indigo-600 rounded-lg hover:bg-indigo-50 transition-all hover:scale-105 active:scale-95 font-medium shadow-md hover:shadow-lg text-center"
              >
                Register
              </Link>
            </motion.div>
          </div>
        </motion.div>
      </div>

      {/* Animation styles */}
      <style>{`
        @keyframes float {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { transform: translateY(-100vh) translateX(20px) rotate(360deg); opacity: 0; }
        }

        @keyframes float-icons {
          0% { transform: translateY(0) translateX(0) rotate(0deg); opacity: 0; }
          10% { opacity: 0.2; }
          50% { opacity: 0.3; }
          90% { opacity: 0.2; }
          100% { transform: translateY(-80vh) translateX(-20px) rotate(360deg); opacity: 0; }
        }

        @keyframes gradient-background {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }

        .animate-gradient-background {
          background-size: 200% 200%;
          animation: gradient-background 15s ease infinite;
        }
      `}</style>
    </div>
  );
};

export default Welcome;
