"use client";

import { useState, useEffect } from "react";
import { checkDatabaseHealth, SafeDatabaseOperations } from "./database";

// React hook for database health status
export function useDatabaseHealth() {
  const [isHealthy, setIsHealthy] = useState(true);
  const [lastError, setLastError] = useState<string | null>(null);

  useEffect(() => {
    const checkHealth = async () => {
      const health = await SafeDatabaseOperations.refreshHealthCheck();
      setIsHealthy(health.healthy);
      setLastError(health.error || null);
    };

    // Check immediately
    checkHealth();

    // Set up periodic health checks
    const interval = setInterval(checkHealth, 30000); // Every 30 seconds

    return () => clearInterval(interval);
  }, []);

  return { isHealthy, lastError, refreshHealth: () => SafeDatabaseOperations.refreshHealthCheck() };
}
