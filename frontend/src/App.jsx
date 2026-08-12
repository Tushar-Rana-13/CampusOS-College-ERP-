import React from 'react';

export default function App() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-6">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl p-8 shadow-2xl max-w-md text-center space-y-4">
        <div className="inline-block px-3 py-1 bg-sky-500/10 text-sky-400 text-xs font-semibold rounded-full uppercase tracking-wider">
          CampusOS Development
        </div>
        <h1 className="text-3xl font-bold tracking-tight text-white">
          Tailwind CSS v4 Connected!
        </h1>
        <p className="text-slate-400 text-sm">
          If you see this dark card with styled badges, rounded borders, and blue text, your frontend design stack is 100% verified.
        </p>
        <button className="w-full py-2.5 px-4 bg-sky-600 hover:bg-sky-500 text-white font-medium rounded-xl transition duration-200 shadow-lg shadow-sky-600/30 active:scale-95">
          System Ready
        </button>
      </div>
    </div>
  );
}