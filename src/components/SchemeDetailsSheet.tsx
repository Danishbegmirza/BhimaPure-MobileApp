import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  LayoutAnimation,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  UIManager,
  View,
} from 'react-native';

if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

import Ionicons from 'react-native-vector-icons/Ionicons';
import {
  fetchSchemePopupDetails,
  type PaymentHistoryItem,
  type SchemePopupResponse,
} from '../api/user';
import { getToken } from '../storage/auth';

function formatDate(dateStr: string): string {
  if (!dateStr) { return '—'; }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) { return dateStr; }
  return d
    .toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    .toUpperCase();
}

function formatGoldHoldings(value: string | number | null | undefined): string {
  if (value == null || value === '') { return '0g'; }
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) { return '0g'; }
  const trimmed = String(num).replace(/\.?0+$/, '');
  return `${trimmed}g`;
}

function formatPaymentMonthYear(dateStr: string): string {
  if (!dateStr) { return '—'; }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) { return dateStr; }
  return d.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function formatPaymentFullDate(dateStr: string): string {
  if (!dateStr) { return '—'; }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) { return dateStr; }
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function isPaymentPaid(item: PaymentHistoryItem): boolean {
  const status = (item.status_message ?? item.status ?? '').toLowerCase();
  return status === 'success' || status === 'paid';
}

function getPaymentAmount(item: PaymentHistoryItem): number {
  if (item.installment_amount != null && item.installment_amount !== '') {
    const parsed = parseFloat(String(item.installment_amount));
    if (!isNaN(parsed)) { return parsed; }
  }
  return item.amount ?? 0;
}

function getPaymentDisplayDate(item: PaymentHistoryItem): string {
  return item.payment_date || item.installment_date || item.date || '';
}

function getPaymentMonthLabel(item: PaymentHistoryItem): string {
  if (item.month) { return item.month; }
  return formatPaymentMonthYear(item.installment_date || item.date || '');
}

function getPaymentStatusLabel(item: PaymentHistoryItem): string {
  if (item.status) { return item.status.toUpperCase(); }
  return isPaymentPaid(item) ? 'PAID' : (item.status_message ?? 'PENDING').toUpperCase();
}

function isAverageRateBookingSmart(schemeName: string): boolean {
  return schemeName.trim() === 'Average Rate Booking Smart';
}

type Props = {
  schemeId: number;
  onClose: () => void;
  bottomPadding?: number;
};

export function SchemeDetailsSheet({ schemeId, onClose, bottomPadding = 24 }: Props) {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<SchemePopupResponse | null>(null);
  const [paymentHistoryExpanded, setPaymentHistoryExpanded] = useState(false);

  const togglePaymentHistory = useCallback(() => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setPaymentHistoryExpanded(prev => !prev);
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      setData(null);
      setPaymentHistoryExpanded(false);
      const token = await getToken();
      if (!token) {
        setError('Please log in to view scheme details.');
        return;
      }
      const result = await fetchSchemePopupDetails(token, schemeId);
      console.log("result=====", result);
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
  }, [schemeId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <View style={styles.loadingState}>
        <ActivityIndicator size="large" color="#E88800" />
      </View>
    );
  }

  if (error || !data) {
    return (
      <View style={styles.loadingState}>
        <Ionicons name="alert-circle-outline" size={40} color="#E05252" />
        <Text style={styles.errorText}>{error ?? 'Scheme not found.'}</Text>
        <Pressable style={styles.retryButton} onPress={loadData}>
          <Text style={styles.retryText}>RETRY</Text>
        </Pressable>
      </View>
    );
  }

  const { scheme, next_payment, metrics } = data;
  const paymentHistory = scheme.payment_history ?? data.payment_history ?? [];
  const nomineeName = scheme.nominee_name || data.nominee_name || null;
  const nomineeRelation = scheme.nominee_relation || data.nominee_relation || null;
  const joinDate = scheme.join_date || data.join_date || null;
  const maturityDate = scheme.maturity_date || data.maturity_date || null;
  const isOverdue = next_payment?.status === 'OVERDUE';
  const showBonusCard = data.show_bonus === 'yes';
  const showGoldHoldingsCard = data.show_gold_holdings === 'yes';
  const showMaturityCard = data.show_gold_holdings === 'no' || data.show_gold_holdings == null;
  const bonusAmount = parseFloat(String(data.bonus_value ?? scheme.bonus_value ?? '0'));
  const isAverageRateBooking = isAverageRateBookingSmart(scheme.name);

  return (
    <ScrollView
      style={styles.sheetScroll}
      contentContainerStyle={[styles.sheetContent, { paddingBottom: bottomPadding }]}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.sheetHandle} />

      <View style={styles.sheetHeader}>
        <View style={{ flex: 1, paddingRight: 10 }}>
          <Text style={styles.sheetTitle}>{scheme.name}</Text>
          <Text style={styles.sheetSubTitle}>SCHEME DETAILED ANALYSIS</Text>
        </View>
        <Pressable style={styles.closeButton} onPress={onClose}>
          <Ionicons name="close" size={14} color="#9CA3AF" />
        </Pressable>
      </View>

      <View style={styles.dateCardsRow}>
        <View style={styles.dateCard}>
          <View style={styles.dateCardIconWrap}>
            <Ionicons name="calendar-outline" size={14} color="#F39200" />
          </View>
          <Text style={styles.dateCardLabel}>JOINING DATE</Text>
          <Text style={styles.dateCardValue}>
            {joinDate ? formatDate(joinDate) : '—'}
          </Text>
        </View>
        <View style={styles.dateCard}>
          <View style={styles.dateCardIconWrap}>
            <Ionicons name="calendar-outline" size={14} color="#F39200" />
          </View>
          <Text style={styles.dateCardLabel}>MATURITY DATE</Text>
          <Text style={styles.dateCardValue}>
            {maturityDate ? formatDate(maturityDate) : '—'}
          </Text>
        </View>
      </View>

      <View style={styles.schemeDetailsCard}>
        <View style={styles.schemeDetailsHeader}>
          <Ionicons name="information-circle-outline" size={16} color="#3B82F6" />
          <Text style={styles.schemeDetailsHeaderText}>SCHEME DETAILS</Text>
        </View>
        <View style={styles.schemeDetailsBody}>
          {metrics.total_paid != null && (
            <View style={styles.schemeDetailRow}>
              <Text style={styles.schemeDetailLabel}>Total Installment Amount</Text>
              <Text style={styles.schemeDetailValue}>
                ₹{metrics.total_paid.toLocaleString('en-IN')}
              </Text>
            </View>
          )}
          {!isAverageRateBooking && scheme.scheme_amount != null  && (
            <View style={styles.schemeDetailRow}>
              <Text style={styles.schemeDetailLabel}>Installment Amount</Text>
              <Text style={styles.schemeDetailValue}>₹{scheme.scheme_amount.toLocaleString('en-IN')}</Text>
            </View>
          )}
          {!isAverageRateBooking && (
            <View style={styles.schemeDetailRow}>
              <Text style={styles.schemeDetailLabel}>Scheme Duration</Text>
              <Text style={styles.schemeDetailValue}>
                {scheme.total_installments ? `${scheme.total_installments} Months` : '—'}
              </Text>
            </View>
          )}
        </View>
      </View>

      {!isAverageRateBooking && (
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
      )}

      {(showBonusCard || showGoldHoldingsCard || showMaturityCard) && (
        <View style={styles.benefitRow}>
          {showBonusCard && (
            <View style={styles.benefitCard}>
              <Text style={styles.benefitLabel} numberOfLines={2}>
                ELIGIBLE BONUS UPON MATURITY
              </Text>
              <View style={styles.benefitCardContent}>
                <Text style={styles.benefitValue}>
                  ₹{bonusAmount.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.benefitCaption}>Bonus on scheme completion</Text>
              </View>
            </View>
          )}

          {showGoldHoldingsCard && (
            <View style={[styles.benefitCard, styles.benefitCardGreen]}>
              <Text style={styles.benefitLabelGreen} numberOfLines={2}>
                GOLD HOLDINGS
              </Text>
              <View style={styles.benefitCardContent}>
                <Text style={styles.benefitValue}>
                  {formatGoldHoldings(metrics.gold_holdings)}
                </Text>
                <Text style={styles.benefitCaption}>Expected at maturity</Text>
              </View>
            </View>
          )}

          {showMaturityCard && (
            <View style={[styles.benefitCard, styles.benefitCardGreen]}>
              <Text style={styles.benefitLabelGreen} numberOfLines={2}>
                MATURITY VALUE
              </Text>
              <View style={styles.benefitCardContent}>
                <Text style={styles.benefitValue}>
                  ₹{metrics.maturity_amount.toLocaleString('en-IN')}
                </Text>
                <Text style={styles.benefitCaption}>Expected at maturity</Text>
              </View>
            </View>
          )}
        </View>
      )}

      {(nomineeName || nomineeRelation) && (
        <View style={styles.nomineeCard}>
          <View style={styles.nomineeHeader}>
            <View style={styles.nomineeIconWrap}>
              <Ionicons name="heart-outline" size={14} color="#F39200" />
            </View>
            <Text style={styles.nomineeHeaderText}>NOMINEE DETAILS</Text>
          </View>
          <View style={styles.nomineeBody}>
            <View style={styles.nomineeField}>
              <Text style={styles.nomineeLabel}>NAME</Text>
              <Text style={styles.nomineeName}>{nomineeName || '—'}</Text>
            </View>
            <View style={styles.nomineeFieldRight}>
              <Text style={styles.nomineeLabel}>RELATIONSHIP</Text>
              <View style={styles.nomineeRelationWrap}>
                <Ionicons name="people-outline" size={12} color="#F39200" />
                <Text style={styles.nomineeRelation}>{nomineeRelation || '—'}</Text>
              </View>
            </View>
          </View>
        </View>
      )}

      <View style={styles.paymentHistoryCard}>
        <Pressable style={styles.paymentHistoryHeader} onPress={togglePaymentHistory}>
          <View style={styles.paymentHistoryHeaderLeft}>
            <View style={styles.paymentHistoryIconWrap}>
              <Ionicons name="receipt-outline" size={16} color="#F39200" />
            </View>
            <View>
              <Text style={styles.paymentHistoryTitle}>Payment History</Text>
              {!isAverageRateBooking && (
                <Text style={styles.paymentHistorySubtitle}>
                  {scheme.paid_count} OF {scheme.total_installments} PAID
                </Text>
              )}
            </View>
          </View>
          <Ionicons
            name={paymentHistoryExpanded ? 'chevron-up' : 'chevron-down'}
            size={20}
            color="#9CA3AF"
          />
        </Pressable>

        {paymentHistoryExpanded && paymentHistory.length > 0 && (
          <View style={styles.paymentHistoryList}>
            {paymentHistory.map((item, index) => {
              const paid = isPaymentPaid(item);
              const displayDate = getPaymentDisplayDate(item);
              const txnId = item.transaction_id?.trim();

              return (
              <View key={`${displayDate}-${index}`} style={styles.paymentHistoryItemCard}>
                <View style={styles.paymentHistoryItemLeft}>
                  <View style={[
                    styles.paymentHistoryDot,
                    paid && styles.paymentHistoryDotPaid,
                  ]}>
                    <Ionicons
                      name={paid ? 'checkmark' : 'ellipse-outline'}
                      size={14}
                      color={paid ? '#00B67A' : '#D1D5DB'}
                    />
                  </View>
                  <View>
                    <Text style={styles.paymentHistoryMonth}>{getPaymentMonthLabel(item)}</Text>
                    <Text style={styles.paymentHistoryDate}>
                      {formatPaymentFullDate(displayDate)}
                    </Text>
                  </View>
                </View>
                <View style={styles.paymentHistoryItemRight}>
                  <Text style={styles.paymentHistoryAmount}>
                    ₹{getPaymentAmount(item).toLocaleString('en-IN')}
                  </Text>
                  {txnId ? (
                    <Text style={styles.paymentHistoryTxn}>{txnId}</Text>
                  ) : null}
                  <Text style={[
                    styles.paymentHistoryStatus,
                    paid && styles.paymentHistoryStatusPaid,
                  ]}>
                    {getPaymentStatusLabel(item)}
                  </Text>
                </View>
              </View>
              );
            })}
          </View>
        )}

        {paymentHistoryExpanded && paymentHistory.length === 0 && (
          <View style={styles.paymentHistoryEmpty}>
            <Text style={styles.paymentHistoryEmptyText}>No payment history available</Text>
          </View>
        )}
      </View>

      {next_payment && (
        <View style={[styles.milestoneCard, isOverdue && styles.milestoneCardOverdue]}>
          <Ionicons
            name={isOverdue ? 'alert-circle-outline' : 'checkmark-circle-outline'}
            size={15}
            color={isOverdue ? '#F39200' : '#00B67A'}
          />
          <View style={styles.milestoneTextWrap}>
            <Text style={styles.milestoneTitle}>
              {isOverdue ? 'Payment Overdue' : 'Next Payment Milestone'}
            </Text>
            <Text style={styles.milestoneBody}>{next_payment.label}</Text>
            {next_payment.text && (
              <Text style={styles.milestoneSubText}>{next_payment.text}</Text>
            )}
            {(next_payment.due_date || next_payment.date) && (
              <Text style={styles.milestoneDueDate}>
                Due: {formatDate(next_payment.due_date || next_payment.date || '')}
              </Text>
            )}
          </View>
        </View>
      )}

      <Pressable style={styles.closeCta} onPress={onClose}>
        <Text style={styles.closeCtaText}>CLOSE</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  loadingState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    paddingHorizontal: 24,
    backgroundColor: '#F8F9FB',
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
  sheetScroll: {
    flex: 1,
    backgroundColor: '#F8F9FB',
  },
  sheetContent: {
    paddingHorizontal: 16,
    paddingTop: 12,
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
  dateCardsRow: {
    flexDirection: 'row',
    gap: 10,
  },
  dateCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dateCardIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFF7E6',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  dateCardLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 1.1,
  },
  dateCardValue: {
    color: '#0F172A',
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    marginTop: 4,
  },
  nomineeCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  nomineeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 14,
  },
  nomineeIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#FFF7E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nomineeHeaderText: {
    color: '#F39200',
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 1.2,
  },
  nomineeBody: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  nomineeField: {
    flex: 1,
  },
  nomineeFieldRight: {
    alignItems: 'flex-end',
  },
  nomineeLabel: {
    color: '#94A3B8',
    fontSize: 9,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 1.1,
  },
  nomineeName: {
    color: '#0F172A',
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    marginTop: 4,
  },
  nomineeRelationWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  nomineeRelation: {
    color: '#F39200',
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
  },
  paymentHistoryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    overflow: 'hidden',
  },
  paymentHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
  },
  paymentHistoryHeaderLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentHistoryIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF7E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentHistoryTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
  },
  paymentHistorySubtitle: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.5,
    marginTop: 2,
  },
  paymentHistoryList: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    padding: 12,
    gap: 10,
  },
  paymentHistoryItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#EEF2F7',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 2,
  },
  paymentHistoryItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  paymentHistoryDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    backgroundColor: '#F9FAFB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  paymentHistoryDotPaid: {
    borderColor: '#A7F3D0',
    backgroundColor: '#D1FAE5',
  },
  paymentHistoryMonth: {
    color: '#0F172A',
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
  },
  paymentHistoryDate: {
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    marginTop: 2,
  },
  paymentHistoryItemRight: {
    alignItems: 'flex-end',
  },
  paymentHistoryAmount: {
    color: '#0F172A',
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
  },
  paymentHistoryTxn: {
    color: '#94A3B8',
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    marginTop: 2,
  },
  paymentHistoryStatus: {
    color: '#6B7280',
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
    marginTop: 4,
    letterSpacing: 0.6,
  },
  paymentHistoryStatusPaid: {
    color: '#00B67A',
  },
  paymentHistoryEmpty: {
    padding: 20,
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  paymentHistoryEmptyText: {
    color: '#94A3B8',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  schemeDetailsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  schemeDetailsHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 14,
  },
  schemeDetailsHeaderText: {
    color: '#3B82F6',
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 1.2,
  },
  schemeDetailsBody: {
    gap: 12,
  },
  schemeDetailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  schemeDetailLabel: {
    color: '#6B7280',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  schemeDetailValue: {
    color: '#1F2937',
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
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
  benefitRow: { flexDirection: 'row', gap: 10, alignItems: 'stretch' },
  benefitCard: {
    flex: 1,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#F2E9D3',
    backgroundColor: '#FFF9EA',
    padding: 12,
    minHeight: 110,
    justifyContent: 'space-between',
  },
  benefitCardGreen: { borderColor: '#CDEEE2', backgroundColor: '#ECFDF5' },
  benefitLabel: {
    color: '#F39200',
    fontSize: 8,
    fontFamily: 'Poppins-Black',
    letterSpacing: 1.1,
    lineHeight: 12,
    minHeight: 24,
  },
  benefitLabelGreen: {
    color: '#059669',
    fontSize: 8,
    fontFamily: 'Poppins-Black',
    letterSpacing: 1.1,
    lineHeight: 12,
    minHeight: 24,
  },
  benefitValue: { color: '#0F172A', fontSize: 20, fontFamily: 'Poppins-BoldItalic' },
  benefitCardContent: {
    gap: 4,
    marginTop: 8,
  },
  benefitCaption: { color: '#94A3B8', fontSize: 8, fontFamily: 'Poppins-Medium' },
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
  milestoneSubText: { color: '#EF4444', fontSize: 10, fontFamily: 'Poppins-Medium', marginTop: 2 },
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
