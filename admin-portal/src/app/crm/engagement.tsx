"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Send, Users, Target, TrendingUp, Calendar, Bell, Smartphone, Mail, Wallet, Plus, Eye, BarChart } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Campaign {
  id: string;
  name: string;
  type: 'push' | 'sms' | 'email' | 'in_app' | 'wallet_credit';
  target_audience: 'all' | 'inactive' | 'kyc_pending' | 'new_users' | 'active_users';
  message: string;
  metadata?: {
    wallet_amount?: number;
    schedule_time?: string;
    delivery_count?: number;
    open_rate?: number;
    click_rate?: number;
  };
  status: 'draft' | 'scheduled' | 'sent' | 'paused' | 'completed';
  created_at: string;
  sent_at?: string;
  completed_at?: string;
}

interface UserSegment {
  id: string;
  name: string;
  description: string;
  user_count: number;
  criteria: {
    last_active_days?: number;
    kyc_status?: string;
    registration_date?: string;
    wallet_balance_min?: number;
    announcements_count_min?: number;
  };
  created_at: string;
}

interface EngagementMetrics {
  total_users: number;
  active_users_today: number;
  inactive_users: number;
  kyc_pending_users: number;
  new_users_this_week: number;
  avg_session_duration: number;
  messages_sent_today: number;
  wallet_credits_today: number;
}

export default function EngagementManagement() {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [userSegments, setUserSegments] = useState<UserSegment[]>([]);
  const [metrics, setMetrics] = useState<EngagementMetrics>({
    total_users: 0,
    active_users_today: 0,
    inactive_users: 0,
    kyc_pending_users: 0,
    new_users_this_week: 0,
    avg_session_duration: 0,
    messages_sent_today: 0,
    wallet_credits_today: 0
  });
  const [loading, setLoading] = useState(true);
  const [showCampaignModal, setShowCampaignModal] = useState(false);
  const [selectedCampaign, setSelectedCampaign] = useState<Campaign | null>(null);
  const [campaignForm, setCampaignForm] = useState({
    name: '',
    type: 'push' as const,
    target_audience: 'all' as const,
    message: '',
    wallet_amount: '',
    schedule_time: ''
  });

  useEffect(() => {
    const fetchEngagementData = async () => {
      try {
        // Fetch campaigns
        const { data: campaignsData } = await supabase
          .from('campaigns')
          .select('*')
          .order('created_at', { ascending: false });

        // Fetch user segments
        const { data: segmentsData } = await supabase
          .from('user_segments')
          .select('*');

        // Calculate engagement metrics
        const [
          { count: totalUsers },
          { count: activeUsersToday },
          { count: kycPendingUsers },
          { count: newUsersThisWeek }
        ] = await Promise.all([
          supabase.from('users').select('*', { count: 'exact', head: true }),
          supabase.from('users').select('*', { count: 'exact', head: true })
            .gte('last_active', new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString()),
          supabase.from('users').select('*', { count: 'exact', head: true })
            .eq('kyc_status', 'pending'),
          supabase.from('users').select('*', { count: 'exact', head: true })
            .gte('created_at', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
        ]);

        const inactiveUsers = (totalUsers || 0) - (activeUsersToday || 0);

        setCampaigns(campaignsData || []);
        setUserSegments(segmentsData || []);
        setMetrics({
          total_users: totalUsers || 0,
          active_users_today: activeUsersToday || 0,
          inactive_users: inactiveUsers,
          kyc_pending_users: kycPendingUsers || 0,
          new_users_this_week: newUsersThisWeek || 0,
          avg_session_duration: 0, // TODO: Calculate from analytics
          messages_sent_today: 0, // TODO: Calculate from message logs
          wallet_credits_today: 0 // TODO: Calculate from transaction logs
        });
      } catch (error) {
        console.error('Error fetching engagement data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchEngagementData();
  }, []);

  const handleCreateCampaign = async () => {
    if (!campaignForm.name || !campaignForm.message) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      const campaignData: any = {
        name: campaignForm.name,
        type: campaignForm.type,
        target_audience: campaignForm.target_audience,
        message: campaignForm.message,
        status: 'draft',
        created_at: new Date().toISOString()
      };

      if (campaignForm.type === 'wallet_credit' && campaignForm.wallet_amount) {
        campaignData.metadata = {
          wallet_amount: parseFloat(campaignForm.wallet_amount)
        };
      }

      if (campaignForm.schedule_time) {
        campaignData.metadata = {
          ...campaignData.metadata,
          schedule_time: campaignForm.schedule_time
        };
        campaignData.status = 'scheduled';
      }

      const { error } = await supabase
        .from('campaigns')
        .insert(campaignData);

      if (error) throw error;

      alert('Campaign created successfully');
      setShowCampaignModal(false);
      setCampaignForm({
        name: '',
        type: 'push',
        target_audience: 'all',
        message: '',
        wallet_amount: '',
        schedule_time: ''
      });

      // Refresh campaigns
      const { data } = await supabase.from('campaigns').select('*');
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error creating campaign:', error);
      alert('Failed to create campaign');
    }
  };

  const handleSendCampaign = async (campaignId: string) => {
    if (!confirm('Are you sure you want to send this campaign? This action cannot be undone.')) {
      return;
    }

    try {
      // Get campaign details
      const campaign = campaigns.find(c => c.id === campaignId);
      if (!campaign) return;

      // Get target users based on audience
      let query = supabase.from('users').select('id, fcm_token, email, phone');

      switch (campaign.target_audience) {
        case 'inactive':
          query = query.lt('last_active', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
          break;
        case 'kyc_pending':
          query = query.eq('kyc_status', 'pending');
          break;
        case 'new_users':
          query = query.gte('created_at', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString());
          break;
        case 'active_users':
          query = query.gte('last_active', new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString());
          break;
      }

      const { data: targetUsers } = await query;

      if (!targetUsers || targetUsers.length === 0) {
        alert('No users found in target audience');
        return;
      }

      // Send messages based on campaign type
      let deliveryCount = 0;

      if (campaign.type === 'wallet_credit' && campaign.metadata?.wallet_amount) {
        // Credit wallets
        for (const user of targetUsers) {
          await supabase
            .from('wallets')
            .upsert({
              user_id: user.id,
              balance: supabase.rpc('increment_wallet_balance', { 
                user_id: user.id, 
                amount: campaign.metadata.wallet_amount 
              }),
              updated_at: new Date().toISOString()
            }, {
              onConflict: 'user_id'
            });

          await supabase
            .from('transactions')
            .insert({
              user_id: user.id,
              amount: campaign.metadata.wallet_amount,
              type: 'credit',
              description: `Promotional credit: ${campaign.name}`,
              status: 'completed',
              created_at: new Date().toISOString()
            });

          deliveryCount++;
        }
      } else if (campaign.type === 'push') {
        // Send push notifications (would need FCM integration)
        deliveryCount = targetUsers.length;
        // TODO: Implement actual push notification sending
      } else if (campaign.type === 'email') {
        // Send emails (would need email service integration)
        deliveryCount = targetUsers.length;
        // TODO: Implement actual email sending
      } else if (campaign.type === 'sms') {
        // Send SMS (would need SMS service integration)
        deliveryCount = targetUsers.length;
        // TODO: Implement actual SMS sending
      }

      // Update campaign status
      await supabase
        .from('campaigns')
        .update({
          status: 'completed',
          sent_at: new Date().toISOString(),
          completed_at: new Date().toISOString(),
          metadata: {
            ...campaign.metadata,
            delivery_count: deliveryCount
          }
        })
        .eq('id', campaignId);

      alert(`Campaign sent to ${deliveryCount} users successfully`);

      // Refresh campaigns
      const { data } = await supabase.from('campaigns').select('*');
      setCampaigns(data || []);
    } catch (error) {
      console.error('Error sending campaign:', error);
      alert('Failed to send campaign');
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'push': return <Smartphone className="h-4 w-4" />;
      case 'sms': return <Smartphone className="h-4 w-4" />;
      case 'email': return <Mail className="h-4 w-4" />;
      case 'in_app': return <Bell className="h-4 w-4" />;
      case 'wallet_credit': return <Wallet className="h-4 w-4" />;
      default: return <Send className="h-4 w-4" />;
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'push': return <Badge className="bg-blue-100 text-blue-800">Push</Badge>;
      case 'sms': return <Badge className="bg-green-100 text-green-800">SMS</Badge>;
      case 'email': return <Badge className="bg-purple-100 text-purple-800">Email</Badge>;
      case 'in_app': return <Badge className="bg-orange-100 text-orange-800">In-App</Badge>;
      case 'wallet_credit': return <Badge className="bg-yellow-100 text-yellow-800">Wallet Credit</Badge>;
      default: return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'draft': return <Badge variant="secondary">Draft</Badge>;
      case 'scheduled': return <Badge className="bg-blue-100 text-blue-800">Scheduled</Badge>;
      case 'sent': return <Badge className="bg-green-100 text-green-800">Sent</Badge>;
      case 'paused': return <Badge className="bg-yellow-100 text-yellow-800">Paused</Badge>;
      case 'completed': return <Badge className="bg-purple-100 text-purple-800">Completed</Badge>;
      default: return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getAudienceBadge = (audience: string) => {
    switch (audience) {
      case 'all': return <Badge variant="outline">All Users</Badge>;
      case 'inactive': return <Badge className="bg-red-100 text-red-800">Inactive</Badge>;
      case 'kyc_pending': return <Badge className="bg-yellow-100 text-yellow-800">KYC Pending</Badge>;
      case 'new_users': return <Badge className="bg-green-100 text-green-800">New Users</Badge>;
      case 'active_users': return <Badge className="bg-blue-100 text-blue-800">Active Users</Badge>;
      default: return <Badge variant="outline">{audience}</Badge>;
    }
  };

  if (loading) {
    return (
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
    );
  }

  return (
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">Engagement & Campaign Management</h1>
        <Button onClick={() => setShowCampaignModal(true)} className="bg-blue-600 hover:bg-blue-700">
          <Plus className="h-4 w-4 mr-1" />
          Create Campaign
        </Button>
      </div>

      {/* Engagement Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Users</CardTitle>
            <Users className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{metrics.total_users.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Registered users</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Active Today</CardTitle>
            <TrendingUp className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics.active_users_today.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Users active today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">KYC Pending</CardTitle>
            <Calendar className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics.kyc_pending_users.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">New This Week</CardTitle>
            <Target className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{metrics.new_users_this_week.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">New registrations</p>
          </CardContent>
        </Card>
      </div>

      {/* Campaigns Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Marketing Campaigns</span>
            <div className="flex space-x-2">
              <Badge variant="outline" className="text-sm">
                {campaigns.filter(c => c.status === 'draft').length} Draft
              </Badge>
              <Badge className="bg-blue-100 text-blue-800 text-sm">
                {campaigns.filter(c => c.status === 'scheduled').length} Scheduled
              </Badge>
              <Badge className="bg-green-100 text-green-800 text-sm">
                {campaigns.filter(c => c.status === 'completed').length} Completed
              </Badge>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {campaigns.length === 0 ? (
            <div className="text-center py-8">
              <Send className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No campaigns created yet</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Campaign Name</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Target Audience</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Delivery</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {campaigns.map((campaign) => (
                  <TableRow key={campaign.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{campaign.name}</div>
                        <div className="text-sm text-gray-500 max-w-xs truncate">
                          {campaign.message}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getTypeIcon(campaign.type)}
                        {getTypeBadge(campaign.type)}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getAudienceBadge(campaign.target_audience)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(campaign.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {campaign.metadata?.delivery_count ? (
                          <span className="font-medium">{campaign.metadata.delivery_count} users</span>
                        ) : (
                          <span className="text-gray-500">Not sent</span>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(campaign.created_at).toLocaleDateString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedCampaign(campaign)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {(campaign.status === 'draft' || campaign.status === 'scheduled') && (
                          <Button
                            size="sm"
                            onClick={() => handleSendCampaign(campaign.id)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            <Send className="h-4 w-4 mr-1" />
                            Send
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

      {/* Create Campaign Modal */}
      {showCampaignModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-xl font-bold mb-4">Create New Campaign</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Name</label>
                <Input
                  value={campaignForm.name}
                  onChange={(e) => setCampaignForm({...campaignForm, name: e.target.value})}
                  placeholder="e.g., Weekend Trip Promotion"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Campaign Type</label>
                <select
                  value={campaignForm.type}
                  onChange={(e) => setCampaignForm({...campaignForm, type: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="push">Push Notification</option>
                  <option value="sms">SMS</option>
                  <option value="email">Email</option>
                  <option value="in_app">In-App Message</option>
                  <option value="wallet_credit">Wallet Credit</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Target Audience</label>
                <select
                  value={campaignForm.target_audience}
                  onChange={(e) => setCampaignForm({...campaignForm, target_audience: e.target.value as any})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="all">All Users</option>
                  <option value="inactive">Inactive Users (7+ days)</option>
                  <option value="kyc_pending">KYC Pending Users</option>
                  <option value="new_users">New Users (30 days)</option>
                  <option value="active_users">Active Users (7 days)</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                <Textarea
                  value={campaignForm.message}
                  onChange={(e) => setCampaignForm({...campaignForm, message: e.target.value})}
                  placeholder="Enter your campaign message..."
                  rows={3}
                />
              </div>
              {campaignForm.type === 'wallet_credit' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Wallet Amount (₹)</label>
                  <Input
                    type="number"
                    value={campaignForm.wallet_amount}
                    onChange={(e) => setCampaignForm({...campaignForm, wallet_amount: e.target.value})}
                    placeholder="e.g., 10"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Schedule (Optional)</label>
                <Input
                  type="datetime-local"
                  value={campaignForm.schedule_time}
                  onChange={(e) => setCampaignForm({...campaignForm, schedule_time: e.target.value})}
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowCampaignModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleCreateCampaign} className="bg-blue-600 hover:bg-blue-700">
                Create Campaign
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Campaign Detail Modal */}
      {selectedCampaign && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">{selectedCampaign.name}</h2>
              <Button variant="ghost" size="sm" onClick={() => setSelectedCampaign(null)}>
                ×
              </Button>
            </div>
            <div className="space-y-4">
              <div>
                <span className="text-sm text-gray-500">Type</span>
                <p>{getTypeBadge(selectedCampaign.type)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Target Audience</span>
                <p>{getAudienceBadge(selectedCampaign.target_audience)}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Message</span>
                <p className="font-medium">{selectedCampaign.message}</p>
              </div>
              <div>
                <span className="text-sm text-gray-500">Status</span>
                <p>{getStatusBadge(selectedCampaign.status)}</p>
              </div>
              {selectedCampaign.metadata && (
                <div>
                  <span className="text-sm text-gray-500">Campaign Details</span>
                  <div className="mt-2 space-y-1 text-sm">
                    {selectedCampaign.metadata.wallet_amount && (
                      <p>Wallet Amount: ₹{selectedCampaign.metadata.wallet_amount}</p>
                    )}
                    {selectedCampaign.metadata.delivery_count && (
                      <p>Delivered to: {selectedCampaign.metadata.delivery_count} users</p>
                    )}
                    {selectedCampaign.metadata.schedule_time && (
                      <p>Scheduled: {new Date(selectedCampaign.metadata.schedule_time).toLocaleString()}</p>
                    )}
                  </div>
                </div>
              )}
              <div>
                <span className="text-sm text-gray-500">Created</span>
                <p className="font-medium">{new Date(selectedCampaign.created_at).toLocaleString()}</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
