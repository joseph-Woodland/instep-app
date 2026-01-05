import * as Updates from 'expo-updates';
import { Alert, Platform } from 'react-native';

export const UpdateService = {
    checkForUpdates: async () => {
        if (__DEV__ || Platform.OS === 'web') return;

        try {
            const update = await Updates.checkForUpdateAsync();
            if (update.isAvailable) {
                Alert.alert(
                    "Update Available",
                    "A new version of InStep is ready. Would you like to update now?",
                    [
                        { text: "Later", style: "cancel" },
                        {
                            text: "Update Now",
                            onPress: async () => {
                                await Updates.fetchUpdateAsync();
                                await Updates.reloadAsync();
                            }
                        }
                    ]
                );
            }
        } catch (e) {
            // Log error but don't disrupt user
            console.warn("Error checking for updates:", e);
        }
    }
};
