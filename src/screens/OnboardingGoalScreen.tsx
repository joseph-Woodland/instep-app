
import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Switch, ActivityIndicator, Alert, Image, Modal, TextInput, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { GroupService } from '../services/GroupService';
import { GoalService } from '../services/GoalService';

import { useAuth } from '../context/AuthContext';

// Assets
const goalRunImg = require('../../assets/images/goal_run.png');
const goalCodeImg = require('../../assets/images/goal_code.png');
const goalSavingsImg = require('../../assets/images/goal_savings.png');

// Helper to style goals based on ID (simulating the design's specific categories)
const getGoalStyle = (id: string) => {
    if (id.includes('run') || id.includes('5k')) return { label: 'Get Active', sub: 'Run 5K', color: colors.cardMint, image: goalRunImg };
    if (id.includes('code') || id.includes('learn')) return { label: 'Learn Skill', sub: 'Basic Coding', color: colors.cardBeige, image: goalCodeImg };
    if (id.includes('save') || id.includes('1000')) return { label: 'Save Money', sub: 'Save £1,000', color: '#E0F7FA', image: goalSavingsImg };
    return { label: 'Custom Goal', sub: 'My Goal', color: colors.cardBrown, image: goalRunImg };
};

export const OnboardingGoalScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();
    const {
        userId,
        setGoal: setContextGoal,
        setExperienceLevel,
        setSelectedGoalId: setContextGoalId,
        setGroupId: setContextGroupId
    } = useUser();
    const { user } = useAuth();

    const [selectedGoalId, setSelectedGoalId] = useState<string | null>(null);
    const [level, setLevel] = useState<'Beginner' | 'Experienced'>('Beginner');
    const [guideToggle, setGuideToggle] = useState(true);
    const [loading, setLoading] = useState(false);
    const [requestModalVisible, setRequestModalVisible] = useState(false);
    const [requestText, setRequestText] = useState('');
    const [goals, setGoals] = React.useState<any[]>([]);

    // Invite Code State (Phase 13)
    const [inviteCode, setInviteCode] = useState('');
    const [inviteError, setInviteError] = useState('');

    React.useEffect(() => {
        const loadGoals = async () => {
            const fetchedGoals = await GoalService.getAvailableGoals();
            setGoals(fetchedGoals);
        };
        loadGoals();
    }, []);

    const handleContinue = async () => {
        // --- 1. Invite Code Path ---
        if (inviteCode.trim().length > 0) {
            setLoading(true);
            setInviteError('');
            try {
                const validation = await GroupService.validateGroupInvite(inviteCode.trim());
                if (!validation.valid) {
                    setInviteError(validation.message || "Invalid code");
                    setLoading(false);
                    return; // Stop here
                }

                // If valid:
                if (!user) {
                    // Pass to SignUp
                    navigation.navigate('SignUp', {
                        inviteCode: inviteCode.trim(),
                        goalId: validation.invite?.goalId,
                        groupId: validation.invite?.groupId
                    });
                    return;
                } else {
                    // Already logged in? Redeem immediately
                    const res = await GroupService.redeemGroupInvite(userId, inviteCode.trim());
                    if (res.success && res.groupId && res.goalId) {
                        setContextGroupId(res.groupId);
                        setContextGoalId(res.goalId);

                        // Auto-post system message (Chunk 4)
                        // Ideally done server-side or implicitly, but we can do it here or in SignUp
                        // For now, simple redirect
                        navigation.navigate('MainTabs', {
                            screen: 'GroupChat',
                            params: { groupId: res.groupId, goalId: res.goalId }
                        });
                        return;
                    } else {
                        Alert.alert("Error", res.message || "Could not join group.");
                        setLoading(false);
                        return;
                    }
                }
            } catch (e) {
                console.error("Invite validation error", e);
                setInviteError("Something went wrong validating the code.");
                setLoading(false);
                return;
            }
        }

        // --- 2. Standard Path (No Invite) ---
        if (!selectedGoalId) {
            Alert.alert('Required', 'Please select a goal.');
            return;
        }

        const goalDef = goals.find((g: any) => g.id === selectedGoalId);
        if (goalDef) setContextGoal(goalDef.name);
        setExperienceLevel(level);
        setContextGoalId(selectedGoalId);

        if (!user) {
            // "Login wall after goal selection"
            navigation.navigate('SignUp');
            return;
        }

        setLoading(true);
        let groupId = "offline-group-id"; // Fallback ID

        try {
            // 1. Try Assign User to Group
            groupId = await GroupService.assignUserToGroup(userId, selectedGoalId);
        } catch (e) {
            console.warn("Group assignment failed, using fallback mode.", e);
            // Allow proceeding even if backend fails (Demo/Offline resilience)
        }

        try {
            // 2. Update Context
            const goalDef = goals.find((g: any) => g.id === selectedGoalId);
            if (goalDef) setContextGoal(goalDef.name);
            setExperienceLevel(level);
            setContextGoalId(selectedGoalId);
            setContextGroupId(groupId);

            // 3. Handle Guide Role if Experienced AND Toggle is ON
            if (level === 'Experienced' && guideToggle) {
                try {
                    await GroupService.updateUserRoleToGuide(userId, groupId, selectedGoalId);
                } catch (roleError) {
                    console.warn("Role update failed", roleError);
                }
            }

            // Navigate to Home
            navigation.navigate('MainTabs', {
                screen: 'Home',
            });

        } catch (e) {
            Alert.alert("Error", "Something went wrong. Please try again.");
            console.error(e);
        } finally {
            setLoading(false);
        }
    };

    return (
        <View style={styles.outerContainer}>
            <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
                <View style={styles.progressHeader}>
                    <View style={[styles.progressDot, styles.activeDot]} />
                    <View style={styles.progressDot} />
                    <View style={styles.progressDot} />
                </View>

                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
                    <View style={styles.headerTextContainer}>
                        <Text style={styles.headerTitle}>Let's find your path.</Text>
                        <Text style={styles.headerSub}>Pick a goal to find your supportive circle.</Text>
                    </View>

                    {/* Goal Grid */}
                    <View style={styles.grid}>
                        {goals.length === 0 && <ActivityIndicator size="small" />}
                        {goals.map((g: any) => {
                            const style = getGoalStyle(g.id);
                            const isSelected = selectedGoalId === g.id;
                            return (
                                <TouchableOpacity
                                    key={g.id}
                                    style={[styles.card, isSelected && styles.cardSelected]}
                                    onPress={() => setSelectedGoalId(g.id)}
                                    activeOpacity={0.9}
                                >
                                    <View style={[styles.cardImagePlaceholder, { backgroundColor: style.color }]}>
                                        <Image
                                            source={style.image}
                                            style={styles.cardImage}
                                            resizeMode="contain"
                                        />
                                        {isSelected && (
                                            <View style={styles.checkBadge}>
                                                <Ionicons name="checkmark" size={12} color={colors.white} />
                                            </View>
                                        )}
                                    </View>
                                    <View style={styles.cardTextContent}>
                                        <Text style={styles.cardTitle}>{style.label}</Text>
                                        <Text style={styles.cardSub}>{style.sub}</Text>
                                        {/* Fallback to actual name if it differs significantly */}
                                        <Text style={styles.cardRealName} numberOfLines={1}>{g.name}</Text>
                                    </View>
                                </TouchableOpacity>
                            );
                        })}

                        {/* Request Card */}
                        <TouchableOpacity
                            style={[styles.card, { borderColor: colors.gray, borderStyle: 'dashed' }]}
                            onPress={() => setRequestModalVisible(true)}
                        >
                            <View style={[styles.cardImagePlaceholder, { backgroundColor: '#F5F5F5' }]}>
                                <Ionicons name="add" size={32} color={colors.textLight} />
                            </View>
                            <View style={styles.cardTextContent}>
                                <Text style={styles.cardTitle}>Something Else?</Text>
                                <Text style={styles.cardSub}>Request a goal</Text>
                            </View>
                        </TouchableOpacity>
                    </View>

                    {/* Request Modal */}
                    <Modal visible={requestModalVisible} transparent animationType="slide">
                        <View style={styles.modalOverlay}>
                            <View style={styles.modalContent}>
                                <Text style={styles.modalTitle}>Request a Goal</Text>
                                <Text style={styles.modalSub}>What are you trying to achieve?</Text>
                                <TextInput
                                    style={styles.modalInput}
                                    placeholder="e.g. Learning French, Marathon Training..."
                                    value={requestText}
                                    onChangeText={setRequestText}
                                    autoFocus
                                />
                                <View style={styles.modalButtons}>
                                    <TouchableOpacity onPress={() => setRequestModalVisible(false)} style={styles.modalButtonCancel}>
                                        <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                                    </TouchableOpacity>
                                    <TouchableOpacity
                                        style={styles.modalButtonSubmit}
                                        onPress={async () => {
                                            if (requestText.trim()) {
                                                await GoalService.createGoalRequest(userId, requestText, 'new_goal');
                                                Alert.alert("Received!", "We'll let you know when this goal is available.");
                                                setRequestText('');
                                                setRequestModalVisible(false);
                                            }
                                        }}
                                    >
                                        <Text style={styles.modalButtonTextSubmit}>Submit Request</Text>
                                    </TouchableOpacity>
                                </View>
                            </View>
                        </View>
                    </Modal>

                    {/* Experience Level */}
                    <View style={styles.section}>
                        <Text style={styles.sectionTitle}>How familiar are you with this?</Text>
                        <View style={styles.levelRow}>
                            <TouchableOpacity
                                style={[styles.levelCard, level === 'Beginner' && styles.levelCardSelected]}
                                onPress={() => setLevel('Beginner')}
                            >
                                <Ionicons
                                    name="leaf-outline"
                                    size={28}
                                    color={level === 'Beginner' ? colors.primary : colors.textLight}
                                />
                                <Text style={[styles.levelText, level === 'Beginner' && { color: colors.text }]}>Just Starting</Text>
                            </TouchableOpacity>

                            <TouchableOpacity
                                style={[styles.levelCard, level === 'Experienced' && styles.levelCardSelected]}
                                onPress={() => setLevel('Experienced')}
                            >
                                <Ionicons
                                    name="barbell-outline"
                                    size={28}
                                    color={level === 'Experienced' ? colors.primary : colors.textLight}
                                />
                                <Text style={[styles.levelText, level === 'Experienced' && { color: colors.text }]}>I have a routine</Text>
                            </TouchableOpacity>
                        </View>
                    </View>

                    {/* Guide Option */}
                    <View style={styles.guideCard}>
                        <View style={styles.guideInfo}>
                            <View style={styles.guideHeader}>
                                <Ionicons name={level === 'Experienced' ? "school-outline" : "happy-outline"} size={22} color={colors.primary} />
                                <Text style={styles.guideTitle}>
                                    {level === 'Experienced' ? "Coach others as a Guide?" : "Add a supportive Guide?"}
                                </Text>
                            </View>
                            <Text style={styles.guideDesc}>
                                {level === 'Experienced'
                                    ? "Share your experience and help beginners succeed."
                                    : "A friendly guide to check in on you. No pressure."}
                            </Text>
                        </View>
                        <Switch
                            value={guideToggle}
                            onValueChange={setGuideToggle}
                            trackColor={{ false: "#E0E0E0", true: colors.primary }}
                            thumbColor={colors.white}
                        />
                    </View>

                    <View style={styles.footerInner}>
                        {/* Invite Code Input */}
                        <View style={styles.inviteSection}>
                            <Text style={styles.inviteLabel}>Have an invite code?</Text>
                            <View style={styles.inviteInputContainer}>
                                <TextInput
                                    style={styles.inviteInput}
                                    placeholder="e.g. TG-ABCD"
                                    value={inviteCode}
                                    onChangeText={text => {
                                        setInviteCode(text);
                                        setInviteError('');
                                    }}
                                    autoCapitalize="characters"
                                    maxLength={8}
                                />
                            </View>
                            <Text style={styles.inviteHint}>
                                {inviteError ?
                                    <Text style={{ color: '#EF4444' }}>{inviteError}</Text> :
                                    "If a friend invited you, enter the code to join their group."
                                }
                            </Text>
                        </View>

                        {loading ? (
                            <ActivityIndicator size="large" color={colors.primary} />
                        ) : (
                            <TouchableOpacity style={styles.continueButton} onPress={handleContinue}>
                                <Text style={styles.continueText}>Continue</Text>
                                <Ionicons name="arrow-forward" size={20} color={colors.text} />
                            </TouchableOpacity>
                        )}
                    </View>
                </ScrollView>
            </SafeAreaView>
        </View>
    );
};

const styles = StyleSheet.create({
    outerContainer: {
        flex: 1,
        ...Platform.select({
            web: {
                position: 'absolute',
                top: 0,
                bottom: 0,
                left: 0,
                right: 0,
            }
        }),
        overflow: 'hidden',
    },
    container: {
        flex: 1,
        height: '100%',
        backgroundColor: colors.background,
    },
    progressHeader: {
        flexDirection: 'row',
        justifyContent: 'center',
        paddingVertical: 16,
        gap: 8,
    },
    progressDot: {
        width: 32,
        height: 6,
        backgroundColor: colors.gray,
        borderRadius: 3,
    },
    activeDot: {
        backgroundColor: colors.primary,
    },
    scrollContent: {
        paddingBottom: 100,
    },
    headerTextContainer: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    headerTitle: {
        fontSize: 32,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 8,
    },
    headerSub: {
        fontSize: 16,
        color: colors.textLight,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        paddingHorizontal: 16,
        gap: 16,
        marginBottom: 32,
    },
    card: {
        width: '47%', // roughly half minus gap
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 12,
        // Shadow
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
        borderWidth: 2,
        borderColor: 'transparent',
    },
    cardSelected: {
        borderColor: colors.primary,
        backgroundColor: '#F0FDF4', // Very light mint
    },
    cardImagePlaceholder: {
        width: '100%',
        aspectRatio: 1,
        borderRadius: 12,
        marginBottom: 12,
        justifyContent: 'center',
        alignItems: 'center',
        position: 'relative',
    },
    cardImage: {
        width: '60%',
        height: '60%',
    },
    checkBadge: {
        position: 'absolute',
        top: 8,
        right: 8,
        backgroundColor: colors.primary,
        borderRadius: 12,
        width: 20,
        height: 20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    cardTextContent: {
        gap: 2,
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    cardSub: {
        fontSize: 12,
        color: colors.textLight,
        fontWeight: '500',
    },
    cardRealName: {
        fontSize: 10,
        color: colors.textLight,
        marginTop: 4,
        opacity: 0.8,
    },
    section: {
        paddingHorizontal: 24,
        marginBottom: 24,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 16,
    },
    levelRow: {
        flexDirection: 'row',
        gap: 12,
    },
    levelCard: {
        flex: 1,
        backgroundColor: colors.white,
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        gap: 8,
        borderWidth: 2,
        borderColor: 'transparent',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.03,
        shadowRadius: 6,
    },
    levelCardSelected: {
        borderColor: colors.primary,
        backgroundColor: '#F0FDF4',
    },
    levelText: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.textLight,
    },
    guideCard: {
        marginHorizontal: 24,
        backgroundColor: '#E6F4EA', // Minty
        borderRadius: 16,
        padding: 16,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: 'rgba(19, 236, 91, 0.2)',
    },
    guideInfo: {
        flex: 1,
        marginRight: 16,
    },
    guideHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        marginBottom: 4,
    },
    guideTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
    },
    guideDesc: {
        fontSize: 13,
        color: colors.textLight,
        lineHeight: 18,
    },
    footerInner: {
        padding: 24,
        paddingBottom: 40,
    },
    continueButton: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        height: 56,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 4,
    },
    continueText: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    // Modal Styles
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
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
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
        backgroundColor: colors.background,
        borderRadius: 12,
        padding: 16,
        fontSize: 16,
        marginBottom: 24,
    },
    modalButtons: {
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
        color: colors.text,
    },
    // Invite
    inviteSection: {
        marginBottom: 24,
    },
    inviteLabel: {
        fontSize: 14,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 8,
    },
    inviteInputContainer: {
        backgroundColor: colors.white,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: '#E5E7EB',
        marginBottom: 8,
    },
    inviteInput: {
        padding: 16,
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
        letterSpacing: 1,
    },
    inviteHint: {
        fontSize: 12,
        color: colors.textLight,
        marginLeft: 4,
    },
});
