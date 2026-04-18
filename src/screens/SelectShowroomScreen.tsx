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
import type { RootStackParamList } from '../navigation/types';
import { postRedemptionStatus } from '../api/customerSchemes';
import { fetchBranchList, fetchProfile, type BranchItem } from '../api/user';
import { getToken } from '../storage/auth';
import { UnauthenticatedError } from '../api/apiClient';
import { goBackOrDashboard } from '../navigation/backNavigation';
import { useSafeBottomInset } from '../utils/safeBottomInset';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectShowroom'>;

function parseCustomerCode(code: string): number | string {
  const trimmed = code.trim();
  if (/^\d+$/.test(trimmed)) {
    return Number(trimmed);
  }
  return trimmed;
}

export function SelectShowroomScreen({ navigation, route }: Props) {
  const safeBottom = useSafeBottomInset();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [branches, setBranches] = useState<BranchItem[]>([]);
  const [selectedCode, setSelectedCode] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const loadBranches = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) { setError('Please log in.'); return; }
      const result = await fetchBranchList(token);
      if (result.success) {
        const data = result.branchdata ?? [];
        setBranches(data);
        if (data.length > 0) { setSelectedCode(data[0].branch_code); }
      } else {
        setError('Failed to load branch list.');
      }
    } catch (_e) {
      setError('Unable to load branches. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadBranches();
  }, [loadBranches]);

  const onConfirmShowroom = useCallback(async () => {
    if (!selectedCode) { return; }
    const showroom =
      branches.find(b => b.branch_code === selectedCode)?.display_name ?? selectedCode;
    try {
      setSubmitting(true);
      const token = await getToken();
      if (!token) { return; }
      const profileRes = await fetchProfile(token);
      if (!profileRes.success || !profileRes.data?.customer_code) {
        Alert.alert('Error', 'Could not load your customer profile.');
        return;
      }
      const customerCode = parseCustomerCode(profileRes.data.customer_code);
      const customerschemeId = Number(route.params.schemeId);
      const res = await postRedemptionStatus(token, {
        customerCode,
        customerschemeId,
        redumption_mode: 'jwellery',
        showroom,
      });
      if (res.status) {
        navigation.navigate('RedemptionSuccess', { schemeId: route.params.schemeId });
      } else {
        Alert.alert('Redemption', res.message ?? 'Could not update redemption mode.');
      }
    } catch (e) {
      if (e instanceof UnauthenticatedError) { return; }
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [branches, navigation, route.params.schemeId, selectedCode]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F3" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 106 + safeBottom }]}
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

        <Text style={styles.title}>Select Showroom</Text>
        <Text style={styles.subtitle}>
          Choose the branch where you wish to collect your gold.
        </Text>

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
        ) : (
          <View style={styles.listWrap}>
            {branches.map(branch => {
              const isSelected = branch.branch_code === selectedCode;
              return (
                <Pressable
                  key={branch.branch_code}
                  style={[styles.item, isSelected && styles.itemSelected]}
                  onPress={() => setSelectedCode(branch.branch_code)}
                >
                  <View style={styles.itemLeft}>
                    <Ionicons name="storefront-outline" size={16} color="#94A3B8" />
                    <Text style={styles.itemText}>{branch.display_name}</Text>
                  </View>
                  <Ionicons
                    name={isSelected ? 'radio-button-on' : 'radio-button-off'}
                    size={18}
                    color={isSelected ? '#F39200' : '#D1D5DB'}
                  />
                </Pressable>
              );
            })}
          </View>
        )}
      </ScrollView>

      <View style={[styles.bottomCtaWrap, { paddingBottom: 14 + safeBottom }]}>
        <Pressable
          style={[
            styles.bottomCta,
            (!selectedCode || submitting) && styles.bottomCtaDisabled,
          ]}
          disabled={!selectedCode || submitting}
          onPress={onConfirmShowroom}
        >
          {submitting ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <>
              <Text style={styles.bottomCtaText}>NEXT STEP</Text>
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
  content: { paddingHorizontal: 14, paddingTop: 8 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 30,
  },
  iconBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 22, lineHeight: 26, fontFamily: 'Jost-BoldItalic', color: '#111827' },
  headerRightDots: {
    width: 24,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 3,
  },
  dotActive: { width: 8, height: 3, borderRadius: 2, backgroundColor: '#F59E0B' },
  dotMuted: { width: 6, height: 3, borderRadius: 2, backgroundColor: '#FCD7A1' },
  title: { marginTop: 14, color: '#111827', fontSize: 32, lineHeight: 36, fontFamily: 'Jost-BoldItalic' },
  subtitle: {
    marginTop: 4,
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',
  },
  loadingWrap: { paddingVertical: 60, alignItems: 'center' },
  errorWrap: { paddingVertical: 40, alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  errorText: { color: '#6B7280', fontSize: 13, fontFamily: 'Poppins-Medium', textAlign: 'center' },
  retryButton: { paddingVertical: 10, paddingHorizontal: 28, borderRadius: 12, backgroundColor: '#111827' },
  retryText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Poppins-Black', letterSpacing: 1.4 },
  listWrap: { marginTop: 16, gap: 10 },
  item: {
    borderRadius: 18,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EBEF',
    minHeight: 64,
    paddingHorizontal: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  itemSelected: {
    borderColor: '#F39200',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.22,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 3 },
    elevation: 3,
  },
  itemLeft: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemText: { color: '#374151', fontSize: 18, lineHeight: 22, fontFamily: 'Jost-BoldItalic' },
  bottomCtaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F5F5F3',
    paddingHorizontal: 16,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#E8EBEF',
  },
  bottomCta: {
    minHeight: 52,
    borderRadius: 18,
    backgroundColor: '#050505',
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
  bottomCtaDisabled: { backgroundColor: '#9CA3AF' },
  bottomCtaText: { color: '#FFFFFF', fontSize: 11, letterSpacing: 1, fontFamily: 'Poppins-Black' },
});
