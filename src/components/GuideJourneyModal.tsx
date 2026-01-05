import React from 'react';
import { View, Text, StyleSheet, Modal, TouchableOpacity, ScrollView } from 'react-native';
import { colors } from '../theme/colors';
import { TimelineEntry } from '../services/GoalService';
import { getMilestone } from '../data/goals';

interface GuideJourneyModalProps {
    visible: boolean;
    onClose: () => void;
    guideName: string;
    goalId: string;
    timeline: TimelineEntry[];
}

export const GuideJourneyModal: React.FC<GuideJourneyModalProps> = ({
    visible,
    onClose,
    guideName,
    goalId,
    timeline,
}) => {
    // Filter to only completed milestones
    const completedMilestones = timeline.filter(t => t.completedAt !== null);

    return (
        <Modal
            visible={visible}
            transparent
            animationType="slide"
            onRequestClose={onClose}
        >
            <View style={styles.overlay}>
                <View style={styles.modal}>
                    {/* Header */}
                    <View style={styles.header}>
                        <View>
                            <Text style={styles.title}>{guideName}'s Journey</Text>
                            <Text style={styles.subtitle}>
                                {guideName} completed this goal and is here to help you.
                            </Text>
                        </View>
                        <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                            <Text style={styles.closeText}>✕</Text>
                        </TouchableOpacity>
                    </View>

                    {/* Timeline */}
                    <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
                        {completedMilestones.length === 0 ? (
                            <View style={styles.emptyState}>
                                <Text style={styles.emptyText}>
                                    {guideName} is just getting started on their journey.
                                </Text>
                            </View>
                        ) : (
                            <View style={styles.timeline}>
                                {completedMilestones.map((entry, index) => {
                                    const milestone = getMilestone(goalId, entry.milestoneId);
                                    const isLast = index === completedMilestones.length - 1;

                                    return (
                                        <View key={entry.milestoneId} style={styles.timelineItem}>
                                            <View style={styles.timelineLeft}>
                                                <View style={styles.dot} />
                                                {!isLast && <View style={styles.line} />}
                                            </View>
                                            <View style={styles.timelineContent}>
                                                <Text style={styles.milestoneTitle}>
                                                    {milestone?.title || 'Milestone'}
                                                </Text>
                                                <Text style={styles.milestoneDate}>
                                                    {entry.completedAt
                                                        ? new Date(entry.completedAt).toLocaleDateString('en-US', {
                                                            month: 'short',
                                                            day: 'numeric',
                                                            year: 'numeric'
                                                        })
                                                        : 'In progress'}
                                                </Text>
                                            </View>
                                        </View>
                                    );
                                })}
                            </View>
                        )}

                        <View style={styles.footer}>
                            <Text style={styles.footerText}>
                                💚 You can do this too!
                            </Text>
                        </View>
                    </ScrollView>
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        justifyContent: 'flex-end',
    },
    modal: {
        backgroundColor: colors.white,
        borderTopLeftRadius: 24,
        borderTopRightRadius: 24,
        maxHeight: '80%',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        padding: 24,
        paddingBottom: 16,
        borderBottomWidth: 1,
        borderBottomColor: '#F0F0F0',
    },
    title: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 14,
        color: colors.textLight,
        lineHeight: 20,
        maxWidth: '80%',
    },
    closeButton: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#F5F5F5',
        justifyContent: 'center',
        alignItems: 'center',
    },
    closeText: {
        fontSize: 18,
        color: colors.textLight,
    },
    scrollView: {
        flex: 1,
    },
    timeline: {
        padding: 24,
        paddingTop: 16,
    },
    timelineItem: {
        flexDirection: 'row',
        marginBottom: 8,
    },
    timelineLeft: {
        alignItems: 'center',
        marginRight: 16,
        width: 20,
    },
    dot: {
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.primary,
        borderWidth: 2,
        borderColor: colors.white,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 0 },
        shadowOpacity: 0.3,
        shadowRadius: 4,
    },
    line: {
        flex: 1,
        width: 2,
        backgroundColor: '#E0E0E0',
        marginTop: 4,
        minHeight: 40,
    },
    timelineContent: {
        flex: 1,
        paddingBottom: 16,
    },
    milestoneTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 4,
    },
    milestoneDate: {
        fontSize: 14,
        color: colors.textLight,
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
    },
    emptyText: {
        fontSize: 16,
        color: colors.textLight,
        textAlign: 'center',
        lineHeight: 24,
    },
    footer: {
        padding: 24,
        paddingTop: 8,
        alignItems: 'center',
    },
    footerText: {
        fontSize: 16,
        color: colors.text,
        fontWeight: '600',
    },
});
