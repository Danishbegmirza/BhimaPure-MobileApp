import React, { useEffect } from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { BackHandler } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppNavigator } from './src/navigation/AppNavigator';
import { navigationRef } from './src/navigation/navigationRef';

function App() {
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

  return (
    <SafeAreaProvider>
      <NavigationContainer ref={navigationRef}>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

export default App;
