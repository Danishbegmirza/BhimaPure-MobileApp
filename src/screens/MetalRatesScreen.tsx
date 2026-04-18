import React, { useCallback, useEffect, useMemo, useState } from 'react';
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
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSafeBottomInset } from '../utils/safeBottomInset';
import type { RootStackParamList } from '../navigation/types';
import { fetchGoldRates, type GoldRateItem } from '../api/goldrates';
import { goBackOrDashboard } from '../navigation/backNavigation';

type Props = NativeStackScreenProps<RootStackParamList, 'MetalRates'>;

function formatINR(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) return '0';
  const intPart = Math.round(num).toString();
  if (intPart.length <= 3) return intPart;
  const last3 = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
}

function parseRate(rate: string): number {
  const n = parseFloat(String(rate).replace(/,/g, ''));
  return Number.isFinite(n) ? n : 0;
}

function goldKaratLabel(purityNum: number): string {
  if (Math.abs(purityNum - 22) < 0.5) return 'Gold 22K (916)';
  if (Math.abs(purityNum - 18) < 0.5) return 'Gold 18K (750)';
  if (Math.abs(purityNum - 14) < 0.5) return 'Gold 14K (585)';
  return `Gold ${purityNum}K`;
}

const GOLD_ICONS: Array<'trophy' | 'star' | 'heart'> = ['trophy', 'star', 'heart'];

function SellRateCard({
  title,
  unitLabel,
  saleRate,
  icon,
}: {
  title: string;
  unitLabel: string;
  saleRate: number;
  icon: 'trophy' | 'star' | 'heart' | 'diamond' | 'ellipse';
}) {
  return (
    <View style={styles.metalCard}>
      <View style={styles.metalCardTop}>
        <View style={styles.metalIconWrap}>
          <Ionicons name={icon} size={18} color="#C2410C" />
        </View>
        <View style={styles.metalTitles}>
          <Text style={styles.metalTitle}>{title}</Text>
          <Text style={styles.metalSub}>{unitLabel}</Text>
        </View>
      </View>
      <View style={styles.sellRateBox}>
        <Text style={styles.sellRateLabel}>Sell rate</Text>
        <Text style={styles.sellRateValue}>₹{formatINR(saleRate)}</Text>
      </View>
    </View>
  );
}

export function MetalRatesScreen({ navigation }: Props) {
  const { top } = useSafeAreaInsets();
  const safeBottom = useSafeBottomInset();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState<GoldRateItem[]>([]);

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const result = await fetchGoldRates();
      setRows(Array.isArray(result.goldrates) ? result.goldrates : []);
    } catch {
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const { goldRows, silverRow, platinumRow, lastUpdatedLine } = useMemo(() => {
    const list = rows;
    const gold = list
      .filter((r) => r.item_type === 'Gold')
      .sort((a, b) => parseFloat(b.purity) - parseFloat(a.purity));
    const silver = list.find((r) => r.item_type === 'Silver');
    const platinum = list.find((r) => r.item_type === 'Platinum');
    const last = gold[0]?.last_updated ?? silver?.last_updated ?? platinum?.last_updated ?? '—';
    return { goldRows: gold, silverRow: silver, platinumRow: platinum, lastUpdatedLine: last };
  }, [rows]);

  return (
    <SafeAreaView style={styles.safe}>
      <StatusBar barStyle="light-content" backgroundColor="#E88800" />
      <View style={[styles.hero, { paddingTop: Math.max(top, 12) }]}>
        <View style={styles.heroTop}>
          <Pressable style={styles.heroIcon} onPress={() => goBackOrDashboard(navigation)} hitSlop={8}>
            <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
          </Pressable>
          <Pressable style={styles.heroIcon} onPress={load} hitSlop={8}>
            <Ionicons name="refresh" size={20} color="#FFFFFF" />
          </Pressable>
        </View>
        <Text style={styles.heroTitle}>Metal Rates</Text>
        <Text style={styles.heroSub}>Live Market Prices</Text>
        <View style={styles.heroMeta}>
          <Ionicons name="time-outline" size={14} color="rgba(255,255,255,0.9)" />
          <Text style={styles.heroMetaText}>Last updated: {lastUpdatedLine}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#E88800" />
        </View>
      ) : (
        <ScrollView
          contentContainerStyle={[styles.scroll, { paddingBottom: 24 + safeBottom }]}
          showsVerticalScrollIndicator={false}
        >
          <View style={styles.infoBanner}>
            <Ionicons name="information-circle" size={18} color="#2563EB" />
            <Text style={styles.infoBannerText}>
              <Text style={styles.infoBold}>LIVE RATES: </Text>
              Sell rates are indicative and may vary at branches. Taxes additional.
            </Text>
          </View>

          <View style={styles.sectionHead}>
            <View style={styles.sectionHeadLeft}>
              <Ionicons name="trophy" size={16} color="#C2410C" />
              <Text style={styles.sectionHeadTitle}>GOLD RATES</Text>
            </View>
            <Text style={styles.sectionHeadSub}>Different purities available.</Text>
          </View>

          {goldRows.map((row, index) => {
            const p = parseFloat(row.purity);
            const icon = GOLD_ICONS[Math.min(index, GOLD_ICONS.length - 1)];
            const unit = row.unit ? row.unit.replace(/^\s*per\s+/i, '') : 'gram';
            return (
              <SellRateCard
                key={`${row.purity}-${index}`}
                title={goldKaratLabel(p)}
                unitLabel={`per ${unit}`}
                saleRate={parseRate(row.sale_rate)}
                icon={icon}
              />
            );
          })}

          {(silverRow || platinumRow) && (
            <View style={[styles.sectionHead, styles.sectionHeadSpaced]}>
              <View style={styles.sectionHeadLeft}>
                <View style={styles.diamondCircle}>
                  <Ionicons name="diamond" size={14} color="#7C3AED" />
                </View>
                <Text style={styles.sectionHeadTitle}>OTHER METALS</Text>
              </View>
              <Text style={styles.sectionHeadSub}>Silver & Platinum.</Text>
            </View>
          )}

          {silverRow ? (
            <SellRateCard
              title="Silver"
              unitLabel={`${silverRow.unit || 'per gram'}`}
              saleRate={parseRate(silverRow.sale_rate)}
              icon="ellipse"
            />
          ) : null}

          {platinumRow ? (
            <SellRateCard
              title="Platinum"
              unitLabel={`${platinumRow.unit || 'per gram'}`}
              saleRate={parseRate(platinumRow.sale_rate)}
              icon="diamond"
            />
          ) : null}

          <Text style={styles.disclaimer}>
            Rates are indicative and subject to change without notice. Making charges, GST, and other levies are
            extra as applicable at the branch.
          </Text>

          <Pressable style={styles.cta} onPress={() => navigation.navigate('SelectScheme')}>
            <Text style={styles.ctaText}>START INVESTING NOW</Text>
            <Ionicons name="chevron-forward" size={20} color="#FFFFFF" />
          </Pressable>
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#F5F5F3',
  },
  hero: {
    backgroundColor: '#E88800',
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  heroTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  heroIcon: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  heroTitle: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
  },
  heroSub: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.92)',
    marginTop: 4,
  },
  heroMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 10,
  },
  heroMetaText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.9)',
    flex: 1,
  },
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scroll: {
    paddingHorizontal: 14,
    paddingTop: 14,
    gap: 12,
  },
  infoBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
    backgroundColor: '#E0EFFF',
    borderRadius: 12,
    padding: 12,
  },
  infoBannerText: {
    flex: 1,
    fontSize: 12,
    color: '#1E3A5F',
    lineHeight: 18,
  },
  infoBold: {
    fontFamily: 'Poppins-Bold',
  },
  sectionHead: {
    marginTop: 4,
  },
  sectionHeadSpaced: {
    marginTop: 16,
  },
  sectionHeadLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  sectionHeadTitle: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.8,
    color: '#111827',
  },
  sectionHeadSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 4,
    marginLeft: 24,
  },
  diamondCircle: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#EDE9FE',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metalCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E8EBEF',
  },
  metalCardTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 12,
  },
  metalIconWrap: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#FFF7ED',
    justifyContent: 'center',
    alignItems: 'center',
  },
  metalTitles: {
    flex: 1,
  },
  metalTitle: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },
  metalSub: {
    fontSize: 11,
    color: '#6B7280',
    marginTop: 2,
  },
  sellRateBox: {
    backgroundColor: '#FFF8ED',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#FED7AA',
  },
  sellRateLabel: {
    fontSize: 10,
    color: '#9CA3AF',
    marginBottom: 4,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.5,
    textTransform: 'uppercase',
  },
  sellRateValue: {
    fontSize: 22,
    fontFamily: 'Poppins-Bold',
    color: '#9A3412',
  },
  disclaimer: {
    fontSize: 11,
    color: '#9CA3AF',
    lineHeight: 16,
    marginTop: 8,
  },
  cta: {
    marginTop: 8,
    backgroundColor: '#E88800',
    borderRadius: 14,
    minHeight: 52,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingHorizontal: 16,
  },
  ctaText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 0.6,
  },
});
