import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity, Image, KeyboardAvoidingView, Platform, Keyboard, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { useUser } from '../context/UserContext';
import { ChatService, ChatMessage } from '../services/ChatService';
import { GroupService } from '../services/GroupService';
import { GoalService } from '../services/GoalService';
import { useAuth } from '../context/AuthContext';
import { LinearGradient } from 'expo-linear-gradient';
import { useNavigation } from '@react-navigation/native';
import { GuideJourneyModal } from '../components/GuideJourneyModal';
import { InviteFriendModal } from '../components/InviteFriendModal';
import { CheckInModal } from '../components/CheckInModal';
import { getGoalById } from '../data/goals';

export const GroupChatScreen = () => {
    const navigation = useNavigation();
    const { groupId, userId, selectedGoalId } = useUser();
    const { user } = useAuth();

    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputText, setInputText] = useState('');
    const [loading, setLoading] = useState(true);
    const [groupName, setGroupName] = useState('Support Group');
    const [daysActive, setDaysActive] = useState(1);

    // Milestones for CheckIn
    const [milestones, setMilestones] = useState<{ id: string, title: string }[]>([]);

    // Modals
    const [inviteModalVisible, setInviteModalVisible] = useState(false);
    const [guideModalVisible, setGuideModalVisible] = useState(false);
    const [checkInVisible, setCheckInVisible] = useState(false);

    const flatListRef = useRef<FlatList>(null);

    useEffect(() => {
        if (groupId) {
            // Subscribe to Chat
            const unsub = ChatService.subscribeToGroupMessages(groupId, (msgs) => {
                setMessages(msgs);
                setLoading(false);
            });

            // Load Group & Goal Details
            loadDetails();

            return () => unsub();
        }
    }, [groupId, selectedGoalId]);

    const loadDetails = async () => {
        if (!groupId || !selectedGoalId) return;
        try {
            const [grp, ug] = await Promise.all([
                GroupService.getGroup(groupId),
                GoalService.getOrCreateUserGoal(userId, selectedGoalId)
            ]);

            if (grp) setGroupName(grp.name);

            if (ug) {
                // Calculate Days Active
                const start = new Date(ug.startDate);
                const diffTime = Math.abs(Date.now() - start.getTime());
                const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                setDaysActive(diffDays || 1);
            }

            // Load Milestones
            const goalDef = getGoalById(selectedGoalId);
            if (goalDef) {
                setMilestones(goalDef.milestones.map(m => ({ id: m.id, title: m.title })));
            }

        } catch (e) {
            console.error("Load Chat Details Err", e);
        }
    };

    const handleSend = async () => {
        if (inputText.trim().length === 0 || !groupId || !user) return;

        const text = inputText.trim();
        setInputText('');

        try {
            await ChatService.sendMessage(
                groupId,
                user.uid,
                user.displayName || 'Member',
                text,
                user.photoURL || undefined
            );
        } catch (error) {
            console.error("Send error", error);
        }
    };

    const handleCheckInSubmit = async (note: string, milestoneId: string | null, photo: string | null) => {
        if (!groupId || !userId || !selectedGoalId || !user) return;

        try {
            const result = await GoalService.submitCheckIn(userId, selectedGoalId, groupId, note, milestoneId, null);
            if (result.success) {
                setCheckInVisible(false);
                // Send a message to the group
                if (result.milestoneCompletedName) {
                    await ChatService.sendMessage(
                        groupId,
                        user.uid,
                        user.displayName || 'Member',
                        `🏆 I just smashed a milestone: ${result.milestoneCompletedName}!`,
                        user.photoURL || undefined
                    );
                } else {
                    // Optionally post regular checkin? user might prefer manual.
                    // Let's post it for engagement.
                    await ChatService.sendMessage(
                        groupId,
                        user.uid,
                        user.displayName || 'Member',
                        `✅ Check-in: ${note}`,
                        user.photoURL || undefined
                    );
                }
            }
        } catch (e) {
            Alert.alert("Error", "Failed to save check-in.");
        }
    };

    const renderItem = ({ item, index }: { item: ChatMessage, index: number }) => {
        const isMe = item.userId === userId;
        const prevMsg = messages[index - 1];
        const showAvatar = !isMe && (!prevMsg || prevMsg.userId !== item.userId);
        const showName = showAvatar;

        return (
            <View style={[styles.msgRow, isMe ? styles.msgRowMe : styles.msgRowOther, { marginTop: showName ? 12 : 2 }]}>
                {!isMe && (
                    <View style={styles.avatarContainer}>
                        {showAvatar ? (
                            <Image
                                source={{ uri: item.userPhoto || 'https://via.placeholder.com/40' }}
                                style={styles.avatar}
                            />
                        ) : <View style={{ width: 32 }} />}
                    </View>
                )}

                <View style={[styles.bubbleContainer, isMe ? styles.bubbleMeContainer : styles.bubbleOtherContainer]}>
                    {!isMe && showName && <Text style={styles.senderName}>{item.userName}</Text>}

                    {isMe ? (
                        <LinearGradient
                            colors={['#13EC5B', '#10B981']}
                            start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }}
                            style={styles.bubbleMe}
                        >
                            <Text style={styles.textMe}>{item.text}</Text>
                        </LinearGradient>
                    ) : (
                        <View style={styles.bubbleOther}>
                            <Text style={styles.textOther}>{item.text}</Text>
                        </View>
                    )}
                </View>
            </View>
        );
    };

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            {/* Header */}
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
                <View style={styles.headerContent}>
                    <Text style={styles.groupName}>{groupName}</Text>
                    <View style={styles.statusRow}>
                        <View style={styles.statusDot} />
                        <Text style={styles.statusText}>Active now • Day {daysActive} of Goal</Text>
                    </View>
                </View>
                {/* Invite Friend Button in top right */}
                <TouchableOpacity style={styles.menuBtn} onPress={() => setInviteModalVisible(true)}>
                    <Ionicons name="person-add-outline" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            {/* Chat List */}
            <FlatList
                ref={flatListRef}
                data={messages}
                renderItem={renderItem}
                keyExtractor={item => item.id}
                contentContainerStyle={styles.listContent}
                onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
                onLayout={() => flatListRef.current?.scrollToEnd({ animated: true })}
                ListFooterComponent={<View style={{ height: 20 }} />}
            />

            {/* Input Area */}
            <KeyboardAvoidingView
                behavior={Platform.OS === "ios" ? "padding" : undefined}
                keyboardVerticalOffset={Platform.OS === "ios" ? 10 : 0}
            >
                <View style={styles.inputContainer}>
                    {/* Add Milestone / Check-In Button */}
                    <TouchableOpacity style={styles.addBtn} onPress={() => setCheckInVisible(true)}>
                        <Ionicons name="flag-outline" size={24} color={colors.primary} />
                    </TouchableOpacity>

                    <View style={styles.inputWrapper}>
                        <TextInput
                            style={styles.textInput}
                            placeholder="Message group..."
                            placeholderTextColor="#94A3B8"
                            value={inputText}
                            onChangeText={setInputText}
                            multiline
                        />
                        <TouchableOpacity style={styles.sendBtn} onPress={handleSend} disabled={inputText.length === 0}>
                            <Ionicons name="arrow-up" size={20} color={inputText.length > 0 ? colors.white : '#E2E8F0'} />
                        </TouchableOpacity>
                    </View>
                </View>
            </KeyboardAvoidingView>

            <InviteFriendModal
                visible={inviteModalVisible}
                onClose={() => setInviteModalVisible(false)}
            />

            <GuideJourneyModal
                visible={guideModalVisible}
                onClose={() => setGuideModalVisible(false)}
                goalId={selectedGoalId || ''}
                guideName="Guide"
                timeline={[]}
            />

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
        backgroundColor: '#F6F8F6', // Light Mint Grey
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'rgba(255,255,255,0.8)',
        borderBottomWidth: 1,
        borderBottomColor: '#F1F5F9',
        zIndex: 10,
    },
    backBtn: {
        padding: 8,
    },
    menuBtn: {
        padding: 8,
    },
    headerContent: {
        flex: 1,
        alignItems: 'center',
    },
    groupName: {
        fontSize: 16,
        fontWeight: '800',
        color: colors.text,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statusDot: {
        width: 6,
        height: 6,
        borderRadius: 3,
        backgroundColor: colors.primary,
    },
    statusText: {
        fontSize: 12,
        color: colors.textLight,
        fontWeight: '500',
    },
    listContent: {
        paddingHorizontal: 16,
        paddingVertical: 16,
        paddingBottom: 24, // extra padding for footer
    },
    // Message Rows
    msgRow: {
        flexDirection: 'row',
        marginBottom: 2,
    },
    msgRowMe: {
        justifyContent: 'flex-end',
    },
    msgRowOther: {
        justifyContent: 'flex-start',
    },
    avatarContainer: {
        width: 32,
        marginRight: 8,
        justifyContent: 'flex-end',
        paddingBottom: 4,
    },
    avatar: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: '#E2E8F0',
    },
    bubbleContainer: {
        maxWidth: '75%',
    },
    bubbleMeContainer: {
        alignItems: 'flex-end',
    },
    bubbleOtherContainer: {
        alignItems: 'flex-start',
    },
    senderName: {
        fontSize: 10,
        color: colors.textLight,
        marginLeft: 4,
        marginBottom: 2,
    },
    bubbleMe: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderBottomRightRadius: 4,
    },
    bubbleOther: {
        backgroundColor: colors.white,
        paddingHorizontal: 16,
        paddingVertical: 10,
        borderRadius: 20,
        borderBottomLeftRadius: 4,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.05,
        shadowRadius: 2,
    },
    textMe: {
        color: colors.white,
        fontSize: 15,
        fontWeight: '500',
    },
    textOther: {
        color: colors.text,
        fontSize: 15,
    },
    // Input
    inputContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingHorizontal: 16,
        paddingVertical: 12,
        backgroundColor: 'transparent',
    },
    addBtn: {
        width: 44,
        height: 44,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: 22,
        marginRight: 10,
        shadowColor: '#000',
        shadowOpacity: 0.05,
        shadowRadius: 5,
        borderWidth: 1,
        borderColor: '#E2E8F0',
    },
    inputWrapper: {
        flex: 1,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderRadius: 24,
        paddingLeft: 16,
        paddingRight: 6,
        paddingVertical: 6,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
        minHeight: 48,
    },
    textInput: {
        flex: 1,
        fontSize: 16,
        color: colors.text,
        maxHeight: 100,
    },
    sendBtn: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
        marginLeft: 8,
    },
});
