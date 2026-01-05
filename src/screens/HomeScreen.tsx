import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, ActivityIndicator, Image, Modal, Pressable, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { Header } from '../components/Header';
import { DailyGoalCard } from '../components/DailyGoalCard'; // New Component
import { PrimaryButton } from '../components/PrimaryButton';
import { useUser } from '../context/UserContext';
import { GoalService, UserGoal } from '../services/GoalService';
import { GroupService, Invite } from '../services/GroupService';
import { getGoalById, getMilestone } from '../data/goals';
import { Ionicons } from '@expo/vector-icons';
import { CheckInModal } from '../components/CheckInModal';
import { InviteFriendModal } from '../components/InviteFriendModal'; // New
import { ChatService } from '../services/ChatService';
import { NotificationService } from '../services/NotificationService';
import { UserService } from '../services/UserService'; // New
import { NotificationPermissionModal } from '../components/NotificationPermissionModal';
import { UpdateService } from '../services/UpdateService';

export const HomeScreen = () => {
    const navigation = useNavigation<any>();
    const { userId, userName, selectedGoalId, groupId } = useUser();

    // State
    const [loading, setLoading] = useState(true);
    const [userGoal, setUserGoal] = useState<UserGoal | null>(null);
    const [groupName, setGroupName] = useState<string>('');
    const [memberCount, setMemberCount] = useState(0);
    const [checkInVisible, setCheckInVisible] = useState(false);
    const [invites, setInvites] = useState<Invite[]>([]);
    const [inviteModalVisible, setInviteModalVisible] = useState(false); // Incoming
    const [showInviteFriendModal, setShowInviteFriendModal] = useState(false); // Outgoing
    const [showNotifPermissionModal, setShowNotifPermissionModal] = useState(false); // New
    const [members, setMembers] = useState<any[]>([]); // New

    // Gratitude State
    const [gratitude, setGratitude] = useState('');
    const [isGratitudeSubmitted, setIsGratitudeSubmitted] = useState(false);
    const [gratitudeAnswer, setGratitudeAnswer] = useState('');

    // Derived data
    const currentGoalDef = selectedGoalId ? getGoalById(selectedGoalId) : null;

    // Calculate progress (Mocking 'Units' as we don't store them in GoalDef yet, assuming 'Steps' or 'Checkins')
    // We'll use progressPercent / 100 * target. Let's just pass raw percent for now or mock it.
    const progressVal = userGoal ? Math.round(userGoal.progressPercent) : 0;
    const progressTarget = 100;

    useEffect(() => {
        loadData();
        checkNotifications();
        UpdateService.checkForUpdates();
    }, [userId, selectedGoalId, groupId]);

    const checkNotifications = async () => {
        const config = await NotificationService.getConfig();
        if (!config) {
            // Delay slightly for better UX
            setTimeout(() => {
                setShowNotifPermissionModal(true);
            }, 3000);
        }

        // Silent Push Registration
        try {
            const token = await NotificationService.getPushToken();
            if (token && userId) {
                UserService.updatePushToken(userId, token);
            }
        } catch (e) {
            console.log("Push reg failed", e);
        }
    };

    const [latestCheckIn, setLatestCheckIn] = useState<any>(null);

    const loadData = async () => {
        setLoading(true);
        try {
            if (selectedGoalId) {
                const [g, checkIns] = await Promise.all([
                    GoalService.getOrCreateUserGoal(userId, selectedGoalId),
                    GoalService.getCheckIns(userId, selectedGoalId)
                ]);
                setUserGoal(g);
                if (checkIns && checkIns.length > 0) {
                    setLatestCheckIn(checkIns[0]);
                }
            }

            if (groupId) {
                const gDetails = await GroupService.getGroupDetails(groupId);
                if (gDetails) {
                    setGroupName(gDetails.name);
                    setMemberCount(gDetails.memberCount);

                    // Fetch preview members (max 3)
                    const userIds = await GroupService.getGroupMembers(groupId);
                    if (userIds.length > 0) {
                        // Optimizing: just fetch first 3 full profiles for avatars
                        const previewIds = userIds.slice(0, 3);
                        const usersMap = await UserService.getUsers(previewIds);
                        setMembers(previewIds.map(id => ({ id, ...usersMap[id] })));
                    }
                }
            }

            const pending = await GroupService.getUserPendingInvites(userId);
            setInvites(pending);
            if (pending.length > 0) setInviteModalVisible(true);
        } catch (e) {
            console.error("Error loading home data:", e);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenGroup = () => {
        if (groupId && selectedGoalId) {
            navigation.navigate('MainTabs', { screen: 'GroupChat', params: { groupId, goalId: selectedGoalId } });
        } else {
            Alert.alert("No Group", "You don't seem to have an active group yet.");
        }
    };

    const handleViewMembers = () => {
        if (groupId) {
            navigation.navigate('GroupMembers');
        }
    };

    const handleCheckInSubmit = async (note: string, milestoneId: string | null) => {
        if (!selectedGoalId || !groupId) return;

        try {
            const result = await GoalService.submitCheckIn(userId, selectedGoalId, groupId, note, milestoneId, null);

            if (result.success) {
                let systemText = `You checked in: "${note.substring(0, 80)}${note.length > 80 ? '...' : ''}"`;
                if (milestoneId && result.milestoneCompletedName) {
                    systemText = `You reached milestone: ${result.milestoneCompletedName} 🎉`;
                }
                await ChatService.sendSystemMessage(groupId, systemText);
                await loadData();
            }
        } catch (e) {
            Alert.alert("Error", "Check-in failed. Please try again.");
        }
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.loadingContainer}>
                    <ActivityIndicator size="large" color={colors.primary} />
                </View>
            </SafeAreaView>
        );
    }

    if (!selectedGoalId || !userGoal) {
        return (
            <SafeAreaView style={styles.container}>
                <View style={styles.emptyContainer}>
                    <Text style={styles.emptyTitle}>Welcome, {userName || 'Friend'}!</Text>
                    <Text style={styles.emptyText}>You haven't started a goal yet.</Text>
                    <PrimaryButton
                        title="Choose a Goal"
                        onPress={() => navigation.navigate('OnboardingGoal')}
                        style={styles.emptyButton}
                    />
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Custom Header */}
            <Header
                title={`Hi, ${userName.split(' ')[0]}`}
            />

            {invites.length > 0 && (
                <TouchableOpacity style={styles.inviteBanner} onPress={() => setInviteModalVisible(true)}>
                    <Ionicons name="mail" size={20} color="#FFF" />
                    <Text style={styles.inviteBannerText}>You have {invites.length} new invite{invites.length > 1 ? 's' : ''}!</Text>
                    <Ionicons name="chevron-forward" size={20} color="#FFF" />
                </TouchableOpacity>
            )}

            <ScrollView
                contentContainerStyle={styles.content}
                showsVerticalScrollIndicator={false}
            >
                {/* Greeting */}
                <View style={styles.greetingContainer}>
                    <Text style={styles.greetingTitle}>Good Morning,{'\n'}{userName || 'Alex'} <Ionicons name="sunny" size={24} color="#FDB813" /></Text>
                    <Text style={styles.greetingSub}>Ready for today? Small steps still count.</Text>
                </View>

                {/* Daily Goal Card */}
                <DailyGoalCard
                    goalName={currentGoalDef?.name || "Drink Water"}
                    progress={progressVal}
                    target={progressTarget}
                    unit="%"
                    onCheckIn={() => setCheckInVisible(true)}
                />

                {/* Latest Check-in / Journal Link */}
                <TouchableOpacity
                    style={styles.journalLinkCard}
                    onPress={() => navigation.navigate('MainTabs', { screen: 'Journal' })}
                >
                    <View style={styles.journalLinkHeader}>
                        <Text style={styles.journalLinkTitle}>LATEST ACTIVITY</Text>
                        <Ionicons name="arrow-forward" size={16} color={colors.primary} />
                    </View>
                    {latestCheckIn ? (
                        <View>
                            <Text style={styles.journalSubText} numberOfLines={2}>
                                {latestCheckIn.note}
                            </Text>
                            <Text style={styles.journalDate}>
                                {new Date(latestCheckIn.createdAt).toLocaleDateString()}
                            </Text>
                        </View>
                    ) : (
                        <Text style={styles.journalSubText}>Start your journey with a check-in.</Text>
                    )}
                </TouchableOpacity>

                {/* Check-In Modal with Photo Support */}
                <CheckInModal
                    visible={checkInVisible}
                    onClose={() => setCheckInVisible(false)}
                    onSubmit={handleCheckInSubmit}
                    milestones={currentGoalDef?.milestones || []}
                />
                <View style={[styles.reflectionCard, isGratitudeSubmitted && styles.reflectionCardDone]}>
                    <View style={styles.refHeader}>
                        <Ionicons name="sunny-outline" size={20} color="#F59E0B" />
                        <Text style={styles.refTitle}>DAILY REFLECTION</Text>
                    </View>
                    <Text style={styles.refQuestion}>What is one small thing you are grateful for today?</Text>

                    {isGratitudeSubmitted ? (
                        <View style={styles.refAnswerBox}>
                            <Text style={styles.refAnswerText}>"{gratitudeAnswer}"</Text>
                            <TouchableOpacity onPress={() => setIsGratitudeSubmitted(false)}>
                                <Text style={styles.refEditLink}>Edit answer</Text>
                            </TouchableOpacity>
                        </View>
                    ) : (
                        <View style={styles.refInputRow}>
                            <TextInput
                                style={styles.refInput}
                                placeholder="Tap to answer..."
                                value={gratitude}
                                onChangeText={setGratitude}
                                multiline
                            />
                            <TouchableOpacity
                                style={[styles.refSubmitBtn, !gratitude.trim() && { opacity: 0.5 }]}
                                onPress={() => {
                                    if (gratitude.trim()) {
                                        setGratitudeAnswer(gratitude);
                                        setIsGratitudeSubmitted(true);
                                        setGratitude('');
                                    }
                                }}
                                disabled={!gratitude.trim()}
                            >
                                <Ionicons name="checkmark-circle" size={32} color={colors.primary} />
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* Daily Reminder Toggle Shortcut */}
                <View style={styles.reminderCard}>
                    <View style={styles.reminderHeader}>
                        <Ionicons name="notifications-outline" size={20} color={colors.primary} />
                        <Text style={styles.reminderTitle}>DAILY REMINDER</Text>
                    </View>
                    <Text style={styles.reminderText}>Get a gentle nudge to stay on track.</Text>
                    <TouchableOpacity
                        style={styles.reminderBtn}
                        onPress={() => navigation.navigate('MainTabs', { screen: 'Profile' })}
                    >
                        <Text style={styles.reminderBtnText}>Manage Reminders</Text>
                        <Ionicons name="settings-outline" size={16} color={colors.primary} />
                    </TouchableOpacity>
                </View>

                {/* Your Circle Section */}
                <View style={styles.circleHeader}>
                    <Text style={styles.sectionTitle}>Your Circle</Text>
                    <TouchableOpacity onPress={handleViewMembers}>
                        <Text style={styles.viewAllText}>View All</Text>
                    </TouchableOpacity>
                </View>

                <TouchableOpacity style={styles.circleCard} onPress={handleViewMembers} activeOpacity={0.9}>
                    <View style={styles.avatarsRow}>
                        {members.length > 0 ? members.map((m, i) => {
                            const initials = m.displayName
                                ? m.displayName.split(' ').map((n: string) => n[0]).join('').substring(0, 2).toUpperCase()
                                : '??';

                            return (
                                <View key={m.id} style={[styles.avatarCircle, { marginLeft: i > 0 ? -12 : 0, zIndex: 10 - i }]}>
                                    {m.photoUrl ? (
                                        <Image source={{ uri: m.photoUrl }} style={styles.avatarImage} />
                                    ) : (
                                        <Text style={{ fontSize: 14, fontWeight: '700', color: colors.primary }}>{initials}</Text>
                                    )}
                                </View>
                            );
                        }) : (
                            <View style={[styles.avatarCircle, { backgroundColor: '#F3F4F6' }]}>
                                <Ionicons name="people" size={20} color={colors.textLight} />
                            </View>
                        )}

                        {memberCount > 3 && (
                            <View style={[styles.avatarCircle, styles.avatarMore, { marginLeft: -12, zIndex: 5 }]}>
                                <Text style={styles.moreText}>+{memberCount - 3}</Text>
                            </View>
                        )}
                        <View style={styles.arrowContainer}>
                            <Ionicons name="chevron-forward" size={20} color={colors.text} />
                        </View>
                    </View>

                    <View style={styles.updateBadge}>
                        <Ionicons name="heart" size={14} color={colors.primary} />
                        <Text style={styles.updateText}>
                            Sarah just shared a win{'\n'}
                            <Text style={styles.updateSub}>"Finally went for that run!"</Text>
                        </Text>
                    </View>
                </TouchableOpacity>

                {/* Invite CTA */}
                <TouchableOpacity
                    style={styles.inviteCTA}
                    onPress={() => setShowInviteFriendModal(true)}
                    activeOpacity={0.8}
                >
                    <View style={styles.inviteIconBox}>
                        <Ionicons name="person-add" size={20} color={colors.primary} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.inviteCTATitle}>Invite a friend to your group</Text>
                        <Text style={styles.inviteCTASub}>Support is better in step.</Text>
                    </View>
                    <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
                </TouchableOpacity>

                {/* Quote or Bottom Spacer */}
                <Text style={styles.quote}>"Progress is quiet. You're doing great."</Text>

            </ScrollView>


            {/* Invite Modal */}
            <Modal visible={inviteModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Your Invites</Text>
                        {invites.length === 0 ? (
                            <Text style={styles.modalSub}>No pending invites.</Text>
                        ) : (
                            invites.map(invite => (
                                <View key={invite.id} style={styles.inviteCard}>
                                    <Text style={styles.inviteMsg}>{invite.message}</Text>
                                    <Text style={styles.inviteSub}>{new Date(invite.createdAt?.toMillis?.() || Date.now()).toLocaleDateString()}</Text>
                                    <View style={styles.modalButtons}>
                                        <TouchableOpacity
                                            style={styles.modalButtonCancel}
                                            onPress={async () => {
                                                await GroupService.respondToInvite(invite.id, false);
                                                loadData();
                                            }}
                                        >
                                            <Text style={styles.modalButtonTextCancel}>Decline</Text>
                                        </TouchableOpacity>
                                        <TouchableOpacity
                                            style={styles.modalButtonSubmit}
                                            onPress={async () => {
                                                await GroupService.respondToInvite(invite.id, true);
                                                setInviteModalVisible(false);
                                                loadData(); // Will refresh and show group
                                                Alert.alert("Welcome!", "You have joined the group.");
                                            }}
                                        >
                                            <Text style={styles.modalButtonTextSubmit}>Accept</Text>
                                        </TouchableOpacity>
                                    </View>
                                </View>
                            ))
                        )}
                        <Pressable style={{ marginTop: 16 }} onPress={() => setInviteModalVisible(false)}>
                            <Text style={{ color: colors.textLight }}>Close</Text>
                        </Pressable>
                    </View>
                </View>
            </Modal>

            {/* Outgoing Invite Modal */}
            <InviteFriendModal
                visible={showInviteFriendModal}
                onClose={() => setShowInviteFriendModal(false)}
                groupName={groupName}
                goalName={currentGoalDef?.name}
                groupId={groupId || ''}
                goalId={selectedGoalId || ''}
            />

            <NotificationPermissionModal
                visible={showNotifPermissionModal}
                onClose={() => setShowNotifPermissionModal(false)}
            />

            <CheckInModal
                visible={checkInVisible}
                onClose={() => setCheckInVisible(false)}
                onSubmit={handleCheckInSubmit}
                milestones={currentGoalDef?.milestones || []}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    loadingContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: 24,
        paddingVertical: 12,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    avatarContainer: {
        position: 'relative',
    },
    avatar: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#E0E0E0',
    },
    statusDotHeader: {
        position: 'absolute',
        top: 0,
        right: 0,
        width: 12,
        height: 12,
        borderRadius: 6,
        backgroundColor: colors.primary,
        borderWidth: 2,
        borderColor: '#FAFAFA',
    },
    content: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    greetingContainer: {
        marginBottom: 24,
        marginTop: 8,
    },
    greetingTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 8,
        lineHeight: 40,
    },
    greetingSub: {
        fontSize: 16,
        color: '#15803d', // Dark green text
        opacity: 0.8,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    circleHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    viewAllText: {
        fontSize: 14,
        color: '#15803d',
        fontWeight: '600',
    },
    circleCard: {
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: 20,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    avatarsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 20,
        justifyContent: 'space-between', // To push arrow to right? No
    },
    avatarCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        borderWidth: 2,
        borderColor: colors.white,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
        overflow: 'hidden',
    },
    avatarImage: {
        width: '100%',
        height: '100%',
    },
    avatarMore: {
        backgroundColor: '#F3F4F6',
    },
    moreText: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.textLight,
    },
    arrowContainer: {
        marginLeft: 'auto', // Pushes to right
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#F3F4F6',
        justifyContent: 'center',
        alignItems: 'center',
    },
    updateBadge: {
        backgroundColor: '#F8FAFC',
        padding: 16,
        borderRadius: 16,
        flexDirection: 'row',
        gap: 12,
        alignItems: 'flex-start',
    },
    updateText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        flex: 1,
    },
    updateSub: {
        fontWeight: '400',
        color: '#15803d',
        fontSize: 12,
    },
    quote: {
        marginTop: 32,
        textAlign: 'center',
        fontStyle: 'italic',
        color: colors.textLight,
        fontSize: 14,
        opacity: 0.8,
    },
    // Empty State
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 32,
    },
    emptyTitle: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 12,
    },
    emptyText: {
        fontSize: 16,
        color: colors.textLight,
        textAlign: 'center',
        marginBottom: 32,
    },
    emptyButton: {
        width: '100%',
    },
    // Invite Styles
    inviteBanner: {
        backgroundColor: colors.primary,
        margin: 16,
        padding: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.2,
        shadowRadius: 8,
        elevation: 4,
    },
    inviteBannerText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 14,
        flex: 1,
    },
    // Modal
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
        maxHeight: '80%',
    },
    modalTitle: {
        fontSize: 20,
        fontWeight: '700',
        marginBottom: 16,
        color: colors.text,
        textAlign: 'center',
    },
    modalSub: {
        textAlign: 'center',
        color: colors.textLight,
        marginBottom: 24,
    },
    inviteCard: {
        backgroundColor: colors.background,
        padding: 16,
        borderRadius: 16,
        marginBottom: 16,
    },
    inviteMsg: {
        fontSize: 16,
        color: colors.text,
        marginBottom: 8,
        lineHeight: 22,
    },
    inviteSub: {
        fontSize: 12,
        color: colors.textLight,
        marginBottom: 16,
    },
    modalButtons: {
        flexDirection: 'row',
        gap: 12,
    },
    modalButtonCancel: {
        flex: 1,
        padding: 12,
        alignItems: 'center',
        borderWidth: 1,
        borderColor: colors.gray,
        borderRadius: 12,
    },
    modalButtonSubmit: {
        flex: 1,
        padding: 12,
        alignItems: 'center',
        backgroundColor: colors.primary,
        borderRadius: 12,
    },
    modalButtonTextCancel: {
        fontWeight: '600',
        color: colors.textLight,
    },
    modalButtonTextSubmit: {
        fontWeight: '700',
        color: colors.white,
    },
    // Invite CTA
    inviteCTA: {
        backgroundColor: colors.white,
        borderRadius: 20,
        padding: 16,
        marginTop: 24,
        flexDirection: 'row',
        alignItems: 'center',
        gap: 16,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    inviteIconBox: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: '#F0FDF4',
        justifyContent: 'center',
        alignItems: 'center',
    },
    inviteCTATitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 2,
    },
    inviteCTASub: {
        fontSize: 13,
        color: colors.textLight,
    },
    // Reflection
    reflectionCard: {
        backgroundColor: '#FFF7ED',
        padding: 20,
        borderRadius: 24,
        marginTop: 24,
        borderWidth: 1,
        borderColor: '#FFEDD5',
    },
    reflectionCardDone: {
        backgroundColor: '#F0FDF4',
        borderColor: '#DCFCE7',
    },
    refHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 12,
    },
    refTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#F59E0B',
        letterSpacing: 1,
    },
    refQuestion: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 16,
        lineHeight: 24,
    },
    refInputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        gap: 12,
    },
    refInput: {
        flex: 1,
        backgroundColor: colors.white,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FFEDD5',
        minHeight: 80,
        textAlignVertical: 'top',
    },
    refSubmitBtn: {
        paddingBottom: 4,
    },
    refAnswerBox: {
        backgroundColor: colors.white,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#DCFCE7',
    },
    refAnswerText: {
        fontSize: 16,
        fontStyle: 'italic',
        color: colors.text,
        marginBottom: 8,
    },
    refEditLink: {
        fontSize: 12,
        color: colors.primary,
        fontWeight: '600',
    },
    // Reminder Card
    reminderCard: {
        backgroundColor: '#F8FAFC',
        padding: 20,
        borderRadius: 24,
        marginTop: 24,
        borderWidth: 1,
        borderColor: '#F1F5F9',
    },
    reminderHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 8,
    },
    reminderTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: colors.primary,
        letterSpacing: 1,
    },
    reminderText: {
        fontSize: 14,
        color: colors.textLight,
        marginBottom: 12,
    },
    reminderBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    reminderBtnText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.primary,
    },
    // Journal Link
    journalLinkCard: {
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: 20,
        marginBottom: 24,
        marginTop: 12,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    journalLinkHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    journalLinkTitle: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9CA3AF',
        letterSpacing: 1,
    },
    journalSubText: {
        fontSize: 15,
        color: colors.text,
        lineHeight: 22,
    },
    journalDate: {
        fontSize: 12,
        color: colors.textLight,
        marginTop: 6,
    },
});
