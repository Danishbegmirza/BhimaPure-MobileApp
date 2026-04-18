import React, { useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { RootStackParamList } from '../navigation/types';
import LinearGradient from 'react-native-linear-gradient';
import { verifyOTP, isVerifyOtpSuccess, isValidationError, isNewUser } from '../api/auth';
import { saveToken, saveCustomer, savePendingMobile } from '../storage/auth';
import { goBackOrDashboard } from '../navigation/backNavigation';
import { useSafeBottomInset } from '../utils/safeBottomInset';

type Props = NativeStackScreenProps<RootStackParamList, 'VerifyOtp'>;

const OTP_DIGITS = 6;
const RESEND_SECONDS = 19;

export function VerifyOtpScreen({ navigation, route }: Props) {
  const safeBottom = useSafeBottomInset();
  const [otp, setOtp] = useState('');
  const [secondsLeft, setSecondsLeft] = useState(RESEND_SECONDS);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [isInputFocused, setIsInputFocused] = useState(false);

  const inputRef = useRef<TextInput>(null);
  const isOtpReady = useMemo(() => otp.length === OTP_DIGITS, [otp]);
  const { phoneNumber } = route.params;

  // ─── Countdown timer ────────────────────────────────────────────────────────
  useEffect(() => {
    if (secondsLeft === 0) {
      return undefined;
    }

    const timerId = setInterval(() => {
      setSecondsLeft(previous => Math.max(previous - 1, 0));
    }, 1000);

    return () => {
      clearInterval(timerId);
    };
  }, [secondsLeft]);

  // ─── OTP input handler ──────────────────────────────────────────────────────
  const onOtpChange = (value: string) => {
    const digitsOnly = value.replace(/\D/g, '');
    setOtp(digitsOnly.slice(0, OTP_DIGITS));
    setErrorMsg('');
  };

  // ─── Verify OTP ─────────────────────────────────────────────────────────────
  const handleVerifyOtp = async () => {
    if (!isOtpReady || loading) {
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await verifyOTP(phoneNumber, otp);
      console.log('response', response);

      if (isValidationError(response)) {
        const otpErrors = response.errors.otp;
        const mobileErrors = response.errors.mobile;
        const firstError = otpErrors?.[0] ?? mobileErrors?.[0] ?? response.message;
        setErrorMsg(firstError);
        return;
      }

      if (isNewUser(response)) {
        // New user – save mobile number so CompleteProfile can pre-fill it
        await savePendingMobile(phoneNumber);
        navigation.replace('CompleteProfile');
        return;
      }

      if (isVerifyOtpSuccess(response)) {
        // Persist token and customer data
        await saveToken(response.token);
        await saveCustomer(response.customer);

        // Navigate to dashboard
        navigation.replace('Dashboard');
      }
    } catch (error) {
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const resendAllowed = secondsLeft === 0;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F5F0" />
      <View style={styles.container}>
        <TextInput
          ref={inputRef}
          value={otp}
          onChangeText={onOtpChange}
          onFocus={() => setIsInputFocused(true)}
          onBlur={() => setIsInputFocused(false)}
          keyboardType="number-pad"
          maxLength={OTP_DIGITS}
          style={styles.hiddenInput}
        />

        <Pressable style={styles.backButton} onPress={() => goBackOrDashboard(navigation)}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" />
        </Pressable>

        <Pressable style={styles.iconWrap} onPress={() => inputRef.current?.focus()}>
          <Image source={require('../assets/verifyOtplogo.png')} style={styles.iconImage} resizeMode="contain" />
        </Pressable>

        <Text style={styles.title}>Verify OTP</Text>
        <Text style={styles.subtitle}>Enter the 6-digit code sent to</Text>
        <Text style={styles.mobileText}>{phoneNumber}</Text>

        <Pressable style={styles.otpRow} onPress={() => inputRef.current?.focus()}>
          {Array.from({ length: OTP_DIGITS }, (_, index) => {
            const digit = otp[index] ?? '';
            const isActive = index === otp.length && otp.length < OTP_DIGITS;
            const showCursor = isInputFocused && isActive && digit.length === 0;
            return (
              <View
                key={index}
                style={[
                  styles.otpBox,
                  isActive && styles.otpBoxActive,
                  !!errorMsg && styles.otpBoxError,
                ]}
              >
                {showCursor ? <View style={styles.otpCursor} /> : <Text style={styles.otpDigit}>{digit}</Text>}
              </View>
            );
          })}
        </Pressable>

        {!!errorMsg && (
          <View style={styles.errorRow}>
            <Ionicons name="alert-circle-outline" size={13} color="#E03636" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        )}

        <View style={styles.resendRow}>
          <Text style={styles.dot}>•</Text>
          {resendAllowed ? (
            <Pressable
              onPress={() => {
                setSecondsLeft(RESEND_SECONDS);
                setOtp('');
                setErrorMsg('');
                inputRef.current?.focus();
              }}
            >
              <Text style={styles.resendTextActive}>Resend OTP</Text>
            </Pressable>
          ) : (
            <Text style={styles.resendText}>
              Resend OTP in <Text style={styles.timeText}>0:{String(secondsLeft).padStart(2, '0')}</Text>
            </Text>
          )}
        </View>

        <View style={styles.infoCard}>
          <View style={styles.infoIcon}>
            <Ionicons name="checkmark-circle-outline" size={18} color="#12B76A" />
          </View>
          <View style={styles.infoTextWrap}>
            <Text style={styles.infoTitle}>Secure Verification</Text>
            <Text style={styles.infoBody}>Your OTP is valid for 5 minutes. Never share it with anyone.</Text>
          </View>
        </View>

        <View style={styles.bottomWrap}>
          <Pressable
            style={[styles.primaryButton, (!isOtpReady || loading) && styles.primaryButtonDisabled]}
            onPress={handleVerifyOtp}
            disabled={!isOtpReady || loading}
          >
            <LinearGradient
              colors={['#FFA800', '#F38B00']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.primaryButtonGradient}
            >
              {loading ? (
                <ActivityIndicator color="#FFFFFF" size="small" />
              ) : (
                <>
                  <Text style={styles.primaryButtonText}>VERIFY OTP</Text>
                  <Ionicons name="arrow-forward" size={17} color="#FFFFFF" />
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
    backgroundColor: '#F7F5F0',
  },
  container: {
    flex: 1,
    paddingHorizontal: 22,
    paddingTop: 30,
  },
  hiddenInput: {
    position: 'absolute',
    opacity: 0,
    width: 1,
    height: 1,
  },
  backButton: {
    width: 38,
    height: 38,
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconWrap: {
    marginTop: 20,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconImage: {
    width: 120,
    height: 120,
  },
  title: {
    textAlign: 'center',
    color: '#111827',
    fontSize: 25,
    fontFamily: 'Poppins-Bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 8,
    textAlign: 'center',
    fontSize: 14,
    color: '#667085',
    fontFamily: 'Poppins-Medium',
  },
  mobileText: {
    marginTop: 4,
    textAlign: 'center',
    color: '#111827',
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
  },
  otpRow: {
    marginTop: 36,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  otpBox: {
    width: 40,
    height: 53,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: '#F39A00',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxActive: {
    borderColor: '#FFA800',
    backgroundColor: '#FFF8EC',
  },
  otpBoxError: {
    borderColor: '#E03636',
  },
  otpDigit: {
    color: '#111827',
    fontSize: 31,
    fontWeight: '700',
  },
  otpCursor: {
    width: 2,
    height: 28,
    borderRadius: 1,
    backgroundColor: '#111827',
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 10,
    justifyContent: 'center',
  },
  errorText: {
    color: '#E03636',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  resendRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 6,
  },
  dot: {
    color: '#F39A00',
    fontSize: 25,
    fontFamily: 'Poppins-Bold',
  },
  resendText: {
    color: '#4B5563',
    fontSize: 15,
    fontFamily: 'Poppins-Medium',
  },
  timeText: {
    color: '#F39A00',
    fontFamily: 'Poppins-Bold',
  },
  resendTextActive: {
    color: '#F39A00',
    fontSize: 17,
    fontFamily: 'Poppins-Bold',
  },
  infoCard: {
    marginTop: 40,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#DEE3EA',
    backgroundColor: '#F8F8F8',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  infoIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#E9FAEF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: -30,
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitle: {
    color: '#111827',
    fontSize: 14,
    fontFamily: 'Poppins-Black',
  },
  infoBody: {
    marginTop: 4,
    color: '#667085',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',
  },
  bottomWrap: {
    marginTop: 50,
  },
  primaryButton: {
    minHeight: 60,
    borderRadius: 30,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000000',
    shadowOpacity: 0.25,
    shadowRadius: 16,
    shadowOffset: { width: 0, height: 12 },
    elevation: 10,
    flexDirection: 'row',
    gap: 7,
    overflow: 'hidden',
  },
  primaryButtonGradient: {
    width: '100%',
    minHeight: 60,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 7,
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-Black',
    letterSpacing: 0.8,
  },
});
