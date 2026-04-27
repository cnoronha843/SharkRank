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
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur'; // Glassmorphism
import { LinearGradient } from 'expo-linear-gradient'; // Para o botão central

import { DashboardScreen } from './src/screens/DashboardScreen';
import { TrackerScreen } from './src/screens/TrackerScreen';
import { RankingScreen } from './src/screens/RankingScreen';
import { SettingsScreen } from './src/screens/SettingsScreen';
import { SharkVisionScreen } from './src/screens/SharkVisionScreen'; // NOVO
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
    card: 'transparent', // Para funcionar com BlurView
    text: COLORS.textPrimary,
    border: 'transparent',
    notification: COLORS.accent,
  },
};


export default function App() {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    async function bootstrap() {
      try {
        await loadFlags();
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
        <Ionicons name="water" size={80} color={COLORS.accent} />
        <ActivityIndicator color={COLORS.accent} style={{ marginTop: 20 }} />
      </View>
    );
  }

  return (
    <SafeAreaProvider>
      <NavigationContainer theme={SharkTheme}>
        <StatusBar style="light" />
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerShown: false,
            tabBarBackground: () => (
              <View style={[StyleSheet.absoluteFill, { borderRadius: 24, overflow: 'hidden' }]}>
                <BlurView tint="dark" intensity={80} style={StyleSheet.absoluteFill} />
              </View>
            ),
            tabBarStyle: {
              position: 'absolute',
              bottom: 25,
              left: 20,
              right: 20,
              height: 70,
              borderRadius: 24,
              paddingBottom: 0,
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.1)',
              shadowColor: '#000',
              shadowOffset: { width: 0, height: 10 },
              shadowOpacity: 0.5,
              shadowRadius: 20,
              elevation: 15,
            },
            tabBarShowLabel: false, // Label escondido para visual minimalista
            tabBarActiveTintColor: COLORS.accent,
            tabBarInactiveTintColor: COLORS.textMuted,
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: any = 'home';
              
              if (route.name === 'Dashboard') iconName = focused ? 'home' : 'home-outline';
              else if (route.name === 'Ranking') iconName = focused ? 'trophy' : 'trophy-outline';
              else if (route.name === 'Tracker') iconName = focused ? 'flash' : 'flash-outline';
              else if (route.name === 'SharkVision') iconName = focused ? 'play-circle' : 'play-circle-outline';
              else if (route.name === 'Settings') iconName = focused ? 'person' : 'person-outline';

              return <Ionicons name={iconName} size={28} color={color} />;
            },
          })}
        >
          <Tab.Screen name="Dashboard" component={DashboardScreen} />
          <Tab.Screen name="Ranking" component={RankingScreen} />
          <Tab.Screen name="Tracker" component={TrackerScreen} />
          <Tab.Screen name="SharkVision" component={SharkVisionScreen} />
          <Tab.Screen name="Settings" component={SettingsScreen} />
        </Tab.Navigator>
      </NavigationContainer>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  splash: {
    flex: 1,
    backgroundColor: COLORS.bgPrimary,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
