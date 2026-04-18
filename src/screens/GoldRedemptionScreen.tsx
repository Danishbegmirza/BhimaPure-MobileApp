import React, { useCallback, useEffect, useState } from 'react';
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
import { postRedemptionStatus } from '../api/customerSchemes';
import {
  fetchProfile,
  fetchSchemePopupDetails,
  type SchemePopupResponse,
} from '../api/user';
import { getToken } from '../storage/auth';
import { UnauthenticatedError } from '../api/apiClient';
import type { RootStackParamList } from '../navigation/types';
import { goBackOrDashboard } from '../navigation/backNavigation';
import { useSafeBottomInset } from '../utils/safeBottomInset';

type Props = NativeStackScreenProps<RootStackParamList, 'GoldRedemption'>;

function parseCustomerCode(code: string): number | string {
  const trimmed = code.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }
  return trimmed;
}

export function GoldRedemptionScreen({ navigation, route }: Props) {
  const safeBottom = useSafeBottomInset();
  const customerschemeId = Number(route.params.schemeId);
  const [mode, setMode] = useState<'jewellery' | 'online'>('jewellery');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [customerCode, setCustomerCode] = useState<number | string | null>(null);
  const [popup, setPopup] = useState<SchemePopupResponse | null>(null);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Please log in.');
        goBackOrDashboard(navigation);
        return;
      }
      const [profileRes, popupRes] = await Promise.all([
        fetchProfile(token),
        fetchSchemePopupDetails(token, customerschemeId).catch(() => null),
      ]);
      if (profileRes.success && profileRes.data?.customer_code) {
        setCustomerCode(parseCustomerCode(profileRes.data.customer_code));
      }
      if (popupRes?.success) {
        setPopup(popupRes);
      }
    } catch (e) {
      if (e instanceof UnauthenticatedError) { return; }
    } finally {
      setLoading(false);
    }
  }, [customerschemeId, navigation]);

  useEffect(() => {
    load();
  }, [load]);

  const schemeName = popup?.scheme?.name ?? 'Your scheme';
  const eligibleValue = popup?.metrics?.eligible_value ?? 0;
  const rawBonus = popup?.scheme?.bonus_value
    ? parseFloat(popup.scheme.bonus_value)
    : 0;
  const bonusValue = Number.isFinite(rawBonus) ? rawBonus : 0;

  const onOnlineRedeem = useCallback(async () => {
    if (customerCode == null) {
      Alert.alert('Error', 'Customer profile could not be loaded. Please try again.');
      return;
    }
    try {
      setSubmitting(true);
      const token = await getToken();
      if (!token) { return; }
      const res = await postRedemptionStatus(token, {
        customerCode,
        customerschemeId,
        redumption_mode: 'shop online',
        showroom: 'Online',
      });
      if (res.status) {
        navigation.navigate('ShopOnlineSuccess', { schemeId: route.params.schemeId });
      } else {
        Alert.alert('Redemption', res.message ?? 'Request could not be completed.');
      }
    } catch (e) {
      if (e instanceof UnauthenticatedError) { return; }
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [customerCode, customerschemeId, navigation, route.params.schemeId]);

  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="dark-content" backgroundColor="#F5F5F3" />
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#F59E0B" />
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F3" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 116 + safeBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={() => goBackOrDashboard(navigation)}>
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>Gold Redemption</Text>
          <View style={styles.headerRightDots}>
            <View style={styles.dotActive} />
            <View style={styles.dotMuted} />
          </View>
        </View>

        <View style={styles.heroCard}>
          <View style={styles.heroTopRow}>
            <View>
              <Text style={styles.heroLabel}>MATURED SCHEME</Text>
              <Text style={styles.heroTitle}>{schemeName}</Text>
            </View>
            <View style={styles.heroTrendIcon}>
              <Ionicons name="trending-up-outline" size={14} color="#FBBF24" />
            </View>
          </View>
          <View style={styles.heroAmounts}>
            <View>
              <Text style={styles.metricLabel}>TOTAL VALUE</Text>
              <Text style={styles.metricValue}>₹{eligibleValue.toLocaleString('en-IN')}</Text>
            </View>
            <View style={styles.metricRight}>
              <Text style={styles.metricLabel}>BONUS</Text>
              <Text style={styles.metricAccent}>₹{bonusValue.toLocaleString('en-IN')}</Text>
            </View>
          </View>
        </View>

        <Text style={styles.blockTitle}>ELIGIBILITY STATUS</Text>
        <View style={styles.statusCard}>
          <View style={styles.statusIcon}>
            <Ionicons name="checkmark" size={14} color="#FFFFFF" />
          </View>
          <View style={styles.statusContent}>
            <Text style={styles.statusTitle}>Scheme Fully Matured</Text>
            <Text style={styles.statusBody}>You are eligible to choose a redemption option.</Text>
          </View>
        </View>

        <View style={styles.privCard}>
          <Text style={styles.privTitle}>Your Redemption Privileges:</Text>
          <View style={styles.privRow}>
            <Ionicons name="checkmark-circle-outline" size={12} color="#10B981" />
            <Text style={styles.privItem}>Guaranteed live-rate redemption</Text>
          </View>
          <View style={styles.privRow}>
            <Ionicons name="checkmark-circle-outline" size={12} color="#10B981" />
            <Text style={styles.privItem}>Flexible collection options</Text>
          </View>
          <View style={styles.privRow}>
            <Ionicons name="checkmark-circle-outline" size={12} color="#10B981" />
            <Text style={styles.privItem}>Transparent pricing, zero hidden charges</Text>
          </View>
        </View>

        <Text style={styles.blockTitle}>CHOOSE REDEMPTION MODE</Text>

        <Pressable
          style={[styles.modeCard, mode === 'jewellery' && styles.modeCardActive]}
          onPress={() => setMode('jewellery')}
        >
          <View style={[styles.modeIcon, mode === 'jewellery' && styles.modeIconActive]}>
            <Ionicons name="storefront-outline" size={17} color={mode === 'jewellery' ? '#FFFFFF' : '#6B7280'} />
          </View>
          <View style={styles.modeBody}>
            <View style={styles.modeTitleRow}>
              <Text style={styles.modeTitle}>Jewellery</Text>
              <Text style={styles.recommended}>RECOMMENDED</Text>
            </View>
            <Text style={styles.modeText}>
              Visit any branch and redeem as per your gold eligibility and offers.
            </Text>
            <View style={styles.modePointsWrap}>
              <View style={styles.modePointRow}>
                <Ionicons name="checkmark-circle-outline" size={11} color="#10B981" />
                <Text style={styles.modePointText}>12% Month Bonus Applied</Text>
              </View>
              <View style={styles.modePointRow}>
                <Ionicons name="checkmark-circle-outline" size={11} color="#10B981" />
                <Text style={styles.modePointText}>Priority Store Service</Text>
              </View>
            </View>
          </View>
          <Ionicons name={mode === 'jewellery' ? 'radio-button-on' : 'radio-button-off'} size={18} color="#F39200" />
        </Pressable>

        <Pressable
          style={[styles.modeCard, mode === 'online' && styles.modeCardActive]}
          onPress={() => setMode('online')}
        >
          <View style={[styles.modeIcon, mode === 'online' && styles.modeIconActive]}>
            <Ionicons name="sparkles-outline" size={16} color={mode === 'online' ? '#FFFFFF' : '#6B7280'} />
          </View>
          <View style={styles.modeBody}>
            <Text style={styles.modeTitle}>Shop Online</Text>
            <Text style={styles.modeText}>Prefer shopping from home? You can redeem your scheme amount on our online store using a coupon.</Text>
            <View style={styles.modePointsWrap}>
              <View style={styles.modePointRow}>
                <Ionicons name="ellipse" size={4} color="#9CA3AF" />
                <Text style={styles.modePointMuted}>Submit your redemption request</Text>
              </View>
              <View style={styles.modePointRow}>
                <Ionicons name="ellipse" size={4} color="#9CA3AF" />
                <Text style={styles.modePointMuted}>Your request will be processed by our team</Text>
              </View>
            </View>
          </View>
          <Ionicons name={mode === 'online' ? 'radio-button-on' : 'radio-button-off'} size={18} color="#D1D5DB" />
        </Pressable>

        <View style={styles.infoBox}>
          <Ionicons name="information-circle-outline" size={14} color="#4F46E5" />
          <Text style={styles.infoText}>
            Jewellery redemption maximizes your benefits with making charge waivers and bonus credits.
          </Text>
        </View>
      </ScrollView>

      <View style={[styles.bottomCtaWrap, { paddingBottom: 14 + safeBottom }]}>
        <Pressable
          style={[styles.bottomCta, submitting && styles.bottomCtaDisabled]}
          disabled={submitting}
          onPress={() =>
            mode === 'jewellery'
              ? navigation.navigate('SelectShowroom', { schemeId: route.params.schemeId })
              : onOnlineRedeem()
          }
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.bottomCtaText}>
                {mode === 'jewellery' ? 'PROCEED TO REDEEM' : 'GENERATE ONLINE COUPON'}
              </Text>
              <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
            </>
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F3' },
  loadingWrap: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { paddingHorizontal: 14, paddingTop: 8, gap: 11 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingTop: 22 },
  iconBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: { fontSize: 22, lineHeight: 26, fontFamily: 'Jost-BoldItalic', color: '#111827' },
  headerRightDots: { width: 24, flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: 3 },
  dotActive: { width: 8, height: 3, borderRadius: 2, backgroundColor: '#F59E0B' },
  dotMuted: { width: 6, height: 3, borderRadius: 2, backgroundColor: '#FCD7A1' },
  heroCard: {
    borderRadius: 24,
    backgroundColor: '#080808',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    shadowColor: '#0B0F17',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  heroTopRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  heroTrendIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    backgroundColor: '#1B1B1D',
    alignItems: 'center',
    justifyContent: 'center',
  },
  heroLabel: { color: '#A1A1AA', fontSize: 9, letterSpacing: 1.3, fontFamily: 'Poppins-Bold' },
  heroTitle: { color: '#FFFFFF', fontSize: 22, lineHeight: 26, fontFamily: 'Jost-BoldItalic' },
  heroAmounts: { flexDirection: 'row', justifyContent: 'space-between' },
  metricLabel: { color: '#8D96A5', fontSize: 8, letterSpacing: 1.2, fontFamily: 'Poppins-SemiBold' },
  metricValue: { marginTop: 3, color: '#FFFFFF', fontSize: 34, lineHeight: 36, fontFamily: 'Jost-BoldItalic' },
  metricRight: { alignItems: 'flex-end' },
  metricAccent: { marginTop: 3, color: '#FBBF24', fontSize: 34, lineHeight: 36, fontFamily: 'Jost-BoldItalic' },
  blockTitle: { color: '#96A0AE', fontSize: 9, letterSpacing: 1.7, fontFamily: 'Poppins-Bold', marginTop: 6 },
  statusCard: {
    borderRadius: 16,
    backgroundColor: '#D1FAE5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    padding: 12,
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  statusIcon: {
    width: 30,
    height: 30,
    borderRadius: 10,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusContent: { flex: 1 },
  statusTitle: { color: '#065F46', fontSize: 14, fontFamily: 'Poppins-Bold' },
  statusBody: { color: '#047857', fontSize: 10, marginTop: 2, lineHeight: 15, fontFamily: 'Poppins-Medium' },
  privCard: {
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EBEF',
    padding: 12,
    gap: 6,
    shadowColor: '#111827',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  privTitle: { color: '#111827', fontSize: 12, fontFamily: 'Poppins-Bold' },
  privRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  privItem: { color: '#6B7280', fontSize: 10, lineHeight: 15, fontFamily: 'Poppins-Medium' },
  modeCard: {
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EBEF',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    shadowColor: '#111827',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 5 },
    elevation: 2,
  },
  modeCardActive: {
    borderColor: '#F39200',
    shadowColor: '#F39200',
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  modeIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F3F4F6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  modeIconActive: { backgroundColor: '#F39200' },
  modeBody: { flex: 1 },
  modeTitleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modeTitle: { color: '#111827', fontSize: 18, lineHeight: 22, fontFamily: 'Jost-BoldItalic' },
  recommended: {
    color: '#059669',
    fontSize: 8,
    fontFamily: 'Poppins-Bold',
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
    overflow: 'hidden',
  },
  modeText: { marginTop: 2, color: '#6B7280', fontSize: 10, lineHeight: 15, fontFamily: 'Poppins-Medium' },
  modePointsWrap: { marginTop: 7, gap: 4 },
  modePointRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modePointText: { color: '#10B981', fontSize: 9, fontFamily: 'Poppins-SemiBold' },
  modePointMuted: { color: '#6B7280', fontSize: 9, fontFamily: 'Poppins-Medium' },
  infoBox: {
    borderRadius: 14,
    backgroundColor: '#E0E7FF',
    borderWidth: 1,
    borderColor: '#C7D2FE',
    padding: 11,
    flexDirection: 'row',
    gap: 8,
  },
  infoText: { flex: 1, color: '#3730A3', fontSize: 10, lineHeight: 14, fontFamily: 'Poppins-Medium' },
  bottomCtaWrap: {
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
  bottomCta: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    shadowColor: '#111827',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  bottomCtaDisabled: { opacity: 0.7 },
  bottomCtaText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Poppins-Black', letterSpacing: 1 },
});
