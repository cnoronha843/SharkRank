/**
 * SharkRank â€” App Entry Point
 * 4 tabs: Dashboard, Tracker (central), Ranking, Config.
 * Feature flags carregadas no startup.
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';

import { DashboardScreen } from './src/screens/DashboardScreen';
import { TrackerScreen } from './src/screens/TrackerScreen';
import { RankingScreen } from './src/screens/RankingScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { COLORS } from './src/theme';
import { loadFlags } from './src/services/flags';
import { processSyncQueue } from './src/services/api';

const Tab = createBottomTabNavigator();

const SharkTheme = {
  ...DefaultTheme,
  dark: true,
  colors: {
    ...DefaultTheme.colors,
    primary: COLORS.accent,
    background: COLORS.bgPrimary,
    card: COLORS.bgPrimary,
    text: COLORS.textPrimary,
    border: COLORS.border,
    notification: COLORS.accent,
  },
};

function TabIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: focused ? 26 : 22, opacity: focused ? 1 : 0.5 }}>
      {emoji}
    </Text>
  );
}

function CenterTabIcon({ focused }: { focused: boolean }) {
  return (
    <View style={[styles.centerBtn, focused && styles.centerBtnActive]}>
      <Text style={{ fontSize: 24 }}>âš¡</Text>
    </View>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      await loadFlags();
      // NÃ£o damos await no sync para nÃ£o travar a abertura do app
      processSyncQueue().catch(e => console.error("Sync error:", e));
      setReady(true);
    }
    bootstrap();
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <Text style={{ fontSize: 64 }}>ðŸ¦ˆ</Text>
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <NavigationContainer theme={SharkTheme}>
      <StatusBar style="light" />
      <Tab.Navigator
        screenOptions={{
          headerShown: false,
          tabBarStyle: {
            backgroundColor: 'rgba(6, 11, 24, 0.95)',
            borderTopColor: COLORS.border,
            borderTopWidth: 1,
            height: 70,
            paddingBottom: 10,
            paddingTop: 8,
          },
          tabBarActiveTintColor: COLORS.accent,
          tabBarInactiveTintColor: COLORS.textMuted,
          tabBarLabelStyle: { fontSize: 10, fontWeight: '500' },
        }}
      >
        <Tab.Screen
          name="Dashboard"
          component={DashboardScreen}
          options={{
            tabBarLabel: 'Home',
            tabBarIcon: ({ focused }) => <TabIcon emoji="ðŸ " focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Tracker"
          component={TrackerScreen}
          options={{
            tabBarLabel: '',
            tabBarIcon: ({ focused }) => <CenterTabIcon focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Ranking"
          component={RankingScreen}
          options={{
            tabBarLabel: 'Ranking',
            tabBarIcon: ({ focused }) => <TabIcon emoji="ðŸ†" focused={focused} />,
          }}
        />
        <Tab.Screen
          name="Settings"
          component={SettingsScreen}
          options={{
            tabBarLabel: 'Config',
            tabBarIcon: ({ focused }) => <TabIcon emoji="âš™ï¸" focused={focused} />,
          }}
        />
      </Tab.Navigator>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  centerBtn: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: COLORS.bgTertiary, justifyContent: 'center',
    alignItems: 'center', marginBottom: 20,
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 10, elevation: 8,
  },
  centerBtnActive: { backgroundColor: COLORS.accentBlue },
  splash: {
    flex: 1, backgroundColor: COLORS.bgPrimary,
    justifyContent: 'center', alignItems: 'center',
  },
});

