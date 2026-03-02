"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Users,
  UserCheck,
  Receipt,
  AlertCircle,
  Megaphone,
  Handshake,
  Server,
  Activity,
  Shield,
  Clock,
  Database,
  HardDrive,
  Cpu,
  AlertTriangle,
  Info,
  XCircle,
  CheckCircle
} from "lucide-react";
import { getDashboardStats } from "./actions";
import { ProtectedRoute } from "@/components/protected-route";
import { AdminSidebar } from "@/components/admin-sidebar";

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

export default function Dashboard() {
  const [stats, setStats] = useState<DashboardStats>({
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
    systemHealth: {
      databaseStatus: 'unknown',
      apiResponseTime: 0,
      uptime: 0,
      errorRate: 0,
      storageUsed: 0,
      memoryUsage: 0,
      cpuUsage: 0,
    },
    securityAlerts: [],
    recentActivities: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardStats = async () => {
      try {
        const stats = await getDashboardStats();
        setStats(stats);
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardStats();
  }, []);

  const statCards = [
    {
      title: "Total Users",
      value: stats.totalUsers,
      icon: Users,
      description: "Registered users on platform",
    },
    {
      title: "Verified Users",
      value: stats.verifiedUsers,
      icon: UserCheck,
      description: "KYC verified users",
    },
    {
      title: "Pending KYCs",
      value: stats.pendingKYCs,
      icon: AlertCircle,
      description: "Users awaiting verification",
    },
    {
      title: "Active Announcements",
      value: stats.totalAnnouncements,
      icon: Megaphone,
      description: "Travel announcements posted",
    },
    {
      title: "Connection Requests",
      value: stats.totalRequests,
      icon: Handshake,
      description: "Total connection requests made",
    },
    {
      title: "Successful Matches Today",
      value: stats.successfulMatchesToday,
      icon: CheckCircle,
      description: "Connections made today",
    },
    {
      title: "Today's Revenue",
      value: `₹${stats.todayRevenue.toLocaleString()}`,
      icon: Receipt,
      description: "₹1 connection fees collected today",
    },
    {
      title: "Monthly Revenue",
      value: `₹${stats.monthlyRevenue.toLocaleString()}`,
      icon: Receipt,
      description: "Total revenue this month",
    },
  ];

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="min-h-screen bg-gray-50">
      <main className="flex-1 p-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-black mb-2">Dashboard</h1>
          <p className="text-gray-600">Welcome back! Here's what's happening with LinkCab today.</p>
        </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            {statCards.map((stat, index) => (
              <div key={index} className="stat-card">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium text-gray-600">
                    {stat.title}
                  </CardTitle>
                  <stat.icon className="h-4 w-4 text-yellow-500" />
                </CardHeader>
                <CardContent>
                  <div className="stat-value">{stat.value}</div>
                  <p className="stat-label">{stat.description}</p>
                </CardContent>
              </div>
            ))}
          </div>

          {/* System Health & Recent Activity */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* System Health */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Activity className="h-5 w-5 mr-2 text-yellow-500" />
                  System Health
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Database Status</span>
                    <Badge className="bg-green-100 text-green-800">Online</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">API Response Time</span>
                    <span className="text-sm font-medium">{stats.systemHealth.apiResponseTime}ms</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Uptime</span>
                    <span className="text-sm font-medium">{stats.systemHealth.uptime}%</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Error Rate</span>
                    <span className="text-sm font-medium">{stats.systemHealth.errorRate}%</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Activity */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Clock className="h-5 w-5 mr-2 text-yellow-500" />
                  Recent Activity
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {stats.recentActivities.length === 0 ? (
                    <p className="text-gray-500 text-sm">No recent activity</p>
                  ) : (
                    stats.recentActivities.map((activity) => (
                      <div key={activity.id} className="flex items-center space-x-3 text-sm">
                        <div className="w-2 h-2 bg-yellow-400 rounded-full"></div>
                        <div>
                          <p className="font-medium text-black">{activity.user}</p>
                          <p className="text-gray-500">{activity.action}</p>
                        </div>
                        <span className="text-gray-400 text-xs ml-auto">
                          {new Date(activity.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        </main>
      </div>
    </ProtectedRoute>
  );
}
