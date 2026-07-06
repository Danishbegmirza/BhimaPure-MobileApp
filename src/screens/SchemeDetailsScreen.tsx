import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import type { RootStackParamList } from '../navigation/types';
import { goBackOrDashboard } from '../navigation/backNavigation';
import { useSafeBottomInset } from '../utils/safeBottomInset';
import {
  fetchSchemesByType,
  fetchSchemeMaturity,
  fetchMaturityByAmount,
  type SchemeTypeDetail,
  type SchemeEntry,
  type SchemeMaturityResponse,
  type ProjectedMaturity,
  type SchemesByTypeResponse,
  type SchemeAttribute,
} from '../api/schemes';
import { initiateSchemeEnrollment, type InitiateSchemePayload } from '../api/customerSchemes';
import { getToken } from '../storage/auth';
import { UnauthenticatedError } from '../api/apiClient';
import { BottomTabs } from '../components/BottomTabs';

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

/**
 * Calculate maturity based on scheme type and calculation_type from API
 * 
 * Scheme Type 1 (Bhima Gold Tree Future Plus): amount * duration + amount (full bonus)
 * Scheme Type 2 (Gold Tree No Making Charge): amount * duration + amount (full bonus)
 * Scheme Type 3 (Gold Tree Weight Plan): (amount * duration) / gold_rate (weight in grams)
 * Scheme Type 4 (Gold Tree Coin Plan): amount * duration + amount/2 (half bonus)
 * Scheme Type 5 (Smart Gold): amount * duration + amount (full bonus)
 */
interface MaturityCalculationResult {
  totalWithoutBonus: number;
  bonusAmount: number;
  totalMaturity: number;
  isWeightBased: boolean;
  estimatedGold?: number;
}

function calculateMaturity(
  amount: number,
  duration: number,
  schemeTypeId: number,
  calculationType: 'amount' | 'weight' | null | undefined,
  goldRate: string | null | undefined,
): MaturityCalculationResult {
  const totalWithoutBonus = amount * duration;
  
  // Weight-based calculation (Scheme Type 3)
  if (calculationType === 'weight' && goldRate) {
    const rate = parseFloat(goldRate);
    if (rate > 0) {
      const estimatedGold = totalWithoutBonus / rate;
      return {
        totalWithoutBonus,
        bonusAmount: 0,
        totalMaturity: totalWithoutBonus,
        isWeightBased: true,
        estimatedGold,
      };
    }
  }
  
  // Amount-based calculation
  let bonusAmount = amount; // Default: full bonus (1 month)
  
  // Scheme Type 4 (Gold Tree Coin Plan): half bonus
  if (schemeTypeId === 4) {
    bonusAmount = amount / 2;
  }
  
  return {
    totalWithoutBonus,
    bonusAmount,
    totalMaturity: totalWithoutBonus + bonusAmount,
    isWeightBased: false,
  };
}

export function SchemeDetailsScreen({ navigation, route }: Props) {
  const safeBottom = useSafeBottomInset();
  const schemeTypeId = Number(route.params.schemeId);

  // ── Loading states ─────────────────────────────────────────────────────────
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ── Scheme type data ───────────────────────────────────────────────────────
  const [schemeTypeData, setSchemeTypeData] = useState<SchemeTypeDetail | null>(null);

  // ── Selected scheme tab (by index) ─────────────────────────────────────────
  const [selectedSchemeIndex, setSelectedSchemeIndex] = useState<number | null>(null);

  // ── Maturity data (from /api/schemes/:id) ─────────────────────────────────
  const [maturity, setMaturity] = useState<SchemeMaturityResponse | null>(null);
  const [maturityLoading, setMaturityLoading] = useState(false);
  const [hasAcceptedTerms, setHasAcceptedTerms] = useState(false);
  const [joiningScheme, setJoiningScheme] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const toastTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // ── Custom amount entry state ─────────────────────────────────────────────────
  const [customAmount, setCustomAmount] = useState<string>('');
  const [customAmountError, setCustomAmountError] = useState<string>('');
  const [isAmountModalVisible, setIsAmountModalVisible] = useState(false);
  const [tempAmount, setTempAmount] = useState<string>('');
  const [customMaturity, setCustomMaturity] = useState<SchemeMaturityResponse | null>(null);
  const [customMaturityLoading, setCustomMaturityLoading] = useState(false);
  const slideAnim = useRef(new Animated.Value(0)).current;

  // ── Scheme attributes from API ─────────────────────────────────────────────────
  const [schemeAttributes, setSchemeAttributes] = useState<SchemeAttribute[]>([]);

  // ── Fetch scheme type details ──────────────────────────────────────────────
  const loadSchemeType = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      // Get token to send for language preference
      const token = await getToken();
      const result: SchemesByTypeResponse = await fetchSchemesByType(schemeTypeId, token);
      if (result.success && result.schemetype) {
        const detail = result.schemetype;
        const mergedPm = detail.projected_maturity ?? result.projected_maturity ?? null;
        const nextDetail: SchemeTypeDetail = mergedPm
          ? { ...detail, projected_maturity: mergedPm }
          : detail;
        setSchemeTypeData(nextDetail);
        // Store attributes from API response
        setSchemeAttributes(result.attributes ?? []);
        // Do not auto-select scheme - user must tap to select
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
  const handleSchemeTabPress = useCallback(async (index: number, scheme: SchemeEntry) => {
    if (index === selectedSchemeIndex) { return; }
    setSelectedSchemeIndex(index);
    setCustomAmount('');
    setCustomAmountError('');
    setCustomMaturity(null);
    
    // Fetch maturity for selected scheme
    if (schemeTypeData?.scheme_code) {
      try {
        setMaturityLoading(true);
        const result = await fetchMaturityByAmount(schemeTypeData.id);
        console.log("result==", result)
        if (result.success) { 
          setMaturity(result as SchemeMaturityResponse); 
        }
      } catch (_e) {
        // keep previous maturity on error
      } finally {
        setMaturityLoading(false);
      }
    }
  }, [selectedSchemeIndex, schemeTypeData]);

  // ── Custom amount validation ──────────────────────────────────────────────────
  const validateAmount = useCallback((amountStr: string): string => {
    if (!schemeTypeData) { return ''; }
    const amount = parseInt(amountStr, 10);
    if (isNaN(amount) || amount === 0) { return ''; }

    const minAmount = parseFloat(schemeTypeData.min_amount || '0');
    const maxAmount = parseFloat(schemeTypeData.max_amount || '100000');
    const multipleOf = schemeTypeData.multiple_of || 1;

    if (amount < minAmount) {
      return `Amount should be greater than or equal to ₹${formatINR(minAmount)}.`;
    }
    if (amount > maxAmount) {
      return `Amount should not exceed ₹${formatINR(maxAmount)}.`;
    }
    if (multipleOf > 1 && amount % multipleOf !== 0) {
      return `Please enter an amount in multiples of ₹${formatINR(multipleOf)}.`;
    }
    return '';
  }, [schemeTypeData]);

  // ── Handle custom amount confirm ──────────────────────────────────────────────
  const handleCustomAmountConfirm = useCallback(async () => {
    const error = validateAmount(tempAmount);
    if (error) {
      setCustomAmountError(error);
      return;
    }
    setCustomAmount(tempAmount);
    setCustomAmountError('');
    setSelectedSchemeIndex(null);
    setIsAmountModalVisible(false);

    if (schemeTypeData?.scheme_code) {
      try {
        setCustomMaturityLoading(true);
        const result = await fetchMaturityByAmount(schemeTypeData.scheme_code);
        if (result.success) {
          setCustomMaturity(result as SchemeMaturityResponse);
        }
      } catch (_e) {
        // ignore
      } finally {
        setCustomMaturityLoading(false);
      }
    }
  }, [tempAmount, validateAmount, schemeTypeData]);

  // ── Modal animation ───────────────────────────────────────────────────────────
  const openAmountModal = useCallback(() => {
    setTempAmount(customAmount || '');
    setCustomAmountError('');
    setIsAmountModalVisible(true);
    Animated.spring(slideAnim, {
      toValue: 1,
      useNativeDriver: true,
      tension: 65,
      friction: 11,
    }).start();
  }, [customAmount, slideAnim]);

  const closeAmountModal = useCallback(() => {
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 200,
      useNativeDriver: true,
    }).start(() => {
      setIsAmountModalVisible(false);
      setCustomAmountError('');
    });
  }, [slideAnim]);

  // ── Numpad handlers ───────────────────────────────────────────────────────────
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
    setCustomAmountError('');
  }, []);

  // ── Derived values ─────────────────────────────────────────────────────────
  const durationMonths = parseDuration(schemeTypeData?.duration ?? null);
  const activeMaturity = customAmount && customMaturity ? customMaturity : maturity;

  // Find scheme benefit and exclusive benefit from attributes
  const schemeBenefitAttr = schemeAttributes.find(
    attr => attr.field_name.toLowerCase() === 'scheme benefit'
  );
  const exclusiveBenefitAttr = schemeAttributes.find(
    attr => attr.field_name.toLowerCase() === 'exclusive benefit'
  );

  // Get selected scheme from index
  const schemes = schemeTypeData?.scheme ?? [];
  const selectedScheme = selectedSchemeIndex !== null ? schemes[selectedSchemeIndex] : null;

  // ── Dynamic amount calculations ───────────────────────────────────────────
  // Determine displayed monthly amount based on custom input or tab selection
  const displayedMonthlyAmount: number = customAmount
    ? parseInt(customAmount, 10)
    : selectedScheme
      ? parseFloat(selectedScheme.min_amount)
      : parseFloat(activeMaturity?.monthly_amount || '0');

  // Calculate duration
  const calculatedDuration = activeMaturity?.duration || durationMonths || 11;

  // Static maturity calculation based on scheme type and calculation_type
  const maturityCalc = calculateMaturity(
    displayedMonthlyAmount,
    calculatedDuration,
    schemeTypeId,
    schemeTypeData?.calculation_type,
    schemeTypeData?.gold_rate,
  );

  const calculatedTotalWithoutBonus = maturityCalc.totalWithoutBonus;
  const bonusAmount = maturityCalc.bonusAmount;
  const calculatedTotalMaturity = maturityCalc.totalMaturity;
  const isWeightBasedScheme = maturityCalc.isWeightBased;
  const staticEstimatedGold = maturityCalc.estimatedGold;

  // For weight-based schemes, show estimated gold; for others, use API value if available
  const projectedFromType = schemeTypeData?.projected_maturity;
  const estimatedGoldRaw = isWeightBasedScheme
    ? staticEstimatedGold
    : (activeMaturity?.estimated_gold ?? projectedFromType?.estimated_gold);
  const weightInForGold = isWeightBasedScheme ? 'grams' : (activeMaturity?.weight_in ?? projectedFromType?.weight_in);
  const showEstimatedGoldRow = isWeightBasedScheme || hasEstimatedGoldInResponse(estimatedGoldRaw);

  // Determine if scheme has bonus (for amount-based schemes)
  const hasBonus = !isWeightBasedScheme && bonusAmount > 0;

  const hasValidAmount = customAmount ? !validateAmount(customAmount) : selectedSchemeIndex !== null;
  const canJoinScheme = hasValidAmount && hasAcceptedTerms && !joiningScheme;
  const allowCustomAmount = schemeTypeData?.allow_custom_amount_to_enter === true;
  const multipleOf = schemeTypeData?.multiple_of || 1;

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
    if (joiningScheme) { return; }
    if (!hasAcceptedTerms) {
      showToast('Please accept terms and condition');
      return;
    }

    const amount = customAmount
      ? parseInt(customAmount, 10)
      : selectedScheme
        ? parseFloat(selectedScheme.min_amount)
        : 0;

    if (!amount || amount <= 0) {
      showToast('Please select or enter an amount');
      return;
    }

    if (!schemeTypeData?.scheme_code) {
      Alert.alert('Error', 'Scheme configuration is missing. Please try again.');
      return;
    }

    try {
      setJoiningScheme(true);
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Please log in to continue.');
        return;
      }

      const payload: InitiateSchemePayload = {
        scheme_code: schemeTypeData.scheme_code,
        amount: amount,
      };
      const init = await initiateSchemeEnrollment(token, payload);
      if (!init.success || init.customerSchemeId == null) {
        Alert.alert('Unable to join', init.message ?? 'Enrollment could not be started.');
        return;
      }

      // Use static calculation for maturity label
      const maturityCalcForNav = calculateMaturity(
        amount,
        calculatedDuration,
        schemeTypeId,
        schemeTypeData?.calculation_type,
        schemeTypeData?.gold_rate,
      );
      
      let maturityLabelForNav: string | undefined;
      if (maturityCalcForNav.isWeightBased && maturityCalcForNav.estimatedGold != null) {
        maturityLabelForNav = formatGoldRowValue(maturityCalcForNav.estimatedGold, 'grams');
      } else {
        maturityLabelForNav = `₹${formatINR(maturityCalcForNav.totalMaturity)}`;
      }

      navigation.navigate('JoinScheme', {
        schemeId: String(schemeTypeData.id),
        apiSchemeId: schemeTypeData.id,
        customerSchemeId: init.customerSchemeId,
        schemeName: schemeTypeData?.scheme_type_name ?? 'Scheme',
        monthlyAmount: amount,
        maturityLabel: maturityLabelForNav,
      });
    } catch (e) {
      if (e instanceof UnauthenticatedError) { return; }
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setJoiningScheme(false);
    }
  }, [
    calculatedDuration,
    customAmount,
    hasAcceptedTerms,
    joiningScheme,
    navigation,
    schemeTypeData,
    schemeTypeId,
    selectedScheme,
    showToast,
  ]);

  // ── Loading / Error screens ────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F5F3" />
        <View style={styles.screenBody}>
        <View style={styles.centeredWrap}>
          <ActivityIndicator size="large" color="#E88800" />
        </View>
        <BottomTabs navigation={navigation} activeTab="joinNew" />
        </View>
      </SafeAreaView>
    );
  }

  if (error || !schemeTypeData) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F5F3" />
        <View style={styles.screenBody}>
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
        <BottomTabs navigation={navigation} activeTab="joinNew" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F3" />
      <View style={styles.screenBody}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={[styles.content, { paddingBottom: 250 + safeBottom }]}
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
            "Save for {durationMonths} months{exclusiveBenefitAttr || schemeBenefitAttr ? '. Get 1 month bonus' : ''}."
          </Text>
        ) : (
          <Text style={styles.subtitle}>"{schemeTypeData.short_description}"</Text>
        )}

        {/* Benefit card – only if exclusive benefit attribute exists */}
        {exclusiveBenefitAttr && (
          <View style={styles.benefitCard}>
            <View style={styles.benefitIcon}>
              <Ionicons name="gift-outline" size={18} color="#FFFFFF" />
            </View>
            <View style={styles.benefitBody}>
              <Text style={styles.benefitLabel}>EXCLUSIVE BENEFIT</Text>
              <Text style={styles.benefitText}>
                {exclusiveBenefitAttr.field_value}
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

          {schemeBenefitAttr && (
            <View style={styles.bonusInline}>
              <View style={styles.bonusTopRow}>
                <View style={styles.bonusIconWrap}>
                  <Ionicons name="gift-outline" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.bonusTextWrap}>
                  <Text style={styles.bonusInlineLabel}>SCHEME BENEFIT</Text>
                  <Text style={styles.bonusInlineValue}>
                    {schemeBenefitAttr.field_value.split(' - ')[0]}
                  </Text>
                </View>
              </View>
              {schemeBenefitAttr.field_value.includes(' - ') && (
                <View style={styles.bonusBadge}>
                  <Text style={styles.bonusBadgeText}>
                    {schemeBenefitAttr.field_value.split(' - ')[1]}
                  </Text>
                </View>
              )}
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
              {(schemeTypeData.scheme ?? []).map((scheme, index) => {
                const isActive = !customAmount && selectedSchemeIndex === index;
                const isPopular = index === 0;
                return (
                  <Pressable
                    key={`${scheme.min_amount}-${index}`}
                    style={[styles.schemeTab, isActive && styles.schemeTabActive]}
                    onPress={() => {
                      setCustomAmount('');
                      setCustomMaturity(null);
                      handleSchemeTabPress(index, scheme);
                    }}
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

        {/* ── Enter your own amount ─────────────────────────────────────────── */}
        {allowCustomAmount && (
          <Pressable 
            style={[styles.customAmountCard, customAmount && styles.customAmountCardActive]} 
            onPress={openAmountModal}
          >
            <View style={[styles.customAmountIconWrap, customAmount && styles.customAmountIconWrapActive]}>
              <Ionicons name={customAmount ? "checkmark" : "pencil"} size={16} color={customAmount ? "#FFFFFF" : "#F39200"} />
            </View>
            <View style={styles.customAmountTextWrap}>
              {customAmount ? (
                <>
                  <Text style={styles.customAmountSelectedLabel}>CUSTOM AMOUNT</Text>
                  <Text style={styles.customAmountSelectedValue}>₹{formatINR(parseInt(customAmount, 10))}</Text>
                </>
              ) : (
                <>
                  <Text style={styles.customAmountTitle}>ENTER YOUR OWN AMOUNT</Text>
                  <Text style={styles.customAmountHint}>Any amount you prefer</Text>
                </>
              )}
            </View>
            <Ionicons name={customAmount ? "create-outline" : "chevron-forward"} size={18} color={customAmount ? "#F39200" : "#9CA3AF"} />
          </Pressable>
        )}

        {/* ── Helper text for multiple_of ───────────────────────────────────── */}
        {allowCustomAmount && multipleOf > 1 && (
          <View style={styles.helperTextWrap}>
            <Ionicons name="information-circle-outline" size={14} color="#9CA3AF" />
            <Text style={styles.helperText}>
              Please enter an amount in multiples of ₹{formatINR(multipleOf)}.
            </Text>
          </View>
        )}

        {/* ── Projected maturity card ───────────────────────────────────────── */}
        {/* Show maturity when a scheme tab is selected OR valid custom amount is entered */}
        <View style={styles.projectionCard}>
          {maturityLoading ? (
            <View style={styles.maturityLoadingWrap}>
              <ActivityIndicator size="small" color="#E88800" />
              <Text style={styles.maturityLoadingText}>Calculating maturity…</Text>
            </View>
          ) : (displayedMonthlyAmount > 0 && (selectedSchemeIndex !== null || (customAmount && !customAmountError))) ? (
            <>
              <View style={styles.projectedMaturityHeader}>
                <Ionicons name="trending-up" size={16} color="#0D9488" />
                <Text style={styles.projectedMaturityTitle}>PROJECTED MATURITY</Text>
              </View>

              <View style={styles.infoRow}>
                <Text style={styles.infoKey}>MONTHLY AMOUNT</Text>
                <Text style={styles.infoValue}>
                  ₹{formatINR(displayedMonthlyAmount)}
                </Text>
              </View>

              {/* Show rupee total only for amount-based schemes */}
              {!isWeightBasedScheme && (
                <View style={styles.infoRow}>
                  <Text style={styles.infoKey}>{calculatedDuration}-MONTH TOTAL</Text>
                  <Text style={styles.infoValue}>
                    ₹{formatINR(calculatedTotalWithoutBonus)}
                  </Text>
                </View>
              )}

              {/* Show bonus only for amount-based schemes */}
              {!isWeightBasedScheme && bonusAmount > 0 && (
                <View style={styles.infoRow}>
                  <View style={styles.bonusLabelWithBadge}>
                    <Text style={styles.infoKey}>SCHEME BONUS</Text>
                    <View style={styles.giftBadge}>
                      <Text style={styles.giftBadgeText}>GIFT</Text>
                    </View>
                  </View>
                  <Text style={styles.bonusValueAccent}>
                    +₹{formatINR(bonusAmount)}
                  </Text>
                </View>
              )}

              {/* Show estimated gold for weight-based schemes */}
              {isWeightBasedScheme && staticEstimatedGold != null && (
                <View style={styles.estGoldRow}>
                  <Text style={styles.estGoldLabel}>
                    {formatGoldRowLabel('grams')}
                  </Text>
                  <Text style={styles.estGoldValue}>
                    {formatGoldRowValue(staticEstimatedGold, 'grams')}
                  </Text>
                </View>
              )}

              <View style={styles.divider} />
              {isWeightBasedScheme ? (
                <View style={styles.infoRow}>
                  <Text style={styles.totalLabel}>TOTAL GOLD WEIGHT</Text>
                  <Text style={styles.totalValue}>
                    {staticEstimatedGold != null 
                      ? formatGoldRowValue(staticEstimatedGold, 'grams')
                      : '—'}
                  </Text>
                </View>
              ) : (
                <View style={styles.infoRow}>
                  <Text style={styles.totalLabel}>TOTAL MATURITY VALUE</Text>
                  <Text style={styles.totalValue}>
                    ₹{formatINR(calculatedTotalMaturity)}
                  </Text>
                </View>
              )}
            </>
          ) : (
            <Text style={styles.maturityPlaceholder}>
              {allowCustomAmount 
                ? 'Select a plan or enter custom amount to see projected maturity.'
                : 'Select a plan above to see projected maturity.'}
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

      <View style={[styles.termsBar, { bottom: 150 + safeBottom }]}>
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
      <View style={[styles.bottomAction, { bottom: 70 + safeBottom }]}>
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
        <View pointerEvents="none" style={[styles.toastWrap, { bottom: 220 + safeBottom }]}>
          <Ionicons name="information-circle" size={16} color="#E0E7FF" />
          <Text style={styles.toastText}>{toastMessage}</Text>
        </View>
      ) : null}
      <BottomTabs navigation={navigation} activeTab="joinNew" />
      </View>

      {/* ── Amount Entry Modal ─────────────────────────────────────────────────── */}
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

              <Text style={styles.modalLabel}>MONTHLY CONTRIBUTION</Text>

              <View style={styles.modalAmountDisplay}>
                <Text style={styles.rupeeSymbol}>₹</Text>
                <Text style={styles.modalAmountText}>
                  {tempAmount || '0'}
                </Text>
              </View>

              <Text style={styles.modalHint}>
                {tempAmount
                  ? '+ PROJECTIONS UPDATING LIVE'
                  : 'ENTER AMOUNT TO INVEST MONTHLY'}
              </Text>

              {customAmountError ? (
                <View style={styles.modalErrorWrap}>
                  <Ionicons name="alert-circle" size={14} color="#EF4444" />
                  <Text style={styles.modalErrorText}>{customAmountError}</Text>
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
                  (!tempAmount || validateAmount(tempAmount)) && styles.modalConfirmButtonDisabled,
                ]}
                onPress={handleCustomAmountConfirm}
                disabled={!tempAmount || !!validateAmount(tempAmount)}
              >
                <Text style={styles.modalConfirmText}>
                  {tempAmount
                    ? `CONFIRM ₹${formatINR(parseInt(tempAmount, 10))}`
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
  // ── Custom amount card ─────────────────────────────────────────────────────
  customAmountCard: {
    borderRadius: 16,
    backgroundColor: '#FFFBF0',
    borderWidth: 1,
    borderColor: '#F5E6C4',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customAmountIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFF7E6',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#F5D68A',
  },
  customAmountTextWrap: {
    flex: 1,
  },
  customAmountTitle: {
    color: '#F39200',
    fontSize: 11,
    fontFamily: 'Poppins-Black',
    letterSpacing: 1.1,
  },
  customAmountHint: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    marginTop: 2,
  },
  customAmountCardActive: {
    backgroundColor: '#FFF3E0',
    borderColor: '#F39200',
    borderWidth: 2,
  },
  customAmountIconWrapActive: {
    backgroundColor: '#F39200',
    borderColor: '#F39200',
  },
  customAmountSelectedLabel: {
    color: '#6B7280',
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 0.5,
  },
  customAmountSelectedValue: {
    color: '#1F2937',
    fontSize: 16,
    fontFamily: 'Poppins-Bold',
    marginTop: 2,
  },
  // ── Helper text ──────────────────────────────────────────────────────────────
  helperTextWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 4,
  },
  helperText: {
    color: '#9CA3AF',
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
  },
  // ── Amount Entry Modal ─────────────────────────────────────────────────────
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
    marginBottom: 24,
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
  // ── Numpad ───────────────────────────────────────────────────────────────────
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
