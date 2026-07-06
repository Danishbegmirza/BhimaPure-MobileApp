import React, { useCallback, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  ImageBackground,
  Linking,
  Pressable,
  RefreshControl,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  View,
  Image,
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
import { fetchProfile } from '../api/user';
import { BottomTabs } from '../components/BottomTabs';
import { useLanguage } from '../context/LanguageContext';
import type { SupportedLanguage } from '../staticTexts';

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
  welcomeBackText,
  welcomeText,
  guestText,
}: {
  customerName: string;
  isLoggedIn: boolean;
  onNotificationsPress: () => void;
  welcomeBackText: string;
  welcomeText: string;
  guestText: string;
}) {
  return (
    <View style={styles.welcomeCard}>
      <View style={styles.profileBadge}>
        <Image source={require('../assets/welcome.png')} style={{width: 44, height: 44, }} />
      </View>
      <View style={styles.welcomeTextWrap}>
        <Text style={styles.welcomeLabel}>{isLoggedIn ? welcomeBackText : welcomeText}</Text>
        <Text style={styles.welcomeName}>{customerName || guestText}</Text>
      </View>
      <View style={styles.topActions}>
          <Pressable style={styles.roundIcon} onPress={onNotificationsPress}>
            <Image source={require('../assets/bell.png')} style={{width: 20, height: 20, }} />
        </Pressable>
        <Pressable style={styles.roundIcon} onPress={() => Linking.openURL('https://wa.me/918547771777')}>
          <Image source={require('../assets/chat.png')} style={{width: 33, height: 33, }} />
        </Pressable>
      </View>
    </View>
  );
}

function LiveMarketGoldCard({
  goldRate22k,
  onPress,
  todaysGoldRateText,
  liveText,
  perGram22kText,
  viewAllMetalRatesText,
}: {
  goldRate22k: string;
  onPress: () => void;
  todaysGoldRateText: string;
  liveText: string;
  perGram22kText: string;
  viewAllMetalRatesText: string;
}) {
  const price = `₹${formatINR(goldRate22k || '0')}`;
  return (
    <Pressable style={styles.liveMarketCard} onPress={onPress}>
      <View style={styles.liveMarketTopRow}>
        <View style={styles.liveMarketLeft}>
          <View style={styles.liveMarketIconCircle}>
            <Ionicons name="trophy" size={16} color="#FFFFFF" />
          </View>
          <Text style={styles.liveMarketRateLabel}>{todaysGoldRateText}</Text>
        </View>
        <View style={styles.liveMarketLiveBadge}>
          <View style={styles.liveMarketDot} />
          <Text style={styles.liveMarketLiveText}>{liveText}</Text>
        </View>
      </View>
      <Text style={styles.liveMarketPrice}>{price}</Text>
      <Text style={styles.liveMarketPerGram}>{perGram22kText}</Text>
      <View style={styles.liveMarketDivider} />
      <Text style={styles.liveMarketFooterCta}>{viewAllMetalRatesText}</Text>
    </Pressable>
  );
}

function InvestmentSummaryCards({
  goldHoldingsText,
  totalInvestmentText,
  growthPercent,
  goldHoldingsLabel,
  gold22kLabel,
  totalInvestmentLabel,
}: {
  goldHoldingsText: string;
  totalInvestmentText: string;
  growthPercent: string | null;
  goldHoldingsLabel: string;
  gold22kLabel: string;
  totalInvestmentLabel: string;
}) {
  return (
    <View style={styles.investmentRow}>
      <View style={styles.investmentCard}>
        <View style={[styles.investmentIconCircle, styles.investmentIconCircleGold]}>
          <Ionicons name="wallet-outline" size={18} color="#E67E22" />
        </View>
        <Text style={styles.investmentCardLabel}>{goldHoldingsLabel}</Text>
        <Text style={styles.investmentCardValue}>{goldHoldingsText}</Text>
        <Text style={styles.investmentCardSubGold}>{gold22kLabel}</Text>
      </View>
      <View style={styles.investmentCard}>
        <View style={[styles.investmentIconCircle, styles.investmentIconCircleInr]}>
          <Text style={styles.investmentRupeeIcon}>₹</Text>
        </View>
        <Text style={styles.investmentCardLabel}>{totalInvestmentLabel}</Text>
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

function JoinSchemeButton({ onPress, joinNewSchemeText }: { onPress: () => void; joinNewSchemeText: string }) {
  return (
    <Pressable style={styles.joinButton} onPress={onPress}>
      <View style={styles.plusBubble}>
        <Image source={require('../assets/join.png')} style={{width: 32, height: 32, marginRight:0}} />
      </View>
      <Text style={styles.joinButtonText} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.8}>{joinNewSchemeText}</Text>
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
  mostPopularText,
  fixedMonthlyText,
  exploreDetailsText,
}: {
  name: string;
  duration: string | null;
  highlights: string[];
  index: number;
  bannerImageUrl?: string | null;
  onExplore: () => void;
  mostPopularText: string;
  fixedMonthlyText: string;
  exploreDetailsText: string;
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
            <Image source={require('../assets/popular.png')} style={{width: 12, height: 12, }} />
            <Text style={styles.popularTagText}>{mostPopularText}</Text>
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
          <Text style={styles.fixedText}>{fixedMonthlyText}</Text>
        </View>
        {(Array.isArray(highlights) ? highlights : []).map((h, i) => (
          <Text key={i} style={styles.pointText}> <Image source={require('../assets/points.png')} style={{width: 5, height: 5, marginTop:-5 }} /> {" "} {h}</Text>
        ))}
        <Pressable style={styles.exploreButton} onPress={onExplore}>
          <Text style={styles.exploreButtonText}>{exploreDetailsText}</Text>
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

function TransactionItem({ title, date, amount, successText }: TransactionItemProps & { successText: string }) {
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
        <Text style={styles.successText}>{successText}</Text>
      </View>
    </View>
  );
}

function SupportCard({ needAssistanceText, whatsappSupportText }: { needAssistanceText: string; whatsappSupportText: string }) {
  return (
    <View style={styles.supportCard}>
      <View style={styles.supportLeft}>
        <View style={styles.supportIconCircle}>
          <Image source={require('../assets/whatsapp.png')} style={{width: 40, height: 40, }} />
        </View>
        <Pressable onPress={() => Linking.openURL('https://wa.me/918547771777')}>
          <Text style={styles.supportTopLabel}>{needAssistanceText}</Text>
          <Text style={styles.supportTitle}>{whatsappSupportText}</Text>
        </Pressable>
      </View>
      <Text style={styles.supportArrow}> &gt; </Text>
    </View>
  );
}

// ─── Main Screen ──────────────────────────────────────────────────────────────

export function DashboardScreen({ navigation }: Props) {
  const safeBottom = useSafeBottomInset();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DashboardResponse | null>(null);
  const [goldRatesRows, setGoldRatesRows] = useState<GoldRateItem[]>([]);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const { texts, setLanguage } = useLanguage();

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true);
      const token = await getToken();
      setIsLoggedIn(!!token);
      console.log('token', token);
      const result = await fetchDashboard(token ?? undefined);
      console.log('result', result);
      setData(result);

      // Fetch profile to get language preference
      if (token) {
        try {
          const profileResponse = await fetchProfile(token);
          if (profileResponse.success && profileResponse.data?.language_preference) {
            let appLang = 'en';
            const langPref = profileResponse.data.language_preference;
            if (typeof langPref === 'string') {
              appLang = langPref;
            } else if (langPref && typeof langPref === 'object') {
              appLang = (langPref as { app_language?: string }).app_language ?? 'en';
            }
            setLanguage(appLang === 'ta' || appLang === 'Tamil' ? 'ta' : 'en');
          }
        } catch {
          // Silent fail – default to English
        }
      }

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
  }, [setLanguage]);

  useEffect(() => {
    loadDashboard();
  }, [loadDashboard]);

  // ── Pull to refresh handler ────────────────────────────────────────────────
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      const token = await getToken();
      setIsLoggedIn(!!token);
      const result = await fetchDashboard(token ?? undefined);
      setData(result);

      if (token) {
        try {
          const profileResponse = await fetchProfile(token);
          if (profileResponse.success && profileResponse.data?.language_preference) {
            let appLang = 'en';
            const langPref = profileResponse.data.language_preference;
            if (typeof langPref === 'string') {
              appLang = langPref;
            } else if (langPref && typeof langPref === 'object') {
              appLang = (langPref as { app_language?: string }).app_language ?? 'en';
            }
            setLanguage(appLang === 'ta' || appLang === 'Tamil' ? 'ta' : 'en');
          }
        } catch {
          // Silent fail
        }
      }

      try {
        const gr = await fetchGoldRates();
        setGoldRatesRows(Array.isArray(gr.goldrates) ? gr.goldrates : []);
      } catch {
        setGoldRatesRows([]);
      }
    } catch {
      // Silent fail
    } finally {
      setRefreshing(false);
    }
  }, [setLanguage]);

  // ── Derived values ──────────────────────────────────────────────────────────
  const goldRate22k =
    saleRateForGoldPurity(goldRatesRows, 22) ?? data?.todays_goldrate?.sale_rate ?? '0';
  const asOnDate =
    firstGoldLastUpdated(goldRatesRows) ?? data?.todays_goldrate?.as_on_date ?? '';
  const totalInstalmentRaw = getDashboardTotalInstalment(data);
  
  // Gold holdings from totalmetal API response
  const totalMetalRaw = data?.totalmetal;
  const totalMetalNum = totalMetalRaw != null ? parseFloat(String(totalMetalRaw)) : NaN;
  const goldHoldingsText = isLoggedIn && Number.isFinite(totalMetalNum) ? `${totalMetalNum.toFixed(2)}g` : '—';
  
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
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#E88800']}
                tintColor="#E88800"
              />
            }
          >
            {/* Welcome / Header */}
            <WelcomeCard
              customerName={data?.customer?.name ?? ''}
              isLoggedIn={isLoggedIn}
              onNotificationsPress={() => navigation.navigate('Notifications')}
              welcomeBackText={texts.dashboard.welcomeBack}
              welcomeText={texts.dashboard.welcome}
              guestText={texts.dashboard.guest}
            />

            <View style={styles.mainSections}>
              <SectionHeader title={texts.dashboard.investmentLabel} />
              <InvestmentSummaryCards
                goldHoldingsText={goldHoldingsText}
                totalInvestmentText={totalInvestmentText}
                growthPercent={investmentGrowthPercent}
                goldHoldingsLabel={texts.dashboard.goldHoldings}
                gold22kLabel={texts.dashboard.gold22k}
                totalInvestmentLabel={texts.dashboard.totalInvestment}
              />

              {/* Join CTA */}
              <JoinSchemeButton onPress={() => navigation.navigate('SelectScheme')} joinNewSchemeText={texts.dashboard.joinNewScheme} />

              {/* My Enrolled Schemes – only for logged-in users */}
              {isLoggedIn && data?.myschemes && data.myschemes.length > 0 && (
                <>
                  <SectionHeader
                    title={texts.dashboard.myEnrolledSchemes}
                    action={texts.dashboard.viewAllPortfolio}
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
                todaysGoldRateText={texts.dashboard.todaysGoldRate}
                liveText={texts.dashboard.live}
                perGram22kText={texts.dashboard.perGram22k}
                viewAllMetalRatesText={texts.dashboard.viewAllMetalRates}
              />

              {/* Recommended Schemes */}
              {data?.schemetype && data.schemetype.length > 0 && (
                <>
                  <SectionHeader
                    title={texts.dashboard.recommendedForYou}
                    action={texts.dashboard.viewAll}
                    actionAccent
                    onActionPress={() => navigation.navigate('SelectScheme')}
                  />
                  <ScrollView
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    contentContainerStyle={styles.recommendedScrollContent}
                  >
                    {data.schemetype.map((st, index) => (
                      console.log(st),
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
                        mostPopularText={texts.dashboard.mostPopular}
                        fixedMonthlyText={st.scheme_category ?? texts.dashboard.fixedMonthly}
                        exploreDetailsText={texts.dashboard.exploreDetails}
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
                    title={texts.dashboard.recentTransactions}
                    action={texts.dashboard.history}
                    actionAccent
                    onActionPress={() => navigation.navigate('ActivityHistory')}
                  />
                  <View style={styles.transactionsCard}>
                    {data.paymenthistory.map((p, i) => (
                      <TransactionItem
                        key={i}
                        title={texts.dashboard.installmentPayment}
                        date={p.installment_date}
                        amount={p.installment_amount}
                        successText={texts.dashboard.success}
                      />
                    ))}
                  </View>
                </>
              )}

              <SupportCard 
                needAssistanceText={texts.dashboard.needAssistance}
                whatsappSupportText={texts.dashboard.whatsappSupport}
              />
            </View>
          </ScrollView>
        )}

        <BottomTabs navigation={navigation} activeTab="home" />
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
    paddingHorizontal: 18,
    paddingVertical: 20,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    marginTop: 24,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.06,
    shadowRadius: 16,
    elevation: 4,
  },
  profileBadge: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    // backgroundColor: '#FFF5E6',
    marginLeft: 2,
    // borderWidth: 1,
    borderColor: '#FFE8CC',
  },
  profileIcon: {
    fontSize: 16,
    color: '#E68900',
    fontFamily: 'Poppins-SemiBold',
  },
  welcomeTextWrap: {
    flex: 1,
    marginLeft: 14,
  },
  welcomeLabel: {
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 1.2,
    color: '#9AA3B2',
    textTransform: 'uppercase',
  },
  welcomeName: {
    marginTop: 2,
    fontSize: 17,
    fontFamily: 'Poppins-Bold',
    color: '#111827',
  },
  topActions: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  roundIcon: {
    width: 38,
    height: 38,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F7FA',
    borderWidth: 1,
    borderColor: '#E8EBEF',
  },
  roundIconText: {
    fontWeight: '700',
    color: '#687386',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 2,
  },
  sectionTitle: {
    fontSize: 11,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 1.4,
    color: '#96A0AE',
    textTransform: 'uppercase',
  },
  sectionAction: {
    fontSize: 11,
    color: '#8B94A3',
    fontFamily: 'Poppins-SemiBold',
  },
  sectionActionButton: {
    paddingVertical: 4,
    paddingHorizontal: 4,
  },
  accentText: {
    color: '#E88800',
    fontFamily: 'Poppins-Bold',
  },
  liveMarketCard: {
    backgroundColor: '#E88800',
    borderRadius: 20,
    paddingHorizontal: 18,
    paddingVertical: 20,
    shadowColor: '#C2410C',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 6,
  },
  liveMarketTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  liveMarketLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  liveMarketIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  liveMarketRateLabel: {
    fontSize: 11,
    fontFamily: 'Poppins-Bold',
    letterSpacing: 1.2,
    color: '#FFFFFF',
    textTransform: 'uppercase',
  },
  liveMarketLiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(0,0,0,0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
  },
  liveMarketDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#FF4444',
  },
  liveMarketLiveText: {
    fontSize: 10,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  liveMarketPrice: {
    fontSize: 34,
    fontFamily: 'Poppins-Black',
    color: '#FFFFFF',
    marginTop: 4,
  },
  liveMarketPerGram: {
    fontSize: 13,
    color: 'rgba(255,255,255,0.85)',
    marginTop: 2,
    fontFamily: 'Poppins-Medium',
  },
  liveMarketDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.25)',
    marginVertical: 16,
  },
  liveMarketFooterCta: {
    textAlign: 'center',
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    color: '#FFFFFF',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  investmentRow: {
    flexDirection: 'row',
    gap: 12,
  },
  investmentCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    minHeight: 140,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 3,
  },
  investmentIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  investmentIconCircleGold: {
    backgroundColor: '#FFF5E6',
    borderWidth: 1,
    borderColor: '#FFE8CC',
  },
  investmentIconCircleInr: {
    backgroundColor: '#E8F8F0',
    borderWidth: 1,
    borderColor: '#C8F0DC',
  },
  investmentRupeeIcon: {
    fontSize: 20,
    fontFamily: 'Poppins-Bold',
    color: '#27AE60',
  },
  investmentCardLabel: {
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 1.2,
    color: '#808080',
    marginBottom: 6,
    textTransform: 'uppercase',
  },
  investmentCardValue: {
    fontSize: 22,
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
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
  },
  investmentGrowthText: {
    fontSize: 12,
    fontFamily: 'Poppins-Bold',
    color: '#27AE60',
  },
  investmentGrowthPlaceholder: {
    minHeight: 24,
  },
  joinButton: {
    borderRadius: 16,
    backgroundColor: '#101720',
    minHeight: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 14,
    marginTop: 4,
    paddingHorizontal: 20,
    paddingVertical: 14,
    shadowColor: '#0B0F17',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 6,
  },
  plusBubble: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plusText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '700',
  },
  joinButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontFamily: 'Poppins-Black',
    letterSpacing: 1.8,
    flexShrink: 1,
    textAlign: 'center',
    textTransform: 'uppercase',
  },
  schemeItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#F0F0F0',
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  schemeBadge: {
    width: 48,
    height: 48,
    borderRadius: 14,
    backgroundColor: '#FFF5E6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFE8CC',
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
    marginTop: 4,
    fontSize: 10,
    letterSpacing: 0.8,
    color: '#98A2B3',
    fontFamily: 'Poppins-Medium',
    textTransform: 'uppercase',
  },
  schemeDueOverdue: {
    color: '#E05252',
  },
  schemeRight: {
    alignItems: 'flex-end',
  },
  schemeAmount: {
    fontSize: 15,
    fontFamily: 'Poppins-Black',
    color: '#111827',
  },
  activePill: {
    marginTop: 6,
    backgroundColor: '#E8FFF5',
    color: '#0F9E63',
    paddingVertical: 4,
    paddingHorizontal: 12,
    borderRadius: 20,
    fontSize: 9,
    fontFamily: 'Poppins-Bold',
    overflow: 'hidden',
    letterSpacing: 0.5,
  },
  overduePill: {
    backgroundColor: '#FFF0F0',
    color: '#E05252',
  },
  recommendedCard: {
    width: 260,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#F0F0F0',
    backgroundColor: '#FFFFFF',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 14,
    elevation: 4,
  },
  recommendedScrollContent: {
    paddingRight: 4,
    gap: 14,
  },
  recommendedTop: {
    minHeight: 140,
    padding: 18,
    justifyContent: 'flex-end',
    overflow: 'hidden',
  },
  recommendedBannerImage: {
    resizeMode: 'cover',
  },
  recommendedOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.35)',
  },
  popularTag: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    position: 'absolute',
    right: 14,
    top: 14,
    backgroundColor: '#F7A714',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  popularTagText: {
    fontSize: 9,
    fontFamily: 'Poppins-Black',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  recommendedTitle: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Poppins-BoldItalic',
    lineHeight: 22,
  },
  recommendedBody: {
    padding: 18,
  },
  recommendedRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  monthPill: {
    fontSize: 10,
    backgroundColor: '#FFF5E6',
    color: '#E38A00',
    fontFamily: 'Poppins-Bold',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    overflow: 'hidden',
  },
  fixedText: {
    fontSize: 10,
    color: '#98A2B3',
    fontFamily: 'Poppins-SemiBold',
    letterSpacing: 1,
    textTransform: 'uppercase',
  },
  pointText: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    fontSize: 12,
    color: '#3A4658',
    marginTop: 8,
    fontFamily: 'Poppins-Medium',
    lineHeight: 18,
  },
  exploreButton: {
    marginTop: 16,
    borderRadius: 14,
    backgroundColor: '#111D36',
    minHeight: 44,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  exploreButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Poppins-Black',
    fontSize: 11,
    letterSpacing: 1.6,
    textTransform: 'uppercase',
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
    borderColor: '#F0F0F0',
    borderRadius: 20,
    overflow: 'hidden',
    shadowColor: '#111827',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  transactionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 14,
  },
  currencyDot: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F5F7FA',
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
    marginTop: 3,
    color: '#94A3B8',
    fontSize: 11,
    fontFamily: 'Poppins-Medium',
  },
  transactionRight: {
    alignItems: 'flex-end',
  },
  transactionAmount: {
    color: '#131A28',
    fontFamily: 'Poppins-Black',
    fontSize: 15,
  },
  successText: {
    marginTop: 3,
    color: '#0F9E63',
    fontSize: 9,
    letterSpacing: 0.8,
    fontFamily: 'Poppins-Bold',
    textTransform: 'uppercase',
  },
  separator: {
    height: 1,
    backgroundColor: '#E5E7EB',
  },
  supportCard: {
    marginTop: 4,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#C8F0DC',
    backgroundColor: '#E8F8F0',
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    shadowColor: '#15803D',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.1,
    shadowRadius: 14,
    elevation: 3,
  },
  supportLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  supportIconCircle: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
  },
  supportIconText: {
    color: '#24A764',
    fontFamily: 'Poppins-SemiBold',
  },
  supportTopLabel: {
    color: '#0B6A57',
    letterSpacing: 1,
    fontSize: 10,
    fontFamily: 'Poppins-SemiBold',
    textTransform: 'uppercase',
  },
  supportTitle: {
    marginTop: 3,
    color: '#1F2937',
    fontSize: 15,
    fontFamily: 'Poppins-Bold',
  },
  supportArrow: {
    color: '#22A45E',
    fontSize: 24,
    fontFamily: 'Poppins-Bold',
  },
});
