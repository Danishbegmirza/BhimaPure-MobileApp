import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
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
import { useSafeBottomInset } from '../utils/safeBottomInset';
import {
  fetchSchemesByType,
  fetchSchemeMaturity,
  type SchemeTypeDetail,
  type SchemeEntry,
  type SchemeMaturityResponse,
  type ProjectedMaturity,
} from '../api/schemes';
import { initiateSchemeEnrollment } from '../api/customerSchemes';
import { getToken } from '../storage/auth';
import { UnauthenticatedError } from '../api/apiClient';

type Props = NativeStackScreenProps<RootStackParamList, 'SchemeDetails'>;

// Parse "11 Months" → 11, null → 11 (fallback)
function parseDuration(duration: string | null): number {
  if (!duration) { return 11; }
  const match = duration.match(/\d+/);
  return match ? parseInt(match[0], 10) : 11;
}

// Safe INR formatter
function formatINR(value: number): string {
  return value.toLocaleString('en-IN');
}

function parseMoneyField(v: string | number | undefined | null): number {
  if (v === '' || v == null) { return NaN; }
  return typeof v === 'number' ? v : parseFloat(String(v));
}

function parseBonusAmount(m: SchemeMaturityResponse | ProjectedMaturity): number {
  const n = parseMoneyField(m.bonus as string | number);
  return Number.isFinite(n) ? n : 0;
}

/** Total maturity for display; handles empty strings from API. */
function displayTotalMaturityAmount(m: SchemeMaturityResponse): string {
  const raw = m.total_maturity_amount;
  if (raw !== '' && raw != null) {
    const n = typeof raw === 'number' ? raw : parseFloat(String(raw));
    if (Number.isFinite(n)) { return formatINR(n); }
  }
  const tw = m.total_without_bonus;
  const b = parseBonusAmount(m);
  if (Number.isFinite(tw)) {
    return formatINR(tw + b);
  }
  return '—';
}

function hasEstimatedGoldInResponse(
  gold: unknown,
): gold is number | string {
  if (gold == null) { return false; }
  if (typeof gold === 'number' && Number.isFinite(gold)) { return true; }
  if (typeof gold === 'string' && gold.trim() !== '') {
    return !Number.isNaN(parseFloat(gold.trim()));
  }
  return false;
}

function toEstimatedGoldNumber(gold: number | string): number {
  return typeof gold === 'number' ? gold : parseFloat(String(gold).trim());
}

function formatGoldRowLabel(weightIn: string | null | undefined): string {
  const base = (weightIn || 'grams').trim();
  return `EST. GOLD (${base.toUpperCase()})`;
}

function formatGoldRowValue(grams: number, weightIn: string | null | undefined): string {
  const w = (weightIn || 'grams').toLowerCase();
  const num = grams.toLocaleString('en-IN', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 3,
  });
  if (w === 'grams' || w === 'gram') {
    return `~${num}g`;
  }
  return `~${num}`;
}

export function SchemeDetailsScreen({ navigation, route }: Props) {
  const safeBottom = useSafeBottomInset();
  const schemeTypeId = Number(route.params.schemeId);

  // ── Loading states ─────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Scheme type data ───────────────────────────────────────────────────────
  const [schemeTypeData, setSchemeTypeData] = useState<SchemeTypeDetail | null>(null);

  // ── Selected scheme tab ────────────────────────────────────────────────────
  const [selectedScheme, setSelectedScheme] = useState<SchemeEntry | null>(null);

  // ── Maturity data (from /api/schemes/:id) ─────────────────────────────────
  const [maturity, setMaturity] = useState<SchemeMaturityResponse | null>(null);
  const [maturityLoading, setMaturityLoading] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [joiningScheme, setJoiningScheme] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Fetch scheme type details ──────────────────────────────────────────────
  const loadSchemeType = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchSchemesByType(schemeTypeId);
      if (result.success && result.schemetype) {
        const detail = result.schemetype;
        const mergedPm = detail.projected_maturity ?? result.projected_maturity ?? null;
        const nextDetail: SchemeTypeDetail = mergedPm
          ? { ...detail, projected_maturity: mergedPm }
          : detail;
        setSchemeTypeData(nextDetail);

        // Pick the popular scheme as the default selection, or the first one
        const schemes = nextDetail.scheme ?? [];
        const popular = schemes.find(s => s.id === nextDetail.popular_scheme);
        const defaultScheme = popular ?? schemes[0] ?? null;
        setSelectedScheme(defaultScheme);

        if (defaultScheme) {
          // Pre-load maturity for the default scheme
          const matResult = await fetchSchemeMaturity(defaultScheme.id);
          if (matResult.success) { setMaturity(matResult); }
        }
      } else {
        setError(result.message ?? 'Failed to load scheme details.');
      }
    } catch (_e) {
      setError('Unable to load details. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [schemeTypeId]);

  useEffect(() => {
    loadSchemeType();
  }, [loadSchemeType]);

  // ── Handle scheme tab press ────────────────────────────────────────────────
  const handleSchemeTabPress = useCallback(async (scheme: SchemeEntry) => {
    if (scheme.id === selectedScheme?.id) { return; }
    setSelectedScheme(scheme);
    try {
      setMaturityLoading(true);
      const result = await fetchSchemeMaturity(scheme.id);
      if (result.success) { setMaturity(result); }
    } catch (_e) {
      // keep previous maturity on error
    } finally {
      setMaturityLoading(false);
    }
  }, [selectedScheme]);

  // ── Derived values ─────────────────────────────────────────────────────────
  const durationMonths = parseDuration(schemeTypeData?.duration ?? null);
  const hasBonus =
    maturity != null &&
    parseBonusAmount(maturity) > 0;

  const projectedFromType = schemeTypeData?.projected_maturity;
  const estimatedGoldRaw =
    maturity?.estimated_gold != null
      ? maturity.estimated_gold
      : projectedFromType?.estimated_gold;
  const weightInForGold =
    maturity?.weight_in ?? projectedFromType?.weight_in;
  const showEstimatedGoldRow = hasEstimatedGoldInResponse(estimatedGoldRaw);
  const canJoinScheme = !!selectedScheme && hasAcceptedTerms && !joiningScheme;

  const showToast = useCallback((message: string) => {
    setToastMessage(message);
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
    toastTimerRef.current = setTimeout(() => {
      setToastMessage('');
      toastTimerRef.current = null;
    }, 2200);
  }, []);

  useEffect(() => () => {
    if (toastTimerRef.current) {
      clearTimeout(toastTimerRef.current);
    }
  }, []);

  const handleJoinScheme = useCallback(async () => {
    if (!selectedScheme || joiningScheme) { return; }
    if (!hasAcceptedTerms) {
      showToast('Please accept terms and condition');
      return;
    }
    try {
      setJoiningScheme(true);
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Please log in to continue.');
        return;
      }

      const init = await initiateSchemeEnrollment(token, selectedScheme.id);
      if (!init.success || init.customerSchemeId == null) {
        Alert.alert('Unable to join', init.message ?? 'Enrollment could not be started.');
        return;
      }

      const monthly = parseFloat(
        (maturity?.success && maturity.monthly_amount
          ? maturity.monthly_amount
          : selectedScheme.min_amount) ?? '0',
      );
      navigation.navigate('JoinScheme', {
        schemeId: String(selectedScheme.id),
        apiSchemeId: selectedScheme.id,
        customerSchemeId: init.customerSchemeId,
        schemeName: schemeTypeData?.scheme_type_name ?? 'Scheme',
        monthlyAmount: Number.isFinite(monthly) && monthly > 0 ? monthly : 1000,
        maturityLabel: maturity?.success
          ? `₹${displayTotalMaturityAmount(maturity)}`
          : undefined,
      });
    } catch (e) {
      if (e instanceof UnauthenticatedError) { return; }
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setJoiningScheme(false);
    }
  }, [
    hasAcceptedTerms,
    joiningScheme,
    maturity,
    navigation,
    schemeTypeData?.scheme_type_name,
    selectedScheme,
    showToast,
  ]);

  // ── Loading / Error screens ────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F5F3" />
        <View style={styles.centeredWrap}>
          <ActivityIndicator size="large" color="#E88800" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !schemeTypeData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F5F3" />
        <View style={styles.centeredWrap}>
          <Ionicons name="alert-circle-outline" size={40} color="#E05252" />
          <Text style={styles.errorText}>{error ?? 'Something went wrong.'}</Text>
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

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F3" />
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 170 + safeBottom }]}
      >

        {/* Header */}
        <View style={styles.header}>
          <Pressable onPress={() => goBackOrDashboard(navigation)} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </Pressable>
          <Text style={styles.headerLogo}>BHIMA SECURE</Text>
        </View>

        {/* Title block */}
        <Text style={styles.title}>{schemeTypeData.scheme_type_name}</Text>
        <Text style={styles.tagline}>{schemeTypeData.short_description.toUpperCase()}</Text>
        {schemeTypeData.duration ? (
          <Text style={styles.subtitle}>
            "Save for {durationMonths} months{hasBonus ? '. Get 1 month bonus' : ''}."
          </Text>
        ) : (
          <Text style={styles.subtitle}>"{schemeTypeData.short_description}"</Text>
        )}

        {/* Benefit card – only for plans with a bonus */}
        {hasBonus && (
          <View style={styles.benefitCard}>
            <View style={styles.benefitIcon}>
              <Ionicons name="gift-outline" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.benefitBody}>
              <Text style={styles.benefitLabel}>EXCLUSIVE BENEFIT</Text>
              <Text style={styles.benefitText}>
                Complete {durationMonths} installments – Get 1 month installment{' '}
                <Text style={styles.benefitTextFree}>free</Text>.
              </Text>
            </View>
          </View>
        )}

        {/* Scheme briefing */}
        <View style={styles.briefCard}>
          <Text style={styles.sectionLabel}>SCHEME BRIEFING</Text>
          <View style={styles.briefTopRow}>
            <View style={styles.briefIconWrap}>
              <Ionicons name="cash-outline" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.briefText}>
              {schemeTypeData.min_amount && schemeTypeData.max_amount ? (
                <>
                  Monthly installments from{' '}
                  <Text style={styles.briefTextAccent}>
                    ₹{parseFloat(schemeTypeData.min_amount).toLocaleString('en-IN')}
                  </Text>{' '}
                  to{' '}
                  <Text style={styles.briefTextAccent}>
                    ₹{parseFloat(schemeTypeData.max_amount).toLocaleString('en-IN')}
                  </Text>.
                </>
              ) : (
                'Flexible monthly installments available.'
              )}
            </Text>
          </View>

          {hasBonus && (
            <View style={styles.bonusInline}>
              <View style={styles.bonusTopRow}>
                <View style={styles.bonusIconWrap}>
                  <Ionicons name="gift-outline" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.bonusTextWrap}>
                  <Text style={styles.bonusInlineLabel}>SCHEME BENEFIT</Text>
                  <Text style={styles.bonusInlineValue}>
                    Complete {durationMonths} installments and{'\n'}receive
                  </Text>
                </View>
              </View>
              <View style={styles.bonusBadge}>
                <Text style={styles.bonusBadgeText}>1 month installment as a bonus</Text>
              </View>
            </View>
          )}

          {schemeTypeData.duration ? (
            <View style={styles.durationRow}>
              <Ionicons name="time-outline" size={13} color="#F39200" />
              <Text style={styles.durationText}>{schemeTypeData.duration}</Text>
            </View>
          ) : null}
        </View>

        {/* ── Scheme plan tabs ──────────────────────────────────────────────── */}
        {(schemeTypeData.scheme ?? []).length > 0 && (
          <>
            <Text style={styles.sectionLabel}>SELECT PLAN</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tabsScrollContent}
            >
              {(schemeTypeData.scheme ?? []).map(scheme => {
                const isActive = scheme.id === selectedScheme?.id;
                const isPopular = scheme.id === schemeTypeData.popular_scheme;
                return (
                  <Pressable
                    key={scheme.id}
                    style={[styles.schemeTab, isActive && styles.schemeTabActive]}
                    onPress={() => handleSchemeTabPress(scheme)}
                  >
                    {isPopular && (
                      <View style={styles.popularDot}>
                        <Ionicons name="star" size={7} color="#FFFFFF" />
                      </View>
                    )}
                    <Text style={[styles.schemeTabAmount, isActive && styles.schemeTabAmountActive]}>
                      ₹{parseFloat(scheme.min_amount).toLocaleString('en-IN')}
                    </Text>
                    <Text style={[styles.schemeTabSub, isActive && styles.schemeTabSubActive]}>
                      {scheme.duration} mo
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </>
        )}

        {/* ── Projected maturity card ───────────────────────────────────────── */}
        <View style={styles.projectionCard}>
          {maturityLoading ? (
            <View style={styles.maturityLoadingWrap}>
              <ActivityIndicator size="small" color="#E88800" />
              <Text style={styles.maturityLoadingText}>Calculating maturity…</Text>
            </View>
          ) : maturity ? (
            <>
              <View style={styles.projectedMaturityHeader}>
                <Ionicons name="trending-up" size={16} color="#0D9488" />
                <Text style={styles.projectedMaturityTitle}>PROJECTED MATURITY</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>MONTHLY AMOUNT</Text>
                <Text style={styles.infoValue}>
                  ₹{formatINR(parseFloat(maturity.monthly_amount || '0'))}
                </Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>{maturity.duration}-MONTH TOTAL</Text>
                <Text style={styles.infoValue}>
                  ₹{formatINR(maturity.total_without_bonus)}
                </Text>
              </View>

              {parseBonusAmount(maturity) > 0 && (
                <View style={styles.infoRow}>
                  <View style={styles.bonusLabelWithBadge}>
                    <Text style={styles.infoKey}>SCHEME BONUS</Text>
                    <View style={styles.giftBadge}>
                      <Text style={styles.giftBadgeText}>GIFT</Text>
                    </View>
                  </View>
                  <Text style={styles.bonusValueAccent}>
                    +₹{formatINR(parseBonusAmount(maturity))}
                  </Text>
                </View>
              )}

              {showEstimatedGoldRow && (
                <View style={styles.estGoldRow}>
                  <Text style={styles.estGoldLabel}>
                    {formatGoldRowLabel(weightInForGold)}
                  </Text>
                  <Text style={styles.estGoldValue}>
                    {formatGoldRowValue(
                      toEstimatedGoldNumber(estimatedGoldRaw as number | string),
                      weightInForGold,
                    )}
                  </Text>
                </View>
              )}

              <View style={styles.divider} />
              <View style={styles.infoRow}>
                <Text style={styles.totalLabel}>TOTAL MATURITY VALUE</Text>
                <Text style={styles.totalValue}>
                  ₹{displayTotalMaturityAmount(maturity)}
                </Text>
              </View>
            </>
          ) : (
            <Text style={styles.maturityPlaceholder}>
              Select a plan above to see projected maturity.
            </Text>
          )}
        </View>

        {/* ── Savings timeline ─────────────────────────────────────────────── */}
        {maturity && (
          <View style={styles.timelineSection}>
            <Text style={styles.timelineTitle}>SAVINGS TIMELINE</Text>
            <View style={styles.timelineTrack}>
              {Array.from({ length: maturity.duration }, (_, i) => (
                <View key={`month-${i + 1}`} style={styles.timelineBar} />
              ))}
              {parseBonusAmount(maturity) > 0 && (
                <View style={[styles.timelineBar, styles.timelineBarBonus]} />
              )}
            </View>
            <View style={styles.timelineLabelRow}>
              <View style={styles.timelineMonthLabels}>
                {Array.from({ length: maturity.duration }, (_, i) => (
                  <Text key={`label-${i + 1}`} style={styles.timelineMonthLabel}>
                    {i + 1}
                  </Text>
                ))}
              </View>
              {parseBonusAmount(maturity) > 0 && (
                <Text style={styles.timelineBonusLabel}>BONUS</Text>
              )}
            </View>
            <Text style={styles.timelineCaption}>
              {maturity.duration} MONTHS SAVING PERIOD
              {parseBonusAmount(maturity) > 0 ? ' + 1 MONTH BONUS' : ''}
            </Text>
          </View>
        )}

        {/* Terms & Conditions */}
        {schemeTypeData.terms_and_conditions ? (
          <View style={styles.termsCard}>
            <Text style={styles.termsCardLabel}>TERMS & CONDITIONS</Text>
            <Text style={styles.termsCardText}>{schemeTypeData.terms_and_conditions}</Text>
          </View>
        ) : null}

      </ScrollView>

      <View style={[styles.termsBar, { bottom: 80 + safeBottom }]}>
        <Pressable style={styles.termsRow} onPress={() => setHasAcceptedTerms(previous => !previous)}>
          <View style={[styles.termsIconWrap, !hasAcceptedTerms && styles.termsIconWrapUnchecked]}>
            {hasAcceptedTerms ? (
              <Ionicons name="checkmark-circle-outline" size={14} color="#FFFFFF" />
            ) : (
              <Ionicons name="ellipse-outline" size={14} color="#98A2B3" />
            )}
          </View>
          <Text style={styles.termsText}>
            I agree to the{' '}
            <Text style={styles.termsAccent}>Terms & Conditions</Text> and confirm that I
            have read the scheme details including the bonus eligibility criteria.
          </Text>
        </Pressable>
      </View>

      {/* Bottom CTA */}
      <View style={[styles.bottomAction, { paddingBottom: 14 + safeBottom }]}>
        <Pressable
          style={[styles.ctaButton, !canJoinScheme && styles.ctaButtonDisabled]}
          onPress={handleJoinScheme}
        >
          {joiningScheme ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.ctaText}>JOIN SCHEME NOW</Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </>
          )}
        </Pressable>
      </View>
      {toastMessage ? (
        <View pointerEvents="none" style={[styles.toastWrap, { bottom: 150 + safeBottom }]}>
          <Ionicons name="information-circle" size={16} color="#E0E7FF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F3',
  },
  centeredWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
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
  content: {
    paddingHorizontal: 14,
    paddingTop: 10,
    gap: 14,
    marginTop: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 2,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerLogo: {
    color: '#BB4D00',
    fontSize: 10,
    letterSpacing: 1.2,
    fontFamily: 'Poppins-Bold',
  },
  title: {
    marginTop: 4,
    fontSize: 24,
    lineHeight: 40,
    color: '#0F172A',
    fontFamily: 'Jost-BlackItalic',
  },
  tagline: {
    marginTop: -10,
    color: '#F59E0B',
    fontSize: 11,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 1.1,
  },
  subtitle: {
    color: '#4B5563',
    fontSize: 12,
    lineHeight: 24,
    fontFamily: 'Poppins-Italic',
  },
  benefitCard: {
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#F5CD78',
    backgroundColor: '#FEF9E8',
    padding: 14,
    flexDirection: 'row',
    gap: 12,
    alignItems: 'center',
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 2,
  },
  benefitIcon: {
    width: 36,
    height: 52,
    borderRadius: 18,
    backgroundColor: '#F39200',
    alignItems: 'center',
    justifyContent: 'center',
  },
  benefitBody: {
    flex: 1,
  },
  benefitLabel: {
    color: '#BB4D00',
    fontSize: 9,
    letterSpacing: 1.2,
    fontFamily: 'Poppins-Black',
  },
  benefitText: {
    marginTop: 3,
    color: '#111827',
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
    lineHeight: 20,
  },
  benefitTextFree: {
    color: '#BB4D00',
    fontSize: 12,
    fontFamily: 'Poppins-BoldItalic',
    lineHeight: 20,
  },
  briefCard: {
    borderRadius: 28,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#ECEFF3',
    padding: 18,
    gap: 14,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  sectionLabel: {
    color: '#98A2B3',
    letterSpacing: 2.3,
    fontFamily: 'Poppins-Bold',
    fontSize: 10,
  },
  briefText: {
    color: '#111827',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Poppins-Bold',
    flex: 1,
  },
  briefTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  briefIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F39200',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.22,
    shadowRadius: 10,
    elevation: 3,
  },
  briefTextAccent: {
    color: '#F57C00',
    fontFamily: 'Poppins-Black',
  },
  bonusInline: {
    marginTop: 2,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EFE4BC',
    backgroundColor: '#FFFDF4',
    padding: 14,
  },
  bonusTopRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  bonusIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 14,
    backgroundColor: '#E56A00',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#B45309',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  bonusTextWrap: {
    flex: 1,
  },
  bonusInlineLabel: {
    color: '#E56A00',
    letterSpacing: 2.2,
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
  },
  bonusInlineValue: {
    marginTop: 5,
    color: '#111827',
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    lineHeight: 18,
  },
  bonusBadge: {
    marginTop: 12,
    borderRadius: 11,
    borderWidth: 1,
    borderColor: '#EFD675',
    backgroundColor: '#FFF7DD',
    paddingVertical: 7,
    paddingHorizontal: 12,
    alignSelf: 'stretch',
  },
  bonusBadgeText: {
    color: '#EF6C00',
    fontSize: 12,
    fontFamily: 'Poppins-Black',
    textAlign: 'center',
  },
  durationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  durationText: {
    color: '#F39200',
    fontSize: 12,
    fontFamily: 'Poppins-SemiBold',
  },
  // ── Scheme tabs ─────────────────────────────────────────────────────────────
  tabsScrollContent: {
    gap: 8,
    paddingRight: 2,
  },
  schemeTab: {
    borderRadius: 14,
    backgroundColor: '#EEF2F6',
    paddingHorizontal: 14,
    paddingVertical: 10,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 72,
    position: 'relative',
  },
  schemeTabActive: {
    backgroundColor: '#111827',
  },
  popularDot: {
    position: 'absolute',
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: '#F7A714',
    alignItems: 'center',
    justifyContent: 'center',
  },
  schemeTabAmount: {
    color: '#4B5563',
    fontSize: 13,
    fontFamily: 'Poppins-Black',
  },
  schemeTabAmountActive: {
    color: '#FFFFFF',
  },
  schemeTabSub: {
    marginTop: 2,
    color: '#9CA3AF',
    fontSize: 9,
    fontFamily: 'Poppins-SemiBold',
  },
  schemeTabSubActive: {
    color: '#9CA3AF',
  },
  // ── Projected maturity card ──────────────────────────────────────────────
  projectionCard: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EBEF',
    padding: 14,
    gap: 9,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
    minHeight: 80,
  },
  maturityLoadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 10,
    paddingVertical: 12,
  },
  maturityLoadingText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
  },
  maturityPlaceholder: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    paddingVertical: 12,
  },
  projectedMaturityHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 6,
  },
  projectedMaturityTitle: {
    color: '#0F766E',
    fontSize: 10,
    letterSpacing: 2,
    fontFamily: 'Poppins-Bold',
  },
  bonusLabelWithBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    flex: 1,
    flexShrink: 1,
  },
  giftBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    backgroundColor: '#FFF4E0',
    borderWidth: 1,
    borderColor: '#FDE68A',
  },
  giftBadgeText: {
    color: '#C2410C',
    fontSize: 8,
    fontFamily: 'Poppins-Black',
    letterSpacing: 0.5,
  },
  bonusValueAccent: {
    color: '#D97706',
    fontSize: 14,
    fontFamily: 'Poppins-Black',
  },
  estGoldRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 10,
    marginTop: 2,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E5E7EB',
  },
  estGoldLabel: {
    color: '#98A2B3',
    fontSize: 11,
    letterSpacing: 0.6,
    fontFamily: 'Poppins-SemiBold',
  },
  estGoldValue: {
    color: '#0D9488',
    fontSize: 14,
    fontFamily: 'Poppins-Black',
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoKey: {
    color: '#6E7786',
    fontSize: 11,
    letterSpacing: 0.6,
    fontFamily: 'Poppins-SemiBold',
  },
  infoValue: {
    color: '#111827',
    fontSize: 14,
    fontFamily: 'Poppins-Black',
  },
  divider: {
    marginTop: 4,
    marginBottom: 2,
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  totalLabel: {
    color: '#111827',
    fontSize: 12,
    letterSpacing: 0.4,
    fontFamily: 'Poppins-Black',
  },
  totalValue: {
    color: '#F59E0B',
    fontSize: 24,
    fontFamily: 'Jost-BoldItalic',
  },
  // ── Timeline ────────────────────────────────────────────────────────────────
  timelineSection: {
    marginTop: 2,
    gap: 8,
  },
  timelineTitle: {
    color: '#8F99A8',
    fontSize: 10,
    letterSpacing: 2.5,
    fontFamily: 'Poppins-Bold',
  },
  timelineTrack: {
    marginTop: 2,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  timelineBar: {
    flex: 1,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E3C6A7',
  },
  timelineBarBonus: {
    backgroundColor: '#F39200',
  },
  timelineLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 1,
  },
  timelineMonthLabels: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
  },
  timelineMonthLabel: {
    color: '#D2D7E0',
    fontSize: 8,
    fontFamily: 'Poppins-Bold',
  },
  timelineBonusLabel: {
    marginLeft: 8,
    color: '#F39200',
    fontSize: 8,
    fontFamily: 'Poppins-Bold',
  },
  timelineCaption: {
    marginTop: 10,
    textAlign: 'center',
    color: '#98A2B3',
    fontSize: 12,
    letterSpacing: 1,
    fontFamily: 'Poppins-Bold',
  },
  // ── Terms ────────────────────────────────────────────────────────────────────
  termsCard: {
    borderRadius: 16,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E8EBEF',
    padding: 14,
    gap: 6,
  },
  termsCardLabel: {
    color: '#98A2B3',
    letterSpacing: 2.3,
    fontFamily: 'Poppins-Bold',
    fontSize: 9,
  },
  termsCardText: {
    color: '#4B5563',
    fontSize: 11,
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',
  },
  termsRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  termsBar: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 12,
    backgroundColor: '#F5F5F3',
    paddingTop: 8,
    paddingBottom: 6,
  },
  termsIconWrap: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#F39200',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  termsIconWrapUnchecked: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#D0D5DD',
  },
  termsText: {
    flex: 1,
    color: '#6B7280',
    fontSize: 11,
    lineHeight: 18,
    fontFamily: 'Poppins-SemiBold',
  },
  termsAccent: {
    color: '#111827',
    fontFamily: 'Poppins-Bold',
    textDecorationLine: 'underline',
  },
  bottomAction: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F5F5F3',
    paddingHorizontal: 16,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#E8EBEF',
  },
  ctaButton: {
    minHeight: 56,
    borderRadius: 24,
    backgroundColor: '#111827',
    justifyContent: 'center',
    alignItems: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.16,
    shadowRadius: 12,
    elevation: 4,
  },
  ctaButtonDisabled: {
    opacity: 0.45,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 11,
    letterSpacing: 1.2,
    fontFamily: 'Poppins-Black',
  },
  toastWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 12,
    backgroundColor: '#4338CA',
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toastText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
});
