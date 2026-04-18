import React, { useEffect, useRef } from 'react';
import {
  Animated,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getToken } from '../storage/auth';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const DOT_COLOR = '#F5A623';
const DOT_SIZE = 10;

export function SplashScreen({ navigation }: Props) {
  // --- Logo animations ---
  const logoOpacity = useRef(new Animated.Value(0)).current;
  const logoScale   = useRef(new Animated.Value(0.75)).current;

  // --- Text animation ---
  const textOpacity    = useRef(new Animated.Value(0)).current;
  const textTranslateY = useRef(new Animated.Value(10)).current;

  // --- Dot animations ---
  const dot1Y = useRef(new Animated.Value(0)).current;
  const dot2Y = useRef(new Animated.Value(0)).current;
  const dot3Y = useRef(new Animated.Value(0)).current;

  const bounceDot = (dotAnim: Animated.Value, delay: number) =>
    Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(dotAnim, {
          toValue: -10,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.timing(dotAnim, {
          toValue: 0,
          duration: 320,
          useNativeDriver: true,
        }),
        Animated.delay(320), // pause before next loop cycle
      ]),
    );

  useEffect(() => {
    // 1. Logo entrance
    Animated.parallel([
      Animated.timing(logoOpacity, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.spring(logoScale, {
        toValue: 1,
        friction: 6,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    // 2. Text entrance (delayed)
    Animated.parallel([
      Animated.timing(textOpacity, {
        toValue: 1,
        duration: 500,
        delay: 500,
        useNativeDriver: true,
      }),
      Animated.timing(textTranslateY, {
        toValue: 0,
        duration: 500,
        delay: 500,
        useNativeDriver: true,
      }),
    ]).start();

    // 3. Staggered bouncing dots (start after content is visible)
    const dotAnimations = [
      bounceDot(dot1Y, 0),
      bounceDot(dot2Y, 180),
      bounceDot(dot3Y, 360),
    ];
    const dotTimeout = setTimeout(() => {
      dotAnimations.forEach(a => a.start());
    }, 900);

    // 4. Navigate after dots have played — go to Dashboard if already logged in
    const navTimeout = setTimeout(async () => {
      dotAnimations.forEach(a => a.stop());
      const token = await getToken();
      navigation.replace(token ? 'Dashboard' : 'Login');
    }, 3200);

    return () => {
      clearTimeout(dotTimeout);
      clearTimeout(navTimeout);
      dotAnimations.forEach(a => a.stop());
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" translucent={false} />

      {/* Centre content */}
      <View style={styles.centerContent}>
        <Animated.View style={{ opacity: logoOpacity, transform: [{ scale: logoScale }] }}>
          <Image
            source={require('../assets/splashScreenlogo.png')}
            style={styles.logo}
            resizeMode="contain"
          />
        </Animated.View>

        <Animated.Text
          style={[
            styles.tagline,
            { opacity: textOpacity, transform: [{ translateY: textTranslateY }] },
          ]}>
          GOLD SAVINGS SCHEMES
        </Animated.Text>
      </View>

      {/* Bouncing dots */}
      <View style={styles.dotsRow}>
        {([dot1Y, dot2Y, dot3Y] as Animated.Value[]).map((anim, i) => (
          <Animated.View
            key={i}
            style={[styles.dot, { transform: [{ translateY: anim }] }]}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  centerContent: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  logo: {
    width: 180,
    height: 180,
  },
  tagline: {
    marginTop: -10,
    fontSize: 13,
    color: '#1A1A1A',
    letterSpacing: 2.5,
    fontFamily: 'Jost-Bold',
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 60,
    gap: 10,
  },
  dot: {
    width: DOT_SIZE,
    height: DOT_SIZE,
    borderRadius: DOT_SIZE / 2,
    backgroundColor: DOT_COLOR,
  },
});
