import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Image, Modal, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { Header } from '../components/Header';
import { GroupService } from '../services/GroupService';
import { UserService } from '../services/UserService';
import { useUser } from '../context/UserContext';
import { GoalService, UserGoal } from '../services/GoalService';
import { getGoalById, getMilestone } from '../data/goals';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const heroBlobs = require('../assets/images/hero_blobs.png');

interface MemberProfileProps {
    visible: boolean;
    userId: string | null;
    onClose: () => void;
    currentGoalId: string;
}

const MemberProfileModal: React.FC<MemberProfileProps> = ({ visible, userId, onClose, currentGoalId }) => {
    const [loading, setLoading] = useState(true);
    const [profile, setProfile] = useState<any>(null);
    const [userGoal, setUserGoal] = useState<UserGoal | null>(null);

    useEffect(() => {
        if (visible && userId) {
            loadProfile();
        }
    }, [visible, userId]);

    const loadProfile = async () => {
        if (!userId) return;
        setLoading(true);
        try {
            const [u, g] = await Promise.all([
                UserService.getUser(userId),
                GoalService.getOrCreateUserGoal(userId, currentGoalId) // Assuming they are in the group for this goal
            ]);
            setProfile(u);
            setUserGoal(g);
        } catch (e) {
            console.error("Err loading detailed profile", e);
        } finally {
            setLoading(false);
        }
    };

    if (!visible) return null;

    const goalDef = getGoalById(currentGoalId);

    // Get Initials logic
    const getInitials = (name?: string) => {
        if (!name) return '??';
        const parts = name.split(' ').filter(p => p.length > 0);
        if (parts.length === 0) return '??';
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    };

    return (
        <Modal visible={visible} transparent animationType="slide">
            <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                    {loading ? (
                        <ActivityIndicator color={colors.primary} />
                    ) : (
                        <>
                            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
                                <Ionicons name="close" size={24} color={colors.textLight} />
                            </TouchableOpacity>

                            <View style={styles.profileHeader}>
                                {profile?.photoUrl ? (
                                    <Image source={{ uri: profile.photoUrl }} style={styles.profileAvatarLarge} />
                                ) : (
                                    <View style={[styles.profileAvatarLarge, { backgroundColor: '#E0E7FF', alignItems: 'center', justifyContent: 'center' }]}>
                                        <Text style={{ fontSize: 24, fontWeight: '700', color: colors.primary }}>
                                            {getInitials(profile?.displayName)}
                                        </Text>
                                    </View>
                                )}
                                <Text style={styles.profileName}>{profile?.displayName || 'Unknown'}</Text>
                                <Text style={styles.profileRole}>{profile?.role === 'guide' ? 'Guide' : 'Member'}</Text>
                            </View>

                            <View style={styles.statsRow}>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>{Math.round(userGoal?.progressPercent || 0)}%</Text>
                                    <Text style={styles.statLabel}>Progress</Text>
                                </View>
                                <View style={styles.statItem}>
                                    <Text style={styles.statValue}>
                                        {userGoal ? new Date(userGoal.startDate).toLocaleDateString() : '-'}
                                    </Text>
                                    <Text style={styles.statLabel}>Started</Text>
                                </View>
                            </View>

                            {userGoal && (
                                <View style={styles.focusCard}>
                                    <Text style={styles.focusLabel}>Current Focus</Text>
                                    <Text style={styles.focusValue}>
                                        {getMilestone(currentGoalId, userGoal.currentMilestoneId)?.title || 'Finished'}
                                    </Text>
                                    <View style={styles.progressBarBg}>
                                        <View style={[styles.progressBarFill, { width: `${userGoal.progressPercent}%` }]} />
                                    </View>
                                </View>
                            )}

                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
};

export const GroupMembersScreen = () => {
    const navigation = useNavigation<any>();
    const { groupId, selectedGoalId, userId } = useUser();
    const [loading, setLoading] = useState(true);
    const [members, setMembers] = useState<any[]>([]);
    const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);

    useEffect(() => {
        loadMembers();
    }, [groupId]);

    const loadMembers = async () => {
        if (!groupId || !selectedGoalId) {
            setLoading(false);
            return;
        }
        try {
            const userIds = await GroupService.getGroupMembers(groupId);
            const usersMap = await UserService.getUsers(userIds);

            // Parallel fetch of goal progress/focus for each member
            const fullMembers = await Promise.all(userIds.map(async (uid) => {
                let focus = "Just joined";
                try {
                    const ug = await GoalService.getOrCreateUserGoal(uid, selectedGoalId);
                    if (ug) {
                        const ms = getMilestone(selectedGoalId, ug.currentMilestoneId);
                        if (ms) focus = ms.title;
                        else if (ug.currentMilestoneId) focus = "Active";
                    }
                } catch (e) {
                    console.log("No goal for", uid);
                }

                return {
                    id: uid,
                    ...usersMap[uid],
                    focus
                };
            }));

            // Append Invite Card placeholder
            setMembers([...fullMembers, { id: 'invite_card_special', type: 'invite' }]);

        } catch (e) {
            console.error("Err loading members", e);
        } finally {
            setLoading(false);
        }
    };

    const renderItem = ({ item, index }: { item: any, index: number }) => {
        // 1. Invite Card
        if (item.type === 'invite') {
            return (
                <TouchableOpacity
                    style={styles.cardInvite}
                    onPress={() => navigation.navigate('InviteFriendModal' as any)} // Or handle modal
                >
                    <View style={styles.inviteIconCircle}>
                        <Ionicons name="add" size={32} color={colors.textLight} />
                    </View>
                    <Text style={styles.inviteText}>Invite Friend</Text>
                </TouchableOpacity>
            );
        }

        // 2. Member Card
        const isMe = item.id === userId;

        const isGuide = item.role === 'guide';

        let borderStyle = { borderTopColor: '#E0F2FE' }; // Default Blue
        if (isMe) borderStyle = { borderTopColor: '#ccfbf1' }; // Mint
        if (isGuide) borderStyle = { borderTopColor: colors.primary }; // Green

        // Random accent for others if desired, or index based
        const accents = ['#E0F2FE', '#fef3c7', '#fce7f3'];
        if (!isMe && !isGuide) {
            borderStyle = { borderTopColor: accents[index % accents.length] };
        }

        return (
            <TouchableOpacity
                style={[styles.cardMember, borderStyle]}
                onPress={() => setSelectedMemberId(item.id)}
                activeOpacity={0.9}
            >
                {isMe && (
                    <View style={styles.badgeYou}>
                        <Text style={styles.badgeYouText}>You</Text>
                    </View>
                )}

                <View style={styles.avatarContainer}>
                    <Image
                        source={{ uri: item.photoUrl || 'https://via.placeholder.com/100' }}
                        style={styles.avatarLarge}
                    />
                    {isGuide && (
                        <View style={styles.badgeGuideIcon}>
                            <Ionicons name="leaf" size={14} color={colors.white} />
                        </View>
                    )}
                </View>

                <View style={styles.nameRow}>
                    <Text style={styles.cardName} numberOfLines={1}>{item.displayName}</Text>
                    {isGuide && (
                        <View style={styles.tagGuide}>
                            <Text style={styles.tagGuideText}>GUIDE</Text>
                        </View>
                    )}
                </View>

                <View style={styles.focusContainer}>
                    <Text style={styles.focusText} numberOfLines={2}>"{item.focus}"</Text>
                </View>

                {/* Action Button */}
                <View style={[styles.cardBtn, isGuide ? styles.btnCheer : styles.btnHighFive]}>
                    <Ionicons
                        name={isMe ? "ellipse-outline" : (isGuide ? "heart" : "thumbs-up")}
                        size={16}
                        color={isGuide ? colors.primary : colors.textLight}
                    />
                    <Text style={[styles.cardBtnText, isGuide && { color: colors.primary }]}>
                        {isMe ? "Current Focus" : (isGuide ? "Cheer" : "High Five")}
                    </Text>
                </View>
            </TouchableOpacity>
        );
    };

    if (loading) {
        return (
            <SafeAreaView style={styles.container}>
                <Header title="Group Members" />
                <ActivityIndicator style={{ marginTop: 20 }} color={colors.primary} />
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Custom Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.roundBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={{ alignItems: 'center' }}>
                    <Text style={styles.headerTitle}>Morning Movers</Text>
                    <Text style={styles.headerSubtitle}>Group of {members.filter(m => m.type !== 'invite').length}</Text>
                </View>
                <TouchableOpacity style={styles.roundBtn}>
                    <Ionicons name="settings-outline" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <FlatList
                data={members}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                numColumns={2}
                columnWrapperStyle={{ gap: 12 }}
                contentContainerStyle={styles.gridContent}
                ListHeaderComponent={
                    <View style={styles.heroSection}>
                        <Image
                            source={heroBlobs}
                            style={StyleSheet.absoluteFillObject}
                            resizeMode="cover"
                        />
                        <View style={styles.heroOverlay} />
                        <View style={styles.heroIcon}>
                            <Ionicons name="people" size={24} color={colors.primary} />
                        </View>
                        <Text style={styles.heroTitle}>You’re in this together.</Text>
                        <Text style={styles.heroDesc}>Friends rooting for you to hit your goals this week.</Text>
                    </View>
                }
                ListFooterComponent={
                    <Text style={styles.footerText}>This group is a safe space for progress, not perfection.</Text>
                }
            />

            <MemberProfileModal
                visible={!!selectedMemberId}
                userId={selectedMemberId}
                onClose={() => setSelectedMemberId(null)}
                currentGoalId={selectedGoalId || ''}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    // New Styles
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 16,
        paddingVertical: 12,
    },
    headerTitle: {
        fontSize: 18,
        fontWeight: '800',
        color: colors.text,
    },
    headerSubtitle: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.textLight,
    },
    roundBtn: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
    },
    gridContent: {
        padding: 16,
        paddingBottom: 40,
    },
    heroSection: {
        alignItems: 'center',
        paddingVertical: 24,
        marginBottom: 8,
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(255,255,255,0.7)',
        zIndex: 0
    },
    heroIcon: {
        backgroundColor: '#ECFDF5',
        padding: 12,
        borderRadius: 50,
        marginBottom: 16,
    },
    heroTitle: {
        fontSize: 28,
        fontWeight: '800',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 8,
    },
    heroDesc: {
        fontSize: 16,
        color: colors.textLight,
        textAlign: 'center',
        maxWidth: 260,
        lineHeight: 24,
    },
    // Cards
    cardMember: {
        flex: 1,
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: 16,
        alignItems: 'center',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 12,
        borderTopWidth: 4,
        borderTopColor: '#E0F2FE',
        marginBottom: 12,
    },
    cardInvite: {
        flex: 1,
        backgroundColor: '#F8FAFC', // Slate 50
        borderRadius: 24,
        padding: 16,
        alignItems: 'center',
        justifyContent: 'center',
        borderWidth: 2,
        borderColor: '#E2E8F0',
        borderStyle: 'dashed',
        minHeight: 200,
        gap: 12,
    },
    inviteIconCircle: {
        width: 56,
        height: 56,
        borderRadius: 28,
        backgroundColor: colors.white,
        justifyContent: 'center',
        alignItems: 'center',
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 4,
    },
    inviteText: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.textLight,
    },
    avatarContainer: {
        marginBottom: 12,
        position: 'relative',
    },
    avatarLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        backgroundColor: '#E2E8F0',
        borderWidth: 4,
        borderColor: colors.white,
    },
    badgeYou: {
        position: 'absolute',
        top: 12,
        right: 12,
        backgroundColor: '#F1F5F9',
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
    },
    badgeYouText: {
        fontSize: 10,
        fontWeight: '700',
        color: '#64748B',
    },
    badgeGuideIcon: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primary,
        padding: 4,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: colors.white,
    },
    nameRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginBottom: 4,
    },
    cardName: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    tagGuide: {
        backgroundColor: '#ECFDF5',
        paddingHorizontal: 4,
        paddingVertical: 2,
        borderRadius: 4,
    },
    tagGuideText: {
        fontSize: 10,
        fontWeight: '700',
        color: colors.primary,
    },
    focusContainer: {
        height: 40,
        justifyContent: 'center',
        marginBottom: 16,
    },
    focusText: {
        fontSize: 12,
        color: colors.textLight,
        textAlign: 'center',
        fontStyle: 'italic',
    },
    cardBtn: {
        width: '100%',
        paddingVertical: 10,
        borderRadius: 16,
        backgroundColor: '#F8FAFC',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
    },
    btnCheer: {
        backgroundColor: '#ECFDF5',
    },
    btnHighFive: {
        backgroundColor: '#F8FAFC',
    },
    cardBtnText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#64748B',
    },
    footerText: {
        textAlign: 'center',
        fontSize: 12,
        color: colors.textLight,
        marginTop: 24,
        marginBottom: 24,
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
        alignItems: 'center',
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        padding: 8,
    },
    profileAvatarLarge: {
        width: 80,
        height: 80,
        borderRadius: 40,
        marginBottom: 16,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 24,
    },
    profileName: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    profileRole: {
        fontSize: 14,
        color: colors.primary,
        fontWeight: '600',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    statsRow: {
        flexDirection: 'row',
        gap: 32,
        marginBottom: 24,
    },
    statItem: {
        alignItems: 'center',
    },
    statValue: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    statLabel: {
        fontSize: 12,
        color: colors.textLight,
    },
    focusCard: {
        width: '100%',
        backgroundColor: '#F3F4F6',
        padding: 16,
        borderRadius: 16,
    },
    focusLabel: {
        fontSize: 12,
        color: colors.textLight,
        marginBottom: 4,
    },
    focusValue: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 12,
    },
    progressBarBg: {
        height: 6,
        backgroundColor: '#E5E7EB',
        borderRadius: 3,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: colors.primary,
    }
});
