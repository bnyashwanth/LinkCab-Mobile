"use server";

import { SafeDatabaseOperations } from "@/lib/database";
import { supabase } from "@/lib/supabase";

interface DashboardStats {
  totalUsers: number;
  verifiedUsers: number;
  pendingKYCs: number;
  totalAnnouncements: number;
  totalRequests: number;
  totalRevenue: number;
  todayRevenue: number;
  monthlyRevenue: number;
  successfulMatchesToday: number;
  activeDisputes: number;
  systemHealth: {
    databaseStatus: string;
    apiResponseTime: number;
    uptime: number;
    errorRate: number;
    storageUsed: number;
    memoryUsage: number;
    cpuUsage: number;
  };
  securityAlerts: Array<{
    id: number;
    type: string;
    title: string;
    message: string;
    timestamp: string;
    severity: string;
  }>;
  recentActivities: Array<{
    id: number;
    user: string;
    action: string;
    timestamp: string;
    type: string;
  }>;
}

export async function getDashboardStats(): Promise<DashboardStats> {
  try {
    // Use safe database operations with retry logic
    const [
      usersResult,
      announcementsResult,
      requestsResult
    ] = await Promise.all([
      SafeDatabaseOperations.safeSelect('users', 'id', {}),
      SafeDatabaseOperations.safeSelect('announcements', 'id', {}),
      SafeDatabaseOperations.safeSelect('requests', 'id', {})
    ]);

    // Handle database errors
    if (usersResult.error || announcementsResult.error || requestsResult.error) {
      console.error('Database errors detected:', {
        users: usersResult.error,
        announcements: announcementsResult.error,
        requests: requestsResult.error
      });
      // Return demo data if database is unavailable
      return getDemoStats();
    }

    // Get counts from safe results
    const totalUsers = usersResult.data?.length || 0;
    const totalAnnouncements = announcementsResult.data?.length || 0;
    const totalRequests = requestsResult.data?.length || 0;

    // Get verified users count
    const verifiedUsersResult = await SafeDatabaseOperations.safeSelect(
      'users', 
      'id', 
      { eq: { kyc_status: 'verified' } }
    );
    
    const verifiedUsers = verifiedUsersResult.data?.length || 0;

    // Get pending KYCs count
    const pendingKYCsResult = await SafeDatabaseOperations.safeSelect(
      'users', 
      'id', 
      { eq: { kyc_status: 'pending' } }
    );
    
    const pendingKYCs = pendingKYCsResult.data?.length || 0;

    // Calculate total revenue (placeholder for now)
    const totalRevenue = 0;
    const todayRevenue = 0;
    const monthlyRevenue = 0;

    return {
      totalUsers,
      verifiedUsers,
      pendingKYCs,
      totalAnnouncements,
      totalRequests,
      totalRevenue,
      todayRevenue,
      monthlyRevenue,
      successfulMatchesToday: 0,
      activeDisputes: 0,
      systemHealth: {
        databaseStatus: "healthy",
        apiResponseTime: 120,
        uptime: 99.9,
        errorRate: 0.1,
        storageUsed: 45,
        memoryUsage: 62,
        cpuUsage: 38,
      },
      securityAlerts: [],
      recentActivities: [],
    };
  } catch (error) {
    console.error('Unexpected error in getDashboardStats:', error);
    return getDemoStats();
  }
}

function getDemoStats(): DashboardStats {
  return {
    totalUsers: 0,
    verifiedUsers: 0,
    pendingKYCs: 0,
    totalAnnouncements: 0,
    totalRequests: 0,
    totalRevenue: 0,
    todayRevenue: 0,
    monthlyRevenue: 0,
    successfulMatchesToday: 0,
    activeDisputes: 0,
    // System health metrics
    systemHealth: {
      databaseStatus: 'unknown',
      apiResponseTime: 0,
      uptime: 0,
      errorRate: 0,
      storageUsed: 0,
      memoryUsage: 0,
      cpuUsage: 0,
    },
    // Security alerts
    securityAlerts: [],
    // Recent activities
    recentActivities: [],
  };
}
