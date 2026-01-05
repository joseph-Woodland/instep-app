import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../theme/colors';

interface DailyGoalCardProps {
    goalName: string;
    progress: number;
    target: number;
    unit: string;
    onCheckIn: () => void;
}

export const DailyGoalCard: React.FC<DailyGoalCardProps> = ({ goalName, progress, target, unit, onCheckIn }) => {
    // Calculate percentage for bar
    const percent = Math.min(100, Math.max(0, (progress / target) * 100));

    return (
        <LinearGradient
            colors={['#84fab0', '#8fd3f4']} // Placeholder gradient: Minty/Blueish. Design is Green scale.
            // Using designs colors: Top is heavy green, bottom fade? 
            // Design image shows a soft vertical gradient.
            // Let's try Mint to slightly darker Mint.
            // colors.primary is #13ec5b.
            style={styles.container}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
        >
            {/* Override gradient with design colors if needed, but LinearGradient prop handles it */}
            <View style={styles.badge}>
                <Text style={styles.badgeText}>TODAY'S FOCUS</Text>
            </View>

            <View style={styles.content}>
                <Text style={styles.label}>Daily Goal</Text>
                <Text style={styles.goalTitle}>{goalName}</Text>

                <View style={styles.barContainer}>
                    <View style={[styles.barFill, { width: `${percent}%` }]} />
                </View>

                <View style={styles.footer}>
                    {/* Progress Text with Icon */}
                    <View style={styles.progressRow}>
                        <Ionicons name="water" size={16} color="#0d1b12" style={{ marginRight: 4 }} />
                        <Text style={styles.progressText}>{progress}{unit} / {target}{unit}</Text>
                    </View>

                    <TouchableOpacity style={styles.checkInButton} onPress={onCheckIn}>
                        <Ionicons name="checkmark" size={18} color="#0d1b12" />
                        <Text style={styles.checkInText}>Check In</Text>
                    </TouchableOpacity>
                </View>
            </View>
        </LinearGradient>
    );
};

const styles = StyleSheet.create({
    container: {
        borderRadius: 24,
        padding: 20,
        minHeight: 200,
        marginBottom: 24,
        justifyContent: 'space-between',
    },
    badge: {
        backgroundColor: 'rgba(255, 255, 255, 0.9)',
        alignSelf: 'flex-start',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginBottom: 32,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#0d1b12',
        letterSpacing: 0.5,
    },
    content: {
        gap: 8,
    },
    label: {
        fontSize: 14,
        color: 'rgba(13, 27, 18, 0.6)',
        fontWeight: '600',
    },
    goalTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: '#0d1b12',
        marginBottom: 16,
    },
    barContainer: {
        height: 8,
        backgroundColor: 'rgba(255, 255, 255, 0.3)',
        borderRadius: 4,
        marginBottom: 16,
        overflow: 'hidden',
    },
    barFill: {
        height: '100%',
        backgroundColor: '#13ec5b', // Bright green fill
        borderRadius: 4,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    progressText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#0d1b12',
    },
    checkInButton: {
        backgroundColor: '#13ec5b',
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 24,
        gap: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 2,
    },
    checkInText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#0d1b12',
    },
});
