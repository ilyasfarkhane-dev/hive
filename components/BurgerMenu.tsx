"use client";
import React, { useState, useRef, useEffect } from 'react';
// Adjust the import path as needed
import Link from 'next/link';
import { useAuth } from "@/context/AuthContext";



const BurgerMenu = () => {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  
const { login, logout, isAuthenticated } = useAuth();

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleLogout = () => {
    localStorage.removeItem("contactEeemailHash");
    setIsOpen(false);
    window.location.href = "/login";
  };

  // Don't show menu if not authenticated
 

  return (
    <div className="relative" ref={menuRef}>
      {/* Burger button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="p-2 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-secondary"
        aria-label="Menu"
      >
        <div className="w-6 h-6 flex flex-col justify-between">
          <span className={`w-full h-0.5 bg-white transition-transform ${isOpen ? 'rotate-45 translate-y-2.5' : ''}`}></span>
          <span className={`w-full h-0.5 bg-white opacity-100 transition-opacity ${isOpen ? 'opacity-0' : ''}`}></span>
          <span className={`w-full h-0.5 bg-white transition-transform ${isOpen ? '-rotate-45 -translate-y-2.5' : ''}`}></span>
        </div>
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-50">
          <Link 
            href="/profile" 
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            Profile
          </Link>
          <Link 
            href="/projects" 
            className="block px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
            onClick={() => setIsOpen(false)}
          >
            My Projects
          </Link>
          <button
            onClick={handleLogout}
            className="block w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      )}
    </div>
  );
};

export default BurgerMenu;