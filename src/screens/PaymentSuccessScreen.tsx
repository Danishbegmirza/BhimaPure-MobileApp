import React from 'react';
import {
  Pressable,
  SafeAreaView,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import { ENROLLED_SCHEMES, getEnrolledSchemeById } from '../data/schemes';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'PaymentSuccess'>;

export function PaymentSuccessScreen({ navigation, route }: Props) {
  const scheme = getEnrolledSchemeById(route.params.schemeId) ?? ENROLLED_SCHEMES[0];

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F3" />
      <View style={styles.container}>
        <View style={styles.successIcon}>
          <Ionicons name="checkmark" size={24} color="#FFFFFF" />
        </View>
        <Text style={styles.title}>Payment Successful!</Text>
        <Text style={styles.subtitle}>
          Installment for {scheme.name} has been credited to your account.
        </Text>

        <Pressable style={styles.cta} onPress={() => navigation.navigate('MySchemes')}>
          <Text style={styles.ctaText}>BACK TO PORTFOLIO</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F3' },
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 28,
  },
  successIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#10B981',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#10B981',
    shadowOpacity: 0.3,
    shadowRadius: 14,
    shadowOffset: { width: 0, height: 5 },
    elevation: 4,
  },
  title: {
    marginTop: 18,
    color: '#0F172A',
    fontSize: 30,
    lineHeight: 34,
    fontFamily: 'Jost-BoldItalic',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 12,
    textAlign: 'center',
    color: '#6B7280',
    fontSize: 12,
    lineHeight: 18,
    fontFamily: 'Poppins-Medium',
    maxWidth: 260,
  },
  cta: {
    marginTop: 24,
    minWidth: 180,
    minHeight: 50,
    borderRadius: 22,
    backgroundColor: '#111827',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    shadowColor: '#111827',
    shadowOpacity: 0.16,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 8 },
    elevation: 3,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 10,
    letterSpacing: 1.3,
    fontFamily: 'Poppins-Black',
  },
});
