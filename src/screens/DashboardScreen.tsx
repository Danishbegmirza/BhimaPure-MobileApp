import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Linking,
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
import { useSafeBottomInset } from '../utils/safeBottomInset';
import type { RootStackParamList } from '../navigation/types';
import { getToken } from '../storage/auth';
import {
  fetchDashboard,
  getDashboardTotalInstalment,
  type DashboardResponse,
} from '../api/dashboard';
import {
  fetchGoldRates,
  firstGoldLastUpdated,
  saleRateForGoldPurity,
  type GoldRateItem,
} from '../api/goldrates';

type Props = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

// ─── Safe number formatter (avoids toLocaleString locale issues in Hermes) ────
function formatINR(value: string | number): string {
  const num = typeof value === 'string' ? parseFloat(value) : value;
  if (isNaN(num)) { return '0'; }
  const intPart = Math.round(num).toString();
  if (intPart.length <= 3) { return intPart; }
  const last3 = intPart.slice(-3);
  const rest = intPart.slice(0, -3);
  return rest.replace(/\B(?=(\d{2})+(?!\d))/g, ',') + ',' + last3;
}

// Card tones for scheme type cards (used when no banner colour from API)
const SCHEME_CARD_TONES = ['#9F1D1D', '#161321', '#0A1F33', '#1A2340'];

// ─── Prop Types ───────────────────────────────────────────────────────────────

type SectionHeaderProps = {
  title: string;
  action?: string;
  actionAccent?: boolean;
  onActionPress?: () => void;
};

type SchemeItemProps = {
  name: string;
  due: string;
  dueStatus?: string;
  dueText?: string;
  amount: string;
  status: string;
  onPress?: () => void;
};

type TransactionItemProps = {
  title: string;
  date: string;
  amount: string;
};

type BottomTabItemProps = {
  label: string;
  icon: string;
  active?: boolean;
  onPress?: () => void;
};

// ─── Sub-components ───────────────────────────────────────────────────────────

function SectionHeader({ title, action, actionAccent, onActionPress }: SectionHeaderProps) {
  return (
    <View style={styles.sectionHeader}>
      <Text style={styles.sectionTitle}>{title}</Text>
      {action ? (
        onActionPress ? (
          <Pressable onPress={onActionPress} style={styles.sectionActionButton}>
            <Text style={[styles.sectionAction, actionAccent && styles.accentText]}>{action}</Text>
          </Pressable>
        ) : (
          <Text style={[styles.sectionAction, actionAccent && styles.accentText]}>{action}</Text>
        )
      ) : null}
    </View>
  );
}

function WelcomeCard({
  customerName,
  isLoggedIn,
  onNotificationsPress,
}: {
  customerName: string;
  isLoggedIn: boolean;
  onNotificationsPress: () => void;
}) {
  return (
    <View style={styles.welcomeCard}>
      <View style={styles.profileBadge}>
        <Ionicons name="person-outline" size={14} color="#E68900" />
      </View>
      <View style={styles.welcomeTextWrap}>
        <Text style={styles.welcomeLabel}>{isLoggedIn ? 'WELCOME BACK' : 'WELCOME'}</Text>
        <Text style={styles.welcomeName}>{customerName || 'Guest'}</Text>
      </View>
      <View style={styles.topActions}>
        <Pressable style={styles.roundIcon} onPress={onNotificationsPress}>
          <Ionicons name="notifications-outline" size={19} color="#707A89" />
        </Pressable>
        <Pressable style={styles.roundIcon} onPress={() => Linking.openURL('https://wa.me/918547771777')}>
          <Ionicons name="chatbubble-ellipses-outline" size={19} color="#22C55E" />
        </Pressable>
      </View>
    </View>
  );
}

function LiveMarketGoldCard({
  goldRate22k,
  onPress,
}: {
  goldRate22k: string;
  onPress: () => void;
}) {
  const price = `₹${formatINR(goldRate22k || '0')}`;
  return (
    <Pressable style={styles.liveMarketCard} onPress={onPress}>
      <View style={styles.liveMarketTopRow}>
        <View style={styles.liveMarketLeft}>
          <View style={styles.liveMarketIconCircle}>
            <Ionicons name="trophy" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.liveMarketRateLabel}>TODAY'S GOLD RATE</Text>
        </View>
        <View style={styles.liveMarketLiveBadge}>
          <View style={styles.liveMarketDot} />
          <Text style={styles.liveMarketLiveText}>LIVE</Text>
        </View>
      </View>
      <Text style={styles.liveMarketPrice}>{price}</Text>
      <Text style={styles.liveMarketPerGram}>Per Gram (22K Gold)</Text>
      <View style={styles.liveMarketDivider} />
      <Text style={styles.liveMarketFooterCta}>View All Metal Rates &gt;</Text>
    </Pressable>
  );
}

function InvestmentSummaryCards({
  goldHoldingsText,
  totalInvestmentText,
  growthPercent,
}: {
  goldHoldingsText: string;
  totalInvestmentText: string;
  growthPercent: string | null;
}) {
  return (
    <View style={styles.investmentRow}>
      <View style={styles.investmentCard}>
        <View style={[styles.investmentIconCircle, styles.investmentIconCircleGold]}>
          <Ionicons name="wallet-outline" size={18} color="#E67E22" />
        </View>
        <Text style={styles.investmentCardLabel}>GOLD HOLDINGS</Text>
        <Text style={styles.investmentCardValue}>{goldHoldingsText}</Text>
        <Text style={styles.investmentCardSubGold}>22K Gold</Text>
      </View>
      <View style={styles.investmentCard}>
        <View style={[styles.investmentIconCircle, styles.investmentIconCircleInr]}>
          <Text style={styles.investmentRupeeIcon}>₹</Text>
        </View>
        <Text style={styles.investmentCardLabel}>TOTAL INVESTMENT</Text>
        <Text style={styles.investmentCardValue}>{totalInvestmentText}</Text>
        {growthPercent ? (
          <View style={styles.investmentGrowthPill}>
            <Ionicons name="trending-up" size={12} color="#27AE60" />
            <Text style={styles.investmentGrowthText}>{growthPercent}</Text>
          </View>
        ) : (
          <View style={styles.investmentGrowthPlaceholder} />
        )}
      </View>
    </View>
  );
}

function JoinSchemeButton({ onPress }: { onPress: () => void }) {
  return (
    <Pressable style={styles.joinButton} onPress={onPress}>
      <View style={styles.plusBubble}>
        <Text style={styles.plusText}>+</Text>
      </View>
      <Text style={styles.joinButtonText}>JOIN NEW GOLD SCHEME</Text>
    </Pressable>
  );
}

function SchemeItem({ name, due, dueStatus, dueText, amount, status, onPress }: SchemeItemProps) {
  const isOverdue = dueStatus === 'OVERDUE';

  const content = (
    <>
      <View style={styles.schemeBadge}>
        <Ionicons name="shield-checkmark-outline" size={16} color="#E28A00" />
      </View>
      <View style={styles.schemeCenter}>
        <Text style={styles.schemeName}>{name}</Text>
        <Text style={[styles.schemeDue, isOverdue && styles.schemeDueOverdue]}>
          DUE: {due}{dueText ? `  ·  ${dueText}` : ''}
        </Text>
      </View>
      <View style={styles.schemeRight}>
        <Text style={styles.schemeAmount}>
          Rs {formatINR(amount)}
        </Text>
        <Text style={[styles.activePill, isOverdue && styles.overduePill]}>{status}</Text>
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={styles.schemeItem} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.schemeItem}>{content}</View>;
}

function RecommendedCard({
  name,
  duration,
  highlights,
  index,
  bannerImageUrl,
  onExplore,
}: {
  name: string;
  duration: string | null;
  highlights: string[];
  index: number;
  bannerImageUrl?: string | null;
  onExplore: () => void;
}) {
  const cardTone = SCHEME_CARD_TONES[index % SCHEME_CARD_TONES.length];

  return (
    <View style={styles.recommendedCard}>
      <ImageBackground
        source={bannerImageUrl ? { uri: bannerImageUrl } : undefined}
        style={[styles.recommendedTop, !bannerImageUrl && { backgroundColor: cardTone }]}
        imageStyle={styles.recommendedBannerImage}
      >
        {/* Dark overlay so text stays readable over the image */}
        <View style={styles.recommendedOverlay} />
        {index === 0 ? (
          <View style={styles.popularTag}>
            <Ionicons name="star-outline" size={10} color="#FFFFFF" />
            <Text style={styles.popularTagText}>MOST POPULAR</Text>
          </View>
        ) : null}
        <Text style={styles.recommendedTitle}>{name}</Text>
      </ImageBackground>
      <View style={styles.recommendedBody}>
        <View style={styles.recommendedRow}>
          {duration ? (
            <Text style={styles.monthPill}>{duration}</Text>
          ) : (
            <View />
          )}
          <Text style={styles.fixedText}>FIXED MONTHLY</Text>
        </View>
        {(Array.isArray(highlights) ? highlights : []).map((h, i) => (
          <Text key={i} style={styles.pointText}>- {h}</Text>
        ))}
        <Pressable style={styles.exploreButton} onPress={onExplore}>
          <Text style={styles.exploreButtonText}>EXPLORE DETAILS</Text>
        </Pressable>
      </View>
    </View>
  );
}

function MarketAnalyticsCard({ goldRate22k }: { goldRate22k: string }) {
  return (
    <View style={styles.marketCard}>
      <View style={styles.marketHeader}>
        <View>
          <Text style={styles.marketTitle}>Market Analytics</Text>
          <Text style={styles.marketSubTitle}>22K GOLD RATE / 1G</Text>
        </View>
        <Text style={styles.gainPill}>
          Rs {formatINR(goldRate22k || '0')}
        </Text>
      </View>
      <View style={styles.chartBox}>
        <View style={styles.chartLine} />
      </View>
    </View>
  );
}

function TransactionItem({ title, date, amount }: TransactionItemProps) {
  return (
    <View style={styles.transactionItem}>
      <View style={styles.currencyDot}>
        <Ionicons name="wallet-outline" size={16} color="#9CA3AF" />
      </View>
      <View style={styles.transactionCenter}>
        <Text style={styles.transactionTitle}>{title}</Text>
        <Text style={styles.transactionDate}>{date}</Text>
      </View>
      <View style={styles.transactionRight}>
        <Text style={styles.transactionAmount}>
          Rs {formatINR(amount)}
        </Text>
        <Text style={styles.successText}>SUCCESS</Text>
      </View>
    </View>
  );
}

function SupportCard() {
  return (
    <View style={styles.supportCard}>
      <View style={styles.supportLeft}>
        <View style={styles.supportIconCircle}>
          <Ionicons name="logo-whatsapp" size={18} color="#24A764" />
        </View>
        <Pressable onPress={() => Linking.openURL('https://wa.me/918547771777')}>
          <Text style={styles.supportTopLabel}>NEED ASSISTANCE?</Text>
          <Text style={styles.supportTitle}>WhatsApp Support</Text>
        </Pressable>
      </View>
      <Text style={styles.supportArrow}> &gt; </Text>
    </View>
  );
}

function BottomTabItem({ label, icon, active, onPress }: BottomTabItemProps) {
  const content = (
    <>
      <Ionicons
        name={icon}
        size={18}
        style={[styles.bottomTabIcon, active && styles.bottomTabIconActive]}
      />
      <View style={styles.bottomTabLabelWrap}>
        <Text
          numberOfLines={1}
          ellipsizeMode="tail"
          style={[styles.bottomTabLabel, active && styles.bottomTabLabelActive]}
        >
          {label}
        </Text>
      </View>
    </>
  );

  if (onPress) {
    return (
      <Pressable style={styles.bottomTabItem} onPress={onPress}>
        {content}
      </Pressable>
    );
  }

  return <View style={styles.bottomTabItem}>{content}</View>;
}

function BottomTabs({
  onJoinNewPress,
  onMySchemesPress,
  onActivityPress,
  onAccountPress,
  safeBottomInset,
}: {
  onJoinNewPress: () => void;
  onMySchemesPress: () => void;
  onActivityPress: () => void;
  onAccountPress: () => void;
  safeBottomInset: number;
}) {
  const footerInset = Math.max(safeBottomInset, 6);

  return (
    <View style={[styles.bottomTabsWrap, { paddingBottom: footerInset }]}>
      <View style={styles.bottomTabs}>
        <BottomTabItem label="Home" icon="home-outline" active />
        <BottomTabItem label="Join New" icon="add-outline" onPress={onJoinNewPress} />
        <Pressable style={styles.bottomTabItem} onPress={onMySchemesPress}>
          <Ionicons name="pie-chart-outline" size={18} style={styles.bottomTabIcon} />
          <View style={styles.bottomTabLabelWrap}>
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.bottomTabLabel}>
              My Schemes
            </Text>
          </View>
        </Pressable>
        <Pressable style={styles.bottomTabItem} onPress={onActivityPress}>
          <Ionicons name="time-outline" size={18} style={styles.bottomTabIcon} />
          <View style={styles.bottomTabLabelWrap}>
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.bottomTabLabel}>
              Activity
            </Text>
          </View>
        </Pressable>
        <Pressable style={styles.bottomTabItem} onPress={onAccountPress}>
          <Ionicons name="person-outline" size={18} style={styles.bottomTabIcon} />
          <View style={styles.bottomTabLabelWrap}>
            <Text numberOfLines={1} ellipsizeMode="tail" style={styles.bottomTabLabel}>
              Account
            </Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function DashboardScreen({ navigation }: Props) {
  const safeBottom = useSafeBottomInset();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [goldRatesRows, setGoldRatesRows] = useState<GoldRateItem[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setIsLoggedIn(!!token);
      const result = await fetchDashboard(token ?? undefined);
      console.log('result', result);
      setData(result);
      try {
        const gr = await fetchGoldRates();
        setGoldRatesRows(Array.isArray(gr.goldrates) ? gr.goldrates : []);
      } catch {
        setGoldRatesRows([]);
      }
    } catch (_e) {
      // Silent fail – keep existing UI visible
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const goldRate22k =
    saleRateForGoldPurity(goldRatesRows, 22) ?? data?.todays_goldrate?.sale_rate ?? '0';
  const asOnDate =
    firstGoldLastUpdated(goldRatesRows) ?? data?.todays_goldrate?.as_on_date ?? '';
  const rateNum = parseFloat(String(goldRate22k).replace(/,/g, ''));
  const totalInstalmentRaw = getDashboardTotalInstalment(data);
  const totalNum =
    totalInstalmentRaw != null && totalInstalmentRaw !== ''
      ? parseFloat(String(totalInstalmentRaw).replace(/,/g, ''))
      : NaN;
  const goldHoldingsG =
    isLoggedIn && Number.isFinite(rateNum) && rateNum > 0 && Number.isFinite(totalNum) && totalNum >= 0
      ? totalNum / rateNum
      : null;
  const goldHoldingsText = goldHoldingsG != null ? `${goldHoldingsG.toFixed(2)}g` : '—';
  const totalInvestmentText =
    isLoggedIn && totalInstalmentRaw != null ? `₹${formatINR(totalInstalmentRaw)}` : '—';
  const investmentGrowthPercent: string | null = (() => {
    if (!isLoggedIn) return null;
    const raw = data?.investment_growth_percent;
    if (raw == null || String(raw).trim() === '') return null;
    const s = String(raw).trim();
    if (s.includes('%')) {
      return s.startsWith('+') || s.startsWith('-') ? s : `+${s}`;
    }
    const n = parseFloat(s);
    return Number.isFinite(n) ? `${n >= 0 ? '+' : ''}${n}%` : `+${s}%`;
  })();

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar barStyle="dark-content" backgroundColor="#F5F5F3" />
      <View style={styles.screenBody}>
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color="#E88800" />
          </View>
        ) : (
          <ScrollView
            contentContainerStyle={[
              styles.content,
              {
                paddingBottom: 108 + safeBottom + 8,
              },
            ]}
            showsVerticalScrollIndicator={false}
          >
            {/* Welcome / Header */}
            <WelcomeCard
              customerName={data?.customer?.name ?? ''}
              isLoggedIn={isLoggedIn}
              onNotificationsPress={() => navigation.navigate('Notifications')}
            />

            <View style={styles.mainSections}>
              <SectionHeader title="INVESTMENT" />
              <InvestmentSummaryCards
                goldHoldingsText={goldHoldingsText}
                totalInvestmentText={totalInvestmentText}
                growthPercent={investmentGrowthPercent}
              />

              {/* Join CTA */}
              <JoinSchemeButton onPress={() => navigation.navigate('SelectScheme')} />

              {/* My Enrolled Schemes – only for logged-in users */}
              {isLoggedIn && data?.myschemes && data.myschemes.length > 0 && (
                <>
                  <SectionHeader
                    title="MY ENROLLED SCHEMES"
                    action="VIEW ALL PORTFOLIO"
                    actionAccent
                    onActionPress={() => navigation.navigate('MySchemes')}
                  />
                  {data.myschemes.map((scheme, i) => (
                    <SchemeItem
                      key={i}
                      name={scheme.scheme_name}
                      due={scheme.due.label}
                      dueStatus={scheme.due.status}
                      dueText={scheme.due.text}
                      amount={scheme.amount}
                      status={scheme.status}
                      onPress={() => navigation.navigate('MySchemes')}
                    />
                  ))}
                </>
              )}

              <SectionHeader
                title=""
                action={asOnDate ? `As on ${asOnDate}` : undefined}
              />
              <LiveMarketGoldCard
                goldRate22k={goldRate22k}
                onPress={() => navigation.navigate('MetalRates')}
              />

              {/* Recommended Schemes */}
              {data?.schemetype && data.schemetype.length > 0 && (
                <>
                  <SectionHeader
                    title="RECOMMENDED FOR YOU"
                    action="VIEW ALL"
                    actionAccent
                    onActionPress={() => navigation.navigate('SelectScheme')}
                  />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.recommendedScrollContent}
                  >
                    {data.schemetype.map((st, index) => (
                      <RecommendedCard
                        key={st.id}
                        name={st.scheme_type_name}
                        duration={st.duration}
                        highlights={st.highlights}
                        index={index}
                        bannerImageUrl={st.banner_image_url}
                        onExplore={() =>
                          navigation.navigate('SchemeDetails', { schemeId: String(st.id) })
                        }
                      />
                    ))}
                  </ScrollView>
                </>
              )}

              {/* Market Performance */}
              {/* <SectionHeader title="MARKET PERFORMANCE" action="Live" actionAccent />
              <MarketAnalyticsCard goldRate22k={goldRate22k} /> */}

              {/* Recent Transactions – only for logged-in users */}
              {isLoggedIn && data?.paymenthistory && data.paymenthistory.length > 0 && (
                <>
                  <SectionHeader
                    title="RECENT TRANSACTIONS"
                    action="HISTORY"
                    actionAccent
                    onActionPress={() => navigation.navigate('ActivityHistory')}
                  />
                  <View style={styles.transactionsCard}>
                    {data.paymenthistory.map((p, i) => (
                      <TransactionItem
                        key={i}
                        title="Installment Payment"
                        date={p.installment_date}
                        amount={p.installment_amount}
                      />
                    ))}
                  </View>
                </>
              )}

              <SupportCard />
            </View>
          </ScrollView>
        )}

        <BottomTabs
          safeBottomInset={safeBottom}
          onJoinNewPress={() => navigation.navigate('SelectScheme')}
          onMySchemesPress={() => navigation.navigate('MySchemes')}
          onActivityPress={() => navigation.navigate('ActivityHistory')}
          onAccountPress={() => navigation.navigate('Profile')}
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F5F5F3',
  },
  screenBody: {
    flex: 1,
  },
  loadingWrap: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    paddingTop: 10,
    paddingBottom: 108,
    gap: 16,
  },
  mainSections: {
    paddingHorizontal: 14,
    gap: 16,
  },
  welcomeCard: {
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingVertical: 22,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ECEFF3',
    marginTop: 25,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 16,
    elevation: 2,
  },
  profileBadge: {
    width: 34,
    height: 34,
    borderRadius: 12,
    borderWidth: 1.2,
    borderColor: '#F6B144',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF8EA',
    marginLeft: 2,
  },
  profileIcon: {
    fontSize: 16,
    color: '#E68900',
    fontFamily: 'Poppins-SemiBold',
  },
  welcomeTextWrap: {
    flex: 1,
    marginLeft: 12,
  },
  welcomeLabel: {
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 1.2,
    color: '#9AA3B2',
  },
  welcomeName: {
    marginTop: 3,
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#111827',
  },
  topActions: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  roundIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 2,
    backgroundColor: '#F8FAFC',
  },
  roundIconText: {
    fontWeight: '700',
    color: '#687386',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 2,
  },
  sectionTitle: {
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 1.6,
    color: '#96A0AE',
  },
  sectionAction: {
    fontSize: 10,
    color: '#8B94A3',
    fontFamily: 'Poppins-SemiBold',
  },
  sectionActionButton: {
    paddingVertical: 2,
  },
  accentText: {
    color: '#E88800',
  },
  liveMarketCard: {
    backgroundColor: '#E88800',
    borderRadius: 18,
    paddingHorizontal: 16,
    paddingVertical: 18,
    shadowColor: '#C2410C',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
    elevation: 4,
  },
  liveMarketTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  liveMarketLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  liveMarketIconCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: 'rgba(255,255,255,0.22)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveMarketRateLabel: {
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 1,
    color: '#FFFFFF',
  },
  liveMarketLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#6B7280',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
  },
  liveMarketDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#EF4444',
  },
  liveMarketLiveText: {
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.5,
  },
  liveMarketPrice: {
    fontSize: 30,
    fontFamily: 'Poppins-Black',
    color: '#FFFFFF',
  },
  liveMarketPerGram: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.92)',
    marginTop: 4,
    fontFamily: 'Poppins-Medium',
  },
  liveMarketDivider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: 'rgba(255,255,255,0.45)',
    marginVertical: 14,
  },
  liveMarketFooterCta: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.4,
  },
  investmentRow: {
    flexDirection: 'row',
    gap: 10,
  },
  investmentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E8E8E8',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 2,
  },
  investmentIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  investmentIconCircleGold: {
    backgroundColor: '#FFF3E0',
  },
  investmentIconCircleInr: {
    backgroundColor: '#E8F8F0',
  },
  investmentRupeeIcon: {
    fontSize: 18,
    fontFamily: 'Poppins-Bold',
    color: '#27AE60',
    marginTop: -2,
  },
  investmentCardLabel: {
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 1,
    color: '#808080',
    marginBottom: 6,
  },
  investmentCardValue: {
    fontSize: 20,
    fontFamily: 'Poppins-Black',
    color: '#1A1C24',
    marginBottom: 8,
  },
  investmentCardSubGold: {
    fontSize: 13,
    fontFamily: 'Poppins-SemiBold',
    color: '#E67E22',
  },
  investmentGrowthPill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    gap: 4,
    backgroundColor: '#E8F5E9',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 999,
  },
  investmentGrowthText: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    color: '#27AE60',
  },
  investmentGrowthPlaceholder: {
    minHeight: 22,
  },
  joinButton: {
    borderRadius: 20,
    backgroundColor: '#101720',
    minHeight: 66,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 12,
    marginTop: 2,
    shadowColor: '#0B0F17',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.18,
    shadowRadius: 14,
    elevation: 4,
  },
  plusBubble: {
    width: 32,
    height: 32,
    borderRadius: 12,
    backgroundColor: '#F7A714',
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '700',
    marginTop: -1,
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontFamily: 'Poppins-Black',
    letterSpacing: 1.6,
    marginTop: 1,
  },
  schemeItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8EBEF',
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  schemeBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#FFF5E7',
    justifyContent: 'center',
    alignItems: 'center',
  },
  schemeBadgeText: {
    color: '#E28A00',
    fontWeight: '700',
  },
  schemeCenter: {
    flex: 1,
  },
  schemeName: {
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
    color: '#131A28',
  },
  schemeDue: {
    marginTop: 2,
    fontSize: 10,
    letterSpacing: 0.8,
    color: '#98A2B3',
    fontFamily: 'Poppins-Medium',
  },
  schemeDueOverdue: {
    color: '#E05252',
  },
  schemeRight: {
    alignItems: 'flex-end',
  },
  schemeAmount: {
    fontSize: 14,
    fontFamily: 'Poppins-Black',
    color: '#111827',
  },
  activePill: {
    marginTop: 6,
    backgroundColor: '#E8FFF5',
    color: '#0F9E63',
    paddingVertical: 3,
    paddingHorizontal: 10,
    borderRadius: 999,
    fontSize: 9,
    fontFamily: 'Poppins-SemiBold',
    overflow: 'hidden',
  },
  overduePill: {
    backgroundColor: '#FFF0F0',
    color: '#E05252',
  },
  recommendedCard: {
    width: 256,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E8EBEF',
    backgroundColor: '#FFFFFF',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 2,
  },
  recommendedScrollContent: {
    paddingRight: 2,
    gap: 12,
  },
  recommendedTop: {
    minHeight: 126,
    padding: 16,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  recommendedBannerImage: {
    resizeMode: 'cover',
  },
  recommendedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
  },
  popularTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    position: 'absolute',
    right: 12,
    top: 12,
    backgroundColor: '#F7A714',
    borderRadius: 14,
    paddingHorizontal: 10,
    paddingVertical: 5,
  },
  popularTagText: {
    fontSize: 9,
    fontFamily: 'Poppins-Black',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  recommendedTitle: {
    color: '#FFFFFF',
    fontSize: 15,
    fontFamily: 'Poppins-BoldItalic',
  },
  recommendedBody: {
    padding: 16,
  },
  recommendedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  monthPill: {
    fontSize: 10,
    backgroundColor: '#FFF0DA',
    color: '#E38A00',
    fontFamily: 'Poppins-SemiBold',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 999,
    overflow: 'hidden',
  },
  fixedText: {
    fontSize: 10,
    color: '#98A2B3',
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 0.9,
  },
  pointText: {
    fontSize: 11,
    color: '#3A4658',
    marginTop: 7,
    fontFamily: 'Poppins-Medium',
  },
  exploreButton: {
    marginTop: 14,
    borderRadius: 12,
    backgroundColor: '#111D36',
    minHeight: 42,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Black',
    fontSize: 11,
    letterSpacing: 1.8,
  },
  marketCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E8EBEF',
    padding: 14,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  marketHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  marketTitle: {
    fontSize: 16,
    fontFamily: 'Poppins-SemiBold',
    color: '#121826',
  },
  marketSubTitle: {
    marginTop: 4,
    fontSize: 10,
    color: '#98A2B3',
    letterSpacing: 0.9,
    fontFamily: 'Poppins-Medium',
  },
  gainPill: {
    fontSize: 11,
    backgroundColor: '#E8FFF5',
    color: '#0F9E63',
    paddingVertical: 5,
    paddingHorizontal: 11,
    borderRadius: 999,
    overflow: 'hidden',
    fontFamily: 'Poppins-SemiBold',
  },
  chartBox: {
    marginTop: 14,
    height: 148,
    backgroundColor: '#FAF2EA',
    borderRadius: 12,
    justifyContent: 'flex-start',
    paddingTop: 32,
  },
  chartLine: {
    height: 3,
    backgroundColor: '#B3560A',
    marginHorizontal: 14,
    borderRadius: 2,
  },
  transactionsCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E8EBEF',
    borderRadius: 18,
    overflow: 'hidden',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.05,
    shadowRadius: 12,
    elevation: 2,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 13,
    gap: 12,
  },
  currencyDot: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  currencyDotText: {
    color: '#9CA3AF',
    fontFamily: 'Poppins-SemiBold',
  },
  transactionCenter: {
    flex: 1,
  },
  transactionTitle: {
    fontSize: 14,
    color: '#131A28',
    fontFamily: 'Poppins-SemiBold',
  },
  transactionDate: {
    marginTop: 2,
    color: '#94A3B8',
    fontSize: 11,
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    color: '#131A28',
    fontFamily: 'Poppins-Black',
    fontSize: 14,
  },
  successText: {
    marginTop: 2,
    color: '#0F9E63',
    fontSize: 9,
    letterSpacing: 0.8,
    fontFamily: 'Poppins-SemiBold',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  supportCard: {
    marginTop: 2,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#BAEFD1',
    backgroundColor: '#E2F8EC',
    padding: 14,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 2,
  },
  supportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  supportIconCircle: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportIconText: {
    color: '#24A764',
    fontFamily: 'Poppins-SemiBold',
  },
  supportTopLabel: {
    color: '#0B6A57',
    letterSpacing: 0.8,
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
  },
  supportTitle: {
    marginTop: 2,
    color: '#1F2937',
    fontSize: 14,
    fontFamily: 'Poppins-SemiBold',
  },
  supportArrow: {
    color: '#22A45E',
    fontSize: 20,
    fontFamily: 'Poppins-SemiBold',
  },
  bottomTabsWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#E8EBEF',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 8,
    zIndex: 20,
  },
  bottomTabs: {
    minHeight: 64,
    paddingHorizontal: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  bottomTabItem: {
    flex: 1,
    minHeight: 56,
    paddingVertical: 6,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
  },
  bottomTabLabelWrap: {
    minHeight: 16,
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
  },
  bottomTabIcon: {
    fontSize: 18,
    fontFamily: 'Poppins-SemiBold',
    color: '#9AA3B2',
  },
  bottomTabIconActive: {
    color: '#E88800',
  },
  bottomTabLabel: {
    fontSize: 10,
    lineHeight: 13,
    color: '#9AA3B2',
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
    width: '100%',
  },
  bottomTabLabelActive: {
    color: '#E88800',
  },
});
