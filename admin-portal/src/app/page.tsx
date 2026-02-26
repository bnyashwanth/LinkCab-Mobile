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

interface DashboardStats {
  totalUsers: number;
  verifiedUsers: number;
  pendingKYCs: number;
  totalAnnouncements: number;
  totalRequests: number;
  totalRevenue: number;
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
      title: "Platform Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      icon: Receipt,
      description: "₹1 connection fees collected",
    },
  ];

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <ProtectedRoute>
      <div className="p-8">
        <h1 className="text-3xl font-bold text-black mb-8">Dashboard</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {statCards.map((stat) => (
            <Card key={stat.title} className="border-gray-200 shadow-md">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium text-gray-700">
                  {stat.title}
                </CardTitle>
                <stat.icon className="h-4 w-4 text-yellow-500" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-black">{stat.value}</div>
                <p className="text-xs text-gray-500 mt-1">{stat.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* System Health */}
          <Card className="border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-black flex items-center">
                <Server className="h-5 w-5 mr-2 text-green-500" />
                System Health
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center space-x-2">
                  <Database className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-700">Database</span>
                  <Badge variant="secondary" className="bg-green-100 text-green-800">
                    {stats.systemHealth.databaseStatus}
                  </Badge>
                </div>
                <div className="flex items-center space-x-2">
                  <Activity className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-700">API</span>
                  <span className="text-sm font-medium text-black">{stats.systemHealth.apiResponseTime}ms</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Clock className="h-4 w-4 text-green-500" />
                  <span className="text-sm text-gray-700">Uptime</span>
                  <span className="text-sm font-medium text-black">{stats.systemHealth.uptime}%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <AlertTriangle className="h-4 w-4 text-yellow-500" />
                  <span className="text-sm text-gray-700">Error Rate</span>
                  <span className="text-sm font-medium text-black">{stats.systemHealth.errorRate}%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <HardDrive className="h-4 w-4 text-blue-500" />
                  <span className="text-sm text-gray-700">Storage</span>
                  <span className="text-sm font-medium text-black">{stats.systemHealth.storageUsed}%</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Cpu className="h-4 w-4 text-orange-500" />
                  <span className="text-sm text-gray-700">CPU</span>
                  <span className="text-sm font-medium text-black">{stats.systemHealth.cpuUsage}%</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Security Alerts */}
          <Card className="border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-black flex items-center">
                <Shield className="h-5 w-5 mr-2 text-red-500" />
                Security Alerts
                <Badge variant="secondary" className="ml-2 bg-red-100 text-red-800">
                  {stats.securityAlerts.length}
                </Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.securityAlerts.slice(0, 3).map((alert) => (
                  <div key={alert.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                    {alert.type === 'error' && <XCircle className="h-4 w-4 text-red-500 mt-0.5" />}
                    {alert.type === 'warning' && <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />}
                    {alert.type === 'info' && <Info className="h-4 w-4 text-blue-500 mt-0.5" />}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-black">{alert.title}</p>
                      <p className="text-xs text-gray-600 mt-1">{alert.message}</p>
                      <p className="text-xs text-gray-500 mt-1">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                    <Badge
                      variant="secondary"
                      className={`${alert.severity === 'high' ? 'bg-red-100 text-red-800' :
                          alert.severity === 'medium' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-blue-100 text-blue-800'
                        }`}
                    >
                      {alert.severity}
                    </Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Recent Activities */}
        <div className="mt-8">
          <Card className="border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-black">Recent Activities</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {stats.recentActivities.map((activity) => (
                  <div key={activity.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center space-x-3">
                      {activity.type === 'kyc' && <UserCheck className="h-4 w-4 text-green-500" />}
                      {activity.type === 'system' && <Server className="h-4 w-4 text-blue-500" />}
                      {activity.type === 'config' && <AlertCircle className="h-4 w-4 text-yellow-500" />}
                      <div>
                        <p className="text-sm font-medium text-black">{activity.action}</p>
                        <p className="text-xs text-gray-600">by {activity.user}</p>
                      </div>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(activity.timestamp).toLocaleString()}
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </ProtectedRoute>
  );
}
