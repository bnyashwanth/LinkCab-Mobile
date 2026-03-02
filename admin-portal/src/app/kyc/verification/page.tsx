"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Eye, CheckCircle, XCircle, Download, AlertCircle } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { ProtectedRoute } from "@/components/protected-route";

interface KYCUser {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  kyc_status: 'pending' | 'submitted' | 'under_review' | 'verified' | 'rejected';
  verification_documents?: {
    idDocumentUrl?: string;
    selfieUrl?: string;
    documentType?: string;
    documentNumber?: string;
    uploadedAt?: string;
  };
  created_at: string;
  announcements_count?: number;
  requests_count?: number;
}

export default function KYCManagement() {
  const [users, setUsers] = useState<KYCUser[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<KYCUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<KYCUser | null>(null);

  useEffect(() => {
    const fetchKYCUsers = async () => {
      try {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('*')
          .in('kyc_status', ['pending', 'submitted', 'under_review', 'verified', 'rejected'])
          .order('created_at', { ascending: false });

        if (usersError) throw usersError;

        // Get counts for each user
        const usersWithCounts = await Promise.all(
          (users || []).map(async (user) => {
            const [{ count: announcementsCount }, { count: requestsCount }] = await Promise.all([
              supabase.from('announcements').select('*', { count: 'exact', head: true }).eq('user_id', user.id),
              supabase.from('requests').select('*', { count: 'exact', head: true }).eq('requester_id', user.id)
            ]);

            return {
              ...user,
              kyc_status: user.kyc_status as 'pending' | 'submitted' | 'under_review' | 'verified' | 'rejected',
              announcements_count: announcementsCount || 0,
              requests_count: requestsCount || 0,
            };
          })
        );

        setUsers(usersWithCounts);
        setFilteredUsers(usersWithCounts);
      } catch (error) {
        console.error('Error fetching KYC users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchKYCUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const handleKYCAction = async (userId: string, action: 'approve' | 'reject') => {
    try {
      const { error } = await supabase
        .from('users')
        .update({ 
          kyc_status: action === 'approve' ? 'verified' : 'rejected',
          updated_at: new Date().toISOString()
        })
        .eq('id', userId);

      if (error) throw error;

      // Refresh the list
      const updatedUsers = users.map(user => 
        user.id === userId 
          ? { ...user, kyc_status: (action === 'approve' ? 'verified' : 'rejected') as KYCUser['kyc_status'] }
          : user
      );
      setUsers(updatedUsers);
      setFilteredUsers(updatedUsers);
      
      alert(`KYC ${action === 'approve' ? 'approved' : 'rejected'} successfully`);
    } catch (error) {
      console.error('Error updating KYC status:', error);
      alert('Failed to update KYC status');
    }
  };

  const getKYCStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800">Submitted</Badge>;
      case 'under_review':
        return <Badge className="bg-yellow-100 text-yellow-800">Reviewing</Badge>;
      default:
        return <Badge variant="secondary">Pending</Badge>;
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
    <ProtectedRoute>
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">KYC Verification Queue</h1>
        <div className="flex gap-2">
          <Badge variant="secondary" className="text-sm">
            {filteredUsers.filter(u => u.kyc_status === 'pending').length} Pending
          </Badge>
          <Badge className="bg-blue-100 text-blue-800 text-sm">
            {filteredUsers.filter(u => u.kyc_status === 'submitted' || u.kyc_status === 'under_review').length} Submitted/Reviewing
          </Badge>
          <Badge className="bg-green-100 text-green-800 text-sm">
            {filteredUsers.filter(u => u.kyc_status === 'verified').length} Verified
          </Badge>
          <Badge variant="destructive" className="text-sm">
            {filteredUsers.filter(u => u.kyc_status === 'rejected').length} Rejected
          </Badge>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All KYC Applications</span>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search users..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredUsers.length === 0 ? (
            <div className="text-center py-8">
              <AlertCircle className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No users found matching your search' : 'No KYC applications found'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Documents</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Applied</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{user.full_name || 'Unknown User'}</div>
                        <div className="text-sm text-gray-500">{user.email}</div>
                        <div className="text-xs text-gray-400">{user.phone}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getKYCStatusBadge(user.kyc_status)}
                    </TableCell>
                    <TableCell>
                      {user.verification_documents ? (
                        <div className="space-y-1">
                          {user.verification_documents.idDocumentUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(user.verification_documents?.idDocumentUrl, '_blank')}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              ID Doc
                            </Button>
                          )}
                          {user.verification_documents.selfieUrl && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => window.open(user.verification_documents?.selfieUrl, '_blank')}
                            >
                              <Download className="h-3 w-3 mr-1" />
                              Selfie
                            </Button>
                          )}
                        </div>
                      ) : (
                        <span className="text-gray-400 text-sm">No documents</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>{user.announcements_count} announcements</div>
                        <div>{user.requests_count} requests</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {new Date(user.created_at).toLocaleDateString()}
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        {['pending', 'submitted', 'under_review'].includes(user.kyc_status) && (
                          <>
                            <Button
                              size="sm"
                              onClick={() => handleKYCAction(user.id, 'approve')}
                              className="bg-green-600 hover:bg-green-700"
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Approve
                            </Button>
                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => handleKYCAction(user.id, 'reject')}
                            >
                              <XCircle className="h-4 w-4 mr-1" />
                              Reject
                            </Button>
                          </>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Eye className="h-4 w-4 mr-1" />
                          View
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* User Details Modal */}
      {selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-4xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">User KYC Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUser(null)}
              >
                ×
              </Button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Basic Information</h3>
                <div className="space-y-2 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <p className="font-medium">{selectedUser.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Email:</span>
                    <p className="font-medium">{selectedUser.email}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Phone:</span>
                    <p className="font-medium">{selectedUser.phone || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">KYC Status:</span>
                    <p>{getKYCStatusBadge(selectedUser.kyc_status)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Applied:</span>
                    <p className="font-medium">{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Verification Documents</h3>
                {selectedUser.verification_documents ? (
                  <div className="space-y-3">
                    {selectedUser.verification_documents.idDocumentUrl && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">ID Document ({selectedUser.verification_documents.documentType})</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(selectedUser.verification_documents?.idDocumentUrl, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          View ID Document
                        </Button>
                      </div>
                    )}
                    {selectedUser.verification_documents.selfieUrl && (
                      <div>
                        <p className="text-sm text-gray-600 mb-1">Selfie Photo</p>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => window.open(selectedUser.verification_documents?.selfieUrl, '_blank')}
                        >
                          <Download className="h-4 w-4 mr-1" />
                          View Selfie
                        </Button>
                      </div>
                    )}
                    {selectedUser.verification_documents.documentNumber && (
                      <div>
                        <span className="text-gray-500">Document Number:</span>
                        <p className="font-medium text-sm">{selectedUser.verification_documents.documentNumber}</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <p className="text-gray-500 text-sm">No verification documents uploaded</p>
                )}
              </div>
            </div>

            <div className="mt-6 pt-6 border-t">
              <h3 className="font-semibold text-gray-700 mb-2">Activity Summary</h3>
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="text-gray-500">Announcements Posted:</span>
                  <p className="font-medium">{selectedUser.announcements_count}</p>
                </div>
                <div>
                  <span className="text-gray-500">Requests Made:</span>
                  <p className="font-medium">{selectedUser.requests_count}</p>
                </div>
              </div>
            </div>

            {['pending', 'submitted', 'under_review'].includes(selectedUser.kyc_status) && (
              <div className="mt-6 pt-6 border-t flex justify-end space-x-3">
                <Button
                  variant="destructive"
                  onClick={() => {
                    handleKYCAction(selectedUser.id, 'reject');
                    setSelectedUser(null);
                  }}
                >
                  <XCircle className="h-4 w-4 mr-1" />
                  Reject KYC
                </Button>
                <Button
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => {
                    handleKYCAction(selectedUser.id, 'approve');
                    setSelectedUser(null);
                  }}
                >
                  <CheckCircle className="h-4 w-4 mr-1" />
                  Approve KYC
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
    </ProtectedRoute>
  );
}
