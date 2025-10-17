import React from 'react';
import { Tag } from 'lucide-react';

/**
 * CategoryBadge - A reusable category badge component
 */
const CategoryBadge = ({
  category,
  showIcon = true,
  size = "sm",
  className = "",
  variant = "default"
}) => {
  const sizeClasses = {
    sm: "px-2 py-0.5 text-xs",
    md: "px-2.5 py-0.5 text-sm",
    lg: "px-3 py-1 text-base"
  };

  const iconSizes = {
    sm: 12,
    md: 14,
    lg: 16
  };

  const variantClasses = {
    default: "bg-primary/10 text-primary",
    overlay: "bg-white/90 backdrop-blur-sm text-primary shadow-md"
  };

  return (
    <span className={`inline-flex items-center ${sizeClasses[size]} rounded-full font-medium ${variantClasses[variant]} ${className}`}>
      {showIcon && <Tag size={iconSizes[size]} className="mr-1" />}
      {category?.name || category}
    </span>
  );
};

export default CategoryBadge;
