import React, { useState } from 'react';
import { motion } from 'framer-motion';
import apiClient from '../api/apiClient';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Login = () => {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const navigate = useNavigate();
    const { login } = useAuth();

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const response = await apiClient.post('/auth/login', { email, password });
            login(response.data.token);
            navigate('/dashboard');
        } catch (err) {
            setError(err.response?.data?.error || 'Login failed. Please try again.');
        }
    };

    const containerVariants = {
        hidden: { opacity: 0, x: -50 },
        visible: {
            opacity: 1,
            x: 0,
            transition: { type: 'spring', stiffness: 100, damping: 10 },
        },
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8 relative">
            {/* Background Gradient Animation */}
            <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 animate-gradient-background"></div>

            {/* Floating Bubbles */}
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

            {/* Floating Emojis */}
            <div className="absolute inset-0 overflow-hidden z-0">
                {['💼', '📝', '💻', '📊', '📈', '📅', '📋', '👔', '🏢', '📧', '🗞️', '🪄', '🖥️'].map((icon, i) => {
                    const size = Math.random() * 24 + 16;
                    const duration = Math.random() * 25 + 20;
                    const delay = Math.random() * 15;

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

            {/* Login Form */}
            <motion.div
                className="max-w-md w-full space-y-8 shadow-lg p-6 bg-white rounded-lg z-10"
                initial="hidden"
                animate="visible"
                variants={containerVariants}
            >
                <motion.h2
                    className="text-center text-3xl font-extrabold text-gray-900"
                    initial={{ x: 50, opacity: 0 }}
                    animate={{ x: 0, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 80, delay: 0.2 }}
                >
                    Login
                </motion.h2>

                {error && (
                    <motion.div
                        className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded relative"
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.3 }}
                    >
                        {error}
                    </motion.div>
                )}

                <form onSubmit={handleSubmit} className="mt-8 space-y-6">
                    <motion.div
                        initial={{ x: -50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ type: 'spring', delay: 0.3 }}
                    >
                        <label htmlFor="email" className="sr-only">Email:</label>
                        <input
                            id="email"
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                            placeholder="Email address"
                            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </motion.div>

                    <motion.div
                        initial={{ x: 50, opacity: 0 }}
                        animate={{ x: 0, opacity: 1 }}
                        transition={{ type: 'spring', delay: 0.4 }}
                    >
                        <label htmlFor="password" className="sr-only">Password:</label>
                        <input
                            id="password"
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            placeholder="Password"
                            className="appearance-none rounded-md relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                        />
                    </motion.div>

                    <div className="flex justify-end">
                        <Link to="/forgot-password" className="text-sm text-indigo-600 hover:text-indigo-800">
                            Forgot Password?
                        </Link>
                    </div>

                    <motion.button
                        type="submit"
                        className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                        initial={{ y: 20, opacity: 0 }}
                        animate={{ y: 0, opacity: 1 }}
                        transition={{ delay: 0.5 }}
                    >
                        Login
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default Login;
