import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  StatusBar,
  Dimensions,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { usePayment } from '@/contexts/PaymentContext';
import { Transaction } from '@/types';

const { width } = Dimensions.get('window');

// Brand Colors
const BRAND = {
  yellow: '#FFD700',
  yellowLight: '#FFF8DC',
  yellowDark: '#E6C200',
  black: '#1A1A1A',
  blackLight: '#333333',
  white: '#FFFFFF',
  gray: '#6B7280',
  grayLight: '#F5F5F5',
  grayMedium: '#E5E7EB',
  green: '#22C55E',
  red: '#EF4444',
};

const TOP_UP_AMOUNTS = [100, 200, 500, 1000];

export default function WalletScreen() {
  const router = useRouter();
  const { wallet, loading, topUpWallet, getTransactionHistory } = usePayment();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    const { data, error } = await getTransactionHistory();
    if (error) {
      Alert.alert('Error', 'Failed to load transactions');
    } else {
      setTransactions(data);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchTransactions();
    setRefreshing(false);
  };

  const handleTopUp = async (amount: number) => {
    Alert.alert(
      'Top Up Wallet',
      `Add ₹${amount} to your wallet?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Add ₹' + amount,
          onPress: async () => {
            const { error } = await topUpWallet(amount);
            if (!error) {
              Alert.alert('Success', `₹${amount} added to your wallet`);
              await fetchTransactions();
            } else {
              Alert.alert('Error', error?.message || 'Failed to top up wallet');
            }
          },
        },
      ]
    );
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'top_up':
        return 'add-circle-outline';
      case 'request_fee':
        return 'remove-circle-outline';
      case 'refund':
        return 'refresh-circle-outline';
      case 'ride_payment':
        return 'car-outline';
      default:
        return 'receipt-outline';
    }
  };

  const getTransactionColor = (type: string, amount: number) => {
    if (amount > 0) return BRAND.green;
    if (type === 'refund') return BRAND.green;
    return BRAND.red;
  };

  const formatAmount = (amount: number) => {
    const sign = amount >= 0 ? '+' : '';
    return `${sign}₹${Math.abs(amount)}`;
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: 'numeric',
      month: 'short',
      year: date.getFullYear() !== new Date().getFullYear() ? 'numeric' : undefined,
    });
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-IN', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <StatusBar barStyle="dark-content" backgroundColor={BRAND.white} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={BRAND.black} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Wallet</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.contentContainer}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[BRAND.yellow]}
            tintColor={BRAND.yellow}
          />
        }
      >
        {/* Balance Card */}
        <View style={styles.balanceCard}>
          <View style={styles.balanceHeader}>
            <View style={styles.balanceIconContainer}>
              <Ionicons name="wallet-outline" size={32} color={BRAND.black} />
            </View>
            <Text style={styles.balanceLabel}>Available Balance</Text>
          </View>
          <Text style={styles.balanceAmount}>
            ₹{wallet?.balance || 0}
          </Text>
          <Text style={styles.balanceSubtext}>
            Used for ride requests and payments
          </Text>
        </View>

        {/* Quick Top Up */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quick Top Up</Text>
          <View style={styles.topUpGrid}>
            {TOP_UP_AMOUNTS.map((amount) => (
              <TouchableOpacity
                key={amount}
                style={styles.topUpButton}
                onPress={() => handleTopUp(amount)}
                disabled={loading}
              >
                <Ionicons name="add" size={20} color={BRAND.black} />
                <Text style={styles.topUpText}>₹{amount}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Info Card */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <Ionicons name="information-circle-outline" size={20} color={BRAND.yellow} />
            <Text style={styles.infoTitle}>How it works</Text>
          </View>
          <Text style={styles.infoText}>
            • ₹1 fee is deducted when you send a ride request{'\n'}
            • Fee is refunded if your request is rejected{'\n'}
            • Top up your wallet to send requests{'\n'}
            • View all transactions below
          </Text>
        </View>

        {/* Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Transaction History</Text>
            <TouchableOpacity onPress={fetchTransactions}>
              <Ionicons name="refresh" size={20} color={BRAND.yellow} />
            </TouchableOpacity>
          </View>

          {transactions.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color={BRAND.gray} />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>Your transaction history will appear here</Text>
            </View>
          ) : (
            <View style={styles.transactionsList}>
              {transactions.map((transaction) => (
                <View key={transaction.id} style={styles.transactionCard}>
                  <View style={styles.transactionLeft}>
                    <View style={[
                      styles.transactionIcon,
                      { backgroundColor: getTransactionColor(transaction.type, transaction.amount) + '20' }
                    ]}>
                      <Ionicons
                        name={getTransactionIcon(transaction.type) as any}
                        size={20}
                        color={getTransactionColor(transaction.type, transaction.amount)}
                      />
                    </View>
                    <View style={styles.transactionInfo}>
                      <Text style={styles.transactionTitle}>
                        {transaction.description || transaction.type.replace('_', ' ').toUpperCase()}
                      </Text>
                      <Text style={styles.transactionTime}>
                        {formatDate(transaction.created_at)} at {formatTime(transaction.created_at)}
                      </Text>
                    </View>
                  </View>
                  <Text style={[
                    styles.transactionAmount,
                    { color: getTransactionColor(transaction.type, transaction.amount) }
                  ]}>
                    {formatAmount(transaction.amount)}
                  </Text>
                </View>
              ))}
            </View>
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BRAND.white,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: BRAND.white,
    borderBottomWidth: 1,
    borderBottomColor: BRAND.grayMedium,
  },
  backButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: BRAND.grayLight,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: BRAND.black,
  },
  headerSpacer: {
    width: 44,
  },
  content: {
    flex: 1,
  },
  contentContainer: {
    padding: 16,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: BRAND.black,
    marginBottom: 16,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },

  // Balance Card
  balanceCard: {
    backgroundColor: BRAND.black,
    borderRadius: 20,
    padding: 24,
    marginBottom: 24,
  },
  balanceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  balanceIconContainer: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: BRAND.yellow,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  balanceLabel: {
    fontSize: 16,
    color: 'rgba(255,255,255,0.8)',
    fontWeight: '500',
  },
  balanceAmount: {
    fontSize: 36,
    fontWeight: '700',
    color: BRAND.yellow,
    marginBottom: 8,
  },
  balanceSubtext: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.6)',
  },

  // Top Up
  topUpGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  topUpButton: {
    flex: 1,
    minWidth: (width - 52) / 2 - 6,
    backgroundColor: BRAND.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: BRAND.yellowLight,
    alignItems: 'center',
    gap: 8,
  },
  topUpText: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.black,
  },

  // Demo Button
  demoButton: {
    backgroundColor: BRAND.green,
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginBottom: 8,
  },
  demoButtonDisabled: {
    backgroundColor: BRAND.grayLight,
  },
  demoButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: BRAND.white,
  },
  demoSubtext: {
    fontSize: 12,
    color: BRAND.gray,
    textAlign: 'center',
    fontStyle: 'italic',
  },

  // Info Card
  infoCard: {
    backgroundColor: BRAND.yellow,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.black,
    marginLeft: 8,
  },
  infoText: {
    fontSize: 14,
    color: BRAND.blackLight,
    lineHeight: 20,
  },

  // Empty State
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '600',
    color: BRAND.black,
    marginTop: 12,
  },
  emptySubtext: {
    fontSize: 14,
    color: BRAND.gray,
    marginTop: 4,
    textAlign: 'center',
  },

  // Transactions
  transactionsList: {
    gap: 12,
  },
  transactionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: BRAND.white,
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: BRAND.grayMedium,
  },
  transactionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  transactionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  transactionInfo: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: BRAND.black,
    marginBottom: 2,
  },
  transactionTime: {
    fontSize: 13,
    color: BRAND.gray,
  },
  transactionAmount: {
    fontSize: 16,
    fontWeight: '700',
  },
});
