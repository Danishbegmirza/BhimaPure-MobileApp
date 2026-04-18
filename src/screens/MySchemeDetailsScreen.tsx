import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { RootStackParamList } from '../navigation/types';
import { goBackOrDashboard } from '../navigation/backNavigation';
import {
  fetchSchemePopupDetails,
  type SchemePopupResponse,
} from '../api/user';
import { getToken } from '../storage/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'MySchemeDetails'>;

function formatDate(dateStr: string): string {
  if (!dateStr) { return '—'; }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) { return dateStr; }
  return d
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();
}

export function MySchemeDetailsScreen({ navigation, route }: Props) {
  const schemeItemId = Number(route.params.schemeId);

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SchemePopupResponse | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError('Please log in to view scheme details.');
        return;
      }
      const result = await fetchSchemePopupDetails(token, schemeItemId);
      if (result.success) {
        setData(result);
      } else {
        setError('Failed to load scheme details.');
      }
    } catch (_e) {
      setError('Unable to load details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [schemeItemId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // ── Loading ────────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#050505" />
        <View style={styles.hero}>
          <View style={styles.topRow}>
            <Pressable style={styles.iconButton} onPress={() => goBackOrDashboard(navigation)}>
              <Ionicons name="arrow-back" size={20} color="#D1D5DB" />
            </Pressable>
            <View style={styles.portfolioLabelWrap}>
              <View style={styles.userChip}>
                <Ionicons name="person-outline" size={12} color="#FBBF24" />
              </View>
              <Text style={styles.portfolioTitle}>My Gold Portfolio</Text>
            </View>
            <View style={styles.iconButton} />
          </View>
        </View>
        <View style={styles.sheetCenter}>
          <ActivityIndicator size="large" color="#E88800" />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error ──────────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#050505" />
        <View style={styles.hero}>
          <View style={styles.topRow}>
            <Pressable style={styles.iconButton} onPress={() => goBackOrDashboard(navigation)}>
              <Ionicons name="arrow-back" size={20} color="#D1D5DB" />
            </Pressable>
            <View style={styles.portfolioLabelWrap}>
              <View style={styles.userChip}>
                <Ionicons name="person-outline" size={12} color="#FBBF24" />
              </View>
              <Text style={styles.portfolioTitle}>My Gold Portfolio</Text>
            </View>
            <View style={styles.iconButton} />
          </View>
        </View>
        <View style={styles.sheetCenter}>
          <Ionicons name="alert-circle-outline" size={40} color="#E05252" />
          <Text style={styles.errorText}>{error ?? 'Scheme not found.'}</Text>
          <Pressable
            style={styles.retryButton}
            onPress={() => navigation.reset({ index: 0, routes: [{ name: 'Login' }] })}
          >
            <Text style={styles.retryText}>LOGIN</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  const { scheme, next_payment, metrics } = data;
  const isOverdue = next_payment?.status === 'OVERDUE';

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />

      {/* Hero */}
      <View style={styles.hero}>
        <View style={styles.topRow}>
          <Pressable style={styles.iconButton} onPress={() => goBackOrDashboard(navigation)}>
            <Ionicons name="arrow-back" size={20} color="#D1D5DB" />
          </Pressable>
          <View style={styles.portfolioLabelWrap}>
            <View style={styles.userChip}>
              <Ionicons name="person-outline" size={12} color="#FBBF24" />
            </View>
            <Text style={styles.portfolioTitle}>My Gold Portfolio</Text>
          </View>
          <View style={styles.iconButton} />
        </View>

        <View style={styles.heroMetrics}>
          <View>
            <Text style={styles.metricLabel}>TOTAL PAID</Text>
            <Text style={styles.metricValue}>
              ₹{metrics.total_paid.toLocaleString('en-IN')}
            </Text>
          </View>
          <View style={styles.metricRight}>
            <Text style={styles.metricLabel}>ELIGIBLE VALUE</Text>
            <Text style={styles.metricAccent}>
              ₹{metrics.eligible_value.toLocaleString('en-IN')}
            </Text>
          </View>
        </View>
      </View>

      {/* Sheet */}
      <ScrollView
        style={styles.sheetScroll}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sheetHandle} />

        {/* Sheet header */}
        <View style={styles.sheetHeader}>
          <View style={{ flex: 1, paddingRight: 10 }}>
            <Text style={styles.sheetTitle}>{scheme.name}</Text>
            <Text style={styles.sheetSubTitle}>SCHEME DETAILED ANALYSIS</Text>
          </View>
          <Pressable style={styles.closeButton} onPress={() => goBackOrDashboard(navigation)}>
            <Ionicons name="close" size={14} color="#9CA3AF" />
          </Pressable>
        </View>

        {/* Installment timeline */}
        <View style={styles.timelineWrap}>
          <View style={styles.timelineHead}>
            <Text style={styles.blockLabel}>INSTALLMENT TIMELINE</Text>
            <Text style={styles.paidCount}>
              {scheme.paid_count}/{scheme.total_installments} Paid
            </Text>
          </View>
          <View style={styles.timelineRow}>
            {scheme.timeline.map((entry, index) => {
              const paid = entry.status === 'PAID';
              return (
                <View key={`${entry.month}-${index}`} style={styles.timelineItem}>
                  <View style={[styles.timelineDot, paid && styles.timelineDotPaid]}>
                    <Ionicons
                      name={paid ? 'checkmark' : 'ellipse-outline'}
                      size={11}
                      color={paid ? '#00B67A' : '#D1D5DB'}
                    />
                  </View>
                  <Text style={styles.timelineMonth}>{entry.month}</Text>
                </View>
              );
            })}
            {/* Show remaining unpaid slots */}
            {Array.from(
              { length: scheme.total_installments - scheme.timeline.length },
              (_, i) => (
                <View key={`pending-${i}`} style={styles.timelineItem}>
                  <View style={styles.timelineDot}>
                    <Ionicons name="ellipse-outline" size={11} color="#D1D5DB" />
                  </View>
                  <Text style={styles.timelineMonth}>—</Text>
                </View>
              ),
            )}
          </View>

          {/* Progress bar */}
          <View style={styles.progressBarWrap}>
            <View
              style={[
                styles.progressBarFill,
                {
                  width: `${Math.round(
                    (scheme.paid_count / scheme.total_installments) * 100,
                  )}%`,
                },
              ]}
            />
          </View>
          <Text style={styles.progressCaption}>
            {scheme.paid_count}/{scheme.total_installments} INSTALLMENTS COMPLETE
          </Text>
        </View>

        {/* Benefit cards */}
        <View style={styles.benefitRow}>
          <View style={styles.benefitCard}>
            <Text style={styles.benefitLabel}>BONUS VALUE</Text>
            <Text style={styles.benefitValue}>
              ₹{parseFloat(scheme.bonus_value).toLocaleString('en-IN')}
            </Text>
            <Text style={styles.benefitCaption}>Bonus on scheme completion</Text>
          </View>
          <View style={[styles.benefitCard, styles.benefitCardGreen]}>
            <Text style={styles.benefitLabelGreen}>MATURITY VALUE</Text>
            <Text style={styles.benefitValue}>
              ₹{metrics.maturity_amount.toLocaleString('en-IN')}
            </Text>
            <Text style={styles.benefitCaption}>Expected at maturity</Text>
          </View>
        </View>

        {/* Next payment milestone */}
        {next_payment && (
          <View style={[styles.milestoneCard, isOverdue && styles.milestoneCardOverdue]}>
            <Ionicons
              name={isOverdue ? 'alert-circle-outline' : 'checkmark-circle-outline'}
              size={15}
              color={isOverdue ? '#F39200' : '#00B67A'}
            />
            <View style={styles.milestoneTextWrap}>
              <Text style={styles.milestoneTitle}>
                {isOverdue ? 'Payment Overdue' : 'Next Payment'}
              </Text>
              <Text style={styles.milestoneBody}>{next_payment.label}</Text>
              {next_payment.due_date ? (
                <Text style={styles.milestoneDueDate}>
                  Due: {formatDate(next_payment.due_date)}
                </Text>
              ) : null}
            </View>
          </View>
        )}

        <Pressable style={styles.closeCta} onPress={() => goBackOrDashboard(navigation)}>
          <Text style={styles.closeCtaText}>CLOSE</Text>
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#050505' },
  sheetCenter: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 24,
    backgroundColor: '#F8F9FB',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  errorText: {
    color: '#6B7280',
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Poppins-Black',
    letterSpacing: 1.4,
  },
  hero: {
    backgroundColor: '#050505',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121820',
  },
  portfolioLabelWrap: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  userChip: {
    width: 26,
    height: 26,
    borderRadius: 13,
    borderWidth: 1,
    borderColor: '#3B4454',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#111923',
  },
  portfolioTitle: { color: '#F8FAFC', fontSize: 20, fontFamily: 'Poppins-BoldItalic' },
  heroMetrics: {
    marginTop: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 10,
  },
  metricLabel: { color: '#7A8596', fontSize: 9, fontFamily: 'Poppins-Bold', letterSpacing: 1.4 },
  metricValue: { marginTop: 4, color: '#F9FAFB', fontSize: 24, fontFamily: 'Poppins-Black' },
  metricRight: { alignItems: 'flex-end' },
  metricAccent: { marginTop: 4, color: '#FBBF24', fontSize: 24, fontFamily: 'Poppins-Black' },
  sheetScroll: {
    flex: 1,
    backgroundColor: '#F8F9FB',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    gap: 18,
  },
  sheetHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#D1D5DB',
    alignSelf: 'center',
  },
  sheetHeader: {
    marginTop: 4,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  sheetTitle: { color: '#0F172A', fontSize: 20, fontFamily: 'Poppins-BoldItalic' },
  sheetSubTitle: {
    marginTop: 2,
    color: '#94A3B8',
    fontSize: 10,
    letterSpacing: 1.1,
    fontFamily: 'Poppins-SemiBold',
  },
  closeButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#EEF2F7',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineWrap: { gap: 10 },
  timelineHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  blockLabel: {
    color: '#94A3B8',
    fontSize: 10,
    letterSpacing: 1.2,
    fontFamily: 'Poppins-Bold',
  },
  paidCount: { color: '#F39200', fontSize: 10, fontFamily: 'Poppins-Bold' },
  timelineRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  timelineItem: { alignItems: 'center', gap: 5 },
  timelineDot: {
    width: 28,
    height: 28,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timelineDotPaid: { borderColor: '#A7F3D0', backgroundColor: '#D1FAE5' },
  timelineMonth: { color: '#94A3B8', fontSize: 8, fontFamily: 'Poppins-SemiBold' },
  progressBarWrap: {
    height: 6,
    borderRadius: 3,
    backgroundColor: '#E5E7EB',
    overflow: 'hidden',
  },
  progressBarFill: { height: 6, borderRadius: 3, backgroundColor: '#F39200' },
  progressCaption: {
    color: '#94A3B8',
    fontSize: 9,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 1.2,
    textAlign: 'right',
  },
  benefitRow: { flexDirection: 'row', gap: 10 },
  benefitCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F2E9D3',
    backgroundColor: '#FFF9EA',
    padding: 12,
    minHeight: 100,
    gap: 4,
  },
  benefitCardGreen: { borderColor: '#CDEEE2', backgroundColor: '#ECFDF5' },
  benefitLabel: { color: '#F39200', fontSize: 8, fontFamily: 'Poppins-Black', letterSpacing: 1.1 },
  benefitLabelGreen: { color: '#059669', fontSize: 8, fontFamily: 'Poppins-Black', letterSpacing: 1.1 },
  benefitValue: { marginTop: 2, color: '#0F172A', fontSize: 20, fontFamily: 'Poppins-BoldItalic' },
  benefitCaption: { marginTop: 2, color: '#94A3B8', fontSize: 8, fontFamily: 'Poppins-Medium' },
  milestoneCard: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F8D692',
    backgroundColor: '#FFF7E6',
    paddingHorizontal: 12,
    paddingVertical: 14,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
  },
  milestoneCardOverdue: { borderColor: '#FCA5A5', backgroundColor: '#FFF1F2' },
  milestoneTextWrap: { flex: 1, gap: 3 },
  milestoneTitle: { color: '#0F172A', fontSize: 11, fontFamily: 'Poppins-Bold' },
  milestoneBody: { color: '#A16207', fontSize: 11, fontFamily: 'Poppins-Medium', lineHeight: 16 },
  milestoneDueDate: { marginTop: 2, color: '#6B7280', fontSize: 9, fontFamily: 'Poppins-SemiBold' },
  closeCta: {
    minHeight: 46,
    borderRadius: 20,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 3,
    marginTop: 8,
  },
  closeCtaText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Poppins-Black', letterSpacing: 1.1 },
});
