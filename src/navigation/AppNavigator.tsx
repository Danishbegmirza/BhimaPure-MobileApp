import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { CompleteProfileScreen } from '../screens/CompleteProfileScreen';
import { DashboardScreen } from '../screens/DashboardScreen';
import { MetalRatesScreen } from '../screens/MetalRatesScreen';
import { CreateAccountScreen } from '../screens/CreateAccountScreen';
import { LoginScreen } from '../screens/LoginScreen';
import { SplashScreen } from '../screens/SplashScreen';
import { VerifyOtpScreen } from '../screens/VerifyOtpScreen';
import { SelectSchemeScreen } from '../screens/SelectSchemeScreen';
import { SchemeDetailsScreen } from '../screens/SchemeDetailsScreen';
import { JoinSchemeScreen } from '../screens/JoinSchemeScreen';
import { MySchemesScreen } from '../screens/MySchemesScreen';
import { MySchemeDetailsScreen } from '../screens/MySchemeDetailsScreen';
import { GoldRedemptionScreen } from '../screens/GoldRedemptionScreen';
import { SelectShowroomScreen } from '../screens/SelectShowroomScreen';
import { RedemptionSuccessScreen } from '../screens/RedemptionSuccessScreen';
import { PaymentMethodScreen } from '../screens/PaymentMethodScreen';
import { PaymentSuccessScreen } from '../screens/PaymentSuccessScreen';
import { ShopOnlineSuccessScreen } from '../screens/ShopOnlineSuccessScreen';
import { NotificationsScreen } from '../screens/NotificationsScreen';
import { ActivityHistoryScreen } from '../screens/ActivityHistoryScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { EditProfileScreen } from '../screens/EditProfileScreen';
import type { RootStackParamList } from './types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export function AppNavigator() {
  return (
    <Stack.Navigator
      initialRouteName="Splash"
      screenOptions={{ headerShown: false }}
    >
      <Stack.Screen name="Splash" component={SplashScreen} />
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="CreateAccount" component={CreateAccountScreen} />
      <Stack.Screen name="CompleteProfile" component={CompleteProfileScreen} />
      <Stack.Screen name="VerifyOtp" component={VerifyOtpScreen} />
      <Stack.Screen name="Dashboard" component={DashboardScreen} />
      <Stack.Screen name="MetalRates" component={MetalRatesScreen} />
      <Stack.Screen name="MySchemes" component={MySchemesScreen} />
      <Stack.Screen name="MySchemeDetails" component={MySchemeDetailsScreen} />
      <Stack.Screen name="GoldRedemption" component={GoldRedemptionScreen} />
      <Stack.Screen name="SelectShowroom" component={SelectShowroomScreen} />
      <Stack.Screen name="RedemptionSuccess" component={RedemptionSuccessScreen} />
      <Stack.Screen name="ShopOnlineSuccess" component={ShopOnlineSuccessScreen} />
      <Stack.Screen name="PaymentMethod" component={PaymentMethodScreen} />
      <Stack.Screen name="PaymentSuccess" component={PaymentSuccessScreen} />
      <Stack.Screen name="Notifications" component={NotificationsScreen} />
      <Stack.Screen name="ActivityHistory" component={ActivityHistoryScreen} />
      <Stack.Screen name="Profile" component={ProfileScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="SelectScheme" component={SelectSchemeScreen} />
      <Stack.Screen name="SchemeDetails" component={SchemeDetailsScreen} />
      <Stack.Screen name="JoinScheme" component={JoinSchemeScreen} />
    </Stack.Navigator>
  );
}
