import React, { useEffect, useRef, useState } from 'react';
import {
  Animated,
  Image,
  Linking,
  Modal,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { getToken } from '../storage/auth';
import { checkAppVersion } from '../api/versionCheck';
import DeviceInfo from 'react-native-device-info';

type Props = NativeStackScreenProps<RootStackParamList, 'Splash'>;

const DOT_COLOR = '#F5A623';
const DOT_SIZE = 10;

export function SplashScreen({ navigation }: Props) {
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [updateMessage, setUpdateMessage] = useState('');
  const [playStoreUrl, setPlayStoreUrl] = useState('');
  const [currentVersion, setCurrentVersion] = useState('');

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
        Animated.delay(320),
      ]),
    );

  const handleUpdatePress = () => {
    if (playStoreUrl) {
      Linking.openURL(playStoreUrl);
    }
  };

  const checkForUpdate = async (): Promise<boolean> => {
    try {
      const appVersion = DeviceInfo.getVersion();
      console.log('appVersion', appVersion);
      setCurrentVersion(appVersion);

      const versionData = await checkAppVersion();
      console.log('versionData', versionData);

      // If version check fails, proceed without blocking
      if (!versionData) {
        console.log('Version check unavailable, proceeding anyway');
        return true;
      }

      // Check if update is needed
      if (versionData.needs_update) {
        setUpdateMessage(
          `A new version (${versionData.latest_version}) is available. Please update to continue using the app.`,
        );
        setPlayStoreUrl(versionData.store_url || '');
        setShowUpdateModal(true);
        return false;
      }
      return true;
    } catch (error) {
      console.log('Version check failed, proceeding anyway:', error);
      return true;
    }
  };

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

    // 4. Navigate based on token (update check disabled for now)
    const navTimeout = setTimeout(async () => {
      dotAnimations.forEach(a => a.stop());

      const canProceed = await checkForUpdate();
      console.log('canProceed', canProceed);
      if(canProceed){ 
      const token = await getToken();
        navigation.replace(token ? 'Dashboard' : 'Login');
      }
    }, 900);

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

      {/* Force Update Modal */}
      <Modal
        visible={showUpdateModal}
        transparent
        animationType="fade"
        statusBarTranslucent
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalIconContainer}>
              <Text style={styles.modalIcon}>↑</Text>
            </View>
            <Text style={styles.modalTitle}>Update Required</Text>
            <Text style={styles.modalMessage}>{updateMessage}</Text>
            <Text style={styles.modalVersion}>
              Current: v{currentVersion}
            </Text>
            <TouchableOpacity
              style={styles.updateButton}
              onPress={handleUpdatePress}
              activeOpacity={0.8}
            >
              <Text style={styles.updateButtonText}>Update Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    alignItems: 'center',
    width: '100%',
    maxWidth: 340,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  modalIconContainer: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FFF5E6',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  modalIcon: {
    fontSize: 28,
    color: DOT_COLOR,
    fontWeight: 'bold',
  },
  modalTitle: {
    fontSize: 22,
    fontFamily: 'Jost-Bold',
    color: '#1A1A1A',
    marginBottom: 12,
    textAlign: 'center',
  },
  modalMessage: {
    fontSize: 15,
    color: '#666666',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 16,
    fontFamily: 'Jost-Regular',
  },
  modalVersion: {
    fontSize: 13,
    color: '#999999',
    marginBottom: 24,
    fontFamily: 'Jost-Regular',
  },
  updateButton: {
    backgroundColor: DOT_COLOR,
    paddingVertical: 14,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontFamily: 'Jost-SemiBold',
    textAlign: 'center',
  },
});
