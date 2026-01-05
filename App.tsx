import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { UserProvider } from './src/context/UserContext';
import { AuthProvider } from './src/context/AuthContext';
import './src/config/firebaseConfig'; // Import to ensure it initializes

import { BetaFeedbackButton } from './src/components/BetaFeedbackButton';

export default function App() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <UserProvider>
          <NavigationContainer>
            <RootNavigator />
            <BetaFeedbackButton />
            <StatusBar style="auto" />
          </NavigationContainer>
        </UserProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
