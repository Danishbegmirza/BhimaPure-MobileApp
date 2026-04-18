import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
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
import RazorpayCheckout from 'react-native-razorpay';
import type { RootStackParamList } from '../navigation/types';
import {
  createSchemePaymentOrder,
  normalizePaymentOrderResponse,
  verifyRazorpayPayment,
} from '../api/customerSchemes';
import { getToken } from '../storage/auth';
import { UnauthenticatedError } from '../api/apiClient';
import { RAZORPAY_KEY_ID } from '../config/payment';
import { goBackOrDashboard } from '../navigation/backNavigation';
import { useSafeBottomInset } from '../utils/safeBottomInset';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentMethod'>;

type PaymentToast = { message: string; variant: 'error' | 'info' };

function usePaymentToast() {
  const [toast, setToast] = useState<PaymentToast | null>(null);
  const opacity = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!toast) {
      return;
    }
    Animated.sequence([
      Animated.timing(opacity, { toValue: 1, duration: 180, useNativeDriver: true }),
      Animated.delay(3200),
      Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
    ]).start(({ finished }) => {
      if (finished) { setToast(null); }
    });
    return () => {
      opacity.stopAnimation();
    };
  }, [toast, opacity]);

  const showToast = useCallback((message: string, variant: PaymentToast['variant'] = 'error') => {
    opacity.setValue(0);
    setToast({ message, variant });
  }, [opacity]);

  return { toast, opacity, showToast };
}

function parseRazorpayError(error: unknown): { message: string; cancelled: boolean } {
  if (typeof error !== 'object' || error === null) {
    return { message: '', cancelled: false };
  }

  const directDescription = 'description' in error
    ? String((error as { description?: unknown }).description ?? '')
    : '';
  const nestedError = 'error' in error ? (error as { error?: unknown }).error : null;
  const nestedDescription = (
    typeof nestedError === 'object' &&
    nestedError !== null &&
    'description' in nestedError
  )
    ? String((nestedError as { description?: unknown }).description ?? '')
    : '';
  const code = (
    typeof nestedError === 'object' &&
    nestedError !== null &&
    'code' in nestedError
  )
    ? String((nestedError as { code?: unknown }).code ?? '')
    : '';

  const message = (nestedDescription || directDescription).trim();
  const lower = message.toLowerCase();
  const cancelledByMessage =
    lower.includes('cancel') ||
    lower.includes('dismiss') ||
    lower.includes('back') ||
    lower.includes('close');
  const cancelledByCode =
    code === '0' ||
    code.toLowerCase().includes('cancel');

  return { message, cancelled: cancelledByMessage || cancelledByCode };
}

export function PaymentMethodScreen({ navigation, route }: Props) {
  const safeBottom = useSafeBottomInset();
  const { toast, opacity, showToast } = usePaymentToast();
  const {
    schemeId,
    customerSchemeId,
    paymentContext,
    amount,
    schemeDisplayName,
  } = route.params;

  const [paying, setPaying] = useState(false);

  const title =
    paymentContext === 'SCHEME_REGISTRATION'
      ? 'SCHEME_REGISTRATION'
      : 'INSTALLMENT PAYMENT';

  const onPay = useCallback(async () => {
    if (amount <= 0) {
      Alert.alert('Invalid amount', 'Payment amount must be greater than zero.');
      return;
    }
    try {
      setPaying(true);
      const token = await getToken();
      if (!token) {
        Alert.alert('Error', 'Please log in to continue.');
        return;
      }
      const order = normalizePaymentOrderResponse(
        await createSchemePaymentOrder(token, customerSchemeId, {
          customerSchemeId,
          amount,
          paymentContext,
        }) as Record<string, unknown>,
      );
      if (!order.success) {
        Alert.alert(
          'Payment',
          order.message ?? order.error ?? 'Order creation failed.',
        );
        return;
      }

      const razorpayKey = order.razorpayKey ?? RAZORPAY_KEY_ID;
      if (!razorpayKey || !order.order_id) {
        Alert.alert('Payment', 'Missing Razorpay order details. Please try again.');
        return;
      }

      const checkoutOptions = {
        key: razorpayKey,
        amount: Math.round((order.amount ?? amount) * 100),
        currency: order.currency ?? 'INR',
        name: 'Bhima Pure',
        description: schemeDisplayName ?? 'Scheme payment',
        order_id: String(order.order_id),
        theme: { color: '#F39200' },
        // Keep contact collection optional in checkout UI.
        hidden: {
          contact: true,
          email: true,
        },
      };
      console.log('checkoutOptions===', checkoutOptions);

      const payment = await RazorpayCheckout.open(checkoutOptions);
      console.log('payment===', payment);

      const verify = await verifyRazorpayPayment(token, {
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_signature: payment.razorpay_signature,
        amount: Math.round(order.amount ?? amount),
      });
      console.log('verify===', verify);
      console.log('payment===',  {
        razorpay_payment_id: payment.razorpay_payment_id,
        razorpay_order_id: payment.razorpay_order_id,
        razorpay_signature: payment.razorpay_signature,
        amount: Math.round(order.amount ?? amount),
      });

      if (verify.success || verify.status) {
        navigation.navigate('PaymentSuccess', { schemeId });
        return;
      }

      showToast(
        verify.message ?? 'Payment could not be verified. Please try again or contact support.',
        'error',
      );
    } catch (e) {
      if (e instanceof UnauthenticatedError) { return; }
      const parsed = parseRazorpayError(e);
      if (parsed.cancelled) {
        showToast('Payment is cancelled.', 'info');
        return;
      }
      if (parsed.message) {
        showToast(parsed.message, 'error');
        console.log('parsed.message===', parsed.message);
        if(parsed?.message == "Post payment parsing error"){
          showToast('Payment is failed. Please try again.', 'error');
          return;
        }
        if(parsed?.message || parsed?.message == "undefined"){
          showToast('Payment is cancelled.', 'info');
        } else {
          showToast('Unable to start payment. Please try again.', 'error');
        }
      }
    } finally {
      setPaying(false);
    }
  }, [amount, customerSchemeId, navigation, paymentContext, schemeDisplayName, schemeId, showToast]);
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F3" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 112 + safeBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={() => goBackOrDashboard(navigation)}>
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </Pressable>
          <Text style={styles.headerTitle}>Payment</Text>
          <View style={styles.iconBtn} />
        </View>

        {schemeDisplayName ? (
          <Text style={styles.schemeTag}>{schemeDisplayName}</Text>
        ) : null}

        <View style={styles.amountSection}>
          <Text style={styles.amountLabel}>{title}</Text>
          <Text style={styles.amountValue}>₹{amount.toLocaleString('en-IN')}</Text>
          <View style={styles.secureTag}>
            <Ionicons name="shield-checkmark-outline" size={12} color="#10B981" />
            <Text style={styles.secureText}>AUTOPAY SECURED</Text>
          </View>
        </View>

        <Text style={styles.blockTitle}>PAYMENT GATEWAY</Text>
        <Pressable style={styles.gatewayCard}>
          <View style={styles.gatewayIcon}>
            <Ionicons name="flash" size={16} color="#FFFFFF" />
          </View>
          <View style={styles.gatewayBody}>
            <Text style={styles.gatewayTitle}>Razorpay</Text>
            <Text style={styles.gatewaySub}>UPI, CARDS, NET BANKING</Text>
          </View>
          <Ionicons name="radio-button-on" size={18} color="#4F46E5" />
        </Pressable>

        <View style={styles.safeCard}>
          <View style={styles.safeHeader}>
            <Ionicons name="shield-checkmark-outline" size={14} color="#059669" />
            <Text style={styles.safeTitle}>SECURE PAYMENT</Text>
          </View>
          <Text style={styles.safeBody}>
            Your payment is processed through Razorpay with bank-grade security.
          </Text>
        </View>

        <View style={styles.bulletWrap}>
          <Text style={styles.bulletText}>Instant payment confirmation</Text>
          <Text style={styles.bulletText}>Multiple payment options in one</Text>
          <Text style={styles.bulletText}>Refund protection available</Text>
        </View>

        <View style={styles.summaryCard}>
          <Text style={styles.summaryTitle}>PAYMENT SUMMARY</Text>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>
              {paymentContext === 'SCHEME_REGISTRATION' ? 'INITIAL INSTALLMENT' : 'INSTALLMENT'}
            </Text>
            <Text style={styles.summaryValue}>₹ {amount.toLocaleString('en-IN')}</Text>
          </View>
          <View style={styles.summaryRow}>
            <Text style={styles.summaryKey}>GATEWAY FEE</Text>
            <Text style={styles.summaryValueAccent}>ABSORBED BY US</Text>
          </View>
          <View style={styles.summaryDivider} />
          <View style={styles.summaryRow}>
            <Text style={styles.summaryTotalKey}>TOTAL PAYABLE</Text>
            <Text style={styles.summaryTotalValue}>₹{amount.toLocaleString('en-IN')}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={[styles.bottomCtaWrap, { paddingBottom: 14 + safeBottom }]}>
        <Pressable style={styles.bottomCta} onPress={onPay} disabled={paying}>
          <LinearGradient
            colors={['#FFA800', '#F38B00']}
            start={{ x: 0, y: 0.5 }}
            end={{ x: 1, y: 0.5 }}
            style={styles.bottomCtaGradient}
          >
            {paying ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <Text style={styles.bottomCtaText}>PAY ₹{amount.toLocaleString('en-IN')} SECURELY</Text>
                <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
              </>
            )}
          </LinearGradient>
        </Pressable>
      </View>

      {toast ? (
        <Animated.View
          pointerEvents="none"
          style={[
            styles.toastWrap,
            { bottom: 88 + safeBottom, opacity },
            toast.variant === 'error' ? styles.toastError : styles.toastInfo,
          ]}
        >
          <Ionicons
            name={toast.variant === 'error' ? 'close-circle' : 'information-circle'}
            size={18}
            color={toast.variant === 'error' ? '#FEE2E2' : '#E0E7FF'}
          />
          <Text style={styles.toastText}>{toast.message}</Text>
        </Animated.View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F3' },
  content: { paddingHorizontal: 16, paddingTop: 8, gap: 12 },
  header: { flexDirection: 'row',  paddingTop: 22 },
  iconBtn: { width: 24, height: 24, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { color: '#111827', fontSize: 22, lineHeight: 26, fontFamily: 'Jost-BoldItalic', marginLeft:10 },
  schemeTag: {
    color: '#6B7280',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
    marginTop: -4,
  },
  amountSection: { alignItems: 'center', marginTop: 8 },
  amountLabel: { color: '#96A0AE', fontSize: 9, letterSpacing: 1.7, fontFamily: 'Poppins-Bold' },
  amountValue: { marginTop: 2, color: '#0F172A', fontSize: 58, lineHeight: 60, fontFamily: 'Poppins-Black' },
  secureTag: {
    marginTop: 8,
    borderRadius: 12,
    backgroundColor: '#D1FAE5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  secureText: { color: '#047857', fontSize: 9, fontFamily: 'Poppins-Bold', letterSpacing: 0.9 },
  blockTitle: { color: '#96A0AE', fontSize: 9, letterSpacing: 1.7, fontFamily: 'Poppins-Bold', marginTop: 6 },
  gatewayCard: {
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: '#4F46E5',
    backgroundColor: '#FFFFFF',
    minHeight: 78,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#4F46E5',
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  gatewayIcon: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#4F46E5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gatewayBody: { flex: 1 },
  gatewayTitle: { color: '#0F172A', fontSize: 15, fontFamily: 'Poppins-Bold' },
  gatewaySub: { color: '#9CA3AF', fontSize: 9, letterSpacing: 1, fontFamily: 'Poppins-SemiBold', marginTop: 2 },
  safeCard: {
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    backgroundColor: '#ECFDF5',
    padding: 14,
  },
  safeHeader: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  safeTitle: { color: '#065F46', fontSize: 11, letterSpacing: 0.9, fontFamily: 'Poppins-Bold' },
  safeBody: { marginTop: 6, color: '#047857', fontSize: 10, lineHeight: 14, fontFamily: 'Poppins-Medium' },
  bulletWrap: { gap: 10 },
  bulletText: { color: '#374151', fontSize: 13, fontFamily: 'Poppins-Medium', paddingLeft: 12 },
  summaryCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EBEF',
    padding: 14,
    gap: 8,
    shadowColor: '#111827',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  summaryTitle: { color: '#96A0AE', fontSize: 9, letterSpacing: 1.6, fontFamily: 'Poppins-Bold' },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  summaryKey: { color: '#6B7280', fontSize: 10, letterSpacing: 0.9, fontFamily: 'Poppins-SemiBold' },
  summaryValue: { color: '#0F172A', fontSize: 10, fontFamily: 'Poppins-Bold' },
  summaryValueAccent: { color: '#059669', fontSize: 10, fontFamily: 'Poppins-Black', letterSpacing: 0.8 },
  summaryDivider: { height: 1, backgroundColor: '#E5E7EB', marginVertical: 2 },
  summaryTotalKey: { color: '#6B7280', fontSize: 11, letterSpacing: 1.1, fontFamily: 'Poppins-Bold' },
  summaryTotalValue: { color: '#0F172A', fontSize: 44, lineHeight: 46, fontFamily: 'Poppins-Black' },
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
    minHeight: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#3730A3',
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  bottomCtaGradient: {
    width: '100%',
    minHeight: 54,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  bottomCtaText: { color: '#FFFFFF', fontSize: 12, fontFamily: 'Poppins-Black', letterSpacing: 0.4 },
  toastWrap: {
    position: 'absolute',
    left: 16,
    right: 16,
    borderRadius: 14,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    shadowColor: '#000000',
    shadowOpacity: 0.2,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 6,
  },
  toastError: { backgroundColor: '#991B1B' },
  toastInfo: { backgroundColor: '#4338CA' },
  toastText: {
    flex: 1,
    color: '#FFFFFF',
    fontSize: 13,
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',
  },
});
