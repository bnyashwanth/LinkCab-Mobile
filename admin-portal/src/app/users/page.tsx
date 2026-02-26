"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Eye, UserCheck, UserX, Wallet } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface User {
  id: string;
  full_name: string;
  kyc_status: 'pending' | 'verified' | 'rejected';
  wallet_balance: number;
  created_at: string;
  kyc_doc_url?: string;
  announcements_count?: number;
  requests_count?: number;
}

export default function UserCRM() {
  const [users, setUsers] = useState<User[]>([]);
  const [filteredUsers, setFilteredUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data: users, error: usersError } = await supabase
          .from('users')
          .select('*')
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
              announcements_count: announcementsCount || 0,
              requests_count: requestsCount || 0,
            };
          })
        );

        setUsers(usersWithCounts);
        setFilteredUsers(usersWithCounts);
      } catch (error) {
        console.error('Error fetching users:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, []);

  useEffect(() => {
    const filtered = users.filter(user =>
      user.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredUsers(filtered);
  }, [searchTerm, users]);

  const getKYCStatusBadge = (status: string) => {
    switch (status) {
      case 'verified':
        return <Badge className="bg-green-100 text-green-800">Verified</Badge>;
      case 'rejected':
        return <Badge variant="destructive">Rejected</Badge>;
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
    <div className="p-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold text-gray-900">User CRM</h1>
        <Badge variant="secondary" className="text-sm">
          {filteredUsers.length} Users
        </Badge>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>All Users</span>
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
              <UserX className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No users found matching your search' : 'No users found'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>KYC Status</TableHead>
                  <TableHead>Wallet Balance</TableHead>
                  <TableHead>Activity</TableHead>
                  <TableHead>Joined</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">
                      <div>
                        <div className="font-semibold">{user.full_name || 'Unknown User'}</div>
                        <div className="text-sm text-gray-500">{user.id}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {user.kyc_status === 'verified' ? (
                          <UserCheck className="h-4 w-4 text-green-600" />
                        ) : user.kyc_status === 'rejected' ? (
                          <UserX className="h-4 w-4 text-red-600" />
                        ) : (
                          <UserCheck className="h-4 w-4 text-gray-400" />
                        )}
                        {getKYCStatusBadge(user.kyc_status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Wallet className="h-4 w-4 text-gray-400" />
                        <span className="font-medium">₹{user.wallet_balance || 0}</span>
                      </div>
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
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => setSelectedUser(user)}
                      >
                        <Eye className="h-4 w-4 mr-1" />
                        View Details
                      </Button>
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
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <div className="flex justify-between items-start mb-4">
              <h2 className="text-xl font-bold">User Details</h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedUser(null)}
              >
                ×
              </Button>
            </div>

            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-2">Basic Information</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-gray-500">Name:</span>
                    <p className="font-medium">{selectedUser.full_name || 'N/A'}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">User ID:</span>
                    <p className="font-medium text-xs">{selectedUser.id}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">KYC Status:</span>
                    <p>{getKYCStatusBadge(selectedUser.kyc_status)}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Wallet Balance:</span>
                    <p className="font-medium">₹{selectedUser.wallet_balance || 0}</p>
                  </div>
                  <div>
                    <span className="text-gray-500">Joined:</span>
                    <p>{new Date(selectedUser.created_at).toLocaleDateString()}</p>
                  </div>
                </div>
              </div>

              <div>
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

              <div>
                <h3 className="font-semibold text-gray-700 mb-2">KYC Document</h3>
                {selectedUser.kyc_doc_url ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(selectedUser.kyc_doc_url, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View KYC Document
                  </Button>
                ) : (
                  <p className="text-gray-500 text-sm">No KYC document uploaded</p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
