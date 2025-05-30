"use client";

import { CloudIcon } from "lucide-react";

export function LoadingSpinner({ className = "" }: { className?: string }) {
  return (
    <div className={`flex items-center justify-center p-4 ${className}`}>
      <div className="animate-spin h-6 w-6 border-2 border-blue-500 rounded-full border-t-transparent"></div>
    </div>
  );
}

export function AuthLoadingState() {
  return (
    <div className="fixed inset-0 bg-black/10 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg w-[300px]">
        <div className="flex flex-col items-center gap-4">
          <CloudIcon className="h-12 w-12 text-blue-500 animate-pulse" />
          <p className="text-sm text-center text-gray-600">
            Authenticating... Please wait a moment.
          </p>
          <LoadingSpinner />
        </div>
      </div>
    </div>
  );
}
