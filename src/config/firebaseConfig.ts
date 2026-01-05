import { initializeApp, getApp, getApps } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { initializeAuth, browserLocalPersistence } from 'firebase/auth';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Platform } from 'react-native';

// TODO: Replace with real config later
// Use environment variables or paste keys here for testing
const firebaseConfig = {
    apiKey: "AIzaSyCYNUNo8Mi-yGbAZOJyhs46UzUZOtaIfOA",
    authDomain: "instep-579cd.firebaseapp.com",
    projectId: "instep-579cd",
    storageBucket: "instep-579cd.firebasestorage.app",
    messagingSenderId: "415378932160",
    appId: "1:415378932160:web:0544555ceca3c688a64825"
};

// Initialize App (Singleton pattern)
export const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApp();
export const db = getFirestore(app);

// Initialize Auth with persistence
const getPersistence = () => {
    if (Platform.OS === 'web') return browserLocalPersistence;
    // getReactNativePersistence is not in standard web types, use require for better RN/Metro support
    const { getReactNativePersistence } = require('firebase/auth');
    return getReactNativePersistence(AsyncStorage);
};

export const auth = initializeAuth(app, { persistence: getPersistence() });
