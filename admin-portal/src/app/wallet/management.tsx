"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Search, Download, Wallet, ArrowUpRight, ArrowDownRight, Plus, Minus, Calendar } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'credit' | 'debit';
  description?: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: string;
  user?: {
    full_name: string;
    email: string;
  };
}

interface Wallet {
  id: string;
  user_id: string;
  balance: number;
  currency: string;
  created_at: string;
  updated_at: string;
  user?: {
    full_name: string;
    email: string;
  };
}

export default function WalletManagement() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [filteredTransactions, setFilteredTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTransaction, setSelectedTransaction] = useState<Transaction | null>(null);
  const [showCreditModal, setShowCreditModal] = useState(false);
  const [creditForm, setCreditForm] = useState({
    userId: '',
    amount: '',
    reason: ''
  });

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch transactions with user data
        const { data: transactionsData, error: transactionsError } = await supabase
          .from('transactions')
          .select(`
            *,
            users:user_id (
              full_name,
              email
            )
          `)
          .order('created_at', { ascending: false });

        if (transactionsError) throw transactionsError;

        // Fetch wallets with user data
        const { data: walletsData, error: walletsError } = await supabase
          .from('wallets')
          .select(`
            *,
            users:user_id (
              full_name,
              email
            )
          `)
          .order('balance', { ascending: false });

        if (walletsError) throw walletsError;

        setTransactions(transactionsData || []);
        setFilteredTransactions(transactionsData || []);
        setWallets(walletsData || []);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const filtered = transactions.filter(transaction =>
      transaction.user?.full_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.user?.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchTerm.toLowerCase())
    );
    setFilteredTransactions(filtered);
  }, [searchTerm, transactions]);

  const handleManualCredit = async () => {
    if (!creditForm.userId || !creditForm.amount || !creditForm.reason) {
      alert('Please fill all fields');
      return;
    }

    try {
      // First, update the user's wallet balance
      const { error: walletError } = await supabase
        .from('wallets')
        .upsert({
          user_id: creditForm.userId,
          balance: supabase.rpc('increment_wallet_balance', { 
            user_id: creditForm.userId, 
            amount: parseFloat(creditForm.amount) 
          }),
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id'
        });

      if (walletError) throw walletError;

      // Then create a transaction record
      const { error: transactionError } = await supabase
        .from('transactions')
        .insert({
          user_id: creditForm.userId,
          amount: parseFloat(creditForm.amount),
          type: 'credit',
          description: creditForm.reason,
          status: 'completed',
          created_at: new Date().toISOString()
        });

      if (transactionError) throw transactionError;

      alert('Wallet credited successfully');
      setShowCreditModal(false);
      setCreditForm({ userId: '', amount: '', reason: '' });
      
      // Refresh data
      window.location.reload();
    } catch (error) {
      console.error('Error crediting wallet:', error);
      alert('Failed to credit wallet');
    }
  };

  const getTransactionBadge = (type: string) => {
    if (type === 'credit') {
      return (
        <Badge className="bg-green-100 text-green-800 flex items-center space-x-1">
          <ArrowUpRight className="h-3 w-3" />
          <span>Credit</span>
        </Badge>
      );
    } else {
      return (
        <Badge variant="destructive" className="flex items-center space-x-1">
          <ArrowDownRight className="h-3 w-3" />
          <span>Debit</span>
        </Badge>
      );
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'completed':
        return <Badge className="bg-green-100 text-green-800">Completed</Badge>;
      case 'pending':
        return <Badge variant="secondary">Pending</Badge>;
      case 'failed':
        return <Badge variant="destructive">Failed</Badge>;
      default:
        return <Badge variant="secondary">Unknown</Badge>;
    }
  };

  // Calculate stats
  const totalRevenue = transactions
    .filter(tx => tx.type === 'debit' && tx.status === 'completed')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const totalCredits = transactions
    .filter(tx => tx.type === 'credit' && tx.status === 'completed')
    .reduce((sum, tx) => sum + (tx.amount || 0), 0);

  const totalWalletBalance = wallets.reduce((sum, wallet) => sum + (wallet.balance || 0), 0);

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
            {[...Array(3)].map((_, i) => (
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
        <h1 className="text-3xl font-bold text-gray-900">Wallet & Transaction Management</h1>
        <Button onClick={() => setShowCreditModal(true)} className="bg-green-600 hover:bg-green-700">
          <Plus className="h-4 w-4 mr-1" />
          Manual Credit
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Revenue
            </CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Connection fees collected</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Credits
            </CardTitle>
            <ArrowUpRight className="h-4 w-4 text-green-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{totalCredits.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Money added to wallets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Wallet Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-blue-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">₹{totalWalletBalance.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Across all users</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span>Transaction Ledger</span>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {filteredTransactions.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">
                {searchTerm ? 'No transactions found matching your search' : 'No transactions found'}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Transaction ID</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredTransactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-xs">
                      {transaction.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{transaction.user?.full_name || 'Unknown User'}</div>
                        <div className="text-sm text-gray-500">{transaction.user?.email}</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      {getTransactionBadge(transaction.type)}
                    </TableCell>
                    <TableCell>
                      <div className={`font-semibold ${transaction.type === 'credit' ? 'text-green-600' : 'text-red-600'}`}>
                        {transaction.type === 'credit' ? '+' : '-'}₹{transaction.amount?.toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-600">
                        {transaction.description || (
                          transaction.type === 'credit' ? 'Wallet credit' : 'Connection fee'
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      {getStatusBadge(transaction.status)}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        {new Date(transaction.created_at).toLocaleDateString()}
                        <div className="text-xs text-gray-500">
                          {new Date(transaction.created_at).toLocaleTimeString()}
                        </div>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* Manual Credit Modal */}
      {showCreditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full">
            <h2 className="text-xl font-bold mb-4">Manual Wallet Credit</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                <Input
                  value={creditForm.userId}
                  onChange={(e) => setCreditForm({...creditForm, userId: e.target.value})}
                  placeholder="Enter user ID"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount (₹)</label>
                <Input
                  type="number"
                  value={creditForm.amount}
                  onChange={(e) => setCreditForm({...creditForm, amount: e.target.value})}
                  placeholder="Enter amount"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <Input
                  value={creditForm.reason}
                  onChange={(e) => setCreditForm({...creditForm, reason: e.target.value})}
                  placeholder="e.g., Refund for platform error"
                />
              </div>
            </div>
            <div className="flex justify-end space-x-3 mt-6">
              <Button variant="outline" onClick={() => setShowCreditModal(false)}>
                Cancel
              </Button>
              <Button onClick={handleManualCredit} className="bg-green-600 hover:bg-green-700">
                Credit Wallet
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
