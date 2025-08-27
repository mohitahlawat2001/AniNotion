import React from 'react';
import { Calendar } from 'lucide-react';

/**
 * DateDisplay - A reusable date display component
 */
const DateDisplay = ({
  date,
  showIcon = true,
  format = "short",
  className = "",
  iconSize = 14
}) => {
  const formatDate = (dateString) => {
    const date = new Date(dateString);

    switch (format) {
      case "long":
        return date.toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        });
      case "medium":
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
      case "short":
      default:
        return date.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'short',
          day: 'numeric'
        });
    }
  };

  return (
    <div className={`flex items-center text-sm text-gray-500 ${className}`}>
      {showIcon && <Calendar size={iconSize} className="mr-1" />}
      {formatDate(date)}
    </div>
  );
};

export default DateDisplay;
