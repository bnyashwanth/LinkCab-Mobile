"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Eye, Trash2, AlertTriangle, MapPin, Calendar, Users, Clock } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Announcement {
  id: string;
  user_id: string;
  pickup_address: string;
  dropoff_address: string;
  route: string;
  travel_date: string;
  travel_time: string;
  available_seats: number;
  price_per_person: number;
  transport_mode: string;
  status: 'active' | 'cancelled' | 'completed';
  created_at: string;
  user?: {
    full_name: string;
    email: string;
  };
  requests_count?: number;
}

export default function AnnouncementModeration() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedAnnouncement, setSelectedAnnouncement] = useState<Announcement | null>(null);

  useEffect(() => {
    const fetchAnnouncements = async () => {
      try {
        const { data, error } = await supabase
          .from('announcements')
          .select(`
            *,
            users:user_id (
              full_name,
              email
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        // Get request counts for each announcement
        const announcementsWithCounts = await Promise.all(
          (data || []).map(async (announcement) => {
            const { count: requestsCount } = await supabase
              .from('requests')
              .select('*', { count: 'exact', head: true })
              .eq('announcement_id', announcement.id);

            return {
              ...announcement,
              requests_count: requestsCount || 0,
            };
          })
        );

        setAnnouncements(announcementsWithCounts);
        setFilteredAnnouncements(announcementsWithCounts);
      } catch (error) {
        console.error('Error fetching announcements:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchAnnouncements();
  }, []);

  useEffect(() => {
    const filtered = announcements.filter(announcement =>
      announcement.route?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.pickup_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.dropoff_address?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      announcement.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredAnnouncements(filtered);
  }, [searchTerm, announcements]);

  const handleTakeDown = async (announcementId: string) => {
    if (!confirm('Are you sure you want to take down this announcement? This action cannot be undone.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('announcements')
        .update({ 
          status: 'cancelled',
          updated_at: new Date().toISOString()
        })
        .eq('id', announcementId);

      if (error) throw error;

      // Refresh the list
      const updatedAnnouncements = announcements.map(announcement => 
        announcement.id === announcementId 
          ? { ...announcement, status: 'cancelled' as const }
          : announcement
      );
      setAnnouncements(updatedAnnouncements);
      setFilteredAnnouncements(updatedAnnouncements);
      
      alert('Announcement taken down successfully');
    } catch (error) {
      console.error('Error taking down announcement:', error);
      alert('Failed to take down announcement');
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">Active</Badge>;
      case 'cancelled':
        return <Badge variant="destructive">Cancelled</Badge>;
      case 'completed':
        return <Badge className="bg-blue-100 text-blue-800">Completed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  const getTransportModeBadge = (mode: string) => {
    switch (mode) {
      case 'cab':
        return <Badge variant="outline">🚗 Cab</Badge>;
      case 'auto':
        return <Badge variant="outline">🛺 Auto</Badge>;
      case 'bike':
        return <Badge variant="outline">🏍️ Bike</Badge>;
      case 'any':
        return <Badge variant="outline">🚗 Any</Badge>;
      default:
        return <Badge variant="outline">{mode}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="h-96 bg-gray-200 rounded"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Announcement Moderation</h1>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-sm">
            {filteredAnnouncements.filter(a => a.status === 'active').length} Active
          </Badge>
          <Badge variant="destructive" className="text-sm">
            {filteredAnnouncements.filter(a => a.status === 'cancelled').length} Cancelled
          </Badge>
          <Badge className="bg-blue-100 text-blue-800 text-sm">
            {filteredAnnouncements.filter(a => a.status === 'completed').length} Completed
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Announcements</span>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search announcements..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredAnnouncements.length === 0 ? (
            <div className="text-center py-8">
              <AlertTriangle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No announcements found matching your search' : 'No announcements found'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Route</TableHead>
                  <TableHead>Posted By</TableHead>
                  <TableHead>Travel Details</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Requests</TableHead>
                  <TableHead>Posted</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAnnouncements.map((announcement) => (
                  <TableRow key={announcement.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold flex items-center">
                          <MapPin className="h-4 w-4 mr-1 text-gray-400" />
                          {announcement.route}
                        </div>
                        <div className="text-sm text-gray-500">
                          {announcement.pickup_address} → {announcement.dropoff_address}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{announcement.user?.full_name || 'Unknown User'}</div>
                        <div className="text-sm text-gray-500">{announcement.user?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center text-sm">
                          <Calendar className="h-3 w-3 mr-1 text-gray-400" />
                          {new Date(announcement.travel_date).toLocaleDateString()}
                        </div>
                        <div className="flex items-center text-sm">
                          <Clock className="h-3 w-3 mr-1 text-gray-400" />
                          {announcement.travel_time}
                        </div>
                        <div className="flex items-center text-sm">
                          <Users className="h-3 w-3 mr-1 text-gray-400" />
                          {announcement.available_seats} seats
                        </div>
                        <div className="text-sm font-medium">
                          ₹{announcement.price_per_person}
                        </div>
                        {getTransportModeBadge(announcement.transport_mode)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(announcement.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{announcement.requests_count}</div>
                        <div className="text-xs text-gray-500">requests</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(announcement.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedAnnouncement(announcement)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {announcement.status === 'active' && (
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleTakeDown(announcement.id)}
                          >
                            <Trash2 className="h-4 w-4 mr-1" />
                            Take Down
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Announcement Details Modal */}
      {selectedAnnouncement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Announcement Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedAnnouncement(null)}
              >
                ×
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Route Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Route:</span>
                    <p className="font-medium">{selectedAnnouncement.route}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Pickup:</span>
                    <p className="font-medium">{selectedAnnouncement.pickup_address}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Dropoff:</span>
                    <p className="font-medium">{selectedAnnouncement.dropoff_address}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Transport Mode:</span>
                    <p>{getTransportModeBadge(selectedAnnouncement.transport_mode)}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Travel Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Travel Date:</span>
                    <p className="font-medium">{new Date(selectedAnnouncement.travel_date).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Travel Time:</span>
                    <p className="font-medium">{selectedAnnouncement.travel_time}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Available Seats:</span>
                    <p className="font-medium">{selectedAnnouncement.available_seats}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Price per Person:</span>
                    <p className="font-medium">₹{selectedAnnouncement.price_per_person}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p>{getStatusBadge(selectedAnnouncement.status)}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-gray-700 mb-2">Posted By</h3>
              <div className="space-y-2 text-sm">
                <div>
                  <span className="text-gray-500">Name:</span>
                  <p className="font-medium">{selectedAnnouncement.user?.full_name || 'Unknown User'}</p>
                </div>
                <div>
                  <span className="text-gray-500">Email:</span>
                  <p className="font-medium">{selectedAnnouncement.user?.email}</p>
                </div>
                <div>
                  <span className="text-gray-500">User ID:</span>
                  <p className="font-medium text-xs">{selectedAnnouncement.user_id}</p>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-gray-700 mb-2">Activity</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Connection Requests:</span>
                  <p className="font-medium">{selectedAnnouncement.requests_count}</p>
                </div>
                <div>
                  <span className="text-gray-500">Posted On:</span>
                  <p className="font-medium">{new Date(selectedAnnouncement.created_at).toLocaleDateString()}</p>
                </div>
              </div>
            </div>

            {selectedAnnouncement.status === 'active' && (
              <div className="mt-6 pt-6 border-t flex justify-end space-x-3">
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleTakeDown(selectedAnnouncement.id);
                    setSelectedAnnouncement(null);
                  }}
                >
                  <Trash2 className="h-4 w-4 mr-1" />
                  Take Down Announcement
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
