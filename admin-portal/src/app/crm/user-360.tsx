"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Eye, Star, Calendar, Clock, Wallet, Megaphone, Handshake, AlertTriangle, TrendingUp, Award, Shield } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface UserActivity {
  id: string;
  user_id: string;
  action_type: 'signup' | 'kyc_submitted' | 'kyc_approved' | 'kyc_rejected' | 'wallet_recharge' | 'announcement_posted' | 'request_sent' | 'request_accepted' | 'request_rejected' | 'match_completed' | 'rating_received';
  description: string;
  metadata?: any;
  created_at: string;
}

interface UserTrustScore {
  average_rating: number;
  total_ratings: number;
  completed_trips: number;
  cancelled_trips: number;
  no_show_incidents: number;
  spam_reports: number;
  trust_score: number;
  verification_level: 'basic' | 'verified' | 'premium';
}

interface User360 {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  kyc_status: 'pending' | 'verified' | 'rejected';
  wallet_balance: number;
  created_at: string;
  last_active: string;
  trust_score: UserTrustScore;
  activities: UserActivity[];
  announcements_count: number;
  requests_sent_count: number;
  requests_received_count: number;
  matches_completed: number;
}

export default function User360View() {
  const [users, setUsers] = useState<User360[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User360[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User360 | null>(null);

  useEffect(() => {
    const fetchUser360Data = async () => {
      try {
        // Fetch basic user data
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('*')
          .order('created_at', { ascending: false });

        if (usersError) throw usersError;

        // For each user, fetch their complete 360-degree view
        const usersWith360Data = await Promise.all(
          (users || []).map(async (user) => {
            // Fetch user activities
            const { data: activities } = await supabase
              .from('user_activities')
              .select('*')
              .eq('user_id', user.id)
              .order('created_at', { ascending: false })
              .limit(50);

            // Fetch ratings data
            const { data: ratings } = await supabase
              .from('ratings')
              .select('rating, comment, created_at')
              .eq('rated_user_id', user.id);

            // Fetch counts
            const [
              { count: announcementsCount },
              { count: requestsSentCount },
              { count: requestsReceivedCount },
              { count: matchesCompleted }
            ] = await Promise.all([
              supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
              supabase.from('requests').select('*', { count: 'exact', head: true }).eq('requester_id', user.id),
              supabase.from('requests').select('*', { count: 'exact', head: true }).eq('announcement_id', user.id),
              supabase.from('requests').select('*', { count: 'exact', head: true }).eq('requester_id', user.id).eq('status', 'accepted')
            ]);

            // Calculate trust score
            const averageRating = ratings?.length > 0 
              ? ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length 
              : 0;

            const trustScore = calculateTrustScore({
              average_rating: averageRating,
              total_ratings: ratings?.length || 0,
              completed_trips: matchesCompleted || 0,
              cancelled_trips: 0, // TODO: Calculate from request status
              no_show_incidents: 0, // TODO: Calculate from disputes
              spam_reports: 0, // TODO: Calculate from reports
            });

            return {
              ...user,
              trust_score: trustScore,
              activities: activities || [],
              announcements_count: announcementsCount || 0,
              requests_sent_count: requestsSentCount || 0,
              requests_received_count: requestsReceivedCount || 0,
              matches_completed: matchesCompleted || 0,
            };
          })
        );

        setUsers(usersWith360Data);
        setFilteredUsers(usersWith360Data);
      } catch (error) {
        console.error('Error fetching user 360 data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUser360Data();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const calculateTrustScore = (data: any): UserTrustScore => {
    let score = 50; // Base score

    // Rating contribution (30% of score)
    if (data.average_rating > 0) {
      score += (data.average_rating - 3) * 10; // Scale rating to score
    }

    // Completed trips contribution (25% of score)
    score += Math.min(data.completed_trips * 2, 25);

    // Penalties for negative incidents
    score -= data.cancelled_trips * 5;
    score -= data.no_show_incidents * 10;
    score -= data.spam_reports * 15;

    // Ensure score is within bounds
    score = Math.max(0, Math.min(100, score));

    return {
      average_rating: data.average_rating,
      total_ratings: data.total_ratings,
      completed_trips: data.completed_trips,
      cancelled_trips: data.cancelled_trips,
      no_show_incidents: data.no_show_incidents,
      spam_reports: data.spam_reports,
      trust_score: score,
      verification_level: data.total_ratings > 10 ? 'premium' : data.total_ratings > 3 ? 'verified' : 'basic'
    };
  };

  const getTrustScoreColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    if (score >= 40) return 'text-orange-600';
    return 'text-red-600';
  };

  const getVerificationBadge = (level: string) => {
    switch (level) {
      case 'premium':
        return <Badge className="bg-purple-100 text-purple-800">Premium</Badge>;
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      default:
        return <Badge variant="secondary">Basic</Badge>;
    }
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'signup': return <Calendar className="h-4 w-4" />;
      case 'kyc_submitted': return <Shield className="h-4 w-4" />;
      case 'kyc_approved': return <Award className="h-4 w-4" />;
      case 'kyc_rejected': return <AlertTriangle className="h-4 w-4" />;
      case 'wallet_recharge': return <Wallet className="h-4 w-4" />;
      case 'announcement_posted': return <Megaphone className="h-4 w-4" />;
      case 'request_sent': return <Handshake className="h-4 w-4" />;
      case 'request_accepted': return <TrendingUp className="h-4 w-4" />;
      case 'request_rejected': return <AlertTriangle className="h-4 w-4" />;
      case 'match_completed': return <Star className="h-4 w-4" />;
      case 'rating_received': return <Star className="h-4 w-4" />;
      default: return <Clock className="h-4 w-4" />;
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
        <h1 className="text-3xl font-bold text-gray-900">User 360-Degree View</h1>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search users..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Users Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        {filteredUsers.map((user) => (
          <Card key={user.id} className="cursor-pointer hover:shadow-lg transition-shadow" onClick={() => setSelectedUser(user)}>
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg">{user.full_name || 'Unknown User'}</h3>
                  <p className="text-sm text-gray-500">{user.email}</p>
                </div>
                {getVerificationBadge(user.trust_score.verification_level)}
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {/* Trust Score */}
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-600">Trust Score</span>
                  <div className="flex items-center">
                    <Star className="h-4 w-4 mr-1" />
                    <span className={`font-bold ${getTrustScoreColor(user.trust_score.trust_score)}`}>
                      {user.trust_score.trust_score}/100
                    </span>
                  </div>
                </div>

                {/* Quick Stats */}
                <div className="grid grid-cols-2 gap-2 text-sm">
                  <div className="flex items-center">
                    <Megaphone className="h-3 w-3 mr-1 text-gray-400" />
                    <span>{user.announcements_count} posts</span>
                  </div>
                  <div className="flex items-center">
                    <Handshake className="h-3 w-3 mr-1 text-gray-400" />
                    <span>{user.matches_completed} matches</span>
                  </div>
                  <div className="flex items-center">
                    <Star className="h-3 w-3 mr-1 text-gray-400" />
                    <span>{user.trust_score.average_rating.toFixed(1)} avg rating</span>
                  </div>
                  <div className="flex items-center">
                    <Wallet className="h-3 w-3 mr-1 text-gray-400" />
                    <span>₹{user.wallet_balance}</span>
                  </div>
                </div>

                {/* Activity Status */}
                <div className="flex items-center text-sm text-gray-500">
                  <Clock className="h-3 w-3 mr-1" />
                  Last active: {user.last_active ? new Date(user.last_active).toLocaleDateString() : 'Never'}
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* User Detail Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-6xl w-full max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-2xl font-bold">{selectedUser.full_name || 'Unknown User'}</h2>
                <p className="text-gray-500">{selectedUser.email}</p>
              </div>
              <div className="flex items-center space-x-2">
                {getVerificationBadge(selectedUser.trust_score.verification_level)}
                <Button variant="ghost" size="sm" onClick={() => setSelectedUser(null)}>
                  ×
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Trust Score Dashboard */}
              <div className="lg:col-span-1">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Shield className="h-5 w-5 mr-2" />
                      Trust Score Dashboard
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div className="text-center">
                        <div className={`text-4xl font-bold ${getTrustScoreColor(selectedUser.trust_score.trust_score)}`}>
                          {selectedUser.trust_score.trust_score}
                        </div>
                        <div className="text-sm text-gray-500">Trust Score</div>
                      </div>
                      
                      <div className="space-y-2 text-sm">
                        <div className="flex justify-between">
                          <span>Average Rating</span>
                          <span className="font-medium">⭐ {selectedUser.trust_score.average_rating.toFixed(1)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Total Ratings</span>
                          <span className="font-medium">{selectedUser.trust_score.total_ratings}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Completed Trips</span>
                          <span className="font-medium">{selectedUser.trust_score.completed_trips}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Cancelled Trips</span>
                          <span className="font-medium text-red-600">{selectedUser.trust_score.cancelled_trips}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>No-Show Incidents</span>
                          <span className="font-medium text-red-600">{selectedUser.trust_score.no_show_incidents}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Spam Reports</span>
                          <span className="font-medium text-red-600">{selectedUser.trust_score.spam_reports}</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Quick Stats */}
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>Activity Summary</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3 text-sm">
                      <div className="flex justify-between">
                        <span>Announcements Posted</span>
                        <span className="font-medium">{selectedUser.announcements_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Requests Sent</span>
                        <span className="font-medium">{selectedUser.requests_sent_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Requests Received</span>
                        <span className="font-medium">{selectedUser.requests_received_count}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Matches Completed</span>
                        <span className="font-medium text-green-600">{selectedUser.matches_completed}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Wallet Balance</span>
                        <span className="font-medium">₹{selectedUser.wallet_balance}</span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Activity Timeline */}
              <div className="lg:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      <Clock className="h-5 w-5 mr-2" />
                      Activity Timeline
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4 max-h-96 overflow-y-auto">
                      {selectedUser.activities.length === 0 ? (
                        <p className="text-gray-500 text-center py-8">No activities recorded</p>
                      ) : (
                        selectedUser.activities.map((activity) => (
                          <div key={activity.id} className="flex items-start space-x-3 p-3 bg-gray-50 rounded-lg">
                            <div className="flex-shrink-0">
                              {getActivityIcon(activity.action_type)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium text-gray-900">
                                {activity.description}
                              </p>
                              {activity.metadata && (
                                <p className="text-xs text-gray-500 mt-1">
                                  {JSON.stringify(activity.metadata)}
                                </p>
                              )}
                              <p className="text-xs text-gray-500 mt-1">
                                {new Date(activity.created_at).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
