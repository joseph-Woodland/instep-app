import React, { useState } from 'react';
import { View, Text, StyleSheet, Modal, TextInput, TouchableOpacity, ActivityIndicator, Alert, Platform, KeyboardAvoidingView } from 'react-native';
import { colors } from '../theme/colors';
import { useUser } from '../context/UserContext';
import { FeedbackService } from '../services/FeedbackService';
import { Ionicons } from '@expo/vector-icons';

interface FeedbackModalProps {
    visible: boolean;
    onClose: () => void;
}

export const FeedbackModal = ({ visible, onClose }: FeedbackModalProps) => {
    const { userId, userName } = useUser();
    const [feedbackMsg, setFeedbackMsg] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async () => {
        if (!feedbackMsg.trim()) return;
        setIsSubmitting(true);
        try {
            await FeedbackService.submitFeedback({
                userId,
                displayName: userName,
                message: feedbackMsg,
                appVersion: '1.0.2', // Should ideally come from Constants
                platform: Platform.OS
            });
            setFeedbackMsg('');
            Alert.alert("Thank You", "Your feedback really helps us improve!");
            onClose();
        } catch (error) {
            Alert.alert("Error", "Failed to send feedback. Please try again.");
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : "height"}
                style={styles.modalOverlay}
            >
                <View style={styles.modalContent}>
                    <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                        <Ionicons name="close" size={24} color={colors.textLight} />
                    </TouchableOpacity>

                    <Text style={styles.modalTitle}>Beta Feedback 🚀</Text>
                    <Text style={styles.modalSub}>Spotted a bug? Have an idea? Let us know!</Text>

                    <TextInput
                        style={[styles.modalInput, { height: 120, textAlignVertical: 'top' }]}
                        placeholder="Type your thoughts here..."
                        value={feedbackMsg}
                        onChangeText={setFeedbackMsg}
                        multiline
                        autoFocus={visible}
                    />

                    <View style={styles.modalButtonsHorizontal}>
                        <TouchableOpacity
                            onPress={onClose}
                            style={styles.modalButtonCancel}
                            disabled={isSubmitting}
                        >
                            <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.modalButtonSubmit}
                            onPress={handleSubmit}
                            disabled={isSubmitting || !feedbackMsg.trim()}
                        >
                            {isSubmitting ? (
                                <ActivityIndicator color={colors.white} size="small" />
                            ) : (
                                <Text style={styles.modalButtonTextSubmit}>Send Feedback</Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>
        </Modal>
    );
};

const styles = StyleSheet.create({
    modalOverlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    modalContent: {
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: 24,
        alignItems: 'center',
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        position: 'relative'
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        padding: 4
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 8,
        color: colors.text,
    },
    modalSub: {
        fontSize: 14,
        color: colors.textLight,
        marginBottom: 24,
        textAlign: 'center',
    },
    modalInput: {
        width: '100%',
        backgroundColor: '#F3F4F6',
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 24,
    },
    modalButtonsHorizontal: {
        flexDirection: 'row',
        gap: 12,
        width: '100%',
    },
    modalButtonCancel: {
        flex: 1,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonSubmit: {
        flex: 1,
        backgroundColor: colors.primary,
        borderRadius: 12,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
    },
    modalButtonTextCancel: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.textLight,
    },
    modalButtonTextSubmit: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.white,
    },
});
