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
import {
  fetchNotifications,
  markAllNotificationsRead,
  type ApiNotification,
} from '../api/user';
import { getToken } from '../storage/auth';
import { goBackOrDashboard } from '../navigation/backNavigation';

type Props = NativeStackScreenProps<RootStackParamList, 'Notifications'>;

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Categorise a notification date string into today / yesterday / earlier. */
function categorise(dateStr: string): 'today' | 'yesterday' | 'earlier' {
  const today = new Date();
  const d = new Date(dateStr);
  const diffDays = Math.floor(
    (today.setHours(0, 0, 0, 0) - d.setHours(0, 0, 0, 0)) / (1000 * 60 * 60 * 24),
  );
  if (diffDays === 0) { return 'today'; }
  if (diffDays === 1) { return 'yesterday'; }
  return 'earlier';
}

/** Format "2026-03-20 05:56:48" → "05:56 AM" */
function formatTime(dateStr: string): string {
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) { return ''; }
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
}

/** Pick a sensible icon/colour based on the call_to_action label. */
function iconForAction(cta: string): { icon: string; iconColor: string; iconBg: string } {
  const ctaLower = (cta ?? '').toLowerCase();
  if (ctaLower.includes('pay') || ctaLower.includes('receipt')) {
    return { icon: 'card-outline', iconColor: '#5972D9', iconBg: '#E9EDFF' };
  }
  if (ctaLower.includes('plan') || ctaLower.includes('view')) {
    return { icon: 'checkmark-circle-outline', iconColor: '#10B981', iconBg: '#E7FBF2' };
  }
  if (ctaLower.includes('gold') || ctaLower.includes('rate')) {
    return { icon: 'trending-up-outline', iconColor: '#F59E0B', iconBg: '#FFF4DF' };
  }
  if (ctaLower.includes('kyc') || ctaLower.includes('update')) {
    return { icon: 'alert-circle-outline', iconColor: '#F43F5E', iconBg: '#FFECEF' };
  }
  return { icon: 'notifications-outline', iconColor: '#7C3AED', iconBg: '#EEE9FF' };
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionLabel({ text }: { text: string }) {
  return <Text style={styles.sectionLabel}>{text}</Text>;
}

function NotificationCard({ item }: { item: ApiNotification }) {
  const { icon, iconColor, iconBg } = iconForAction(item.call_to_action);
  const isUnread = item.read_unread === 'unread';

  return (
    <View style={[styles.card, isUnread && styles.cardAccent]}>
      <View style={styles.cardHeader}>
        <View style={[styles.iconBubble, { backgroundColor: iconBg }]}>
          <Ionicons name={icon} size={14} color={iconColor} />
        </View>
        <View style={styles.cardContent}>
          <View style={styles.titleRow}>
            <Text style={styles.cardTitle} numberOfLines={1}>{item.description}</Text>
            {isUnread ? <View style={styles.unreadDot} /> : null}
          </View>
        </View>
      </View>

      <View style={styles.cardFooter}>
        <Text style={styles.timeText}>{formatTime(item.date)}</Text>
        {item.call_to_action ? (
          <Pressable style={styles.actionBtn}>
            <LinearGradient
              colors={['#FFA800', '#F38B00']}
              start={{ x: 0, y: 0.5 }}
              end={{ x: 1, y: 0.5 }}
              style={styles.actionBtnGradient}
            >
              <Text style={styles.actionText}>{item.call_to_action.toUpperCase()}</Text>
            </LinearGradient>
          </Pressable>
        ) : (
          <View />
        )}
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function NotificationsScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [markingRead, setMarkingRead] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [items, setItems] = useState<ApiNotification[]>([]);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const token = await getToken();
      if (!token) { setError('Please log in.'); return; }
      const result = await fetchNotifications(token);
      if (result.success) {
        setItems(result.notifications ?? []);
      } else {
        setError(result.message ?? 'Failed to load notifications.');
      }
    } catch (_e) {
      setError('Unable to load notifications. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadNotifications();
  }, [loadNotifications]);

  const handleMarkAllRead = useCallback(async () => {
    try {
      setMarkingRead(true);
      const token = await getToken();
      if (!token) { return; }
      await markAllNotificationsRead(token);
      // optimistically update UI
      setItems(prev => prev.map(n => ({ ...n, read_unread: 'read' })));
    } catch (_e) {
      // silent fail
    } finally {
      setMarkingRead(false);
    }
  }, []);

  const today = items.filter(n => categorise(n.date) === 'today');
  const yesterday = items.filter(n => categorise(n.date) === 'yesterday');
  const earlier = items.filter(n => categorise(n.date) === 'earlier');
  const unreadCount = items.filter(n => n.read_unread === 'unread').length;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F4F4F2" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
      >
        {/* Header */}
        <View style={styles.header}>
          <Pressable style={styles.iconBtn} onPress={() => goBackOrDashboard(navigation)}>
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </Pressable>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>Notifications</Text>
            {unreadCount > 0 ? (
              <Text style={styles.unreadText}>{unreadCount} new notification{unreadCount > 1 ? 's' : ''}</Text>
            ) : null}
          </View>
          <View style={styles.headerActions}>
            {unreadCount > 0 && (
              <Pressable
                style={styles.markAll}
                onPress={handleMarkAllRead}
                disabled={markingRead}
              >
                {markingRead ? (
                  <ActivityIndicator size="small" color="#F59E0B" style={{ width: 60 }} />
                ) : (
                  <Text style={styles.markAllText}>MARK ALL READ</Text>
                )}
              </Pressable>
            )}
          </View>
        </View>

        {/* Body */}
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
        ) : items.length === 0 ? (
          <View style={styles.emptyWrap}>
            <Ionicons name="notifications-off-outline" size={44} color="#D1D5DB" />
            <Text style={styles.emptyText}>No notifications yet.</Text>
          </View>
        ) : (
          <>
            {today.length > 0 && (
              <>
                <SectionLabel text="TODAY" />
                {today.map((item, i) => (
                  <NotificationCard key={`today-${i}`} item={item} />
                ))}
              </>
            )}
            {yesterday.length > 0 && (
              <>
                <SectionLabel text="YESTERDAY" />
                {yesterday.map((item, i) => (
                  <NotificationCard key={`yesterday-${i}`} item={item} />
                ))}
              </>
            )}
            {earlier.length > 0 && (
              <>
                <SectionLabel text="EARLIER" />
                {earlier.map((item, i) => (
                  <NotificationCard key={`earlier-${i}`} item={item} />
                ))}
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: '#F5F5F3' },
  content: { flexGrow: 1, paddingHorizontal: 10, paddingTop: 8, paddingBottom: 24, gap: 10, marginTop: 30 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  iconBtn: { width: 30, height: 30, justifyContent: 'center', alignItems: 'center' },
  headerCenter: { flex: 1, marginLeft: 2 },
  headerTitle: { fontSize: 21, lineHeight: 24, color: '#111827', fontFamily: 'Jost-BoldItalic' },
  unreadText: { color: '#F59E0B', fontSize: 10, fontFamily: 'Poppins-SemiBold', marginTop: 1 },
  headerActions: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  markAll: {
    backgroundColor: '#FFF2D9',
    borderRadius: 11,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  markAllText: { color: '#F59E0B', fontSize: 9, fontFamily: 'Poppins-Bold', letterSpacing: 0.3 },
  loadingWrap: { paddingVertical: 60, alignItems: 'center' },
  errorWrap: { paddingVertical: 40, alignItems: 'center', gap: 12, paddingHorizontal: 24 },
  errorText: { color: '#6B7280', fontSize: 13, fontFamily: 'Poppins-Medium', textAlign: 'center' },
  retryButton: { paddingVertical: 10, paddingHorizontal: 28, borderRadius: 12, backgroundColor: '#111827' },
  retryText: { color: '#FFFFFF', fontSize: 11, fontFamily: 'Poppins-Black', letterSpacing: 1.4 },
  emptyWrap: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 10 },
  emptyText: { color: '#9CA3AF', fontSize: 13, fontFamily: 'Poppins-Medium' },
  sectionLabel: {
    marginTop: 8,
    color: '#9AA3B2',
    fontSize: 9,
    letterSpacing: 2.2,
    fontFamily: 'Poppins-Bold',
  },
  card: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#EBEEF2',
    backgroundColor: '#F8F8F8',
    padding: 12,
    gap: 8,
  },
  cardAccent: { borderColor: '#F3D972', backgroundColor: '#FCFCF5' },
  cardHeader: { flexDirection: 'row', alignItems: 'flex-start', gap: 10 },
  iconBubble: {
    width: 28,
    height: 28,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardContent: { flex: 1 },
  titleRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  unreadDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#F59E0B',
    marginTop: 1,
    flexShrink: 0,
  },
  cardTitle: {
    flex: 1,
    color: '#111827',
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
    lineHeight: 18,
  },
  cardFooter: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  timeText: { color: '#9AA3B2', fontSize: 8, fontFamily: 'Poppins-SemiBold' },
  actionBtn: {
    minHeight: 24,
    borderRadius: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  actionBtnGradient: {
    minHeight: 24,
    borderRadius: 12,
    paddingHorizontal: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionText: { color: '#FFFFFF', fontSize: 8, fontFamily: 'Poppins-Black', letterSpacing: 0.6 },
});
