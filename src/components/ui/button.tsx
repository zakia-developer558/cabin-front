import React from "react";

const Button: React.FC<React.ButtonHTMLAttributes<HTMLButtonElement>> = ({ className = "", children, ...props }) => {
  return (
    <button
      className={`px-4 py-2 rounded bg-blue-600 dark:bg-blue-700 text-white dark:text-gray-100 hover:bg-blue-700 dark:hover:bg-blue-800 ${className}`}
      {...props}
    >
      {children}
    </button>
  );
};

export { Button };
