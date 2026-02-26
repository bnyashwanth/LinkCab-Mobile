"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  Shield,
  AlertTriangle,
  Users,
  Eye,
  Ban,
  AlertCircle,
  CheckCircle,
  XCircle,
  Search,
  Filter,
  MapPin,
  Phone,
  Mail,
  Calendar,
  TrendingUp,
  TrendingDown,
  Activity,
  Zap,
  UserX,
  MessageSquare,
  Flag,
  Clock,
  Star,
  ThumbsDown,
  ThumbsUp
} from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";

interface SafetyAlert {
  id: string;
  type: 'fake_profile' | 'suspicious_activity' | 'harassment' | 'spam' | 'unsafe_behavior';
  severity: 'low' | 'medium' | 'high' | 'critical';
  userId: string;
  userName: string;
  userEmail: string;
  description: string;
  timestamp: string;
  status: 'pending' | 'investigating' | 'resolved' | 'false_positive';
  riskScore: number;
  location?: string;
  tripId?: string;
}

interface UserRiskProfile {
  id: string;
  name: string;
  email: string;
  riskScore: number;
  verificationStatus: 'verified' | 'pending' | 'rejected';
  totalTrips: number;
  completedTrips: number;
  cancellationRate: number;
  averageRating: number;
  reportsCount: number;
  lastActive: string;
  flags: string[];
}

interface SafetyIncident {
  id: string;
  type: 'harassment' | 'no_show' | 'payment_dispute' | 'unsafe_behavior' | 'emergency';
  severity: 'low' | 'medium' | 'high' | 'critical';
  reporterId: string;
  reportedUserId: string;
  description: string;
  tripId?: string;
  timestamp: string;
  status: 'pending' | 'investigating' | 'resolved';
  resolution?: string;
}

export default function SafetyDashboard() {
  const [alerts, setAlerts] = useState<SafetyAlert[]>([]);
  const [userRisks, setUserRisks] = useState<UserRiskProfile[]>([]);
  const [incidents, setIncidents] = useState<SafetyIncident[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'alerts' | 'risks' | 'incidents'>('alerts');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSeverity, setSelectedSeverity] = useState<string>('all');

  // Demo data for development
  useEffect(() => {
    const demoAlerts: SafetyAlert[] = [
      {
        id: '1',
        type: 'fake_profile',
        severity: 'high',
        userId: 'user_123',
        userName: 'John Smith',
        userEmail: 'john.smith@email.com',
        description: 'Profile photos appear to be stock images. Phone number disconnected.',
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        status: 'investigating',
        riskScore: 85,
        location: 'Mumbai, Maharashtra'
      },
      {
        id: '2',
        type: 'suspicious_activity',
        severity: 'medium',
        userId: 'user_456',
        userName: 'Sarah Johnson',
        userEmail: 'sarah.j@email.com',
        description: 'User sending 50+ connection requests per hour. Possible spam behavior.',
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        riskScore: 72,
        tripId: 'trip_789'
      },
      {
        id: '3',
        type: 'harassment',
        severity: 'critical',
        userId: 'user_789',
        userName: 'Mike Wilson',
        userEmail: 'mike.w@email.com',
        description: 'Multiple reports of inappropriate messages in chat. Emergency action required.',
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        status: 'investigating',
        riskScore: 95,
        location: 'Bangalore, Karnataka'
      },
      {
        id: '4',
        type: 'spam',
        severity: 'low',
        userId: 'user_101',
        userName: 'Lisa Chen',
        userEmail: 'lisa.c@email.com',
        description: 'Posting duplicate announcements to same destination.',
        timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        status: 'pending',
        riskScore: 45
      }
    ];

    const demoUserRisks: UserRiskProfile[] = [
      {
        id: 'user_123',
        name: 'John Smith',
        email: 'john.smith@email.com',
        riskScore: 85,
        verificationStatus: 'pending',
        totalTrips: 12,
        completedTrips: 3,
        cancellationRate: 75,
        averageRating: 2.1,
        reportsCount: 3,
        lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString(),
        flags: ['high_cancellation', 'fake_profile_suspicion', 'low_rating']
      },
      {
        id: 'user_456',
        name: 'Sarah Johnson',
        email: 'sarah.j@email.com',
        riskScore: 72,
        verificationStatus: 'verified',
        totalTrips: 45,
        completedTrips: 38,
        cancellationRate: 15,
        averageRating: 3.8,
        reportsCount: 1,
        lastActive: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        flags: ['spam_behavior']
      },
      {
        id: 'user_789',
        name: 'Mike Wilson',
        email: 'mike.w@email.com',
        riskScore: 95,
        verificationStatus: 'verified',
        totalTrips: 28,
        completedTrips: 22,
        cancellationRate: 21,
        averageRating: 1.5,
        reportsCount: 7,
        lastActive: new Date(Date.now() - 15 * 60 * 1000).toISOString(),
        flags: ['harassment_reports', 'multiple_complaints', 'critical_risk']
      }
    ];

    const demoIncidents: SafetyIncident[] = [
      {
        id: 'inc_1',
        type: 'harassment',
        severity: 'critical',
        reporterId: 'user_200',
        reportedUserId: 'user_789',
        description: 'User sent inappropriate messages and made threats during trip planning.',
        tripId: 'trip_456',
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(),
        status: 'investigating'
      },
      {
        id: 'inc_2',
        type: 'no_show',
        severity: 'medium',
        reporterId: 'user_300',
        reportedUserId: 'user_123',
        description: 'Accepted connection request but disappeared before meeting.',
        tripId: 'trip_789',
        timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        status: 'resolved',
        resolution: 'User warned and account restricted'
      },
      {
        id: 'inc_3',
        type: 'payment_dispute',
        severity: 'low',
        reporterId: 'user_400',
        reportedUserId: 'user_456',
        description: 'Disagreement over cost sharing for taxi ride.',
        timestamp: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
        status: 'pending'
      }
    ];

    setAlerts(demoAlerts);
    setUserRisks(demoUserRisks);
    setIncidents(demoIncidents);
    setLoading(false);
  }, []);

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getRiskScoreColor = (score: number) => {
    if (score >= 80) return 'text-red-600';
    if (score >= 60) return 'text-orange-600';
    if (score >= 40) return 'text-yellow-600';
    return 'text-green-600';
  };

  const getAlertIcon = (type: string) => {
    switch (type) {
      case 'fake_profile': return <UserX className="h-4 w-4" />;
      case 'suspicious_activity': return <Activity className="h-4 w-4" />;
      case 'harassment': return <MessageSquare className="h-4 w-4" />;
      case 'spam': return <Flag className="h-4 w-4" />;
      case 'unsafe_behavior': return <AlertTriangle className="h-4 w-4" />;
      default: return <AlertCircle className="h-4 w-4" />;
    }
  };

  const handleBanUser = (userId: string) => {
    // In real app, this would call API to ban user
    alert(`User ${userId} would be banned. This requires API implementation.`);
  };

  const handleShadowBan = (userId: string) => {
    // In real app, this would call API to shadow ban user
    alert(`User ${userId} would be shadow banned. This requires API implementation.`);
  };

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="p-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
            <div className="h-96 bg-gray-200 rounded"></div>
          </div>
        </div>
      </ProtectedRoute>
    );
  }

  return (
    <ProtectedRoute>
      <div className="p-8">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-black flex items-center">
              <Shield className="h-8 w-8 mr-3 text-red-500" />
              Trust & Safety Control Panel
            </h1>
            <p className="text-gray-600 mt-2">Monitor and ensure platform safety for all users</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" className="border-red-500 text-red-500">
              <Zap className="h-4 w-4 mr-2" />
              Emergency Mode
            </Button>
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">
              <AlertCircle className="h-4 w-4 mr-2" />
              Generate Report
            </Button>
          </div>
        </div>

        {/* Safety Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-gray-200 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Critical Alerts</p>
                  <p className="text-2xl font-bold text-red-600">
                    {alerts.filter(a => a.severity === 'critical').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center">
                <TrendingUp className="h-8 w-8 text-orange-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">High Risk Users</p>
                  <p className="text-2xl font-bold text-orange-600">
                    {userRisks.filter(u => u.riskScore >= 70).length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Flag className="h-8 w-8 text-yellow-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pending Incidents</p>
                  <p className="text-2xl font-bold text-yellow-600">
                    {incidents.filter(i => i.status === 'pending').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center">
                <CheckCircle className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Resolved Today</p>
                  <p className="text-2xl font-bold text-green-600">12</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('alerts')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'alerts'
                  ? 'border-yellow-400 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Safety Alerts ({alerts.length})
            </button>
            <button
              onClick={() => setActiveTab('risks')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'risks'
                  ? 'border-yellow-400 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Risk Profiles ({userRisks.length})
            </button>
            <button
              onClick={() => setActiveTab('incidents')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'incidents'
                  ? 'border-yellow-400 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Incidents ({incidents.length})
            </button>
          </nav>
        </div>

        {/* Safety Alerts Tab */}
        {activeTab === 'alerts' && (
          <Card className="border-gray-200 shadow-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-black">Safety Alerts</CardTitle>
                <div className="flex space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search alerts..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={selectedSeverity} onValueChange={setSelectedSeverity}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Severity" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Severities</SelectItem>
                      <SelectItem value="critical">Critical</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {alerts.map((alert) => (
                  <div key={alert.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex items-start space-x-4">
                        <div className={`p-2 rounded-full ${alert.severity === 'critical' ? 'bg-red-100' :
                            alert.severity === 'high' ? 'bg-orange-100' :
                              alert.severity === 'medium' ? 'bg-yellow-100' :
                                'bg-blue-100'
                          }`}>
                          {getAlertIcon(alert.type)}
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h3 className="font-semibold text-black">{alert.userName}</h3>
                            <Badge variant="secondary" className={getSeverityColor(alert.severity)}>
                              {alert.severity.toUpperCase()}
                            </Badge>
                            <Badge variant="outline" className="text-gray-600">
                              Risk Score: <span className={getRiskScoreColor(alert.riskScore)}>{alert.riskScore}</span>
                            </Badge>
                          </div>
                          <p className="text-gray-700 mb-2">{alert.description}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <span className="flex items-center">
                              <Mail className="h-3 w-3 mr-1" />
                              {alert.userEmail}
                            </span>
                            {alert.location && (
                              <span className="flex items-center">
                                <MapPin className="h-3 w-3 mr-1" />
                                {alert.location}
                              </span>
                            )}
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              {new Date(alert.timestamp).toLocaleString()}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Review
                        </Button>
                        <Button variant="outline" size="sm" className="text-orange-600">
                          <AlertTriangle className="h-4 w-4 mr-1" />
                          Investigate
                        </Button>
                        <Button variant="outline" size="sm" className="text-red-600">
                          <Ban className="h-4 w-4 mr-1" />
                          Ban
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Risk Profiles Tab */}
        {activeTab === 'risks' && (
          <Card className="border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-black">User Risk Profiles</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-black">User</TableHead>
                    <TableHead className="text-black">Risk Score</TableHead>
                    <TableHead className="text-black">Verification</TableHead>
                    <TableHead className="text-black">Trip Stats</TableHead>
                    <TableHead className="text-black">Rating</TableHead>
                    <TableHead className="text-black">Reports</TableHead>
                    <TableHead className="text-black">Flags</TableHead>
                    <TableHead className="text-black">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {userRisks.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-black">{user.name}</p>
                          <p className="text-sm text-gray-600">{user.email}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <span className={`font-bold ${getRiskScoreColor(user.riskScore)}`}>
                            {user.riskScore}
                          </span>
                          {user.riskScore >= 80 && <AlertTriangle className="h-4 w-4 text-red-500 ml-2" />}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={
                          user.verificationStatus === 'verified' ? 'bg-green-100 text-green-800' :
                            user.verificationStatus === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                              'bg-red-100 text-red-800'
                        }>
                          {user.verificationStatus}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {user.completedTrips}/{user.totalTrips} ({Math.round((1 - user.cancellationRate / 100) * 100)}%)
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center">
                          <Star className="h-4 w-4 text-yellow-500 mr-1" />
                          <span className="text-gray-700">{user.averageRating.toFixed(1)}</span>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700">{user.reportsCount}</TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.flags.map((flag, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {flag.replace('_', ' ')}
                            </Badge>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-orange-600">
                            <AlertTriangle className="h-4 w-4" />
                          </Button>
                          <Button variant="outline" size="sm" className="text-red-600">
                            <Ban className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Incidents Tab */}
        {activeTab === 'incidents' && (
          <Card className="border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-black">Safety Incidents</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {incidents.map((incident) => (
                  <div key={incident.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-3 mb-2">
                          <h3 className="font-semibold text-black capitalize">
                            {incident.type.replace('_', ' ')}
                          </h3>
                          <Badge variant="secondary" className={getSeverityColor(incident.severity)}>
                            {incident.severity.toUpperCase()}
                          </Badge>
                          <Badge variant="outline" className={
                            incident.status === 'resolved' ? 'bg-green-100 text-green-800' :
                              incident.status === 'investigating' ? 'bg-yellow-100 text-yellow-800' :
                                'bg-gray-100 text-gray-800'
                          }>
                            {incident.status}
                          </Badge>
                        </div>
                        <p className="text-gray-700 mb-2">{incident.description}</p>
                        {incident.resolution && (
                          <div className="bg-green-50 border border-green-200 rounded p-2 mb-2">
                            <p className="text-sm text-green-800">
                              <strong>Resolution:</strong> {incident.resolution}
                            </p>
                          </div>
                        )}
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span className="flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(incident.timestamp).toLocaleString()}
                          </span>
                          {incident.tripId && (
                            <span className="flex items-center">
                              <MapPin className="h-3 w-3 mr-1" />
                              Trip ID: {incident.tripId}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button variant="outline" size="sm">
                          <Eye className="h-4 w-4 mr-1" />
                          Details
                        </Button>
                        {incident.status === 'pending' && (
                          <Button variant="outline" size="sm" className="text-yellow-600">
                            <AlertTriangle className="h-4 w-4 mr-1" />
                            Investigate
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}
