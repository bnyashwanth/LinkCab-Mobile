"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Eye, AlertTriangle, Shield, MessageSquare, Clock, CheckCircle, XCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Dispute {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  type: 'no_show' | 'payment_dispute' | 'harassment' | 'spam' | 'inappropriate_content';
  severity: 'low' | 'medium' | 'high' | 'critical';
  description: string;
  status: 'pending' | 'investigating' | 'resolved' | 'dismissed';
  created_at: string;
  updated_at: string;
  reporter?: {
    full_name: string;
    email: string;
  };
  reported_user?: {
    full_name: string;
    email: string;
  };
  announcement_id?: string;
  chat_messages?: any[];
}

export default function DisputeResolution() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [filteredDisputes, setFilteredDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedDispute, setSelectedDispute] = useState<Dispute | null>(null);

  useEffect(() => {
    const fetchDisputes = async () => {
      try {
        const { data, error } = await supabase
          .from('disputes')
          .select(`
            *,
            reporter:reporter_id (
              full_name,
              email
            ),
            reported_user:reported_user_id (
              full_name,
              email
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        setDisputes(data || []);
        setFilteredDisputes(data || []);
      } catch (error) {
        console.error('Error fetching disputes:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDisputes();
  }, []);

  useEffect(() => {
    const filtered = disputes.filter(dispute =>
      dispute.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.reporter?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.reported_user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dispute.description?.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredDisputes(filtered);
  }, [searchTerm, disputes]);

  const handleDisputeAction = async (disputeId: string, action: 'resolve' | 'dismiss' | 'investigate') => {
    try {
      const updateData: any = {
        updated_at: new Date().toISOString()
      };

      if (action === 'resolve') {
        updateData.status = 'resolved';
      } else if (action === 'dismiss') {
        updateData.status = 'dismissed';
      } else if (action === 'investigate') {
        updateData.status = 'investigating';
      }

      const { error } = await supabase
        .from('disputes')
        .update(updateData)
        .eq('id', disputeId);

      if (error) throw error;

      // Refresh the list
      const updatedDisputes = disputes.map(dispute => 
        dispute.id === disputeId 
          ? { ...dispute, status: updateData.status }
          : dispute
      );
      setDisputes(updatedDisputes);
      setFilteredDisputes(updatedDisputes);
      
      alert(`Dispute ${action}d successfully`);
    } catch (error) {
      console.error('Error updating dispute:', error);
      alert('Failed to update dispute');
    }
  };

  const getTypeBadge = (type: string) => {
    switch (type) {
      case 'no_show':
        return <Badge variant="outline">No Show</Badge>;
      case 'payment_dispute':
        return <Badge className="bg-yellow-100 text-yellow-800">Payment</Badge>;
      case 'harassment':
        return <Badge variant="destructive">Harassment</Badge>;
      case 'spam':
        return <Badge variant="secondary">Spam</Badge>;
      case 'inappropriate_content':
        return <Badge className="bg-orange-100 text-orange-800">Inappropriate</Badge>;
      default:
        return <Badge variant="outline">{type}</Badge>;
    }
  };

  const getSeverityBadge = (severity: string) => {
    switch (severity) {
      case 'critical':
        return <Badge variant="destructive">Critical</Badge>;
      case 'high':
        return <Badge className="bg-red-100 text-red-800">High</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">Medium</Badge>;
      case 'low':
        return <Badge className="bg-blue-100 text-blue-800">Low</Badge>;
      default:
        return <Badge variant="outline">{severity}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">Resolved</Badge>;
      case 'dismissed':
        return <Badge variant="secondary">Dismissed</Badge>;
      case 'investigating':
        return <Badge className="bg-orange-100 text-orange-800">Investigating</Badge>;
      case 'pending':
        return <Badge variant="outline">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  // Calculate stats
  const criticalDisputes = disputes.filter(d => d.severity === 'critical' && d.status !== 'resolved').length;
  const pendingDisputes = disputes.filter(d => d.status === 'pending').length;
  const investigatingDisputes = disputes.filter(d => d.status === 'investigating').length;
  const resolvedDisputes = disputes.filter(d => d.status === 'resolved').length;

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
        <h1 className="text-3xl font-bold text-gray-900">Dispute Resolution & Safety</h1>
        <div className="flex gap-2">
          <Badge variant="destructive" className="text-sm">
            {criticalDisputes} Critical
          </Badge>
          <Badge variant="outline" className="text-sm">
            {pendingDisputes} Pending
          </Badge>
          <Badge className="bg-orange-100 text-orange-800 text-sm">
            {investigatingDisputes} Investigating
          </Badge>
          <Badge className="bg-green-100 text-green-800 text-sm">
            {resolvedDisputes} Resolved
          </Badge>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Critical Cases
            </CardTitle>
            <AlertTriangle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{criticalDisputes}</div>
            <p className="text-xs text-gray-500 mt-1">Require immediate attention</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Pending Review
            </CardTitle>
            <Clock className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{pendingDisputes}</div>
            <p className="text-xs text-gray-500 mt-1">Awaiting investigation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Under Investigation
            </CardTitle>
            <Shield className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-600">{investigatingDisputes}</div>
            <p className="text-xs text-gray-500 mt-1">Currently being reviewed</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Resolved Today
            </CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{resolvedDisputes}</div>
            <p className="text-xs text-gray-500 mt-1">Successfully resolved</p>
          </CardContent>
        </Card>
      </div>

      {/* Disputes Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Disputes</span>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search disputes..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredDisputes.length === 0 ? (
            <div className="text-center py-8">
              <Shield className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No disputes found matching your search' : 'No disputes found'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Type</TableHead>
                  <TableHead>Reporter</TableHead>
                  <TableHead>Reported User</TableHead>
                  <TableHead>Severity</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Reported</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDisputes.map((dispute) => (
                  <TableRow key={dispute.id}>
                    <TableCell>
                      {getTypeBadge(dispute.type)}
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{dispute.reporter?.full_name || 'Unknown User'}</div>
                        <div className="text-sm text-gray-500">{dispute.reporter?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{dispute.reported_user?.full_name || 'Unknown User'}</div>
                        <div className="text-sm text-gray-500">{dispute.reported_user?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getSeverityBadge(dispute.severity)}
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(dispute.status)}
                    </TableCell>
                    <TableCell>
                      <div className="max-w-xs truncate text-sm">
                        {dispute.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(dispute.created_at).toLocaleDateString()}
                        <div className="text-xs text-gray-500">
                          {new Date(dispute.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedDispute(dispute)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                        {dispute.status === 'pending' && (
                          <Button
                            size="sm"
                            onClick={() => handleDisputeAction(dispute.id, 'investigate')}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            <Shield className="h-4 w-4 mr-1" />
                            Investigate
                          </Button>
                        )}
                        {dispute.status === 'investigating' && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleDisputeAction(dispute.id, 'resolve')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Resolve
                            </Button>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleDisputeAction(dispute.id, 'dismiss')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Dismiss
                            </Button>
                          </>
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

      {/* Dispute Details Modal */}
      {selectedDispute && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">Dispute Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedDispute(null)}
              >
                ×
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Incident Details</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Type:</span>
                    <p>{getTypeBadge(selectedDispute.type)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Severity:</span>
                    <p>{getSeverityBadge(selectedDispute.severity)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Status:</span>
                    <p>{getStatusBadge(selectedDispute.status)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Description:</span>
                    <p className="font-medium">{selectedDispute.description}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Reported On:</span>
                    <p className="font-medium">{new Date(selectedDispute.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Involved Parties</h3>
                <div className="space-y-4">
                  <div className="p-3 bg-gray-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Reporter</p>
                    <p className="font-medium">{selectedDispute.reporter?.full_name || 'Unknown User'}</p>
                    <p className="text-sm text-gray-500">{selectedDispute.reporter?.email}</p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-lg">
                    <p className="text-sm font-medium text-gray-700">Reported User</p>
                    <p className="font-medium">{selectedDispute.reported_user?.full_name || 'Unknown User'}</p>
                    <p className="text-sm text-gray-500">{selectedDispute.reported_user?.email}</p>
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-gray-700 mb-2">Available Actions</h3>
              <div className="flex flex-wrap gap-2">
                {selectedDispute.status === 'pending' && (
                  <Button
                    onClick={() => {
                      handleDisputeAction(selectedDispute.id, 'investigate');
                      setSelectedDispute(null);
                    }}
                    className="bg-orange-600 hover:bg-orange-700"
                  >
                    <Shield className="h-4 w-4 mr-1" />
                    Start Investigation
                  </Button>
                )}
                {selectedDispute.status === 'investigating' && (
                  <>
                    <Button
                      onClick={() => {
                        handleDisputeAction(selectedDispute.id, 'resolve');
                        setSelectedDispute(null);
                      }}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      <CheckCircle className="h-4 w-4 mr-1" />
                      Resolve Dispute
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => {
                        handleDisputeAction(selectedDispute.id, 'dismiss');
                        setSelectedDispute(null);
                      }}
                    >
                      <XCircle className="h-4 w-4 mr-1" />
                      Dismiss Case
                    </Button>
                  </>
                )}
                <Button
                  variant="outline"
                  onClick={() => window.open(`/users/${selectedDispute.reported_user_id}`, '_blank')}
                >
                  <MessageSquare className="h-4 w-4 mr-1" />
                  View Communication Logs
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
