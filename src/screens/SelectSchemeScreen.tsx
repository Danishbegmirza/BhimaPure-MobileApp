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
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { RootStackParamList } from '../navigation/types';
import { fetchSchemeTypes, type SchemeTypeItem } from '../api/schemes';
import { goBackOrDashboard } from '../navigation/backNavigation';

type Props = NativeStackScreenProps<RootStackParamList, 'SelectScheme'>;

const SCHEME_CARD_TONES = ['#9F1D1D', '#161321', '#0A1F33', '#1A2340'];

function SchemeCard({
  item,
  tone,
  onPress,
}: {
  item: SchemeTypeItem;
  tone: string;
  onPress: () => void;
}) {
  return (
    <Pressable style={styles.schemeCard} onPress={onPress}>
      {/* Banner */}
      <View style={[styles.banner, { backgroundColor: tone }]}>
        {item.banner_image_url ? (
          <Image
            source={{ uri: item.banner_image_url }}
            style={StyleSheet.absoluteFill}
            resizeMode="cover"
          />
        ) : null}
        <View style={styles.bannerOverlay}>
          <Text style={styles.bannerLabel}>BHIMA EXCLUSIVE</Text>
          <Text style={styles.bannerTitle}>{item.scheme_type_name}</Text>
        </View>
      </View>

      <Text style={styles.description}>{item.short_description}</Text>

      {/* Highlights */}
      {item.highlights && item.highlights.length > 0 && (
        <View style={styles.highlightRow}>
          {item.highlights.map((h, i) => (
            <View key={i} style={styles.highlightChip}>
              <Ionicons name="checkmark-outline" size={10} color="#F39200" />
              <Text style={styles.highlightText}>{h}</Text>
            </View>
          ))}
        </View>
      )}

      <View style={styles.metaRow}>
        <View>
          <Text style={styles.metaLabel}>DURATION</Text>
          <Text style={styles.metaValue}>
            <Ionicons name="time-outline" size={12} color="#F39200" />{' '}
            {item.duration ?? 'Flexible'}
          </Text>
        </View>
        {item.starting_plan ? (
          <View style={styles.metaRight}>
            <Text style={styles.metaLabel}>STARTING AT</Text>
            <Text style={styles.metaValue}>
              ₹{parseFloat(item.starting_plan).toLocaleString('en-IN')}
              <Text style={styles.metaValueUnit}> /MO</Text>
            </Text>
          </View>
        ) : null}
      </View>

      <View style={styles.footerRow}>
        <Text style={styles.benefitText}>PREMIUM BENEFITS</Text>
        <Ionicons name="chevron-forward" size={16} color="#BB4D00" />
      </View>
    </Pressable>
  );
}

export function SelectSchemeScreen({ navigation }: Props) {
  const [loading, setLoading] = useState(true);
  const [schemeTypes, setSchemeTypes] = useState<SchemeTypeItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const loadSchemeTypes = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const result = await fetchSchemeTypes();
      if (result.success) {
        setSchemeTypes(result.schemetype);
      } else {
        setError(result.message ?? 'Failed to load schemes.');
      }
    } catch (_e) {
      setError('Unable to load schemes. Please try again.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadSchemeTypes();
  }, [loadSchemeTypes]);

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F4" />
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
        <View style={styles.header}>
          <Pressable onPress={() => goBackOrDashboard(navigation)} style={styles.iconButton}>
            <Ionicons name="arrow-back" size={20} color="#111827" />
          </Pressable>
          <Text style={styles.title}>Select Scheme</Text>
          <View style={styles.headerRight}>
            <Ionicons name="sparkles-outline" size={18} color="#F39200" />
          </View>
        </View>

        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#E88800" />
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
          schemeTypes.map((item, index) => {
            console.log('item', item);
            return (
            <SchemeCard
              key={item.id}
              item={item}
              tone={SCHEME_CARD_TONES[index % SCHEME_CARD_TONES.length]}
              onPress={() =>
                navigation.navigate('SchemeDetails', { schemeId: String(item.id) })
              }
            />
          );
        })
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F4',
  },
  content: {
    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 28,
    gap: 14,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
    paddingTop: 30,
  },
  iconButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    flex: 1,
    marginLeft: 4,
    fontSize: 22,
    color: '#111827',
    fontFamily: 'Jost-BoldItalic',
  },
  headerRight: {
    width: 36,
    alignItems: 'center',
  },
  loadingWrap: {
    marginTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
  },
  errorWrap: {
    marginTop: 80,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    paddingHorizontal: 24,
  },
  errorText: {
    color: '#6B7280',
    fontSize: 13,
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  retryButton: {
    paddingVertical: 10,
    paddingHorizontal: 28,
    borderRadius: 12,
    backgroundColor: '#111827',
  },
  retryText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Poppins-Black',
    letterSpacing: 1.4,
  },
  schemeCard: {
    borderRadius: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    overflow: 'hidden',
  },
  banner: {
    minHeight: 120,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
    justifyContent: 'flex-end',
  },
  bannerOverlay: {
    padding: 14,
    backgroundColor: 'rgba(0,0,0,0.28)',
  },
  bannerLabel: {
    color: '#FCD34D',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 1.4,
  },
  bannerTitle: {
    marginTop: 5,
    color: '#FFFFFF',
    fontSize: 18,
    fontFamily: 'Jost-BoldItalic',
  },
  description: {
    marginTop: 10,
    color: '#9CA3AF',
    fontSize: 13,
    fontFamily: 'Poppins-Italic',
    marginLeft: 10,
  },
  highlightRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 8,
    marginLeft: 10,
  },
  highlightChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FFF5E7',
    borderRadius: 999,
    paddingVertical: 3,
    paddingHorizontal: 8,
  },
  highlightText: {
    color: '#BB4D00',
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
  },
  metaRow: {
    marginTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginLeft: 10,
    marginRight: 10,
  },
  metaRight: {
    alignItems: 'flex-end',
  },
  metaLabel: {
    color: '#9CA3AF',
    letterSpacing: 1.5,
    fontSize: 9,
    fontWeight: '700',
  },
  metaValue: {
    marginTop: 4,
    color: '#111827',
    fontWeight: '800',
    fontSize: 16,
  },
  metaValueUnit: {
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
    color: '#9CA3AF',
  },
  footerRow: {
    marginTop: 14,
    paddingTop: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  benefitText: {
    color: '#BB4D00',
    fontSize: 10,
    letterSpacing: 1.4,
    fontFamily: 'Poppins-Bold',
    marginLeft: 10,
    marginTop: 10,
  },
});
