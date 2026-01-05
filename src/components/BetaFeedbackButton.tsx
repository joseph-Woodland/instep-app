import React, { useState } from 'react';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';
import { FeedbackModal } from './FeedbackModal';
import { useAuth } from '../context/AuthContext';

export const BetaFeedbackButton = () => {
    const [visible, setVisible] = useState(false);
    const { user } = useAuth();

    // Only show if logged in
    if (!user) return null;

    return (
        <>
            <TouchableOpacity
                style={styles.fab}
                onPress={() => setVisible(true)}
                activeOpacity={0.8}
            >
                <Ionicons name="chatbubble-ellipses" size={24} color="white" />
            </TouchableOpacity>

            <FeedbackModal visible={visible} onClose={() => setVisible(false)} />
        </>
    );
};

const styles = StyleSheet.create({
    fab: {
        position: 'absolute',
        bottom: 100, // Above tab bar if present
        right: 20,
        backgroundColor: colors.primary,
        width: 56,
        height: 56,
        borderRadius: 28,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 4.65,
        elevation: 8,
        zIndex: 9999, // Ensure it's on top
    }
});
