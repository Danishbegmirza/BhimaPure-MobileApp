import React, { useMemo, useState, useCallback } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
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
import LinearGradient from 'react-native-linear-gradient';
import type { RootStackParamList } from '../navigation/types';
import {
  createSchemePaymentOrder,
  normalizePaymentOrderResponse,
  updateEnrollmentDetails,
} from '../api/customerSchemes';
import { getToken } from '../storage/auth';
import { UnauthenticatedError } from '../api/apiClient';
import { goBackOrDashboard } from '../navigation/backNavigation';
import { useSafeBottomInset } from '../utils/safeBottomInset';

type Props = NativeStackScreenProps<RootStackParamList, 'JoinScheme'>;

export function JoinSchemeScreen({ navigation, route }: Props) {
  const safeBottom = useSafeBottomInset();
  const {
    customerSchemeId: initialCustomerSchemeId,
    schemeName,
    monthlyAmount,
    maturityLabel,
  } = route.params;

  const [nomineeName, setNomineeName] = useState('');
  const [relationship, setRelationship] = useState('');
  const [salesPerson, setSalesPerson] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const canProceed = useMemo(
    () => nomineeName.trim().length > 2 && relationship.trim().length > 1,
    [nomineeName, relationship],
  );

  const maturityDisplay = maturityLabel ?? '—';

  const onProceedToPayment = useCallback(async () => {
    if (!canProceed) { return; }
    try {
      setSubmitting(true);
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Please log in to continue.');
        return;
      }

      const customerSchemeId = initialCustomerSchemeId;
      if (customerSchemeId == null) {
        Alert.alert('Unable to continue', 'Please start from Scheme Details and try again.');
        return;
      }

      const salesTrim = salesPerson.trim();
      const update = await updateEnrollmentDetails(token, customerSchemeId, {
        nomineeName: nomineeName.trim(),
        nomineeRelationship: relationship.trim(),
        ...(salesTrim ? { salesPersonName: salesTrim } : {}),
      });
      if (!update.success) {
        Alert.alert('Unable to continue', update.message ?? 'Failed to save enrollment details.');
        return;
      }

      const rawOrder = await createSchemePaymentOrder(token, customerSchemeId, {
        customerSchemeId,
        amount: Math.round(monthlyAmount),
        paymentContext: 'SCHEME_REGISTRATION',
      });
      console.log('rawOrder', rawOrder);
      const order = normalizePaymentOrderResponse(rawOrder as Record<string, unknown>);
      if (!order.success || !order.order_id) {
        Alert.alert('Payment', order.message ?? order.error ?? 'Order creation failed.');
        return;
      }
      const razorpayKey = order.razorpayKey;
      if (!razorpayKey) {
        Alert.alert('Payment', 'Missing payment key. Please try again.');
        return;
      }

      navigation.navigate('PaymentMethod', {
        schemeId: String(customerSchemeId),
        customerSchemeId,
        paymentContext: 'SCHEME_REGISTRATION',
        amount: Math.round(monthlyAmount),
        schemeDisplayName: schemeName,
        initialOrder: {
          order_id: order.order_id,
          amount: order.amount ?? Math.round(monthlyAmount),
          razorpayKey,
          currency: order.currency ?? 'INR',
        },
      });
    } catch (e) {
      if (e instanceof UnauthenticatedError) { return; }
      Alert.alert('Error', 'Something went wrong. Please try again.');
    } finally {
      setSubmitting(false);
    }
  }, [
    canProceed,
    initialCustomerSchemeId,
    monthlyAmount,
    navigation,
    nomineeName,
    relationship,
    salesPerson,
    schemeName,
  ]);

  const amountRound = Math.round(monthlyAmount);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F4" />
      <View style={styles.screenWrap}>
        <KeyboardAvoidingView
          style={styles.formArea}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          keyboardVerticalOffset={Platform.OS === 'ios' ? 20 : 0}
        >
          <ScrollView
            contentContainerStyle={[styles.content, { paddingBottom: 140 + safeBottom }]}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
          <View style={styles.header}>
            <Pressable onPress={() => goBackOrDashboard(navigation)} style={styles.backButton}>
              <Ionicons name="arrow-back" size={20} color="#111827" />
            </Pressable>
            <View style={styles.headerTextWrap}>
              <Text style={styles.headerTitle}>Join Scheme</Text>
              <Text style={styles.headerSubTitle}>{schemeName.toUpperCase()}</Text>
            </View>
            <View style={styles.headerDots}>
              <View style={styles.dotActive} />
              <View style={styles.dotMuted} />
            </View>
          </View>
  
          <Text style={styles.pageTitle}>Enrollment Details</Text>
          <Text style={styles.pageSubTitle}>Complete the form to join the scheme.</Text>

          <View style={styles.amountCard}>
            <View style={styles.rowBetween}>
              <Text style={styles.amountLabel}>MONTHLY INSTALLMENT</Text>
              <View style={styles.editBadge}>
                <Ionicons name="create-outline" size={14} color="#E5E7EB" />
              </View>
            </View>
            <Text style={styles.installmentValue}>₹ {amountRound.toLocaleString('en-IN')}</Text>
            <View style={styles.amountMetaRow}>
              <View style={styles.metaSection}>
                <Text style={styles.metaTop}>PLAN</Text>
                <Text style={styles.metaValueLight}>{schemeName}</Text>
                <Text style={styles.metaHint}>per month</Text>
              </View>
              <View style={styles.metaSection}>
                <Text style={styles.metaTop}>MATURITY VALUE</Text>
                <Text style={styles.metaValueLight}>{maturityDisplay}</Text>
                <Text style={styles.metaHint}>from selected plan</Text>
              </View>
            </View>
          </View>

          <View style={styles.sectionLabelRow}>
            <Ionicons name="square-outline" size={11} color="#B7C0CD" />
            <Text style={styles.sectionLabel}>
              NOMINEE DETAILS <Text style={styles.required}>*</Text>
            </Text>
          </View>
          <View style={styles.inputCard}>
            <View style={styles.inputLabelRow}>
              <Ionicons name="person-outline" size={11} color="#9AA4B2" />
              <Text style={styles.inputLabel}>
                Full Name <Text style={styles.required}>*</Text>
              </Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder="Enter nominee's full name"
              placeholderTextColor="#9CA3AF"
              value={nomineeName}
              onChangeText={setNomineeName}
            />
            <View style={styles.inputLabelRow}>
              <Ionicons name="git-branch-outline" size={11} color="#9AA4B2" />
              <Text style={styles.inputLabel}>
                Relationship <Text style={styles.required}>*</Text>
              </Text>
            </View>
            <TextInput
              style={styles.input}
              placeholder=""
              placeholderTextColor="#9CA3AF"
              value={relationship}
              onChangeText={setRelationship}
            />
          </View>
  
          <Text style={styles.sectionLabel}>SALESPERSON NAME (OPTIONAL)</Text>
          <View style={styles.optionalWrap}>
            <TextInput
              style={styles.input}
              placeholder="Enter salesperson name if applicable"
              placeholderTextColor="#9CA3AF"
              value={salesPerson}
              onChangeText={setSalesPerson}
            />
          </View>
  
          <View style={styles.noticeCard}>
            <Ionicons name="information-circle-outline" size={16} color="#F39200" />
            <Text style={styles.noticeText}>
              First Payment Due: Your enrollment will be confirmed upon successful payment of the first
              installment.
            </Text>
          </View>
          </ScrollView>
        </KeyboardAvoidingView>

        <View style={[styles.bottomArea, { paddingBottom: 16 + safeBottom }]}>
        {/* <Pressable style={styles.secondaryButton} disabled>
          <Text style={styles.secondaryButtonText}>COMPLETE ALL FIELDS</Text>
          <Ionicons name="arrow-forward" size={14} color="#9CA3AF" />
        </Pressable> */}
        <Pressable
          style={[styles.primaryButton, (!canProceed || submitting) && styles.buttonDisabled]}
          disabled={!canProceed || submitting}
          onPress={onProceedToPayment}
        >
          <LinearGradient
            colors={['#FFA800', '#F38B00']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.primaryButtonGradient}
          >
            {submitting ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.primaryButtonText}>PROCEED TO PAYMENT</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </>
            )}
          </LinearGradient>
        </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F3',
  },
  screenWrap: {
    flex: 1,
  },
  formArea: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 16,
    paddingTop: 10,
    gap: 12,
    marginTop: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 16,
  },
  backButton: {
    width: 34,
    height: 34,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTextWrap: {
    flex: 1,
    marginLeft: 2,
  },
  headerTitle: {
    color: '#111827',
    fontSize: 18,
    fontFamily: 'Jost-BoldItalic',
    lineHeight: 27,
  },
  headerSubTitle: {
    color: '#98A2B3',
    fontSize: 7,
    fontFamily: 'Poppins-Black',
    letterSpacing: 1.1,
  },
  headerDots: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    width: 34,
    justifyContent: 'flex-end',
  },
  dotActive: {
    width: 11,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#EF7D00',
  },
  dotMuted: {
    width: 8,
    height: 3,
    borderRadius: 2,
    backgroundColor: '#F8C371',
  },
  pageTitle: {
    marginTop: 2,
    color: '#111827',
    fontSize: 24,
    fontFamily: 'Jost-BoldItalic',
    lineHeight: 38,
  },
  pageSubTitle: {
    marginTop: -2,
    color: '#7B8593',
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
  },
  amountCard: {
    marginTop: 6,
    borderRadius: 23,
    backgroundColor: '#070707',
    padding: 18,
    gap: 8,
    shadowColor: '#0B0F17',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.24,
    shadowRadius: 14,
    elevation: 4,
  },
  rowBetween: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  amountLabel: {
    color: '#C6CED9',
    letterSpacing: 1.3,
    fontSize: 7,
    fontFamily: 'Poppins-Bold',
  },
  editBadge: {
    width: 28,
    height: 28,
    borderRadius: 10,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  installmentValue: {
    color: '#FFFFFF',
    fontSize: 28,
    fontFamily: 'Poppins-Black',
    lineHeight: 46,
  },
  amountMetaRow: {
    marginTop: 3,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  metaSection: {
    flex: 1,
  },
  metaTop: {
    color: '#9BA4B2',
    letterSpacing: 0.9,
    fontSize: 8,
    fontFamily: 'Poppins-SemiBold',
  },
  metaValue: {
    marginTop: 2,
    color: '#25D58D',
    fontSize: 28,
    lineHeight: 38,
    fontFamily: 'Poppins-Black',
  },
  metaValueLight: {
    marginTop: 3,
    color: '#F6C23C',
    fontSize: 16,
    lineHeight: 24,
    fontFamily: 'Poppins-Bold',
  },
  metaHint: {
    marginTop: -1,
    color: '#8A93A4',
    fontSize: 8,
    fontFamily: 'Poppins-Medium',
  },
  sectionLabelRow: {
    marginTop: 6,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  sectionLabel: {
    color: '#96A0AE',
    letterSpacing: 1.2,
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
  },
  required: {
    color: '#EF4444',
  },
  inputCard: {
    borderRadius: 24,
    backgroundColor: '#F1F2F4',
    padding: 14,
    gap: 9,
  },
  inputLabelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  inputLabel: {
    color: '#111827',
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
  },
  input: {
    minHeight: 42,
    backgroundColor: '#E9EAED',
    borderRadius: 13,
    paddingHorizontal: 14,
    color: '#1F2937',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  optionalWrap: {
    borderRadius: 24,
    backgroundColor: '#F1F2F4',
    padding: 14,
  },
  noticeCard: {
    marginTop: 4,
    borderRadius: 18,
    backgroundColor: '#FFF7E6',
    borderWidth: 1,
    borderColor: '#F8D692',
    padding: 13,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  noticeText: {
    flex: 1,
    color: '#A76300',
    fontSize: 9,
    lineHeight: 13,
    fontFamily: 'Poppins-Medium',
  },
  bottomArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F5F5F3',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 16,
    paddingTop: 12,
    gap: 10,
    shadowColor: '#64748B',
    shadowOffset: { width: 0, height: -3 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 4,
  },
  secondaryButton: {
    minHeight: 56,
    borderRadius: 28,
    backgroundColor: '#E8E9EC',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
    opacity: 0.95,
  },
  secondaryButtonText: {
    color: '#9199A8',
    fontSize: 12,
    letterSpacing: 0.6,
    fontFamily: 'Poppins-Bold',
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#B45309',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.24,
    shadowRadius: 12,
    elevation: 4,
  },
  primaryButtonGradient: {
    width: '100%',
    minHeight: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins-Black',
    letterSpacing: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
});
