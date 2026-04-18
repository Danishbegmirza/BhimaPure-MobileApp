import React, { useMemo, useState } from 'react';
import {
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
import LinearGradient from 'react-native-linear-gradient';
import type { RootStackParamList } from '../navigation/types';
import { goBackOrDashboard } from '../navigation/backNavigation';

type Props = NativeStackScreenProps<RootStackParamList, 'CreateAccount'>;

export function CreateAccountScreen({ navigation }: Props) {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const isFormValid = useMemo(
    () => firstName.trim().length > 1 && lastName.trim().length > 1,
    [firstName, lastName],
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F7F5F0" />
      <View style={styles.container}>
        <Pressable style={styles.backButton} onPress={() => goBackOrDashboard(navigation)}>
          <Ionicons name="arrow-back" size={24} color="#1F2937" style={{marginTop: 20}} />
        </Pressable>

        <View style={styles.iconWrap}>
          <Image source={require('../assets/createAccountLogo.png')} style={styles.iconImage} resizeMode='cover' />
        </View>

        <Text style={styles.title}>Create Account</Text>
        <Text style={styles.subtitle}>Join Bhima Gold Savings Schemes</Text>

        <Text style={styles.label}>
          FIRST NAME <Text style={styles.required}>*</Text>
        </Text>
        <View style={styles.inputWrap}>
          <Ionicons name="person-outline" size={20} color="#98A2B3" />
          <TextInput
            value={firstName}
            onChangeText={setFirstName}
            style={styles.input}
            placeholder="First name"
            placeholderTextColor="#98A2B3"
          />
          {firstName.trim() ? (
            <Ionicons name="checkmark-circle-outline" size={22} color="#12B76A" />
          ) : null}
        </View>

        <Text style={styles.label}>LAST NAME</Text>
        <View style={styles.inputWrap}>
          <Ionicons name="person-outline" size={20} color="#98A2B3" />
          <TextInput
            value={lastName}
            onChangeText={setLastName}
            style={styles.input}
            placeholder="Last name"
            placeholderTextColor="#98A2B3"
          />
          {lastName.trim() ? (
            <Ionicons name="checkmark-circle-outline" size={22} color="#12B76A" />
          ) : null}
        </View>

        <View style={styles.bonusCard}>
          <View style={styles.bonusIcon}>
            <Ionicons name="sparkles-outline" size={18} color="#F39200" />
          </View>
          <View style={styles.bonusTextWrap}>
            <Text style={styles.bonusTitle}>Welcome Bonus</Text>
            <Text style={styles.bonusBody}>
              Get exclusive offers and benefits on your first gold scheme enrollment.
            </Text>
          </View>
        </View>

        <View style={styles.bottomWrap}>
          <Pressable
            style={[styles.primaryButton, !isFormValid && styles.primaryButtonDisabled]}
            disabled={!isFormValid}
            onPress={() => navigation.navigate('CompleteProfile')}
          >
            <LinearGradient
              colors={['#FFA800', '#F38B00']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.primaryButtonGradient}
            >
              <Ionicons name="person-add-outline" size={17} color="#FFFFFF" />
              <Text style={styles.primaryButtonText}>CREATE ACCOUNT</Text>
              {/* <Ionicons name="arrow-forward" size={17} color="#FFFFFF" /> */}
            </LinearGradient>
          </Pressable>
          <Text style={styles.termsText}>
            By continuing, you agree to our Terms of Service and Privacy Policy
          </Text>
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
    paddingTop: 12,
  },
  backButton: {
    marginTop: 10,
  },
  iconWrap: {
    marginTop: -20,
    alignSelf: 'center',
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconImage: {
    width: 150,
    height: 150,
  },
  title: {
    marginTop: -20,
    textAlign: 'center',
    color: '#111827',
    fontSize: 25,
    fontFamily: 'Poppins-Bold',
    letterSpacing: -0.5,
  },
  subtitle: {
    marginTop: 6,
    textAlign: 'center',
    fontSize: 14,
    color: '#667085',
    marginBottom: 24,
    fontFamily: 'Poppins-Medium',
  },
  label: {
    fontSize: 12,
    letterSpacing: 1.3,
    fontWeight: '700',
    color: '#8A93A4',
    marginTop: 18,
    marginBottom: 8,
    marginLeft: 10,
  },
  required: {
    color: '#F04438',
  },
  inputWrap: {
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#D2D8E0',
    backgroundColor: '#FCFCFC',
    minHeight: 62,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 10,
    marginRight: 10,
  },
  input: {
    flex: 1,
    marginLeft: 12,
    color: '#6B7280',
    fontSize: 14,
    marginTop: 3,
    fontFamily: 'Poppins-Medium',
  },
  bonusCard: {
    marginTop: 30,
    borderRadius: 22,
    borderWidth: 1,
    borderColor: '#DEE3EA',
    backgroundColor: '#F8F8F8',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bonusIcon: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#FFF4E5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  bonusTextWrap: {
    flex: 1,
  },
  bonusTitle: {
    color: '#111827',
    fontSize: 14,
    fontFamily: 'Poppins-Bold',
    letterSpacing: -0.5,
  },
  bonusBody: {
    marginTop: 5,
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
    marginTop: 2,
    marginLeft: 2,
  },
  termsText: {
    marginTop: 18,
    textAlign: 'center',
    color: '#98A2B3',
    fontSize: 12,
    lineHeight: 18,
    paddingHorizontal: 14,
    fontFamily: 'Poppins-Medium',
  },
});
