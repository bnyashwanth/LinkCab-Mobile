import { supabase } from "./supabase";

// Database health check
export async function checkDatabaseHealth(): Promise<{ healthy: boolean; error?: string }> {
  try {
    const { error } = await supabase.from('users').select('id').limit(1);
    if (error) {
      return { healthy: false, error: error.message };
    }
    return { healthy: true };
  } catch (error) {
    return { healthy: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

// Retry logic for database operations
export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delay: number = 1000
): Promise<T> {
  let lastError: any;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error;
      
      // Log the error with attempt number
      console.error(`Database operation failed (attempt ${attempt}/${maxRetries}):`, error);
      
      // If it's the last attempt, throw the error
      if (attempt === maxRetries) {
        throw lastError;
      }
      
      // Wait before retrying (exponential backoff)
      const backoffDelay = delay * Math.pow(2, attempt - 1);
      await new Promise(resolve => setTimeout(resolve, backoffDelay));
    }
  }
  
  throw lastError;
}

// Safe database operations with error handling
export class SafeDatabaseOperations {
  private static isHealthy: boolean = true;
  private static lastHealthCheck: number = 0;
  private static healthCheckInterval: number = 30000; // 30 seconds

  // Check if database is healthy (cached)
  private static async isDatabaseHealthy(): Promise<boolean> {
    const now = Date.now();
    
    // Use cached result if recent
    if (now - this.lastHealthCheck < this.healthCheckInterval && this.isHealthy) {
      return this.isHealthy;
    }
    
    const health = await checkDatabaseHealth();
    this.isHealthy = health.healthy;
    this.lastHealthCheck = now;
    
    if (!health.healthy) {
      console.error('Database health check failed:', health.error);
    }
    
    return this.isHealthy;
  }

  // Safe select operation
  static async safeSelect<T>(
    table: string,
    columns: string = '*',
    filters?: any
  ): Promise<{ data: T[] | null; error: string | null }> {
    try {
      const isHealthy = await this.isDatabaseHealthy();
      if (!isHealthy) {
        return { data: null, error: 'Database temporarily unavailable' };
      }

      let query = supabase.from(table).select(columns);
      
      if (filters) {
        if (filters.eq) {
          Object.entries(filters.eq).forEach(([key, value]) => {
            query = query.eq(key, value as any);
          });
        }
        if (filters.order) {
          query = query.order(filters.order.column, { ascending: filters.order.ascending });
        }
        if (filters.limit) {
          query = query.limit(filters.limit);
        }
      }

      const { data, error } = await withRetry(() => query);
      
      if (error) {
        console.error(`Select operation failed on table ${table}:`, error);
        return { data: null, error: error.message };
      }
      
      return { data, error: null };
    } catch (error) {
      console.error(`Unexpected error in select operation on table ${table}:`, error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Safe insert operation (disabled if database is unhealthy)
  static async safeInsert<T>(
    table: string,
    data: any
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      const isHealthy = await this.isDatabaseHealthy();
      if (!isHealthy) {
        return { data: null, error: 'Service temporarily unavailable. Write operations disabled.' };
      }

      const { data: result, error } = await withRetry(() => 
        supabase.from(table).insert(data).select().single()
      );
      
      if (error) {
        console.error(`Insert operation failed on table ${table}:`, error);
        return { data: null, error: error.message };
      }
      
      return { data: result, error: null };
    } catch (error) {
      console.error(`Unexpected error in insert operation on table ${table}:`, error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Safe update operation (disabled if database is unhealthy)
  static async safeUpdate<T>(
    table: string,
    data: any,
    filters: { eq: Record<string, any> }
  ): Promise<{ data: T | null; error: string | null }> {
    try {
      const isHealthy = await this.isDatabaseHealthy();
      if (!isHealthy) {
        return { data: null, error: 'Service temporarily unavailable. Write operations disabled.' };
      }

      let query = supabase.from(table).update(data);
      
      if (filters.eq) {
        Object.entries(filters.eq).forEach(([key, value]) => {
          query = query.eq(key, value as any);
        });
      }

      const { data: result, error } = await withRetry(() => query.select().single());
      
      if (error) {
        console.error(`Update operation failed on table ${table}:`, error);
        return { data: null, error: error.message };
      }
      
      return { data: result, error: null };
    } catch (error) {
      console.error(`Unexpected error in update operation on table ${table}:`, error);
      return { data: null, error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Safe delete operation (disabled if database is unhealthy)
  static async safeDelete(
    table: string,
    filters: { eq: Record<string, any> }
  ): Promise<{ error: string | null }> {
    try {
      const isHealthy = await this.isDatabaseHealthy();
      if (!isHealthy) {
        return { error: 'Service temporarily unavailable. Write operations disabled.' };
      }

      let query = supabase.from(table).delete();
      
      if (filters.eq) {
        Object.entries(filters.eq).forEach(([key, value]) => {
          query = query.eq(key, value as any);
        });
      }

      const { error } = await withRetry(() => query);
      
      if (error) {
        console.error(`Delete operation failed on table ${table}:`, error);
        return { error: error.message };
      }
      
      return { error: null };
    } catch (error) {
      console.error(`Unexpected error in delete operation on table ${table}:`, error);
      return { error: error instanceof Error ? error.message : 'Unknown error' };
    }
  }

  // Force health check refresh
  static async refreshHealthCheck(): Promise<{ healthy: boolean; error?: string }> {
    this.lastHealthCheck = 0; // Force new check
    const health = await checkDatabaseHealth();
    this.isHealthy = health.healthy;
    this.lastHealthCheck = Date.now();
    return health;
  }
}
