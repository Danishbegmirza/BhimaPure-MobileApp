import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { Alert, BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/navigationRef';
import { NetworkProvider, useNetwork } from './src/context/NetworkContext';
import { LanguageProvider } from './src/context/LanguageContext';
import { NoInternetScreen } from './src/components/NoInternetScreen';
import {
  requestNotificationPermission,
  getFCMToken,
  onForegroundMessage,
  onNotificationOpenedApp,
  getInitialNotification,
  subscribeToTopic,
} from './src/services/notifications';
import {
  handleNotificationAction,
  setPendingNotification,
  processPendingNotification,
} from './src/services/notificationHandler';

function AppContent() {
  const { isConnected, isInternetReachable } = useNetwork();

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      if (!navigationRef.isReady()) { return false; }

      const currentRoute = navigationRef.getCurrentRoute()?.name;

      // Allow exiting app only from Dashboard.
      if (currentRoute === 'Dashboard') { return false; }

      if (navigationRef.canGoBack()) {
        navigationRef.goBack();
      } else {
        navigationRef.navigate('Dashboard');
      }
      return true;
    });

    return () => sub.remove();
  }, []);

  useEffect(() => {
    async function initializeNotifications() {
      const hasPermission = await requestNotificationPermission();
      if (hasPermission) {
        const token = await getFCMToken();
        if (token) {
          console.log('FCM Token:', token);
          // TODO: Send this token to your backend server
        }
        await subscribeToTopic('all_users');
      }
    }

    initializeNotifications();

    // Handle foreground notifications - show alert and allow tap to navigate
    const unsubscribeForeground = onForegroundMessage(remoteMessage => {
      console.log('Foreground notification:', remoteMessage);
      const title = remoteMessage.notification?.title || 'Notification';
      const body = remoteMessage.notification?.body || '';
      
      Alert.alert(
        title,
        body,
        [
          { text: 'Dismiss', style: 'cancel' },
          {
            text: 'View',
            onPress: () => handleNotificationAction(remoteMessage, false),
          },
        ],
        { cancelable: true }
      );
    });

    // Handle notification tap when app is in background
    const unsubscribeOpenedApp = onNotificationOpenedApp(remoteMessage => {
      console.log('Notification opened app from background:', remoteMessage);
      handleNotificationAction(remoteMessage, false);
    });

    // Handle notification tap when app was in quit state
    getInitialNotification().then(remoteMessage => {
      if (remoteMessage) {
        console.log('App opened from quit state by notification:', remoteMessage);
        // Store the notification to process after navigation is ready
        setPendingNotification(remoteMessage);
      }
    });

    return () => {
      unsubscribeForeground();
      unsubscribeOpenedApp();
    };
  }, []);

  const hasNoInternet = !isConnected || isInternetReachable === false;

  if (hasNoInternet) {
    return <NoInternetScreen />;
  }

  // Process pending notification when navigation becomes ready
  const onNavigationReady = () => {
    // Small delay to ensure screens are mounted
    setTimeout(() => {
      processPendingNotification();
    }, 500);
  };

  return (
    <NavigationContainer ref={navigationRef} onReady={onNavigationReady}>
      <AppNavigator />
    </NavigationContainer>
  );
}

function App() {
  return (
    <SafeAreaProvider>
      <NetworkProvider>
        <LanguageProvider>
          <AppContent />
        </LanguageProvider>
      </NetworkProvider>
    </SafeAreaProvider>
  );
}

export default App;
