"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Check, X, Eye, FileText } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { approveKYC, rejectKYC } from "./actions";
import { toast } from "sonner";
import { ProtectedRoute } from "@/components/protected-route";

interface User {
  id: string;
  full_name: string;
  kyc_status: 'pending' | 'verified' | 'rejected';
  kyc_doc_url?: string;
  created_at: string;
}

export default function KYCApprovals() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchPendingKYCs = async () => {
      try {
        const { data, error } = await supabase
          .from('users')
          .select('*')
          .eq('kyc_status', 'pending')
          .order('created_at', { ascending: false });

        if (error) throw error;
        setUsers(data || []);
      } catch (error) {
        console.error('Error fetching pending KYCs:', error);
        toast.error('Failed to fetch pending KYCs');
      } finally {
        setLoading(false);
      }
    };

    fetchPendingKYCs();
  }, []);

  const handleKYCAction = async (userId: string, action: 'approve' | 'reject') => {
    const user = users.find(u => u.id === userId);
    if (!user) return;

    // Optimistically remove the user from the list
    setUsers(users.filter(u => u.id !== userId));

    try {
      const result = action === 'approve'
        ? await approveKYC(userId)
        : await rejectKYC(userId);

      if (result.success) {
        toast.success(
          action === 'approve'
            ? `KYC approved for ${user.full_name || 'User'}`
            : `KYC rejected for ${user.full_name || 'User'}`
        );
      } else {
        // If failed, add the user back to the list
        setUsers([...users]);
        toast.error(result.error || `Failed to ${action} KYC`);
      }
    } catch (error) {
      // If failed, add the user back to the list
      setUsers([...users]);
      toast.error(`Failed to ${action} KYC`);
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
          <h1 className="text-3xl font-bold text-black">KYC Approvals</h1>
          <Badge variant="secondary" className="bg-yellow-100 text-black border-yellow-300 text-sm">
            {users.length} Pending
          </Badge>
        </div>

        <Card className="border-gray-200 shadow-md">
          <CardHeader>
            <CardTitle className="text-black">Pending Verifications</CardTitle>
          </CardHeader>
          <CardContent>
            {users.length === 0 ? (
              <div className="text-center py-8">
                <FileText className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-gray-500">No pending KYC verifications</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="text-black">User ID</TableHead>
                    <TableHead className="text-black">Name</TableHead>
                    <TableHead className="text-black">Submitted</TableHead>
                    <TableHead className="text-black">Documents</TableHead>
                    <TableHead className="text-black">Status</TableHead>
                    <TableHead className="text-black">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell className="font-mono text-xs">
                        {user.id.slice(0, 8)}...
                      </TableCell>
                      <TableCell className="font-medium text-black">
                        {user.full_name || 'Unknown User'}
                      </TableCell>
                      <TableCell className="text-gray-700">
                        {new Date(user.created_at).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {user.kyc_doc_url ? (
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(user.kyc_doc_url, '_blank')}
                            className="border-yellow-400 text-yellow-600 hover:bg-yellow-50"
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        ) : (
                          <span className="text-gray-400 text-sm">No document</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="bg-yellow-100 text-black border-yellow-300">Pending</Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex space-x-2">
                          <Button
                            size="sm"
                            onClick={() => handleKYCAction(user.id, 'approve')}
                            className="bg-yellow-400 hover:bg-yellow-500 text-black font-medium"
                          >
                            <Check className="h-4 w-4 mr-1" />
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => handleKYCAction(user.id, 'reject')}
                            className="bg-red-500 hover:bg-red-600"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Reject
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
      </div>
    </ProtectedRoute>
  );
}
