"use client";
import React, { useState } from 'react';

interface DateTimePickerProps {
  buttonText: string;
  notificationTitle: string;
  notificationMessage: string;
  notificationButtonText?: string;
}

const DateTimePicker: React.FC<DateTimePickerProps> = ({
  buttonText,
  notificationTitle,
  notificationMessage,
  notificationButtonText = "OK"
}) => {
  const [showNotification, setShowNotification] = useState(false);

  const handleClick = () => {
    setShowNotification(true);
    // Hide notification after 3 seconds
    setTimeout(() => setShowNotification(false), 3000);
  };

  return (
    <div className="relative">
      <button
        onClick={handleClick}
        className="bg-teal-600 text-white px-4 py-2 rounded-lg hover:bg-teal-700 transition-colors"
      >
        {buttonText}
      </button>
      
      {showNotification && (
        <div className="absolute top-full left-0 mt-2 p-4 bg-white border border-gray-200 rounded-lg shadow-lg z-50 min-w-64">
          <h4 className="font-semibold text-gray-900 mb-2">{notificationTitle}</h4>
          <p className="text-sm text-gray-600">{notificationMessage}</p>
        </div>
      )}
    </div>
  );
};

export default DateTimePicker;
