import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
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
import type { RootStackParamList } from '../navigation/types';
import { fetchProfile, type CustomerProfile } from '../api/user';
import { clearAuthData, getToken } from '../storage/auth';
import { useSafeBottomInset } from '../utils/safeBottomInset';

type Props = NativeStackScreenProps<RootStackParamList, 'Profile'>;

function getIconPalette(icon: string) {
  if (icon === 'calendar-outline') { return { color: '#5972D9', bg: '#EAF0FF' }; }
  if (icon === 'heart-outline') { return { color: '#EC4899', bg: '#FFEAF4' }; }
  if (icon === 'call-outline') { return { color: '#16A34A', bg: '#E9FBEF' }; }
  if (icon === 'mail-outline') { return { color: '#C026D3', bg: '#F9ECFF' }; }
  if (icon === 'location-outline') { return { color: '#EF4444', bg: '#FFEDEE' }; }
  if (icon === 'business-outline') { return { color: '#F59E0B', bg: '#FFF4DF' }; }
  if (icon === 'card-outline') { return { color: '#64748B', bg: '#EEF2FF' }; }
  return { color: '#64748B', bg: '#EEF2FF' };
}

function SectionTitle({ title }: { title: string }) {
  return <Text style={styles.sectionTitle}>{title}</Text>;
}

function InfoCard({ icon, label, value }: { icon: string; label: string; value: string }) {
  const palette = getIconPalette(icon);
  return (
    <View style={styles.infoCard}>
      <View style={[styles.infoIcon, { backgroundColor: palette.bg }]}>
        <Ionicons name={icon} size={14} color={palette.color} />
      </View>
      <View style={styles.infoContent}>
        <Text style={styles.infoLabel}>{label}</Text>
        <Text style={styles.infoValue}>{value || '—'}</Text>
      </View>
    </View>
  );
}

export function ProfileScreen({ navigation }: Props) {
  const safeBottom = useSafeBottomInset();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [profile, setProfile] = useState<CustomerProfile | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      setIsLoggedIn(!!token);
      if (!token) {
        setError('Please log in to view your profile.');
        return;
      }
      const result = await fetchProfile(token);
      if (result.success) {
        setProfile(result.data);
      } else {
        setError(result.message ?? 'Failed to load profile.');
      }
    } catch (_e) {
      setError('Unable to load profile. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const handleBack = useCallback(() => {
    navigation.navigate('Dashboard');
  }, [navigation]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F3" />
      <ScrollView
        contentContainerStyle={[styles.content, { paddingBottom: 140 + safeBottom }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.header}>
          <Pressable style={styles.headerIconBtn} onPress={handleBack}>
            <Ionicons name="arrow-back" size={18} color="#374151" />
          </Pressable>
          <Text style={styles.headerTitle}>My Profile</Text>
          <Pressable
            style={styles.headerEditBtn}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <Ionicons name="pencil-outline" size={13} color="#F59E0B" />
          </Pressable>
        </View>

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
        ) : profile ? (
          <>
            {/* Hero card */}
            <View style={styles.hero}>
              <View style={styles.avatarWrap}>
                <Ionicons name="person-outline" size={20} color="#FFFFFF" />
              </View>
              <Text style={styles.name}>{profile.name}</Text>
              <Text style={styles.phone}>{profile.contact_information.mobile_number}</Text>
              <Text style={styles.email}>{profile.contact_information.email_address}</Text>
              {profile.customer_code ? (
                <Text style={styles.custCode}>ID: {profile.customer_code}</Text>
              ) : null}
            </View>

            <SectionTitle title="PERSONAL DETAILS" />
            <InfoCard
              icon="calendar-outline"
              label="DATE OF BIRTH"
              value={profile.personal_details.dob}
            />
            <InfoCard
              icon="heart-outline"
              label="ANNIVERSARY"
              value={profile.personal_details.wedding_anniversary}
            />

            <SectionTitle title="CONTACT INFORMATION" />
            <InfoCard
              icon="call-outline"
              label="MOBILE NUMBER"
              value={profile.contact_information.mobile_number}
            />
            <InfoCard
              icon="mail-outline"
              label="EMAIL ADDRESS"
              value={profile.contact_information.email_address}
            />
            <InfoCard
              icon="location-outline"
              label="ADDRESS"
              value={profile.contact_information.address}
            />

            <SectionTitle title="BRANCH DETAILS" />
            <InfoCard
              icon="business-outline"
              label="PREFERRED BRANCH"
              value={profile.branch_details.preferred_branch ?? '—'}
            />

            <SectionTitle title="LANGUAGE PREFERENCE" />
            <View style={styles.languageCard}>
              <View style={styles.langHeader}>
                <View style={styles.infoIcon}>
                  <Ionicons name="language-outline" size={14} color="#059669" />
                </View>
                <View>
                  <Text style={styles.infoLabel}>APP LANGUAGE</Text>
                  <Text style={styles.langHint}>Choose your preferred language</Text>
                </View>
              </View>
              <View style={styles.langButtons}>
                <Pressable
                  style={[
                    styles.langBtn,
                    profile.language_preference.app_language === 'English' && styles.langBtnActive,
                  ]}
                >
                  <Text
                    style={
                      profile.language_preference.app_language === 'English'
                        ? styles.langBtnTextActive
                        : styles.langBtnText
                    }
                  >
                    English
                  </Text>
                </Pressable>
                <Pressable
                  style={[
                    styles.langBtn,
                    profile.language_preference.app_language !== 'English' && styles.langBtnActive,
                  ]}
                >
                  <Text
                    style={
                      profile.language_preference.app_language !== 'English'
                        ? styles.langBtnTextActive
                        : styles.langBtnText
                    }
                  >
                    தமிழ்
                  </Text>
                </Pressable>
              </View>
            </View>

            <SectionTitle title="KYC DETAILS" />
            <InfoCard
              icon="card-outline"
              label="PAN NUMBER"
              value={profile.kyc_details.pan_number}
            />
            <InfoCard
              icon="card-outline"
              label="AADHAAR NUMBER"
              value={profile.kyc_details.aadhaar_number}
            />

            <SectionTitle title="BANK DETAILS" />
            <InfoCard
              icon="business-outline"
              label="BANK NAME"
              value={profile.bank_details.bank_name}
            />
            <InfoCard
              icon="card-outline"
              label="ACCOUNT NUMBER"
              value={profile.bank_details.account_number}
            />
            <InfoCard icon="card-outline" label="IFSC CODE" value={profile.bank_details.ifsc} />
            <View style={{marginBottom:20}}></View>
          </>
        ) : null}
      </ScrollView>

      {isLoggedIn ? (
        <View style={[styles.bottomCtaWrap, { paddingBottom: 12 + safeBottom }]}>
          <Pressable
            style={styles.logoutCta}
            onPress={async () => {
              await clearAuthData();
              setIsLoggedIn(false);
              navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
            }}
          >
            <Ionicons name="log-out-outline" size={14} color="#374151" />
            <Text style={styles.logoutCtaText}>LOGOUT</Text>
          </Pressable>
          <Pressable
            style={styles.bottomCta}
            onPress={() => navigation.navigate('EditProfile')}
          >
            <LinearGradient
              colors={['#FFA800', '#F38B00']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.bottomCtaGradient}
            >
              <Ionicons name="pencil-outline" size={14} color="#FFFFFF" />
              <Text style={styles.bottomCtaText}>EDIT PROFILE</Text>
            </LinearGradient>
          </Pressable>
        </View>
      ) : null}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F3' },
  content: { paddingHorizontal: 14, paddingTop: 10, gap: 11, marginTop: 30 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  headerIconBtn: { width: 22, height: 22, justifyContent: 'center', alignItems: 'center' },
  headerTitle: { flex: 1, marginLeft: 8, color: '#111827', fontSize: 24, fontFamily: 'Jost-BoldItalic' },
  headerEditBtn: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFEFCC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingWrap: { paddingVertical: 60, alignItems: 'center' },
  errorWrap: { paddingVertical: 40, alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  errorText: { color: '#6B7280', fontSize: 13, fontFamily: 'Poppins-Medium', textAlign: 'center' },
  retryButton: { paddingVertical: 10, paddingHorizontal: 28, borderRadius: 12, backgroundColor: '#111827' },
  retryText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Poppins-Black', letterSpacing: 1.4 },
  hero: {
    borderRadius: 22,
    backgroundColor: '#F7A714',
    paddingHorizontal: 16,
    paddingVertical: 20,
    shadowColor: '#F59E0B',
    shadowOpacity: 0.22,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 4,
  },
  avatarWrap: {
    width: 42,
    height: 42,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#FCD34D',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#E28C00',
  },
  name: { marginTop: 10, color: '#FFFFFF', fontSize: 30, lineHeight: 34, fontFamily: 'Jost-BoldItalic' },
  phone: { marginTop: 2, color: '#FFF7ED', fontSize: 12, fontFamily: 'Poppins-Medium' },
  email: { marginTop: 2, color: '#FFF7ED', fontSize: 12, fontFamily: 'Poppins-Medium' },
  custCode: { marginTop: 6, color: '#FFF7ED', fontSize: 10, fontFamily: 'Poppins-Bold', letterSpacing: 1 },
  sectionTitle: {
    marginTop: 7,
    color: '#96A0AE',
    fontSize: 9,
    letterSpacing: 1.6,
    fontFamily: 'Poppins-Bold',
  },
  infoCard: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E8EBEF',
    backgroundColor: '#FFFFFF',
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 11,
    shadowColor: '#111827',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  infoIcon: {
    width: 30,
    height: 30,
    borderRadius: 11,
    backgroundColor: '#EEF2FF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  infoContent: { flex: 1 },
  infoLabel: { color: '#98A2B3', fontSize: 8, letterSpacing: 1.2, fontFamily: 'Poppins-SemiBold' },
  infoValue: { marginTop: 2, color: '#131A28', fontSize: 13, fontFamily: 'Poppins-SemiBold', lineHeight: 18 },
  languageCard: {
    borderRadius: 17,
    borderWidth: 1,
    borderColor: '#E8EBEF',
    backgroundColor: '#FFFFFF',
    padding: 12,
    gap: 10,
    shadowColor: '#111827',
    shadowOpacity: 0.04,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  langHeader: { flexDirection: 'row', gap: 10, alignItems: 'center' },
  langHint: { marginTop: 3, color: '#6B7280', fontSize: 10, fontFamily: 'Poppins-Medium' },
  langButtons: { flexDirection: 'row', gap: 8 },
  langBtn: {
    flex: 1,
    minHeight: 38,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EBEF',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8FAFC',
  },
  langBtnActive: {
    backgroundColor: '#F39200',
    borderColor: '#F39200',
    shadowColor: '#F59E0B',
    shadowOpacity: 0.24,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
    elevation: 2,
  },
  langBtnText: { color: '#374151', fontSize: 13, fontFamily: 'Poppins-SemiBold' },
  langBtnTextActive: { color: '#FFFFFF', fontSize: 13, fontFamily: 'Poppins-Bold' },
  bottomCtaWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#F5F5F3',
    paddingHorizontal: 16,
    paddingTop: 5,
    gap: 10,
  },
  logoutCta: {
    minHeight: 50,
    borderRadius: 25,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  logoutCtaText: {
    color: '#374151',
    fontSize: 11,
    letterSpacing: 1,
    fontFamily: 'Poppins-Bold',
  },
  bottomCta: {
    minHeight: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    shadowColor: '#B45309',
    shadowOpacity: 0.24,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 8 },
    elevation: 4,
  },
  bottomCtaGradient: {
    width: '100%',
    minHeight: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 8,
  },
  bottomCtaText: { color: '#FFFFFF', fontSize: 12, letterSpacing: 1, fontFamily: 'Poppins-Black' },
});
