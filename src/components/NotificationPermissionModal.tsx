import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { NotificationService } from '../services/NotificationService';

interface NotificationPermissionModalProps {
    visible: boolean;
    onClose: () => void;
}

export const NotificationPermissionModal = ({ visible, onClose }: NotificationPermissionModalProps) => {
    // 3 Presets: Morning (08:00), Evening (19:00)
    const [selectedTime, setSelectedTime] = useState("19:00");

    const handleEnable = async () => {
        // Request Permission
        const granted = await NotificationService.requestPermissionsAsync();
        if (granted) {
            // Schedule
            await NotificationService.scheduleDailyReminder(selectedTime);
            // Save Config
            await NotificationService.saveConfig({
                enabled: true,
                reminderTime: selectedTime,
                lastPromptedAt: Date.now()
            });
            onClose();
        } else {
            // Denied - save preference anyway so UI reflects user intent, 
            // even if system blocks it. User might enable later in settings.
            await NotificationService.saveConfig({
                enabled: true, // User WANTED it enabled
                reminderTime: selectedTime,
                lastPromptedAt: Date.now()
            });
            Alert.alert(
                "Permissions Required",
                "We saved your preference, but you need to enable notifications in your phone settings to receive them."
            );
            onClose();
        }
    };

    const handleNotNow = async () => {
        await NotificationService.saveConfig({
            enabled: false,
            reminderTime: "19:00",
            lastPromptedAt: Date.now()
        });
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={() => { }}>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <View style={styles.iconContainer}>
                        <Ionicons name="notifications" size={40} color={colors.primary} />
                    </View>

                    <Text style={styles.title}>Want a daily nudge?</Text>
                    <Text style={styles.body}>
                        We can remind you to check in — no pressure, just support.
                    </Text>

                    {/* Time Presets */}
                    <Text style={styles.label}>Choose a time:</Text>
                    <View style={styles.presetRow}>
                        {[
                            { label: 'Morning (8am)', time: '08:00', icon: 'sunny-outline' },
                            { label: 'Evening (7pm)', time: '19:00', icon: 'moon-outline' },
                        ].map((p) => (
                            <TouchableOpacity
                                key={p.label}
                                style={[styles.presetBtn, selectedTime === p.time && styles.presetBtnActive]}
                                onPress={() => setSelectedTime(p.time)}
                                activeOpacity={0.8}
                            >
                                <Ionicons name={p.icon as any} size={18} color={selectedTime === p.time ? colors.white : colors.textLight} />
                                <Text style={[styles.presetText, selectedTime === p.time && styles.presetTextActive]}>{p.label}</Text>
                            </TouchableOpacity>
                        ))}
                    </View>

                    <TouchableOpacity style={styles.mainBtn} onPress={handleEnable}>
                        <Text style={styles.mainBtnText}>Enable Reminders</Text>
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.secBtn} onPress={handleNotNow}>
                        <Text style={styles.secBtnText}>Not now</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.5)',
        justifyContent: 'center',
        padding: 24,
    },
    content: {
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: 32,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 10,
        elevation: 5,
    },
    iconContainer: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 20,
    },
    title: {
        fontSize: 22,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 12,
        textAlign: 'center',
    },
    body: {
        fontSize: 15,
        color: colors.textLight,
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: 24,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 12,
        alignSelf: 'flex-start',
        width: '100%',
        marginLeft: 4,
    },
    presetRow: {
        flexDirection: 'row',
        gap: 12,
        marginBottom: 32,
        width: '100%',
    },
    presetBtn: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        paddingVertical: 12,
        paddingHorizontal: 8,
        borderRadius: 12,
        backgroundColor: '#F3F4F6',
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    presetBtnActive: {
        backgroundColor: colors.primary,
        borderColor: colors.primary,
    },
    presetText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.textLight,
    },
    presetTextActive: {
        color: colors.white,
    },
    mainBtn: {
        backgroundColor: colors.primary,
        width: '100%',
        paddingVertical: 16,
        borderRadius: 16,
        alignItems: 'center',
        marginBottom: 12,
    },
    mainBtnText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 16,
    },
    secBtn: {
        paddingVertical: 8,
    },
    secBtnText: {
        color: colors.textLight,
        fontWeight: '600',
        fontSize: 14,
    }
});
