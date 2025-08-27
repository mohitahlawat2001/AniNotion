import React from 'react';

/**
 * ClickableCorner - A reusable animated corner CTA component
 * Features diagonal fold with text, hover animations, and accessibility
 */
const ClickableCorner = ({
  onClick,
  text = "READ",
  size = "3.4rem",
  hoverSize = "3.9rem",
  color = "emerald",
  className = "",
  title = "View full content",
  layout = "grid" // "grid" or "list"
}) => {
  const colorClasses = {
    emerald: {
      bg: "bg-emerald-500",
      text: "text-emerald-50",
      focus: "focus-visible:ring-emerald-400/60"
    },
    blue: {
      bg: "bg-blue-500",
      text: "text-blue-50",
      focus: "focus-visible:ring-blue-400/60"
    },
    purple: {
      bg: "bg-purple-500",
      text: "text-purple-50",
      focus: "focus-visible:ring-purple-400/60"
    },
    red: {
      bg: "bg-red-500",
      text: "text-red-50",
      focus: "focus-visible:ring-red-400/60"
    }
  };

  const colors = colorClasses[color] || colorClasses.emerald;

  // Adjust sizes for list layout
  const actualSize = layout === "list" ? "3.2rem" : size;
  const actualHoverSize = layout === "list" ? "3.7rem" : hoverSize;
  const textSize = layout === "list" ? "text-[10px]" : "text-[10px]";
  const textPosition = layout === "list" ? "bottom-[10px] right-[5px]" : "bottom-[12px] right-[6px]";
  const roundedClass = layout === "list" ? "rounded-br-xl" : "rounded-tr-lg";
  const positionClass = layout === "list" ? "bottom-2 right-2" : "bottom-0 right-0";

  return (
    <a
      onClick={onClick}
      className={`group absolute ${positionClass} block outline-none cursor-pointer ${className}`}
      title={title}
    >
      <span className="sr-only">{title}</span>
      <span className={`relative block w-[var(--sz,${actualSize})] h-[var(--sz,${actualSize})] transition-[width,height] duration-300 ease-out hover:[--sz:${actualHoverSize}] ${roundedClass}`}>
        {/* Fold */}
        <span className={`absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)] ${colors.bg} ${roundedClass}`}></span>
        {/* Shading */}
        <span className={`absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)] bg-gradient-to-tr from-black/10 to-transparent mix-blend-overlay ${roundedClass}`}></span>
        {/* Diagonal text */}
        <span className={`absolute ${textPosition} rotate-[-32deg] ${textSize} font-semibold tracking-widest ${colors.text}`}>
          {text}
        </span>
        {/* Ring border */}
        <span className={`absolute inset-0 [clip-path:polygon(100%_0,100%_100%,0_100%)] ring-1 ring-black/10 dark:ring-white/10 ${roundedClass}`}></span>
      </span>
      {/* Focus ring for keyboard users */}
      <span className={`absolute inset-0 ring-2 ring-transparent ${colors.focus} ${roundedClass} pointer-events-none`}></span>
    </a>
  );
};

export default ClickableCorner;
