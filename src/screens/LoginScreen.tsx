import React, { useMemo, useState } from 'react';
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
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import LinearGradient from 'react-native-linear-gradient';
import type { RootStackParamList } from '../navigation/types';
import { requestOTP, isRequestOtpSuccess, isValidationError, isNewUser } from '../api/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export function LoginScreen({ navigation }: Props) {
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const isValidPhone = useMemo(() => phoneNumber.length === 10, [phoneNumber]);

  const handlePhoneChange = (value: string) => {
    const numbersOnly = value.replace(/\D/g, '');
    setPhoneNumber(numbersOnly.slice(0, 10));
    setErrorMsg('');
  };

  const handleSendOtp = async () => {
    if (!isValidPhone) {
      return;
    }

    setLoading(true);
    setErrorMsg('');

    try {
      const response = await requestOTP(phoneNumber);

      if (isValidationError(response)) {
        // e.g. "The mobile field must be 10 digits."
        const mobileErrors = response.errors.mobile;
        setErrorMsg(mobileErrors ? mobileErrors[0] : response.message);
        return;
      }

      if (isNewUser(response)) {
        // Mobile number not registered
        Alert.alert(
          'Not Registered',
          response.message,
          [{ text: 'OK' }],
        );
        return;
      }

      if (isRequestOtpSuccess(response)) {
        // OTP sent – navigate to verify screen
        navigation.navigate('VerifyOtp', { phoneNumber });
      }
    } catch (error) {
      setErrorMsg('Something went wrong. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F5F0" />
      <View style={styles.container}>
        <View style={styles.brandWrap}>
          <Image source={require('../assets/loginIcon.png')} style={styles.brandLogo} resizeMode="contain" />
          <Text style={styles.brandCaption}>G O L D   S A V I N G S   S C H E M E S</Text>
        </View>

        <Text style={styles.title}>Welcome Back!</Text>
        <Text style={styles.subtitle}>Enter your mobile number to continue</Text>

        <View style={[styles.phoneCard, errorMsg ? styles.phoneCardError : null]}>
          <View style={styles.labelRow}>
            <Ionicons name="call-outline" size={11} color="#9AA1AE" />
            <Text style={styles.inputLabel}>MOBILE NUMBER</Text>
          </View>
          <View style={styles.inputWrap}>
            <Text style={styles.countryCode}>+91</Text>
            <TextInput
              placeholder="Enter 10-digit number"
              placeholderTextColor="#9AA1AE"
              keyboardType="number-pad"
              value={phoneNumber}
              onChangeText={handlePhoneChange}
              style={styles.input}
              maxLength={10}
            />
            <Ionicons
              name="checkmark-circle-outline"
              size={15}
              color={isValidPhone ? '#00B060' : '#C3CAD5'}
            />
          </View>
          {!!errorMsg && (
            <View style={styles.errorRow}>
              <Ionicons name="alert-circle-outline" size={13} color="#E03636" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          )}
        </View>

        <View style={styles.bottomWrap}>
          <Pressable
            style={[styles.primaryButton, (!isValidPhone || loading) && styles.primaryButtonDisabled]}
            onPress={handleSendOtp}
            disabled={!isValidPhone || loading}
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
                  <Text style={styles.primaryButtonText}>GET STARTED</Text>
                  <Ionicons name="arrow-forward" size={16} color="#FFFFFF" />
                </>
              )}
            </LinearGradient>
          </Pressable>

          <View style={styles.infoCardBlue}>
            <View style={styles.infoIconBlue}>
              <Ionicons name="shield-checkmark-outline" size={14} color="#5B6EFF" />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoTitleBlue}>Secure &amp; Protected</Text>
              <Text style={styles.infoBodyBlue}>
                Your personal information is encrypted and stored securely
              </Text>
            </View>
          </View>

          <View style={styles.infoCardYellow}>
            <View style={styles.infoIconYellow}>
              <Ionicons name="sparkles-outline" size={14} color="#F39200" />
            </View>
            <View style={styles.infoTextWrap}>
              <Text style={styles.infoTitleYellow}>Trusted by Thousands</Text>
              <Text style={styles.infoBodyYellow}>
                Join India&apos;s leading gold investment community
              </Text>
            </View>
          </View>

          <Text style={styles.termsText}>
            By continuing, you agree to our <Text style={styles.termsAccent}>Term</Text> and{' '}
            <Text style={styles.termsAccent}>Privacy Policy</Text>
          </Text>
          
          <TouchableOpacity onPress={() => navigation.navigate('Dashboard')}>
            <Text style={styles.guestText}>Continue as Guest</Text>
          </TouchableOpacity>
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
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 54,
    paddingBottom: 20,
  },
  brandWrap: {
    alignSelf: 'center',
    alignItems: 'center',
  },
  brandLogo: {
    width: 248,
    height: 64,
  },
  brandCaption: {
    marginTop: 8,
    color: '#6B7280',
    fontSize: 9,
    fontFamily: 'Poppins-Medium',
    letterSpacing: 1.7,
  },
  title: {
    marginTop: 56,
    textAlign: 'center',
    fontSize: 28,
    color: '#12192D',
    lineHeight: 38,
    fontFamily: 'Poppins-Black',
  },
  subtitle: {
    marginTop: 6,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    marginBottom: 22,
  },
  phoneCard: {
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EBEF',
    padding: 14,
    gap: 8,
    shadowColor: '#111827',
    shadowOpacity: 0.04,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
    paddingBottom: 25,
  },
  phoneCardError: {
    borderColor: '#E03636',
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginLeft: 2,
  },
  inputLabel: {
    fontSize: 9,
    letterSpacing: 1.4,
    color: '#98A2B3',
    fontFamily: 'Poppins-Bold',
  },
  inputWrap: {
    borderRadius: 20,
    backgroundColor: '#F3F4F6',
    minHeight: 52,
    paddingHorizontal: 14,
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 10,
  },
  countryCode: {
    fontSize: 15,
    color: '#111827',
    fontFamily: 'Poppins-Bold',
    marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 15,
    color: 'gray',
    fontFamily: 'Poppins-SemiBold',
    borderRadius: 14,
  },
  errorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    marginTop: 2,
    marginLeft: 4,
  },
  errorText: {
    color: '#E03636',
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
    flex: 1,
  },
  bottomWrap: {
    marginTop: 32,
    gap: 12,
  },
  primaryButton: {
    minHeight: 56,
    borderRadius: 28,
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
    minHeight: 56,
    borderRadius: 28,
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
    fontSize: 14,
    fontFamily: 'Poppins-Black',
    letterSpacing: 1,
  },
  infoCardBlue: {
    marginTop: 20,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#C7D8FF',
    backgroundColor: '#E8F0FF',
    padding: 11,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  infoIconBlue: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#DCE7FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoCardYellow: {
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#F2E4AC',
    backgroundColor: '#FFF6D8',
    padding: 11,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginTop: 20,
  },
  infoIconYellow: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFE9BE',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoTextWrap: {
    flex: 1,
  },
  infoTitleBlue: {
    color: '#203FAE',
    fontFamily: 'Poppins-Black',
    fontSize: 11,
  },
  infoBodyBlue: {
    marginTop: 2,
    color: '#2143C5',
    fontSize: 10,
    lineHeight: 14,
    fontFamily: 'Poppins-Medium',
  },
  infoTitleYellow: {
    color: '#8A5300',
    fontFamily: 'Poppins-Black',
    fontSize: 11,
  },
  infoBodyYellow: {
    marginTop: 2,
    color: '#B36A00',
    fontSize: 10,
    lineHeight: 14,
    fontFamily: 'Poppins-Medium',
  },
  termsText: {
    marginTop: 14,
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
  },
  guestText: {
    marginTop: 16,
    textAlign: 'center',
    color: '#9CA3AF',
    fontSize: 10,
    fontFamily: 'Poppins-Medium',
    textDecorationLine: 'underline',
  },
  termsAccent: {
    color: '#F39200',
    fontWeight: '700',
  },
});
