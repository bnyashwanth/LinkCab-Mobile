"use client";

import { useDatabaseHealth } from "@/lib/database-hooks";

export function DatabaseErrorBoundary({ children }: { children: React.ReactNode }) {
  const { isHealthy, lastError } = useDatabaseHealth();

  if (!isHealthy) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <div className="max-w-md w-full">
          <div className="bg-white border border-gray-200 rounded-xl shadow-lg p-6 text-center">
            <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.314 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Service Temporarily Unavailable</h2>
            <p className="text-gray-600 mb-4">
              We are experiencing technical difficulties with our database. Please try again in a few moments.
            </p>
            {lastError && (
              <p className="text-sm text-gray-500 mb-4">
                Error: {lastError}
              </p>
            )}
            <button
              onClick={() => window.location.reload()}
              className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium px-4 py-2 rounded-lg transition-colors"
            >
              Try Again
            </button>
          </div>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
