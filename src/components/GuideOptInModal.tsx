import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';
import { PrimaryButton } from './PrimaryButton';

interface GuideOptInModalProps {
    visible: boolean;
    onAccept: () => void;
    onDecline: () => void;
}

export const GuideOptInModal: React.FC<GuideOptInModalProps> = ({
    visible,
    onAccept,
    onDecline,
}) => {
    return (
        <Modal
            visible={visible}
            transparent
            animationType="fade"
            onRequestClose={onDecline}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    <Text style={styles.emoji}>🌟</Text>
                    <Text style={styles.title}>Want to help others?</Text>
                    <Text style={styles.description}>
                        You've already done this. Would you like to stay in the group and support others as a guide?
                    </Text>

                    <View style={styles.infoBox}>
                        <Text style={styles.infoText}>
                            As a guide, you can share tips and show others it's possible. No pressure, just encouragement.
                        </Text>
                    </View>

                    <View style={styles.buttonContainer}>
                        <PrimaryButton
                            title="Yes, be a guide"
                            onPress={onAccept}
                            style={styles.acceptButton}
                        />
                        <TouchableOpacity onPress={onDecline} style={styles.declineButton}>
                            <Text style={styles.declineText}>No thanks</Text>
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'center',
        alignItems: 'center',
        padding: 24,
    },
    modal: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 24,
        width: '100%',
        maxWidth: 400,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 5,
    },
    emoji: {
        fontSize: 48,
        textAlign: 'center',
        marginBottom: 16,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 12,
    },
    description: {
        fontSize: 16,
        color: colors.textLight,
        textAlign: 'center',
        marginBottom: 16,
        lineHeight: 22,
    },
    infoBox: {
        backgroundColor: '#F0F9FF',
        borderRadius: 8,
        padding: 12,
        marginBottom: 24,
    },
    infoText: {
        fontSize: 14,
        color: colors.text,
        textAlign: 'center',
        lineHeight: 20,
    },
    buttonContainer: {
        gap: 12,
    },
    acceptButton: {
        marginBottom: 0,
    },
    declineButton: {
        paddingVertical: 12,
        alignItems: 'center',
    },
    declineText: {
        fontSize: 16,
        color: colors.textLight,
        fontWeight: '600',
    },
});
