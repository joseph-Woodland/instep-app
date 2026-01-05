import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, ActivityIndicator, Alert } from 'react-native';
import { Header } from '../components/Header';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { GoalService, UserGoal, CheckIn } from '../services/GoalService';
import { getGoalById } from '../data/goals';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { CheckInModal } from '../components/CheckInModal';

// Assets
const heroBlobs = require('../assets/images/hero_blobs.png');

// Helper to format date
const isToday = (date: Date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear();
};

const formatDate = (dateIn: any) => {
    if (!dateIn) return '';
    // Safeguard invalid dates
    const d = dateIn instanceof Date ? dateIn : new Date(dateIn);
    if (isNaN(d.getTime())) return "Unknown";

    if (isToday(d)) return "Today";
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
};

const getTime = (dateIn: any) => {
    if (!dateIn) return '';
    const d = dateIn instanceof Date ? dateIn : new Date(dateIn);
    if (isNaN(d.getTime())) return "";
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

export const JournalScreen = () => {
    const navigation = useNavigation<any>();
    const { userId, selectedGoalId } = useUser();
    const [loading, setLoading] = useState(true);
    const [timelineData, setTimelineData] = useState<any[]>([]);
    const [checkInVisible, setCheckInVisible] = useState(false);

    // User Goal Data
    const [userGoal, setUserGoal] = useState<UserGoal | null>(null);
    const [goalDef, setGoalDef] = useState<any>(null);

    // Track if we have a check-in for "Today"
    const [hasCheckedInToday, setHasCheckedInToday] = useState(false);

    useEffect(() => {
        loadJournalData();
    }, [userId, selectedGoalId]);

    const loadJournalData = async () => {
        if (!userId || !selectedGoalId) {
            setLoading(false);
            return;
        }

        try {
            const [gData, history, userAffirmations] = await Promise.all([
                GoalService.getOrCreateUserGoal(userId, selectedGoalId),
                GoalService.getCheckIns(userId, selectedGoalId),
                GoalService.getAffirmations(userId)
            ]);

            setUserGoal(gData);
            setGoalDef(getGoalById(selectedGoalId));

            // Merge Data
            const checkIns = history.map(c => ({
                type: 'checkin',
                date: new Date(c.createdAt || Date.now()), // Fallback
                data: c
            }));

            const affirmations = userAffirmations.map(a => ({
                type: 'affirmation',
                date: new Date(a.createdAt || Date.now()),
                data: a
            }));

            // Combine and Sort Descending
            const combined = [...checkIns, ...affirmations].sort((a, b) => b.date.getTime() - a.date.getTime());
            setTimelineData(combined);

            // Check if checked in today
            const todayCheckIn = checkIns.find(c => isToday(c.date));
            setHasCheckedInToday(!!todayCheckIn);

        } catch (error) {
            console.error("Failed to load journal", error);
        } finally {
            setLoading(false);
        }
    };

    const handleCheckInSubmit = async (note: string, milestoneId: string | null, photoBase64: string | null) => {
        if (!userId || !selectedGoalId) return;
        try {
            const result = await GoalService.submitCheckIn(userId, selectedGoalId, null, note, milestoneId, null);
            if (result.success) {
                setCheckInVisible(false);
                if (result.milestoneCompletedName) {
                    Alert.alert("Milestone Unlocked!", `You completed: ${result.milestoneCompletedName}`);
                }
                loadJournalData();
            }
        } catch (e) {
            Alert.alert("Error", "Failed to submit check-in");
        }
    };

    const milestones = goalDef ? goalDef.milestones.map((m: any) => ({ id: m.id, title: m.title })) : [];

    const getMilestoneTitle = (mid: string) => {
        return goalDef?.milestones.find((m: any) => m.id === mid)?.title || "Unknown";
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => {
        const isLast = index === timelineData.length - 1;

        if (!(item.date instanceof Date) || isNaN(item.date.getTime())) {
            return null;
        }

        const dateLabel = formatDate(item.date);
        let showDateLabel = false;
        if (index === 0) showDateLabel = true;
        else {
            const prevItem = timelineData[index - 1];
            if (prevItem && prevItem.date) {
                const prevLabel = formatDate(prevItem.date);
                if (prevLabel !== dateLabel) showDateLabel = true;
            }
        }

        const DotColor = item.type === 'checkin' ? colors.primary : '#FBBF24';

        return (
            <View style={styles.timelineRow}>
                <View style={styles.timelineLeft}>
                    {showDateLabel && <Text style={styles.timelineDateLabel}>{dateLabel}</Text>}
                    <View style={styles.lineWrapper}>
                        <View style={[styles.line, isLast && styles.lineLast]} />
                        <View style={[styles.dot, { backgroundColor: DotColor }, showDateLabel ? { top: 28 } : { top: 0 }]} />
                    </View>
                </View>

                <View style={[styles.cardWrapper, showDateLabel && { marginTop: 24 }]}>
                    {item.type === 'checkin' ? (
                        <View style={styles.cardCheckIn}>
                            <View style={styles.cardHeader}>
                                <View style={styles.tagCheckIn}>
                                    <View style={[styles.tagDot, { backgroundColor: colors.primary }]} />
                                    <Text style={styles.tagText}>Daily Check-in</Text>
                                </View>
                                <Text style={styles.timeText}>{getTime(item.date)}</Text>
                            </View>

                            <Text style={styles.cardTitle}>{item.data.reflection || item.data.note || "Goal Activity"}</Text>
                            {item.data.gratefulFor ? <Text style={styles.cardBody}>Grateful for: {item.data.gratefulFor}</Text> : null}

                            <View style={styles.moodRow}>
                                <Ionicons name="happy" size={16} color="#FBBF24" />
                                <Text style={styles.moodText}>{item.data.mood || "Journal Entry"}</Text>
                            </View>
                        </View>
                    ) : (
                        <View style={styles.cardAffirmation}>
                            <Image
                                source={heroBlobs}
                                style={[StyleSheet.absoluteFillObject, { opacity: 0.8 }]}
                                resizeMode="cover"
                            />
                            <LinearGradient
                                colors={['rgba(0,0,0,0.1)', 'rgba(0,0,0,0.6)']}
                                style={StyleSheet.absoluteFillObject}
                            />
                            <View style={styles.affirmationContent}>
                                <View style={styles.tagAffirmation}>
                                    <Ionicons name="sparkles" size={12} color="white" />
                                    <Text style={styles.tagAffirmationText}>Daily Affirmation</Text>
                                </View>
                                <Text style={styles.affirmationQuote}>"{item.data.text}"</Text>
                                <TouchableOpacity style={styles.saveBtn}>
                                    <Ionicons name="bookmark-outline" size={20} color="white" />
                                </TouchableOpacity>
                            </View>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.headerTitle}>Reflections</Text>
                <TouchableOpacity onPress={() => navigation.navigate('Calendar' as any)}>
                    <Ionicons name="calendar-outline" size={24} color={colors.textLight} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={timelineData}
                renderItem={renderItem}
                keyExtractor={(item, index) => index.toString()}
                contentContainerStyle={styles.listContent}
                ListHeaderComponent={
                    <View>
                        {/* Goal Overview Card */}
                        {userGoal && goalDef && (
                            <View style={styles.goalCard}>
                                <Text style={styles.goalTitle}>My Goal: {goalDef.title}</Text>

                                <View style={styles.progressRow}>
                                    <View style={styles.progressBarBg}>
                                        <View style={[styles.progressBarFill, { width: `${userGoal.progressPercent || 0}%` }]} />
                                    </View>
                                    <Text style={styles.progressText}>{Math.round(userGoal.progressPercent || 0)}%</Text>
                                </View>

                                <View style={styles.milestoneRow}>
                                    <Ionicons name="flag-outline" size={14} color={colors.textLight} />
                                    <Text style={styles.milestoneText}>Next: {getMilestoneTitle(userGoal.currentMilestoneId)}</Text>
                                </View>
                            </View>
                        )}

                        {!hasCheckedInToday ? (
                            <View style={styles.ctaContainer}>
                                <View style={styles.ctaCard}>
                                    <LinearGradient
                                        colors={['#ECFDF5', '#FFFFFF']}
                                        style={StyleSheet.absoluteFillObject}
                                    />
                                    <View style={styles.ctaHeader}>
                                        <View style={styles.iconSun}>
                                            <Ionicons name="sunny" size={24} color="#F59E0B" />
                                        </View>
                                        <View>
                                            <Text style={styles.ctaTitle}>Daily Check-in</Text>
                                            <Text style={styles.ctaSubtitle}>Take a moment to pause.</Text>
                                        </View>
                                    </View>
                                    <TouchableOpacity
                                        style={styles.btnStart}
                                        onPress={() => setCheckInVisible(true)}
                                    >
                                        <Text style={styles.btnStartText}>Start Reflection</Text>
                                        <Ionicons name="arrow-forward" size={18} color="white" />
                                    </TouchableOpacity>
                                </View>
                                <View style={{ height: 1, backgroundColor: '#E2E8F0', marginVertical: 24, marginLeft: 28 }} />
                            </View>
                        ) : (
                            <View style={{ height: 24 }} />
                        )}
                    </View>
                }
                ListEmptyComponent={timelineData.length === 0 ? <Text style={styles.emptyText}>Start your journey by checking in.</Text> : null}
            />

            <TouchableOpacity style={styles.fab} onPress={() => setCheckInVisible(true)}>
                <Ionicons name="add" size={32} color="white" />
            </TouchableOpacity>

            <CheckInModal
                visible={checkInVisible}
                onClose={() => setCheckInVisible(false)}
                onSubmit={handleCheckInSubmit}
                milestones={milestones}
            />

        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 16,
        backgroundColor: 'rgba(255,255,255,0.8)',
    },
    headerTitle: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
    },
    listContent: {
        paddingHorizontal: 24,
        paddingBottom: 100,
    },
    // Goal Card
    goalCard: {
        backgroundColor: colors.white,
        borderRadius: 20,
        padding: 20,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
    },
    goalTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 12,
    },
    progressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        marginBottom: 12,
    },
    progressBarBg: {
        flex: 1,
        height: 8,
        backgroundColor: '#F1F5F9',
        borderRadius: 4,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: colors.primary,
        borderRadius: 4,
    },
    progressText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,
        width: 32,
        textAlign: 'right',
    },
    milestoneRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    milestoneText: {
        fontSize: 12,
        color: colors.textLight,
    },
    // CTA
    ctaContainer: {
        marginBottom: 0,
    },
    ctaCard: {
        borderRadius: 24,
        padding: 24,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.1,
        shadowRadius: 20,
        overflow: 'hidden',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        backgroundColor: 'white',
    },
    ctaHeader: {
        flexDirection: 'row',
        gap: 16,
        marginBottom: 24,
    },
    iconSun: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#FEF3C7',
        alignItems: 'center',
        justifyContent: 'center',
    },
    ctaTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    ctaSubtitle: {
        fontSize: 14,
        color: colors.textLight,
        marginTop: 2,
    },
    btnStart: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        height: 48,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
    },
    btnStartText: {
        color: '#0F172A',
        fontWeight: '700',
        fontSize: 14,
    },
    // Timeline
    timelineRow: {
        flexDirection: 'row',
    },
    timelineLeft: {
        width: 60,
        position: 'relative',
    },
    timelineDateLabel: {
        fontSize: 10,
        fontWeight: '700',
        color: '#94A3B8',
        textTransform: 'uppercase',
        marginBottom: 12,
        letterSpacing: 1,
    },
    lineWrapper: {
        position: 'absolute',
        top: 0,
        bottom: 0,
        left: 2, // Align with dot?
        paddingLeft: 4, // Indent line slightly
        height: '100%',
    },
    line: {
        width: 2,
        backgroundColor: '#E2E8F0',
        flex: 1,
        marginLeft: 5, // Center line in dot
    },
    lineLast: {
        backgroundColor: 'transparent', // Stop line for last item?
        // Or gradient fade out
    },
    dot: {
        position: 'absolute',
        left: 0, // In lineWrapper
        width: 12,
        height: 12,
        borderRadius: 6,
        borderWidth: 2,
        borderColor: 'white',
        zIndex: 10,
    },
    // Cards
    cardWrapper: {
        flex: 1,
        marginBottom: 32,
    },
    cardCheckIn: {
        backgroundColor: 'white',
        borderRadius: 20,
        padding: 20,
        borderWidth: 1,
        borderColor: '#F1F5F9',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
    },
    cardAffirmation: {
        height: 200,
        borderRadius: 20,
        overflow: 'hidden',
        justifyContent: 'flex-end',
        padding: 20,
        shadowColor: '#000',
        shadowOpacity: 0.1,
        shadowRadius: 10,
    },
    // CheckIn Content
    cardHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 12,
    },
    tagCheckIn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    tagDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
        shadowColor: colors.primary,
        shadowOpacity: 0.5,
        shadowRadius: 4,
    },
    tagText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
        textTransform: 'uppercase',
    },
    timeText: {
        fontSize: 10,
        color: '#94A3B8',
        fontWeight: '600',
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
    },
    cardBody: {
        fontSize: 14,
        color: colors.textLight,
        lineHeight: 20,
        marginBottom: 12,
    },
    moodRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        paddingTop: 12,
        borderTopWidth: 1,
        borderTopColor: '#F1F5F9',
    },
    moodText: {
        fontSize: 12,
        color: '#64748B',
        fontWeight: '500',
    },
    // Affirmation Content
    affirmationContent: {
        gap: 12,
    },
    tagAffirmation: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: 'rgba(255,255,255,0.2)',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        alignSelf: 'flex-start',
    },
    tagAffirmationText: {
        color: 'white',
        fontSize: 10,
        fontWeight: '700',
        textTransform: 'uppercase',
    },
    affirmationQuote: {
        color: 'white',
        fontSize: 18,
        fontWeight: '700',
        lineHeight: 26,
        fontStyle: 'italic',
    },
    saveBtn: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: 'rgba(255,255,255,0.2)',
        width: 36,
        height: 36,
        borderRadius: 18,
        alignItems: 'center',
        justifyContent: 'center',
    },
    // Empty
    emptyText: {
        textAlign: 'center',
        color: colors.textLight,
        marginTop: 40,
    },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 8 },
        shadowOpacity: 0.4,
        shadowRadius: 16,
        elevation: 10,
    }
});
