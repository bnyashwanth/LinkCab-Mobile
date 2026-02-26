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
  Megaphone,
  MapPin,
  Calendar,
  Users,
  AlertTriangle,
  Eye,
  X,
  Check,
  Search,
  Filter,
  TrendingUp,
  Clock,
  Route,
  AlertCircle,
  Ban,
  Activity,
  Map,
  Navigation
} from "lucide-react";
import { ProtectedRoute } from "@/components/protected-route";

interface TravelAnnouncement {
  id: string;
  userId: string;
  userName: string;
  userEmail: string;
  pickupAddress: string;
  dropoffAddress: string;
  route: string;
  travelDate: string;
  travelTime: string;
  availableSeats: number;
  requestedSeats: number;
  status: 'active' | 'cancelled' | 'completed' | 'suspended';
  createdAt: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  pricePerPerson?: number;
  transportMode: 'cab' | 'auto' | 'bus' | 'train' | 'any';
  preferences: string[];
  duplicateCount?: number;
  reportsCount?: number;
  connectionRequests: number;
  lastActive: string;
}

interface RouteAnalytics {
  route: string;
  totalAnnouncements: number;
  activeAnnouncements: number;
  completedTrips: number;
  averagePrice: number;
  riskLevel: 'low' | 'medium' | 'high';
  popularTimes: string[];
}

export default function AnnouncementManagement() {
  const [announcements, setAnnouncements] = useState<TravelAnnouncement[]>([]);
  const [routeAnalytics, setRouteAnalytics] = useState<RouteAnalytics[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<string>('all');
  const [selectedRisk, setSelectedRisk] = useState<string>('all');
  const [activeTab, setActiveTab] = useState<'announcements' | 'analytics' | 'heatmap'>('announcements');

  // Demo data for development
  useEffect(() => {
    const demoAnnouncements: TravelAnnouncement[] = [
      {
        id: 'ann_1',
        userId: 'user_123',
        userName: 'John Smith',
        userEmail: 'john.smith@email.com',
        pickupAddress: 'MG Road, Bangalore',
        dropoffAddress: 'Electronic City, Bangalore',
        route: 'Bangalore - Electronic City',
        travelDate: '2024-02-26',
        travelTime: '09:00 AM',
        availableSeats: 3,
        requestedSeats: 2,
        status: 'active',
        createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
        riskLevel: 'low',
        pricePerPerson: 150,
        transportMode: 'cab',
        preferences: ['AC', 'Music'],
        connectionRequests: 5,
        lastActive: new Date(Date.now() - 30 * 60 * 1000).toISOString()
      },
      {
        id: 'ann_2',
        userId: 'user_456',
        userName: 'Sarah Johnson',
        userEmail: 'sarah.j@email.com',
        pickupAddress: 'Koramangala, Bangalore',
        dropoffAddress: 'Whitefield, Bangalore',
        route: 'Bangalore - Whitefield',
        travelDate: '2024-02-26',
        travelTime: '08:30 AM',
        availableSeats: 2,
        requestedSeats: 1,
        status: 'suspended',
        createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
        riskLevel: 'high',
        pricePerPerson: 200,
        transportMode: 'auto',
        preferences: ['Fast'],
        duplicateCount: 3,
        reportsCount: 2,
        connectionRequests: 8,
        lastActive: new Date(Date.now() - 15 * 60 * 1000).toISOString()
      },
      {
        id: 'ann_3',
        userId: 'user_789',
        userName: 'Mike Wilson',
        userEmail: 'mike.w@email.com',
        pickupAddress: 'Indiranagar, Bangalore',
        dropoffAddress: 'Airport Road, Bangalore',
        route: 'Bangalore - Airport',
        travelDate: '2024-02-25',
        travelTime: '06:00 PM',
        availableSeats: 4,
        requestedSeats: 0,
        status: 'cancelled',
        createdAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
        riskLevel: 'medium',
        pricePerPerson: 300,
        transportMode: 'cab',
        preferences: ['Luggage Space'],
        connectionRequests: 3,
        lastActive: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString()
      },
      {
        id: 'ann_4',
        userId: 'user_101',
        userName: 'Lisa Chen',
        userEmail: 'lisa.c@email.com',
        pickupAddress: 'HSR Layout, Bangalore',
        dropoffAddress: 'Marathahalli, Bangalore',
        route: 'Bangalore - Marathahalli',
        travelDate: '2024-02-27',
        travelTime: '07:00 PM',
        availableSeats: 2,
        requestedSeats: 1,
        status: 'active',
        createdAt: new Date(Date.now() - 1 * 60 * 60 * 1000).toISOString(),
        riskLevel: 'critical',
        pricePerPerson: 120,
        transportMode: 'any',
        preferences: ['Female Only'],
        reportsCount: 1,
        connectionRequests: 2,
        lastActive: new Date(Date.now() - 45 * 60 * 1000).toISOString()
      }
    ];

    const demoRouteAnalytics: RouteAnalytics[] = [
      {
        route: 'Bangalore - Electronic City',
        totalAnnouncements: 45,
        activeAnnouncements: 12,
        completedTrips: 28,
        averagePrice: 165,
        riskLevel: 'low',
        popularTimes: ['08:00 AM', '09:00 AM', '06:00 PM']
      },
      {
        route: 'Bangalore - Whitefield',
        totalAnnouncements: 38,
        activeAnnouncements: 8,
        completedTrips: 25,
        averagePrice: 185,
        riskLevel: 'medium',
        popularTimes: ['08:30 AM', '09:30 AM', '05:30 PM']
      },
      {
        route: 'Bangalore - Airport',
        totalAnnouncements: 67,
        activeAnnouncements: 15,
        completedTrips: 42,
        averagePrice: 295,
        riskLevel: 'high',
        popularTimes: ['06:00 AM', '07:00 AM', '10:00 PM', '11:00 PM']
      },
      {
        route: 'Bangalore - Marathahalli',
        totalAnnouncements: 23,
        activeAnnouncements: 6,
        completedTrips: 15,
        averagePrice: 135,
        riskLevel: 'medium',
        popularTimes: ['07:00 AM', '08:00 AM', '06:00 PM', '07:00 PM']
      }
    ];

    setAnnouncements(demoAnnouncements);
    setRouteAnalytics(demoRouteAnalytics);
    setLoading(false);
  }, []);

  const getRiskColor = (risk: string) => {
    switch (risk) {
      case 'critical': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return 'bg-green-100 text-green-800';
      case 'suspended': return 'bg-orange-100 text-orange-800';
      case 'cancelled': return 'bg-red-100 text-red-800';
      case 'completed': return 'bg-blue-100 text-blue-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getTransportIcon = (mode: string) => {
    switch (mode) {
      case 'cab': return '🚗';
      case 'auto': return '🛺';
      case 'bus': return '🚌';
      case 'train': return '🚆';
      default: return '🚶';
    }
  };

  const handleCancelAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.map(ann =>
      ann.id === id ? { ...ann, status: 'cancelled' as const } : ann
    ));
  };

  const handleSuspendAnnouncement = (id: string) => {
    setAnnouncements(prev => prev.map(ann =>
      ann.id === id ? { ...ann, status: 'suspended' as const } : ann
    ));
  };

  const filteredAnnouncements = announcements.filter(ann => {
    const matchesSearch = ann.route.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ann.userName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ann.pickupAddress.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ann.dropoffAddress.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || ann.status === selectedStatus;
    const matchesRisk = selectedRisk === 'all' || ann.riskLevel === selectedRisk;

    return matchesSearch && matchesStatus && matchesRisk;
  });

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
              <Megaphone className="h-8 w-8 mr-3 text-blue-500" />
              Travel Announcement Management
            </h1>
            <p className="text-gray-600 mt-2">Monitor and manage all travel announcements on the platform</p>
          </div>
          <div className="flex space-x-3">
            <Button variant="outline" className="border-orange-500 text-orange-500">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Detect Spam
            </Button>
            <Button className="bg-yellow-400 hover:bg-yellow-500 text-black">
              <Activity className="h-4 w-4 mr-2" />
              View Heatmap
            </Button>
          </div>
        </div>

        {/* Stats Overview */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="border-gray-200 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Megaphone className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active Trips</p>
                  <p className="text-2xl font-bold text-black">
                    {announcements.filter(a => a.status === 'active').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center">
                <AlertTriangle className="h-8 w-8 text-red-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">High Risk</p>
                  <p className="text-2xl font-bold text-red-600">
                    {announcements.filter(a => a.riskLevel === 'high' || a.riskLevel === 'critical').length}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Route className="h-8 w-8 text-green-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Routes</p>
                  <p className="text-2xl font-bold text-black">{routeAnalytics.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-gray-200 shadow-md">
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-purple-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Requests</p>
                  <p className="text-2xl font-bold text-black">
                    {announcements.reduce((sum, ann) => sum + ann.connectionRequests, 0)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="border-b border-gray-200 mb-6">
          <nav className="flex space-x-8">
            <button
              onClick={() => setActiveTab('announcements')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'announcements'
                  ? 'border-yellow-400 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Announcements ({announcements.length})
            </button>
            <button
              onClick={() => setActiveTab('analytics')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'analytics'
                  ? 'border-yellow-400 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Route Analytics ({routeAnalytics.length})
            </button>
            <button
              onClick={() => setActiveTab('heatmap')}
              className={`py-2 px-1 border-b-2 font-medium text-sm ${activeTab === 'heatmap'
                  ? 'border-yellow-400 text-yellow-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
            >
              Activity Heatmap
            </button>
          </nav>
        </div>

        {/* Announcements Tab */}
        {activeTab === 'announcements' && (
          <Card className="border-gray-200 shadow-md">
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle className="text-black">Travel Announcements</CardTitle>
                <div className="flex space-x-3">
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search announcements..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={selectedStatus} onValueChange={setSelectedStatus}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="cancelled">Cancelled</SelectItem>
                      <SelectItem value="completed">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={selectedRisk} onValueChange={setSelectedRisk}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Risk Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Risks</SelectItem>
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-black">Route</TableHead>
                    <TableHead className="text-black">User</TableHead>
                    <TableHead className="text-black">Schedule</TableHead>
                    <TableHead className="text-black">Seats</TableHead>
                    <TableHead className="text-black">Price</TableHead>
                    <TableHead className="text-black">Risk</TableHead>
                    <TableHead className="text-black">Requests</TableHead>
                    <TableHead className="text-black">Status</TableHead>
                    <TableHead className="text-black">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAnnouncements.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell>
                        <div>
                          <p className="font-medium text-black">{announcement.route}</p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <MapPin className="h-3 w-3 mr-1" />
                            {announcement.pickupAddress} → {announcement.dropoffAddress}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="font-medium text-black">{announcement.userName}</p>
                          <p className="text-sm text-gray-600">{announcement.userEmail}</p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div>
                          <p className="text-gray-700 flex items-center">
                            <Calendar className="h-3 w-3 mr-1" />
                            {new Date(announcement.travelDate).toLocaleDateString()}
                          </p>
                          <p className="text-sm text-gray-600 flex items-center">
                            <Clock className="h-3 w-3 mr-1" />
                            {announcement.travelTime}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-center">
                          <p className="text-gray-700">
                            {announcement.requestedSeats}/{announcement.availableSeats}
                          </p>
                          <p className="text-xs text-gray-500">
                            {getTransportIcon(announcement.transportMode)} {announcement.transportMode}
                          </p>
                        </div>
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {announcement.pricePerPerson ? `₹${announcement.pricePerPerson}` : 'Free'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getRiskColor(announcement.riskLevel)}>
                          {announcement.riskLevel.toUpperCase()}
                          {announcement.duplicateCount && ` (${announcement.duplicateCount} dup)`}
                          {announcement.reportsCount && ` • ${announcement.reportsCount} reports`}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-gray-700">{announcement.connectionRequests}</TableCell>
                      <TableCell>
                        <Badge variant="secondary" className={getStatusColor(announcement.status)}>
                          {announcement.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          {announcement.status === 'active' && (
                            <>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-orange-600"
                                onClick={() => handleSuspendAnnouncement(announcement.id)}
                              >
                                <AlertCircle className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="outline"
                                size="sm"
                                className="text-red-600"
                                onClick={() => handleCancelAnnouncement(announcement.id)}
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        )}

        {/* Route Analytics Tab */}
        {activeTab === 'analytics' && (
          <Card className="border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-black">Route Analytics</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {routeAnalytics.map((route) => (
                  <Card key={route.route} className="border-gray-200">
                    <CardContent className="p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="font-semibold text-black">{route.route}</h3>
                          <Badge variant="secondary" className={getRiskColor(route.riskLevel)}>
                            {route.riskLevel.toUpperCase()} RISK
                          </Badge>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-black">₹{route.averagePrice}</p>
                          <p className="text-sm text-gray-600">avg price</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-4 mb-4">
                        <div className="text-center">
                          <p className="text-lg font-bold text-black">{route.totalAnnouncements}</p>
                          <p className="text-xs text-gray-600">Total</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-green-600">{route.activeAnnouncements}</p>
                          <p className="text-xs text-gray-600">Active</p>
                        </div>
                        <div className="text-center">
                          <p className="text-lg font-bold text-blue-600">{route.completedTrips}</p>
                          <p className="text-xs text-gray-600">Completed</p>
                        </div>
                      </div>

                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">Popular Times:</p>
                        <div className="flex flex-wrap gap-1">
                          {route.popularTimes.map((time, index) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {time}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Activity Heatmap Tab */}
        {activeTab === 'heatmap' && (
          <Card className="border-gray-200 shadow-md">
            <CardHeader>
              <CardTitle className="text-black flex items-center">
                <Map className="h-5 w-5 mr-2 text-red-500" />
                Trip Activity Heatmap
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-center py-12">
                <Map className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-black mb-2">Interactive Map View</h3>
                <p className="text-gray-600 mb-4">
                  Visual representation of trip density and popular routes across the city
                </p>
                <div className="bg-gray-100 rounded-lg p-8 max-w-2xl mx-auto">
                  <div className="grid grid-cols-4 gap-2">
                    {['High', 'Medium', 'Low', 'No Activity'].map((level, index) => (
                      <div key={level} className={`p-4 rounded text-center text-sm font-medium ${index === 0 ? 'bg-red-500 text-white' :
                          index === 1 ? 'bg-yellow-500 text-white' :
                            index === 2 ? 'bg-green-500 text-white' :
                              'bg-gray-300 text-gray-700'
                        }`}>
                        {level}
                      </div>
                    ))}
                  </div>
                  <p className="text-sm text-gray-600 mt-4">
                    Real-time heatmap would show actual trip density and patterns
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </ProtectedRoute>
  );
}
