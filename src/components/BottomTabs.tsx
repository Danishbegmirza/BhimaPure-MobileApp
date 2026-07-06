import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from 'react-native-vector-icons/Ionicons';
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation/types';
import { useSafeBottomInset } from '../utils/safeBottomInset';

type BottomTabItemProps = {
  label: string;
  icon: string;
  active?: boolean;
  onPress?: () => void;
};

function BottomTabItem({ label, icon, active, onPress }: BottomTabItemProps) {
  const content = (
    <View style={[styles.bottomTabItemInner, active && styles.bottomTabItemActive]}>
      <View style={[styles.iconWrap, active && styles.iconWrapActive]}>
        <Ionicons
          name={active ? icon.replace('-outline', '') : icon}
          size={22}
          color={active ? '#E88800' : '#9AA3B2'}
        />
      </View>
      <Text
        numberOfLines={1}
        adjustsFontSizeToFit
        minimumFontScale={0.8}
        style={[styles.bottomTabLabel, active && styles.bottomTabLabelActive]}
      >
        {label}
      </Text>
    </View>
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

export type ActiveTab = 'home' | 'joinNew' | 'mySchemes' | 'activity' | 'account';

type BottomTabsProps = {
  navigation: NativeStackNavigationProp<RootStackParamList, keyof RootStackParamList>;
  activeTab?: ActiveTab;
};

export function BottomTabs({ navigation, activeTab = 'home' }: BottomTabsProps) {
  const safeBottom = useSafeBottomInset();
  const footerInset = Math.max(safeBottom, 6);

  return (
    <View style={[styles.bottomTabsWrap, { paddingBottom: footerInset }]}>
      <View style={styles.bottomTabs}>
        <BottomTabItem
          label="Home"
          icon="home-outline"
          active={activeTab === 'home'}
          onPress={() => navigation.navigate('Dashboard')}
        />
        <BottomTabItem
          label="Join New"
          icon="add-outline"
          active={activeTab === 'joinNew'}
          onPress={() => navigation.navigate('SelectScheme')}
        />
        <BottomTabItem
          label=" My Schemes"
          icon="pie-chart-outline"
          active={activeTab === 'mySchemes'}
          onPress={() => navigation.navigate('MySchemes')}
        />
        <BottomTabItem
          label="Activity"
          icon="time-outline"
          active={activeTab === 'activity'}
          onPress={() => navigation.navigate('ActivityHistory')}
        />
        <BottomTabItem
          label="Account"
          icon="person-outline"
          active={activeTab === 'account'}
          onPress={() => navigation.navigate('Profile')}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bottomTabsWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderColor: '#F0F0F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 12,
    zIndex: 20,
  },
  bottomTabs: {
    minHeight: 70,
    paddingHorizontal: 8,
    paddingTop: 8,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-around',
  },
  bottomTabItem: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'flex-start',
  },
  bottomTabItemInner: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 6,
    borderRadius: 16,
    minWidth: 56,
  },
  bottomTabItemActive: {
    backgroundColor: '#FFF7ED',
  },
  iconWrap: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconWrapActive: {
    transform: [{ scale: 1.05 }],
  },
  bottomTabLabel: {
    fontSize: 9,
    lineHeight: 12,
    marginTop: 3,
    color: '#9AA3B2',
    fontFamily: 'Poppins-Medium',
    textAlign: 'center',
  },
  bottomTabLabelActive: {
    color: '#E88800',
    fontFamily: 'Poppins-SemiBold',
  },
});
