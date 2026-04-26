/**
 * SharkRank — App Entry Point
 * 4 tabs: Dashboard, Tracker (central), Ranking, Config.
 * Feature flags carregadas no startup.
 */

import React, { useEffect, useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, View, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { DashboardScreen } from './src/screens/DashboardScreen';
import { TrackerScreen } from './src/screens/TrackerScreen';
import { RankingScreen } from './src/screens/RankingScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { COLORS } from './src/theme';
import { loadFlags } from './src/services/flags';
import { processSyncQueue } from './src/services/sync';

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
      <Text style={{ fontSize: 24 }}>⚡</Text>
    </View>
  );
}

export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        await loadFlags();
        // Não damos await no sync para não travar a abertura do app
        processSyncQueue().catch(e => console.error("Sync error:", e));
      } catch (e) {
        console.error("Bootstrap error:", e);
      } finally {
        setReady(true);
      }
    }
    bootstrap();
  }, []);

  if (!ready) {
    return (
      <View style={styles.splash}>
        <Text style={{ fontSize: 64 }}>🦈</Text>
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={SharkTheme}>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={{
            headerShown: false,
            tabBarStyle: {
              backgroundColor: COLORS.bgCard,
              borderTopWidth: 0,
              position: 'absolute',
              bottom: 25,
              left: 20,
              right: 20,
              height: 70,
              borderRadius: 24,
              paddingBottom: 12,
              paddingTop: 10,
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 15,
              borderWidth: 1,
              borderColor: COLORS.border,
            },
            tabBarActiveTintColor: COLORS.accent,
            tabBarInactiveTintColor: COLORS.textMuted,
            tabBarLabelStyle: { fontSize: 10, fontWeight: '700', marginBottom: -5 },
          }}
        >
          <Tab.Screen
            name="Dashboard"
            component={DashboardScreen}
            options={{
              tabBarLabel: 'Home',
              tabBarIcon: ({ focused }) => <TabIcon emoji="🏠" focused={focused} />,
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
              tabBarIcon: ({ focused }) => <TabIcon emoji="🏆" focused={focused} />,
            }}
          />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarLabel: 'Config',
              tabBarIcon: ({ focused }) => <TabIcon emoji="⚙️" focused={focused} />,
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  centerBtn: {
    width: 60, height: 60, borderRadius: 30,
    backgroundColor: COLORS.accent, justifyContent: 'center',
    alignItems: 'center', marginBottom: 35,
    shadowColor: COLORS.accent, shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.6, shadowRadius: 15, elevation: 12,
    borderWidth: 4, borderColor: COLORS.bgPrimary,
  },
  centerBtnActive: { backgroundColor: COLORS.accentOrange, shadowColor: COLORS.accentOrange },
  splash: {
    flex: 1, backgroundColor: COLORS.bgPrimary,
    justifyContent: 'center', alignItems: 'center',
  },
});
