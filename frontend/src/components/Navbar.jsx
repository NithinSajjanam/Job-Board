import React, { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

const Navbar = () => {
  const { isAuthenticated, logout, user } = useAuth();
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const toggleMenu = () => {
    setMenuOpen(prev => !prev);
  };

  // Close menu if clicked outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <nav className="bg-blue-600 text-white p-4 flex justify-between items-center relative">
      <div className="text-lg font-bold">
        <Link to="/">Job Board</Link>
      </div>
      <div className="flex items-center space-x-4">
        {isAuthenticated ? (
          <>
          <Link to="/dashboard" className="hover:underline">Home</Link>
            <Link to="/ats" className="hover:underline">ATS Tracker</Link>
            <Link to="/interview-prep" className="hover:underline">Interview Preparation</Link>
            
            <Link
              to="/calendar"
              className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              title="Show Calendar"
            >
              Show Calendar
            </Link>
            <div className="relative" ref={menuRef}>
              <button
                onClick={toggleMenu}
                className="flex items-center space-x-2 focus:outline-none"
                aria-haspopup="true"
                aria-expanded={menuOpen}
              >
                <span className="sr-only">Open user menu</span>
                {/* Profile Icon - simple circle with initials or emoji */}
                <div className="w-8 h-8 rounded-full bg-white text-blue-600 flex items-center justify-center font-bold cursor-pointer select-none">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </div>
              </button>
              {menuOpen && (
                <div className="absolute right-0 mt-2 w-48 bg-white text-blue-600 rounded-md shadow-lg z-50">
                  <div className="px-4 py-2 border-b border-gray-200 font-semibold">
                    {user?.name || 'User'}
                  </div>
                  <Link
                    to="/settings"
                    className="block px-4 py-2 hover:bg-blue-100"
                    onClick={() => setMenuOpen(false)}
                  >
                    Settings
                  </Link>
                  <button
                    className="w-full text-left px-4 py-2 hover:bg-blue-100"
                    onClick={() => {
                      alert('Theme settings clicked');
                      setMenuOpen(false);
                    }}
                  >
                    Themes
                  </button>
                  <button
                    className="w-full text-left px-4 py-2 text-red-600 hover:bg-red-100"
                    onClick={() => {
                      handleLogout();
                      setMenuOpen(false);
                    }}
                  >
                    Logout
                  </button>
                </div>
              )}
            </div>
          </>
        ) : (
          <>
            <Link to="/login" className="hover:underline">Login</Link>
            <Link to="/register" className="hover:underline">Register</Link>
          </>
        )}
      </div>
    </nav>
  );
};

export default Navbar;
