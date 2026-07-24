import React, { useEffect } from 'react';
import type { NativeStackScreenProps } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';

type Props = NativeStackScreenProps<RootStackParamList, 'MySchemeDetails'>;

/** Redirects to MySchemes and opens the scheme details popup. */
export function MySchemeDetailsScreen({ navigation, route }: Props) {
  useEffect(() => {
    navigation.replace('MySchemes', { openSchemeId: route.params.schemeId });
  }, [navigation, route.params.schemeId]);

  return null;
}
