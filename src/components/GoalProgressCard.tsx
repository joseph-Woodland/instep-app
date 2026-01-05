import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { colors } from '../theme/colors';

interface GoalProgressCardProps {
    goalName: string;
    currentMilestoneTitle: string;
    progressPercent: number;
    startDate?: number;
    onPressGuide?: () => void;
    guideName?: string;
}

export const GoalProgressCard: React.FC<GoalProgressCardProps> = ({
    goalName,
    currentMilestoneTitle,
    progressPercent,
    startDate,
    onPressGuide,
    guideName = 'your guide',
}) => {
    return (
        <View style={styles.container}>
            <Text style={styles.goalName}>{goalName}</Text>

            <View style={styles.progressContainer}>
                <View style={styles.progressBarBg}>
                    <View
                        style={[
                            styles.progressBarFill,
                            { width: `${Math.max(0, Math.min(100, Number(progressPercent) || 0))}%` }
                        ]}
                    />
                </View>
                <Text style={styles.percentText}>{progressPercent}%</Text>
            </View>

            <Text style={styles.milestoneText}>
                Current: <Text style={styles.milestoneHighlight}>{currentMilestoneTitle}</Text>
            </Text>

            {startDate && (
                <Text style={styles.dateText}>
                    Started on {new Date(startDate).toLocaleDateString()}
                </Text>
            )}

            {onPressGuide && (
                <TouchableOpacity onPress={onPressGuide} style={styles.guideLink}>
                    <Text style={styles.guideText}>See how {guideName} did it →</Text>
                </TouchableOpacity>
            )}
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
        backgroundColor: colors.white,
        borderRadius: 12,
        padding: 16,
        marginBottom: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 4,
        elevation: 2,
        borderWidth: 1,
        borderColor: '#F0F0F0',
    },
    goalName: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 12,
    },
    progressContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
    },
    progressBarBg: {
        flex: 1,
        height: 8,
        backgroundColor: '#F0F0F0',
        borderRadius: 4,
        marginRight: 10,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 4,
    },
    percentText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.primary,
        width: 32,
        textAlign: 'right',
    },
    milestoneText: {
        fontSize: 14,
        color: colors.textLight,
        marginBottom: 4,
    },
    milestoneHighlight: {
        color: colors.text,
        fontWeight: '600',
    },
    dateText: {
        fontSize: 12,
        color: '#999',
        marginTop: 4,
    },
    guideLink: {
        marginTop: 12,
        alignSelf: 'flex-start',
    },
    guideText: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
    },
});
