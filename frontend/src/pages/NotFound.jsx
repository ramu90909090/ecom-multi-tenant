import React from "react";
import { Link } from "react-router-dom";
import { Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-4 text-center">
      <span className="text-6xl font-black text-indigo-600 mb-2">404</span>
      <h1 className="text-2xl font-black text-slate-900 mb-2">Page Not Found</h1>
      <p className="text-xs text-slate-500 max-w-sm mb-6">
        The page you are looking for does not exist or has been moved to another location.
      </p>
      <div className="flex gap-3">
        <Link
          to="/"
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-indigo-600 text-white font-bold text-xs rounded-xl"
        >
          <Home className="w-4 h-4" /> Go Home
        </Link>
        <button
          onClick={() => window.history.back()}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-slate-100 text-slate-700 font-bold text-xs rounded-xl"
        >
          <ArrowLeft className="w-4 h-4" /> Go Back
        </button>
      </div>
    </div>
  );
}