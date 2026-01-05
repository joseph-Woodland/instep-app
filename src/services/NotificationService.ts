import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Keys
const NOTIF_CONFIG_KEY = 'TOGETHER_NOTIF_CONFIG';

export interface NotificationConfig {
    enabled: boolean;
    reminderTime: string; // "HH:mm" 24h format
    lastPromptedAt: number;
}

// Config Handler for Notifications
Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true
    }),
});

export const NotificationService = {
    // 1. Get/Set Config
    getConfig: async (): Promise<NotificationConfig | null> => {
        try {
            const json = await AsyncStorage.getItem(NOTIF_CONFIG_KEY);
            return json ? JSON.parse(json) : null;
        } catch (e) {
            console.error("Error reading notif config", e);
            return null;
        }
    },

    saveConfig: async (config: NotificationConfig) => {
        try {
            await AsyncStorage.setItem(NOTIF_CONFIG_KEY, JSON.stringify(config));
        } catch (e) {
            console.error("Error saving notif config", e);
        }
    },

    // 2. Schedule Daily Reminder
    scheduleDailyReminder: async (timeString: string = "19:00") => {
        try {
            // Cancel existing first to avoid dupes/overlaps
            await Notifications.cancelAllScheduledNotificationsAsync();

            const [hourStr, minuteStr] = timeString.split(':');
            const hour = parseInt(hourStr, 10);
            const minute = parseInt(minuteStr, 10);

            await Notifications.scheduleNotificationAsync({
                content: {
                    title: "Quick check-in?",
                    body: "How did today go? Your group is here with you. Take a step.",
                    sound: true,
                },
                trigger: {
                    hour,
                    minute,
                    repeats: true,
                } as any,
            });

            console.log(`Scheduled daily reminder at ${hour}:${minute}`);
        } catch (e) {
            console.error("Error scheduling reminder", e);
        }
    },

    cancelAllReminders: async () => {
        try {
            await Notifications.cancelAllScheduledNotificationsAsync();
            console.log("Cancelled all reminders");
        } catch (e) {
            console.error("Error cancelling reminders", e);
        }
    },

    // 3. Register for Push (Permission + Token)
    // Returns true if permission granted
    requestPermissionsAsync: async (): Promise<boolean> => {
        if (Platform.OS === 'web') return false; // Early return for web

        if (Platform.OS === 'android') {
            await Notifications.setNotificationChannelAsync('default', {
                name: 'default',
                importance: Notifications.AndroidImportance.MAX,
                vibrationPattern: [0, 250, 250, 250],
                lightColor: '#FF231F7C',
            });
        }

        if (!Device.isDevice) {
            // Simulator: Permission flow might still work for local notifications on iOS, 
            // but push tokens won't generate.
            console.log('Running on simulator - push tokens may not be available.');
        }

        const { status: existingStatus } = await Notifications.getPermissionsAsync();
        let finalStatus = existingStatus;
        if (existingStatus !== 'granted') {
            const { status } = await Notifications.requestPermissionsAsync();
            finalStatus = status;
        }

        if (finalStatus !== 'granted') {
            console.log('Notification permission not granted');
            return false;
        }

        return true;
    },

    getPushToken: async (): Promise<string | null> => {
        try {
            if (Platform.OS === 'web') return null;
            if (!Device.isDevice) return null;

            // Allow passing projectId if available in ENV, otherwise try default
            // If it fails due to missing ID, we catch it gracefully
            const tokenData = await Notifications.getExpoPushTokenAsync({
                projectId: 'b5aedc82-cdfb-45d3-8f9b-538782447451' // Hardcoding the old ID for now to allow token gen
            }).catch(err => {
                // Fallback or ignore
                console.warn("Push Token Warning: ", err?.message);
                return null;
            });

            return tokenData ? tokenData.data : null;
        } catch (e) {
            console.error("Error getting push token", e);
            return null;
        }
    }
};
