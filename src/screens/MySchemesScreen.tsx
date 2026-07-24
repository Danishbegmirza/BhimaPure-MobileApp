import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  BackHandler,
  Dimensions,
  Modal,
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
import LinearGradient from 'react-native-linear-gradient';
import type { RootStackParamList } from '../navigation/types';
import { fetchMyPortfolio, type PortfolioScheme, type PortfolioCounts } from '../api/portfolio';
import { getToken } from '../storage/auth';
import { goBackOrDashboard } from '../navigation/backNavigation';
import { BottomTabs } from '../components/BottomTabs';
import { SchemeDetailsSheet } from '../components/SchemeDetailsSheet';
import { useSafeBottomInset } from '../utils/safeBottomInset';

type Props = NativeStackScreenProps<RootStackParamList, 'MySchemes'>;
type FilterState = 'all' | 'active' | 'matured' | 'redeemed';

// ─── Helpers ──────────────────────────────────────────────────────────────────

function statusDotColor(status: string) {
  if (status === 'ACTIVE') { return '#00B67A'; }
  if (status === 'MATURED') { return '#F59E0B'; }
  return '#9CA3AF';
}

function formatDate(dateStr: string): string {
  if (!dateStr) { return '—'; }
  // "2026-07-19" → "JUL 19, 2026"
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) { return dateStr; }
  return d.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  }).toUpperCase();
}

/** Get installment amount from scheme_amount or estimate */
function getInstallmentAmount(scheme: PortfolioScheme): number {
  if (scheme.scheme_amount != null && scheme.scheme_amount > 0) {
    return scheme.scheme_amount;
  }
  const { total_invested, progress_percent } = scheme.metrics;
  if (total_invested > 0 && progress_percent != null && progress_percent > 0) {
    const assumedMonths = 11;
    const paidSlots = Math.max(1, Math.round((progress_percent / 100) * assumedMonths));
    return Math.max(500, Math.round(total_invested / paidSlots));
  }
  return 1000;
}

function formatINR(value: number): string {
  return value.toLocaleString('en-IN');
}

function formatGoldHoldings(value: string | number | null | undefined): string {
  if (value == null || value === '') { return '0g'; }
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) { return '0g'; }
  const trimmed = String(num).replace(/\.?0+$/, '');
  return `${trimmed}g`;
}

function isAverageRateBookingSmart(scheme: PortfolioScheme): boolean {
  return scheme.scheme.name.trim() === 'Average Rate Booking Smart';
}

function requiresCustomAmountEntry(scheme: PortfolioScheme): boolean {
  return scheme.variable_installment_allow === true || isAverageRateBookingSmart(scheme);
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function FilterPill({
  label,
  count,
  active,
  onPress,
}: {
  label: string;
  count: number;
  active: boolean;
  onPress: () => void;
}) {
  return (
    <Pressable style={[styles.filterPill, active && styles.filterPillActive]} onPress={onPress}>
      <Text style={[styles.filterText, active && styles.filterTextActive]}>{label}</Text>
      {count > 0 && (
        <View style={[styles.filterBadge, active && styles.filterBadgeActive]}>
          <Text style={[styles.filterBadgeText, active && styles.filterBadgeTextActive]}>
            {count}
          </Text>
        </View>
      )}
    </Pressable>
  );
}

function SchemePortfolioCard({
  scheme,
  onViewDetails,
  onPrimaryAction,
}: {
  scheme: PortfolioScheme;
  onViewDetails: () => void;
  onPrimaryAction: () => void;
}) {
  const isOverdue = scheme.next_payment?.status === 'OVERDUE';
  const statusUpper = scheme.status?.toUpperCase() || '';
  const isMatured = statusUpper === 'MATURED';
  const isPaymentCompleted = statusUpper === 'PAYMENT COMPLETED';
  const isRedeemed = statusUpper === 'REDEEMED';

  const showActionButton = !isRedeemed && !isPaymentCompleted;
  const actionLabel = isMatured ? 'REDEEM' : 'PAY NOW';
  const showGoldHoldings = scheme.show_gold_holdings === 'yes';

  return (
    <View style={styles.card}>
      {/* Card header */}
      <View style={styles.cardHead}>
        <View style={styles.statusRow}>
          <View style={[styles.statusDot, { backgroundColor: statusDotColor(scheme.status) }]} />
          <Text style={styles.statusText}>{scheme.status}</Text>
          <Text style={styles.orderNo}>· {scheme.order_no}</Text>
        </View>
        {isOverdue && scheme.next_payment ? (
          <View style={styles.badge}>
            <Ionicons name="alert-circle-outline" size={12} color="#F39200" />
            <Text style={styles.badgeText}>{scheme.next_payment.label}</Text>
          </View>
        ) : scheme.next_payment?.is_paid ? (
          <View style={[styles.badge, styles.badgePaid]}>
            <Ionicons name="checkmark-circle-outline" size={12} color="#0F9E63" />
            <Text style={styles.badgeTextPaid}>{scheme.next_payment.label}</Text>
          </View>
        ) : null}
      </View>

      {/* Scheme name + maturity date + progress */}
      <View style={styles.cardMiddle}>
        <View style={styles.nameWrap}>
          <Text style={styles.schemeName}>{scheme.scheme.name}</Text>
          <Text style={styles.metaText}>MATURITY: {formatDate(scheme.maturity_date)}</Text>
        </View>
        {scheme.metrics.progress_percent != null && (
          <View style={styles.progressRing}>
            <Text style={styles.progressText}>{scheme.metrics.progress_percent}%</Text>
          </View>
        )}
      </View>

      {/* Amounts */}
      <View style={styles.amountRow}>
        <View>
          <Text style={styles.amountLabel}>TOTAL INVESTED</Text>
          <Text style={styles.amountValue}>
            ₹{scheme.metrics.total_invested.toLocaleString('en-IN')}
          </Text>
        </View>
        <View style={styles.amountRight}>
          <Text style={showGoldHoldings ? styles.amountValueGoldHoldingsAccent : styles.amountLabel}>
            {showGoldHoldings ? 'GOLD HOLDINGS' : 'ELIGIBLE VALUE'}
          </Text>
          <Text style={styles.amountValueAccent}>
            {showGoldHoldings
              ? formatGoldHoldings(scheme.metrics.gold_holdings)
              : `₹${scheme.metrics.eligible_value.toLocaleString('en-IN')}`}
          </Text>
        </View>
      </View>

      {/* Bonus bar */}
      {scheme.metrics.bonus_amount > 0 && (
        <View style={styles.infoBar}>
          <Ionicons name="flash-outline" size={12} color="#F59E0B" />
          <Text style={styles.infoText}>
            BONUS: ₹{scheme.metrics.bonus_amount.toLocaleString('en-IN')}
            {scheme.metrics.bonus_percent > 0
              ? `  ·  ${scheme.metrics.bonus_percent}% WAIVER`
              : ''}
          </Text>
        </View>
      )}

      {/* Actions */}
      <View style={styles.actionRow}>
        <Pressable
          style={[styles.secondaryButton, !showActionButton && styles.fullWidthButton]}
          onPress={onViewDetails}
        >
          <Text style={styles.secondaryButtonText}>VIEW DETAILS</Text>
        </Pressable>
        {showActionButton && (
          <Pressable
            style={[styles.primaryButton, isMatured && styles.redeemButton]}
            onPress={onPrimaryAction}
          >
            <Text style={styles.primaryButtonText}>{actionLabel}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function MySchemesScreen({ navigation, route }: Props) {
  const safeBottom = useSafeBottomInset();
  const bottomTabHeight = 78 + Math.max(safeBottom, 6);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [totalInvested, setTotalInvested] = useState('0');
  const [bonusEarned, setBonusEarned] = useState('');
  const [counts, setCounts] = useState<PortfolioCounts>({ all: 0, active: 0, matured: 0, redeemed: 0 });

  const [allSchemes, setAllSchemes] = useState<PortfolioScheme[]>([]);
  const [activeSchemes, setActiveSchemes] = useState<PortfolioScheme[]>([]);
  const [maturedSchemes, setMaturedSchemes] = useState<PortfolioScheme[]>([]);
  const [redeemedSchemes, setRedeemedSchemes] = useState<PortfolioScheme[]>([]);

  const [filter, setFilter] = useState<FilterState>('all');

  // ── Variable installment amount modal state ─────────────────────────────────
  const [isAmountModalVisible, setIsAmountModalVisible] = useState(false);
  const [selectedSchemeForPayment, setSelectedSchemeForPayment] = useState<PortfolioScheme | null>(null);
  const [tempAmount, setTempAmount] = useState<string>('');
  const [amountError, setAmountError] = useState<string>('');
  const slideAnim = useRef(new Animated.Value(0)).current;

  const [detailsSchemeId, setDetailsSchemeId] = useState<number | null>(null);
  const [heroHeight, setHeroHeight] = useState(0);
  const detailsSlideAnim = useRef(new Animated.Value(0)).current;

  const loadPortfolio = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) {
        setError('Please log in to view your portfolio.');
        return;
      }
      const result = await fetchMyPortfolio(token);
      console.log('fetchMyPortfolio', result);
      if (result.success) {
        setTotalInvested(result.totalInvested ?? '0');
        setBonusEarned(result.bonusearned ?? '');
        setCounts(result.counts);
        setAllSchemes(result.all ?? []);
        setActiveSchemes(result.active ?? []);
        setMaturedSchemes(result.matured ?? []);
        setRedeemedSchemes(result.redeemed ?? []);
      } else {
        setError(result.message ?? 'Failed to load portfolio.');
      }
    } catch (_e) {
      setError('Unable to load portfolio. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPortfolio();
  }, [loadPortfolio]);

  const filteredSchemes: PortfolioScheme[] = (() => {
    switch (filter) {
      case 'active': return activeSchemes;
      case 'matured': return maturedSchemes;
      case 'redeemed': return redeemedSchemes;
      default: return allSchemes;
    }
  })();

  // ── Amount validation ──────────────────────────────────────────────────────
  const validateInstallmentAmount = useCallback((amountStr: string, scheme: PortfolioScheme): string => {
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount === 0) { return ''; }

    const minAmount = parseFloat(scheme.scheme?.min_amount || '500');
    const maxAmount = parseFloat(scheme.scheme?.max_amount || '100000');
    const multipleOf = scheme.scheme?.multiple_of || 1;

    if (amount < minAmount) {
      return `Amount should be at least ₹${formatINR(minAmount)}.`;
    }
    if (amount > maxAmount) {
      return `Amount should not exceed ₹${formatINR(maxAmount)}.`;
    }
    if (multipleOf > 1 && amount % multipleOf !== 0) {
      return `Please enter an amount in multiples of ₹${formatINR(multipleOf)}.`;
    }
    return '';
  }, []);

  // ── Modal handlers ─────────────────────────────────────────────────────────
  const openAmountModal = useCallback((scheme: PortfolioScheme) => {
    setSelectedSchemeForPayment(scheme);
    setTempAmount(
      isAverageRateBookingSmart(scheme)
        ? ''
        : (scheme.scheme_amount?.toString() || ''),
    );
    setAmountError('');
    setIsAmountModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [slideAnim]);

  const closeAmountModal = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsAmountModalVisible(false);
      setSelectedSchemeForPayment(null);
      setAmountError('');
    });
  }, [slideAnim]);

  const openDetails = useCallback((schemeId: number) => {
    setDetailsSchemeId(schemeId);
    Animated.spring(detailsSlideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [detailsSlideAnim]);

  const closeDetails = useCallback(() => {
    Animated.timing(detailsSlideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setDetailsSchemeId(null);
    });
  }, [detailsSlideAnim]);

  useEffect(() => {
    const openId = route.params?.openSchemeId;
    if (openId) {
      openDetails(Number(openId));
      navigation.setParams({ openSchemeId: undefined });
    }
  }, [route.params?.openSchemeId, openDetails, navigation]);

  useEffect(() => {
    if (detailsSchemeId === null) { return undefined; }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      closeDetails();
      return true;
    });
    return () => subscription.remove();
  }, [detailsSchemeId, closeDetails]);

  const handleNumpadPress = useCallback((digit: string) => {
    setTempAmount(prev => {
      if (digit === 'backspace') {
        return prev.slice(0, -1);
      }
      if (digit === '000') {
        return prev + '000';
      }
      const newAmount = prev + digit;
      if (parseInt(newAmount, 10) > 10000000) { return prev; }
      return newAmount;
    });
    setAmountError('');
  }, []);

  const handleConfirmAmount = useCallback(() => {
    if (!selectedSchemeForPayment || !tempAmount) { return; }
    const error = validateInstallmentAmount(tempAmount, selectedSchemeForPayment);
    if (error) {
      setAmountError(error);
      return;
    }
    const amount = parseInt(tempAmount, 10);
    closeAmountModal();
    navigation.navigate('PaymentMethod', {
      schemeId: String(selectedSchemeForPayment.id),
      customerSchemeId: selectedSchemeForPayment.id,
      paymentContext: 'INSTALLMENT_PAYMENT',
      amount: amount,
      schemeDisplayName: selectedSchemeForPayment.scheme.name,
    });
  }, [selectedSchemeForPayment, tempAmount, validateInstallmentAmount, closeAmountModal, navigation]);

  // ── Handle pay now action ──────────────────────────────────────────────────
  const handlePayNow = useCallback((scheme: PortfolioScheme) => {
    if (requiresCustomAmountEntry(scheme)) {
      openAmountModal(scheme);
    } else {
      const amount = getInstallmentAmount(scheme);
      navigation.navigate('PaymentMethod', {
        schemeId: String(scheme.id),
        customerSchemeId: scheme.id,
        paymentContext: 'INSTALLMENT_PAYMENT',
        amount: amount,
        schemeDisplayName: scheme.scheme.name,
      });
    }
  }, [navigation, openAmountModal]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      <View style={styles.screenBody}>
        <View
          style={styles.hero}
          onLayout={event => setHeroHeight(event.nativeEvent.layout.height)}
        >
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
              <Text style={styles.metricLabel}>TOTAL INVESTED</Text>
              <Text style={styles.metricValue}>
                ₹{parseFloat(totalInvested || '0').toLocaleString('en-IN')}
              </Text>
            </View>
            <View style={styles.metricRight}>
              <Text style={styles.metricLabel}>BONUS EARNED</Text>
              <Text style={styles.metricAccent}>
                {bonusEarned
                  ? `₹${parseFloat(bonusEarned).toLocaleString('en-IN')}`
                  : '—'}
              </Text>
            </View>
          </View>

          <Pressable style={styles.joinButton} onPress={() => navigation.navigate('SelectScheme')}>
            <LinearGradient
              colors={['#FFA800', '#F38B00']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.joinButtonGradient}
            >
              <Ionicons name="add" size={15} color="#FFFFFF" />
              <Text style={styles.joinButtonText}>JOIN NEW SCHEME</Text>
            </LinearGradient>
          </Pressable>

          <View style={styles.heroSpacer} />
        </View>

      <ScrollView
        style={styles.listScroll}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 100 + safeBottom }]}
      >
        {/* Filter pills */}
        <View style={styles.filterRow}>
          <FilterPill
            label="ALL"
            count={counts.all}
            active={filter === 'all'}
            onPress={() => setFilter('all')}
          />
          <FilterPill
            label="ACTIVE"
            count={counts.active}
            active={filter === 'active'}
            onPress={() => setFilter('active')}
          />
          <FilterPill
            label="MATURED"
            count={counts.matured}
            active={filter === 'matured'}
            onPress={() => setFilter('matured')}
          />
          <FilterPill
            label="REDEEMED"
            count={counts.redeemed}
            active={filter === 'redeemed'}
            onPress={() => setFilter('redeemed')}
          />
        </View>

        {/* Content */}
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#E88800" />
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
        ) : filteredSchemes.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="file-tray-outline" size={40} color="#D1D5DB" />
            <Text style={styles.emptyText}>No schemes found in this category.</Text>
          </View>
        ) : (
          filteredSchemes.map(scheme => (
            <SchemePortfolioCard
              key={scheme.id}
              scheme={scheme}
              onViewDetails={() => openDetails(scheme.id)}
              onPrimaryAction={() =>
                scheme.status === 'MATURED'
                  ? navigation.navigate('GoldRedemption', { schemeId: String(scheme.id) })
                  : handlePayNow(scheme)
              }
            />
          ))
        )}

        {/* Footer prompt */}
        {!loading && !error && filteredSchemes.length > 0 && (
          <View style={styles.footerPrompt}>
            <Ionicons name="sparkles-outline" size={16} color="#FBBF24" />
            <Text style={styles.footerMain}>Stay consistent, secure your bonus.</Text>
            <Text style={styles.footerSub}>KEEP UP YOUR MONTHLY INSTALLMENTS ON TIME.</Text>
          </View>
        )}
      </ScrollView>

      {detailsSchemeId !== null && (
        <View style={styles.detailsOverlay} pointerEvents="box-none">
          <Pressable
            style={[styles.detailsBackdrop, { top: heroHeight, bottom: bottomTabHeight }]}
            onPress={closeDetails}
          />
          <Animated.View
            style={[
              styles.detailsSheet,
              {
                transform: [{
                  translateY: detailsSlideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [Dimensions.get('window').height, 0],
                  }),
                }],
              },
            ]}
          >
            <SchemeDetailsSheet
              schemeId={detailsSchemeId}
              onClose={closeDetails}
              bottomPadding={bottomTabHeight + 16}
            />
          </Animated.View>
        </View>
      )}

      <View style={styles.bottomTabsLayer}>
        <BottomTabs navigation={navigation} activeTab="mySchemes" />
      </View>
      </View>

      {/* ── Variable Installment Amount Modal ─────────────────────────────────── */}
      <Modal
        visible={isAmountModalVisible}
        transparent
        animationType="none"
        onRequestClose={closeAmountModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeAmountModal}>
          <Animated.View
            style={[
              styles.modalContent,
              {
                transform: [{
                  translateY: slideAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [Dimensions.get('window').height, 0],
                  }),
                }],
              },
            ]}
          >
            <Pressable onPress={() => {}}>
              <View style={styles.modalHandle} />

              <Text style={styles.modalLabel}>
                {selectedSchemeForPayment && isAverageRateBookingSmart(selectedSchemeForPayment)
                  ? 'ENTER YOUR AMOUNT'
                  : 'INSTALLMENT AMOUNT'}
              </Text>

              <View style={styles.modalAmountDisplay}>
                <Text style={styles.rupeeSymbol}>₹</Text>
                <Text style={styles.modalAmountText}>
                  {tempAmount || '0'}
                </Text>
              </View>

              <Text style={styles.modalHint}>
                {tempAmount ? 'CONFIRM YOUR INSTALLMENT AMOUNT' : 'ENTER AMOUNT TO PAY'}
              </Text>

              {selectedSchemeForPayment && isAverageRateBookingSmart(selectedSchemeForPayment) && (
                <View style={styles.helperWrap}>
                  <Ionicons name="information-circle-outline" size={14} color="#9CA3AF" />
                  <Text style={styles.helperText}>
                    Minimum amount: ₹{formatINR(parseFloat(selectedSchemeForPayment.scheme.min_amount || '100'))}
                    {selectedSchemeForPayment.scheme.multiple_of && selectedSchemeForPayment.scheme.multiple_of > 1
                      ? `  ·  Multiples of ₹${formatINR(selectedSchemeForPayment.scheme.multiple_of)}`
                      : ''}
                  </Text>
                </View>
              )}

              {selectedSchemeForPayment?.scheme?.multiple_of
                && selectedSchemeForPayment.scheme.multiple_of > 1
                && !isAverageRateBookingSmart(selectedSchemeForPayment) && (
                <View style={styles.helperWrap}>
                  <Ionicons name="information-circle-outline" size={14} color="#9CA3AF" />
                  <Text style={styles.helperText}>
                    Enter amount in multiples of ₹{formatINR(selectedSchemeForPayment.scheme.multiple_of)}
                  </Text>
                </View>
              )}

              {amountError ? (
                <View style={styles.modalErrorWrap}>
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  <Text style={styles.modalErrorText}>{amountError}</Text>
                </View>
              ) : null}

              {/* Numpad */}
              <View style={styles.numpad}>
                {[
                  ['1', '2', '3'],
                  ['4', '5', '6'],
                  ['7', '8', '9'],
                  ['000', '0', 'backspace'],
                ].map((row, rowIndex) => (
                  <View key={rowIndex} style={styles.numpadRow}>
                    {row.map(key => (
                      <Pressable
                        key={key}
                        style={[
                          styles.numpadKey,
                          key === 'backspace' && styles.numpadKeyBackspace,
                        ]}
                        onPress={() => handleNumpadPress(key)}
                      >
                        {key === 'backspace' ? (
                          <Ionicons name="backspace-outline" size={22} color="#F5F5F3" />
                        ) : (
                          <Text style={styles.numpadKeyText}>{key}</Text>
                        )}
                      </Pressable>
                    ))}
                  </View>
                ))}
              </View>

              {/* Confirm button */}
              <Pressable
                style={[
                  styles.modalConfirmButton,
                  (!tempAmount || (selectedSchemeForPayment && validateInstallmentAmount(tempAmount, selectedSchemeForPayment))) && styles.modalConfirmButtonDisabled,
                ]}
                onPress={handleConfirmAmount}
                disabled={!tempAmount || !!(selectedSchemeForPayment && validateInstallmentAmount(tempAmount, selectedSchemeForPayment))}
              >
                <Text style={styles.modalConfirmText}>
                  {tempAmount
                    ? `PAY ₹${formatINR(parseInt(tempAmount, 10))}`
                    : 'ENTER AN AMOUNT'}
                </Text>
              </Pressable>
            </Pressable>
          </Animated.View>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F3',
  },
  screenBody: {
    flex: 1,
  },
  listScroll: {
    flex: 1,
    backgroundColor: '#F5F5F3',
  },
  content: {
    paddingBottom: 24,
    gap: 14,
  },
  hero: {
    backgroundColor: '#050505',
    borderBottomLeftRadius: 42,
    borderBottomRightRadius: 42,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 20,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 24,
    paddingBottom: 16,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121820',
  },
  portfolioLabelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
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
  portfolioTitle: {
    color: '#F8FAFC',
    fontSize: 20,
    fontFamily: 'Poppins-BoldItalic',
  },
  heroMetrics: {
    marginTop: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 10,
  },
  metricLabel: {
    color: '#7A8596',
    fontSize: 9,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 1.4,
  },
  metricValue: {
    marginTop: 4,
    color: '#F9FAFB',
    fontSize: 24,
    fontFamily: 'Poppins-Black',
  },
  metricRight: {
    alignItems: 'flex-end',
  },
  metricAccent: {
    marginTop: 6,
    color: '#FBBF24',
    fontSize: 22,
    fontFamily: 'Poppins-Black',
  },
  joinButton: {
    marginTop: 18,
    minHeight: 44,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    marginHorizontal: 10,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 14,
    elevation: 4,
  },
  joinButtonGradient: {
    width: '100%',
    minHeight: 44,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 7,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Poppins-Black',
    letterSpacing: 1.4,
  },
  heroSpacer: {
    marginBottom: 8,
  },
  filterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
    paddingHorizontal: 14,
    marginTop: 15,
  },
  filterPill: {
    flex: 1,
    minHeight: 34,
    borderRadius: 17,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ECEFF3',
    flexDirection: 'row',
    gap: 4,
    paddingHorizontal: 6,
  },
  filterPillActive: {
    backgroundColor: '#111827',
  },
  filterText: {
    color: '#8F97A5',
    fontSize: 9,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.9,
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  filterBadge: {
    backgroundColor: '#D1D5DB',
    borderRadius: 999,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  filterBadgeActive: {
    backgroundColor: 'rgba(255,255,255,0.22)',
  },
  filterBadgeText: {
    color: '#6B7280',
    fontSize: 8,
    fontFamily: 'Poppins-Black',
  },
  filterBadgeTextActive: {
    color: '#FFFFFF',
  },
  loadingWrap: {
    paddingVertical: 60,
    alignItems: 'center',
  },
  errorWrap: {
    paddingVertical: 40,
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 24,
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
  emptyWrap: {
    paddingVertical: 50,
    alignItems: 'center',
    gap: 10,
  },
  emptyText: {
    color: '#9CA3AF',
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  card: {
    marginHorizontal: 14,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEFF3',
    padding: 14,
    gap: 12,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  cardHead: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  statusText: {
    color: '#0F172A',
    fontSize: 9,
    fontFamily: 'Poppins-Black',
    letterSpacing: 1.1,
  },
  orderNo: {
    color: '#9CA3AF',
    fontSize: 9,
    fontFamily: 'Poppins-SemiBold',
  },
  badge: {
    borderWidth: 1,
    borderColor: '#F9DC9D',
    backgroundColor: '#FFF8E8',
    borderRadius: 13,
    paddingHorizontal: 8,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgePaid: {
    borderColor: '#BBF7D0',
    backgroundColor: '#F0FFF6',
  },
  badgeText: {
    color: '#A16207',
    fontSize: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  badgeTextPaid: {
    color: '#047857',
    fontSize: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  cardMiddle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginHorizontal: 8,
  },
  nameWrap: {
    flex: 1,
    paddingRight: 10,
  },
  schemeName: {
    color: '#0F172A',
    fontSize: 17,
    fontFamily: 'Poppins-BoldItalic',
  },
  metaText: {
    marginTop: 2,
    color: '#94A3B8',
    fontSize: 10,
    letterSpacing: 0.9,
    fontFamily: 'Poppins-SemiBold',
  },
  progressRing: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 3,
    borderColor: '#F59E0B',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressText: {
    color: '#0F172A',
    fontSize: 10,
    fontFamily: 'Poppins-Black',
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginHorizontal: 8,
    marginTop: 12,
  },
  amountLabel: {
    color: '#94A3B8',
    fontSize: 8,
    letterSpacing: 1.1,
    fontFamily: 'Poppins-SemiBold',
  },
  amountValue: {
    marginTop: 2,
    color: '#0F172A',
    fontSize: 22,
    fontFamily: 'Poppins-BoldItalic',
  },
  amountRight: {
    alignItems: 'flex-end',
  },
  amountValueAccent: {
    marginTop: 2,
    color: '#F39200',
    fontSize: 22,
    fontFamily: 'Poppins-BoldItalic',
  },
  amountValueGoldHoldingsAccent: {
    color: '#F39200',
    marginTop: 2,
    fontSize: 8,
    letterSpacing: 1.1,
    fontFamily: 'Poppins-Bold'
  },
  infoBar: {
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    minHeight: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    paddingHorizontal: 10,
    marginTop: 4,
  },
  infoText: {
    color: '#475569',
    fontSize: 9,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.6,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  secondaryButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullWidthButton: {
    flex: 2,
  },
  secondaryButtonText: {
    color: '#111827',
    fontSize: 10,
    fontFamily: 'Poppins-Black',
    letterSpacing: 1,
  },
  primaryButton: {
    flex: 1,
    minHeight: 40,
    borderRadius: 12,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.14,
    shadowRadius: 10,
    elevation: 3,
  },
  redeemButton: {
    backgroundColor: '#F7A714',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontFamily: 'Poppins-Black',
    letterSpacing: 1,
  },
  footerPrompt: {
    marginHorizontal: 14,
    marginTop: 2,
    borderRadius: 20,
    backgroundColor: '#111827',
    paddingVertical: 20,
    paddingHorizontal: 14,
    alignItems: 'center',
    gap: 6,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 12,
    elevation: 3,
  },
  footerMain: {
    color: '#F8FAFC',
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
  },
  footerSub: {
    color: '#94A3B8',
    fontSize: 8,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 1.3,
  },
  // ── Amount Entry Modal ─────────────────────────────────────────────────────
  detailsOverlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 30,
    elevation: 30,
  },
  detailsBackdrop: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  detailsSheet: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '78%',
    backgroundColor: '#F8F9FB',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    overflow: 'hidden',
    zIndex: 31,
    elevation: 31,
  },
  bottomTabsLayer: {
    zIndex: 40,
    elevation: 40,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 34,
  },
  modalHandle: {
    width: 48,
    height: 5,
    borderRadius: 3,
    backgroundColor: '#4B5563',
    alignSelf: 'center',
    marginBottom: 20,
  },
  modalLabel: {
    color: '#9CA3AF',
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 2,
    textAlign: 'center',
  },
  modalAmountDisplay: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 16,
    marginBottom: 8,
  },
  rupeeSymbol: {
    color: '#F39200',
    fontSize: 32,
    fontFamily: 'Poppins-Bold',
    marginRight: 4,
  },
  modalAmountText: {
    color: '#FFFFFF',
    fontSize: 56,
    fontFamily: 'Poppins-Black',
  },
  modalHint: {
    color: '#F39200',
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 1.5,
    textAlign: 'center',
    marginBottom: 16,
  },
  helperWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 12,
  },
  helperText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
  },
  modalErrorWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  modalErrorText: {
    color: '#EF4444',
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  numpad: {
    gap: 10,
  },
  numpadRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
  },
  numpadKey: {
    width: 100,
    height: 56,
    borderRadius: 14,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  numpadKeyBackspace: {
    backgroundColor: '#3D3D00',
  },
  numpadKeyText: {
    color: '#F5F5F3',
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
  },
  modalConfirmButton: {
    marginTop: 20,
    minHeight: 56,
    borderRadius: 24,
    backgroundColor: '#F5C842',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalConfirmButtonDisabled: {
    backgroundColor: '#3D3D3D',
  },
  modalConfirmText: {
    color: '#111827',
    fontSize: 12,
    fontFamily: 'Poppins-Black',
    letterSpacing: 1.1,
  },
});
