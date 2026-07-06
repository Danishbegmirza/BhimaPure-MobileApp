import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Dimensions,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { RootStackParamList } from '../navigation/types';
import { goBackOrDashboard } from '../navigation/backNavigation';
import { fetchNotificationDetail, type NotificationDetailResponse } from '../api/notifications';
import { BottomTabs } from '../components/BottomTabs';
import { useSafeBottomInset } from '../utils/safeBottomInset';

type Props = NativeStackScreenProps<RootStackParamList, 'NotificationDetail'>;

const { width: SCREEN_WIDTH } = Dimensions.get('window');

function formatDate(dateStr: string): string {
  if (!dateStr) { return ''; }
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) { return dateStr; }
  return d.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function NotificationDetailScreen({ navigation, route }: Props) {
  const safeBottom = useSafeBottomInset();
  const { notificationId } = route.params;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<NotificationDetailResponse['data'] | null>(null);

  const loadNotification = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchNotificationDetail(notificationId);
      
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setError(result.message ?? 'Failed to load notification.');
      }
    } catch (_e) {
      setError('Unable to load notification. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [notificationId]);

  useEffect(() => {
    loadNotification();
  }, [loadNotification]);

  // ── Loading State ────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#050505" />
        <View style={styles.screenBody}>
          <View style={styles.hero}>
            <View style={styles.topRow}>
              <Pressable style={styles.iconButton} onPress={() => goBackOrDashboard(navigation)}>
                <Ionicons name="arrow-back" size={20} color="#D1D5DB" />
              </Pressable>
              <Text style={styles.headerTitle}>Notification</Text>
              <View style={styles.iconButton} />
            </View>
          </View>
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#E88800" />
          </View>
          <BottomTabs navigation={navigation} activeTab="notifications" />
        </View>
      </SafeAreaView>
    );
  }

  // ── Error State ──────────────────────────────────────────────────────────────
  if (error || !data) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <StatusBar barStyle="light-content" backgroundColor="#050505" />
        <View style={styles.screenBody}>
          <View style={styles.hero}>
            <View style={styles.topRow}>
              <Pressable style={styles.iconButton} onPress={() => goBackOrDashboard(navigation)}>
                <Ionicons name="arrow-back" size={20} color="#D1D5DB" />
              </Pressable>
              <Text style={styles.headerTitle}>Notification</Text>
              <View style={styles.iconButton} />
            </View>
          </View>
          <View style={styles.errorWrap}>
            <Ionicons name="alert-circle-outline" size={48} color="#E05252" />
            <Text style={styles.errorText}>{error ?? 'Notification not found.'}</Text>
            <Pressable style={styles.retryButton} onPress={loadNotification}>
              <Text style={styles.retryText}>TRY AGAIN</Text>
            </Pressable>
          </View>
          <BottomTabs navigation={navigation} activeTab="notifications" />
        </View>
      </SafeAreaView>
    );
  }

  // ── Success State ────────────────────────────────────────────────────────────
  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="light-content" backgroundColor="#050505" />
      <View style={styles.screenBody}>
        {/* Header */}
        <View style={styles.hero}>
          <View style={styles.topRow}>
            <Pressable style={styles.iconButton} onPress={() => goBackOrDashboard(navigation)}>
              <Ionicons name="arrow-back" size={20} color="#D1D5DB" />
            </Pressable>
            <Text style={styles.headerTitle}>Notification</Text>
            <View style={styles.iconButton} />
          </View>
        </View>

        {/* Content */}
        <ScrollView
          style={styles.contentScroll}
          contentContainerStyle={[styles.contentContainer, { paddingBottom: 100 + safeBottom }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Image */}
          {data.image && (
            <View style={styles.imageContainer}>
              <Image
                source={{ uri: data.image }}
                style={styles.notificationImage}
                resizeMode="cover"
              />
            </View>
          )}

          {/* Title */}
          <View style={styles.titleContainer}>
            <View style={styles.titleIconWrap}>
              <Ionicons name="notifications" size={20} color="#F39200" />
            </View>
            <Text style={styles.title}>{data.title}</Text>
          </View>

          {/* Date */}
          {data.created_at && (
            <View style={styles.dateRow}>
              <Ionicons name="time-outline" size={14} color="#9CA3AF" />
              <Text style={styles.dateText}>{formatDate(data.created_at)}</Text>
            </View>
          )}

          {/* Divider */}
          <View style={styles.divider} />

          {/* Description */}
          <View style={styles.descriptionContainer}>
            <Text style={styles.description}>{data.description}</Text>
          </View>
        </ScrollView>

        <BottomTabs navigation={navigation} activeTab="notifications" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#050505',
  },
  screenBody: {
    flex: 1,
  },
  hero: {
    backgroundColor: '#050505',
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 16,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 22,
  },
  iconButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#121820',
  },
  headerTitle: {
    color: '#F8FAFC',
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#F8F9FB',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  errorWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
    backgroundColor: '#F8F9FB',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  errorText: {
    color: '#6B7280',
    fontSize: 14,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 1.2,
  },
  contentScroll: {
    flex: 1,
    backgroundColor: '#F8F9FB',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
  },
  contentContainer: {
    paddingHorizontal: 20,
    paddingTop: 24,
  },
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 20,
    backgroundColor: '#E5E7EB',
  },
  notificationImage: {
    width: '100%',
    height: '100%',
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 12,
  },
  titleIconWrap: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFF7E6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    color: '#0F172A',
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    lineHeight: 28,
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
    paddingLeft: 52,
  },
  dateText: {
    color: '#9CA3AF',
    fontSize: 12,
    fontFamily: 'Poppins-Medium',
  },
  divider: {
    height: 1,
    backgroundColor: '#E5E7EB',
    marginVertical: 16,
  },
  descriptionContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  description: {
    color: '#374151',
    fontSize: 15,
    fontFamily: 'Poppins-Regular',
    lineHeight: 24,
  },
});
