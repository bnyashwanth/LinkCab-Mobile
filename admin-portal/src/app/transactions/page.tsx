"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowUpRight, ArrowDownRight, Wallet, TrendingUp } from "lucide-react";
import { supabase } from "@/lib/supabase";

interface Transaction {
  id: string;
  user_id: string;
  amount: number;
  type: 'credit' | 'debit';
  created_at: string;
  description?: string;
  user?: {
    full_name: string;
  };
}

export default function Transactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalCredits: 0,
    totalDebits: 0,
    transactionCount: 0
  });

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const { data, error } = await supabase
          .from('transactions')
          .select(`
            *,
            users:user_id (
              full_name
            )
          `)
          .order('created_at', { ascending: false });

        if (error) throw error;

        const transactions = data?.map(tx => ({
          ...tx,
          user: tx.users
        })) || [];

        setTransactions(transactions);

        // Calculate stats
        const totalRevenue = transactions
          .filter(tx => tx.type === 'credit')
          .reduce((sum, tx) => sum + (tx.amount || 0), 0);

        const totalCredits = transactions
          .filter(tx => tx.type === 'credit')
          .reduce((sum, tx) => sum + (tx.amount || 0), 0);

        const totalDebits = transactions
          .filter(tx => tx.type === 'debit')
          .reduce((sum, tx) => sum + (tx.amount || 0), 0);

        setStats({
          totalRevenue,
          totalCredits,
          totalDebits,
          transactionCount: transactions.length
        });
      } catch (error) {
        console.error('Error fetching transactions:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchTransactions();
  }, []);

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

  if (loading) {
    return (
      <div className="p-8">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-8"></div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-24 bg-gray-200 rounded"></div>
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
        <h1 className="text-3xl font-bold text-gray-900">Financial Ledger</h1>
        <Badge variant="secondary" className="text-sm">
          {stats.transactionCount} Transactions
        </Badge>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Revenue
            </CardTitle>
            <TrendingUp className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">₹{stats.totalRevenue.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Platform earnings</p>
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
            <div className="text-2xl font-bold text-green-600">₹{stats.totalCredits.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Money added to wallets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Total Debits
            </CardTitle>
            <ArrowDownRight className="h-4 w-4 text-red-400" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">₹{stats.totalDebits.toLocaleString()}</div>
            <p className="text-xs text-gray-500 mt-1">Connection fees & charges</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">
              Net Balance
            </CardTitle>
            <Wallet className="h-4 w-4 text-gray-400" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${(stats.totalCredits - stats.totalDebits) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{(stats.totalCredits - stats.totalDebits).toLocaleString()}
            </div>
            <p className="text-xs text-gray-500 mt-1">Credits minus debits</p>
          </CardContent>
        </Card>
      </div>

      {/* Transactions Table */}
      <Card>
        <CardHeader>
          <CardTitle>All Transactions</CardTitle>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <div className="text-center py-8">
              <Wallet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
              <p className="text-gray-500">No transactions found</p>
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
                  <TableHead>Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((transaction) => (
                  <TableRow key={transaction.id}>
                    <TableCell className="font-mono text-xs">
                      {transaction.id.slice(0, 8)}...
                    </TableCell>
                    <TableCell>
                      <div>
                        <div className="font-medium">{transaction.user?.full_name || 'Unknown User'}</div>
                        <div className="text-sm text-gray-500">{transaction.user_id.slice(0, 8)}...</div>
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
                          transaction.type === 'credit' ? 'Wallet top-up' : 'Connection fee'
                        )}
                      </div>
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
    </div>
  );
}
