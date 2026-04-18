import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { RootStackParamList } from '../navigation/types';
import { fetchPaymentHistory, type PaymentInstallment } from '../api/user';
import { getToken } from '../storage/auth';
import { goBackOrDashboard } from '../navigation/backNavigation';

type Props = NativeStackScreenProps<RootStackParamList, 'ActivityHistory'>;
type Filter = 'all' | 'installments';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function dateGroupLabel(item: PaymentInstallment): string {
  if (item.is_today) { return 'TODAY'; }
  return item.date.toUpperCase();
}

function FilterChip({
  label,
  active,
  onPress,
}: {
  label: string;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.filterChip, active && styles.filterChipActive]} onPress={onPress}>
      <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>{label}</Text>
    </Pressable>
  );
}

function PaymentCard({ item }: { item: PaymentInstallment }) {
  const isSuccess = (item.status_message ?? '').toLowerCase() === 'success';

  return (
    <View style={styles.itemCard}>
      <View style={styles.itemTop}>
        <View style={[styles.itemIcon, !isSuccess && styles.itemIconPending]}>
          <Ionicons
            name={isSuccess ? 'arrow-down-outline' : 'time-outline'}
            size={13}
            color={isSuccess ? '#00B67A' : '#D97706'}
          />
        </View>
        <View style={styles.itemCenter}>
          <Text style={styles.schemeName}>{item.scheme_name}</Text>
          <Text style={styles.meta}>
            INSTALLMENT <Text style={styles.dot}>•</Text> {item.time}
          </Text>
        </View>
        <View style={styles.itemRight}>
          <Text style={[styles.amountText, !isSuccess && styles.amountTextPending]}>
            +₹{parseFloat(item.instalment_amount).toLocaleString('en-IN')}
          </Text>
          <Text
            style={[styles.statusPill, !isSuccess && styles.statusPending]}
          >
            {item.status_message.toUpperCase()}
          </Text>
        </View>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function ActivityHistoryScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [installments, setInstallments] = useState<PaymentInstallment[]>([]);
  const [totalInstallment, setTotalInstallment] = useState('0');

  const [filter, setFilter] = useState<Filter>('all');
  const [query, setQuery] = useState('');

  const loadHistory = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) { setError('Please log in.'); return; }
      const result = await fetchPaymentHistory(token);
      if (result.success) {
        setInstallments(result.installments ?? []);
        setTotalInstallment(result.total_installment ?? '0');
      } else {
        setError(result.message ?? 'Failed to load payment history.');
      }
    } catch (_e) {
      setError('Unable to load history. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadHistory();
  }, [loadHistory]);

  const filtered = useMemo(() => {
    return installments.filter(item => {
      if (!query.trim()) { return true; }
      const value = query.toLowerCase();
      return (
        item.scheme_name.toLowerCase().includes(value) ||
        item.date.toLowerCase().includes(value)
      );
    });
  }, [installments, query]);

  const totalIn = useMemo(
    () => filtered.reduce((sum, i) => sum + parseFloat(i.instalment_amount), 0),
    [filtered],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F3" />
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>

        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={() => goBackOrDashboard(navigation)}>
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>Transaction History</Text>
          <View style={styles.downloadBtn}>
            <Ionicons name="download-outline" size={14} color="#F39200" />
          </View>
        </View>

        {/* Search bar */}
        <View style={styles.searchBar}>
          <Ionicons name="search-outline" size={14} color="#9CA3AF" />
          <TextInput
            placeholder="Search by scheme or date..."
            placeholderTextColor="#94A3B8"
            style={styles.searchInput}
            value={query}
            onChangeText={setQuery}
          />
        </View>

        {/* Summary */}
        <View style={styles.summaryRow}>
          <View style={[styles.summaryCard, styles.summaryIn]}>
            <Text style={styles.summaryLabel}>TOTAL INSTALLMENTS</Text>
            <Text style={styles.summaryValue}>
              ₹{parseFloat(totalInstallment).toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={[styles.summaryCard, styles.summaryCount]}>
            <Text style={styles.summaryLabel}>TRANSACTIONS</Text>
            <Text style={styles.summaryValue}>{filtered.length}</Text>
          </View>
        </View>

        {/* Filter chips */}
        <View style={styles.filterRow}>
          <FilterChip label="ALL" active={filter === 'all'} onPress={() => setFilter('all')} />
          <FilterChip
            label="INSTALLMENTS"
            active={filter === 'installments'}
            onPress={() => setFilter('installments')}
          />
        </View>

        {/* Body */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#F59E0B" />
          </View>
        ) : error ? (
          <View style={styles.errorWrap}>
            <Ionicons name="alert-circle-outline" size={36} color="#E05252" />
            <Text style={styles.errorText}>{error}</Text>
            <Pressable
              style={styles.retryButton}
              onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}
            >
              <Text style={styles.retryText}>LOGIN</Text>
            </Pressable>
          </View>
        ) : filtered.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="receipt-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>No transactions found.</Text>
          </View>
        ) : (
          filtered.map((item, index) => {
            const currentLabel = dateGroupLabel(item);
            const prevLabel = index > 0 ? dateGroupLabel(filtered[index - 1]) : null;
            const showDate = currentLabel !== prevLabel;
            return (
              <View key={`${item.date}-${index}`}>
                {showDate ? <Text style={styles.dateLabel}>{currentLabel}</Text> : null}
                <PaymentCard item={item} />
              </View>
            );
          })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F3' },
  content: { paddingHorizontal: 12, paddingTop: 8, paddingBottom: 24, gap: 10, marginTop: 10 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 22,
  },
  iconBtn: { width: 24, height: 24, justifyContent: 'center', alignItems: 'center' },
  headerTitle: {
    flex: 1,
    marginLeft: 8,
    color: '#111827',
    fontSize: 22,
    lineHeight: 26,
    fontFamily: 'Jost-BoldItalic',
  },
  downloadBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFF2D9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  searchBar: {
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EBEF',
    minHeight: 44,
    paddingHorizontal: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    shadowColor: '#111827',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
  },
  searchInput: { flex: 1, color: '#111827', fontSize: 12, fontFamily: 'Poppins-Medium' },
  summaryRow: { flexDirection: 'row', gap: 10, marginTop: 4 },
  summaryCard: {
    flex: 1,
    borderRadius: 18,
    padding: 12,
    minHeight: 86,
    justifyContent: 'space-between',
  },
  summaryIn: { backgroundColor: '#00C853' },
  summaryCount: { backgroundColor: '#111827' },
  summaryLabel: { color: '#FFFFFF', fontSize: 9, letterSpacing: 1.2, fontFamily: 'Poppins-Bold' },
  summaryValue: { color: '#FFFFFF', fontSize: 24, lineHeight: 40, fontFamily: 'Poppins-Black' },
  filterRow: { flexDirection: 'row', gap: 7, marginTop: 2 },
  filterChip: {
    minHeight: 32,
    borderRadius: 16,
    paddingHorizontal: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#E5E7EB',
  },
  filterChipActive: { backgroundColor: '#F59E0B' },
  filterChipText: { color: '#374151', fontSize: 10, fontFamily: 'Poppins-Bold' },
  filterChipTextActive: { color: '#FFFFFF' },
  loadingWrap: { paddingVertical: 60, alignItems: 'center' },
  errorWrap: { paddingVertical: 40, alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  errorText: { color: '#6B7280', fontSize: 13, fontFamily: 'Poppins-Medium', textAlign: 'center' },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  retryText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Poppins-Black', letterSpacing: 1.4 },
  emptyWrap: { paddingVertical: 50, alignItems: 'center', gap: 10 },
  emptyText: { color: '#9CA3AF', fontSize: 13, fontFamily: 'Poppins-Medium', textAlign: 'center' },
  dateLabel: {
    marginTop: 10,
    marginBottom: 2,
    color: '#96A0AE',
    fontSize: 9,
    letterSpacing: 1.8,
    fontFamily: 'Poppins-Bold',
  },
  itemCard: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8EBEF',
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 11,
    shadowColor: '#111827',
    shadowOpacity: 0.03,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 1,
  },
  itemTop: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  itemIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#DCFCE7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemIconPending: { backgroundColor: '#FEF3C7' },
  itemCenter: { flex: 1 },
  schemeName: { color: '#111827', fontSize: 13, fontFamily: 'Poppins-Bold' },
  meta: { marginTop: 3, color: '#94A3B8', fontSize: 9, letterSpacing: 0.8, fontFamily: 'Poppins-SemiBold' },
  dot: { color: '#CBD5E1' },
  itemRight: { alignItems: 'flex-end' },
  amountText: { color: '#00B67A', fontSize: 20, lineHeight: 32, fontFamily: 'Poppins-Black' },
  amountTextPending: { color: '#D97706' },
  statusPill: {
    marginTop: 6,
    color: '#00A862',
    backgroundColor: '#DCFCE7',
    fontSize: 9,
    fontFamily: 'Poppins-Bold',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
    overflow: 'hidden',
  },
  statusPending: { color: '#D97706', backgroundColor: '#FEF3C7' },
});
