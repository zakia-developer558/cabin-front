"use client";

import { useTheme } from "next-themes";
import { useEffect, useState } from "react";

export default function TestTheme() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen p-8 bg-white dark:bg-black text-black dark:text-white transition-all duration-300">
      <h1 className="text-4xl font-bold mb-8">Theme Test Page</h1>
      
      <div className="space-y-4">
        <p>Current theme: {theme}</p>
        <p>Resolved theme: {resolvedTheme}</p>
        
        <div className="flex gap-4">
          <button
            onClick={() => setTheme('light')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            Light Mode
          </button>
          <button
            onClick={() => setTheme('dark')}
            className="px-4 py-2 bg-gray-800 text-white rounded hover:bg-gray-700"
          >
            Dark Mode
          </button>
          <button
            onClick={() => setTheme('system')}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            System
          </button>
        </div>

        <div className="mt-8 p-4 border-2 border-gray-300 dark:border-gray-700 rounded">
          <h2 className="text-2xl mb-4">Test Elements</h2>
          <div className="bg-gray-100 dark:bg-gray-800 p-4 rounded mb-4">
            <p>This should be light gray in light mode, dark gray in dark mode</p>
          </div>
          <div className="bg-red-100 dark:bg-red-900 p-4 rounded">
            <p>This should be light red in light mode, dark red in dark mode</p>
          </div>
        </div>
      </div>
    </div>
  );
}