import type { NavigationProp, ParamListBase } from '@react-navigation/native';

export function goBackOrDashboard(
  navigation: NavigationProp<ParamListBase>,
) {
  if (navigation.canGoBack()) {
    navigation.goBack();
    return;
  }
  navigation.navigate('Dashboard');
}

