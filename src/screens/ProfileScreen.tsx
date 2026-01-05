import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, ScrollView, TouchableOpacity, ActivityIndicator, Modal, TextInput, Alert, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../theme/colors';
import { Header } from '../components/Header';
import { useUser } from '../context/UserContext';
import { GroupService, Group } from '../services/GroupService';
import { NotificationService, NotificationConfig } from '../services/NotificationService';
import { NotificationPermissionModal } from '../components/NotificationPermissionModal';
import { UserService } from '../services/UserService';
import { Ionicons } from '@expo/vector-icons';
import { Switch } from 'react-native';

import { FeedbackModal } from '../components/FeedbackModal';
import { useAuth } from '../context/AuthContext';

export const ProfileScreen = () => {
    const { signOut } = useAuth();
    const { userId, userName, setUserName, experienceLevel, groupId, setGroupId } = useUser();
    const [isGuide, setIsGuide] = useState(false);
    const [loading, setLoading] = useState(false);
    const [notifConfig, setNotifConfig] = useState<NotificationConfig | null>(null);
    const [showNotifModal, setShowNotifModal] = useState(false);

    // Edit Profile State
    const [isEditModalVisible, setIsEditModalVisible] = useState(false);
    const [newName, setNewName] = useState(userName || '');
    const [isUpdating, setIsUpdating] = useState(false);

    // Feedback State
    const [isFeedbackVisible, setIsFeedbackVisible] = useState(false);

    useEffect(() => {
        if (groupId) {
            setLoading(true);
            GroupService.isUserGuide(userId, groupId)
                .then(setIsGuide)
                .catch(console.error)
                .finally(() => setLoading(false));
        }
    }, [groupId, userId]);

    useEffect(() => {
        loadNotifConfig();
    }, []);

    const loadNotifConfig = async () => {
        const cfg = await NotificationService.getConfig();
        setNotifConfig(cfg);
    };

    const handleToggleNotifications = async (value: boolean) => {
        if (value) {
            setShowNotifModal(true);
        } else {
            // Disable
            const newConfig = {
                enabled: false,
                reminderTime: notifConfig?.reminderTime || "19:00",
                lastPromptedAt: Date.now()
            };
            await NotificationService.saveConfig(newConfig);
            await NotificationService.cancelAllReminders();
            setNotifConfig(newConfig);
        }
    };

    const handleUpdateName = async () => {
        if (!newName.trim()) return;
        setIsUpdating(true);
        try {
            await UserService.updateUserProfile(userId, { name: newName });
            setUserName(newName);
            setIsEditModalVisible(false);
        } catch (error) {
            console.error("Update profile failed", error);
        } finally {
            setIsUpdating(false);
        }
    };

    const handleLeaveGroup = () => {
        if (!groupId) return;
        Alert.alert(
            "Leave User Group",
            "Are you sure you want to leave your current group?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Leave",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await GroupService.leaveGroup(userId, groupId);
                            setGroupId(null);
                            // Navigation will auto-update or stay on Profile? 
                            // Usually MainTabs might redirect if groupId missing?
                            // For now just update context.
                            Alert.alert("Left Group", "You have left the group.");
                        } catch (e) {
                            Alert.alert("Error", "Could not leave group.");
                        }
                    }
                }
            ]
        );
    };

    const handleSignOut = () => {
        Alert.alert(
            "Sign Out",
            "Are you sure you want to sign out?",
            [
                { text: "Cancel", style: "cancel" },
                {
                    text: "Sign Out",
                    style: "destructive",
                    onPress: async () => {
                        try {
                            await signOut();
                        } catch (e) {
                            console.error("Sign out failed", e);
                            Alert.alert("Error", "Could not sign out. Please try again.");
                        }
                    }
                }
            ]
        );
    };


    return (
        <SafeAreaView style={styles.container}>
            <Header title="Profile" rightAction={<Ionicons name="settings-sharp" size={24} color={colors.text} />} />

            <ScrollView contentContainerStyle={styles.content}>
                {/* Profile Header */}
                <View style={styles.profileHeader}>
                    <View style={styles.avatarContainer}>
                        <Image
                            source={{ uri: 'https://ui-avatars.com/api/?name=Alex+M&background=random&size=200' }}
                            style={styles.avatar}
                        />
                        <View style={styles.levelBadge}>
                            <Ionicons name="leaf" size={12} color={colors.white} />
                        </View>
                    </View>
                    <Text style={styles.name}>{userName || 'Alex M.'}</Text>

                    {isGuide && (
                        <View style={styles.roleBadge}>
                            <Ionicons name="school" size={14} color="#D97706" />
                            <Text style={styles.roleText}>Community Guide</Text>
                        </View>
                    )}
                </View>

                {/* My Journey Section */}
                <View style={styles.section}>
                    <View style={styles.sectionHeader}>
                        <Text style={styles.sectionTitle}>My Journey</Text>
                        <View style={styles.seedlingBadge}>
                            <Ionicons name="leaf" size={14} color="#8D6E63" />
                            <Text style={styles.seedlingText}>Seedling</Text>
                        </View>
                    </View>

                    <View style={styles.statsRow}>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>12</Text>
                            <Text style={styles.statLabel}>Goals Shared</Text>
                        </View>
                        <View style={styles.statCard}>
                            <Text style={styles.statValue}>45</Text>
                            <Text style={styles.statLabel}>Cheers Given</Text>
                        </View>
                    </View>
                </View>

                {/* Preferences */}

                {/* Preferences */}
                {/* Preferences */}
                <Text style={styles.sectionTitleSmall}>PREFERENCES</Text>
                <View style={styles.prefList}>
                    {/* ... (Existing Pref Items) ... */}
                    <View style={styles.prefItem}>
                        <View style={styles.prefIconBg}>
                            <Ionicons name="notifications" size={20} color="#3B82F6" />
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.prefLabel}>Daily Reminder</Text>
                            <Text style={styles.prefSub}>{notifConfig?.enabled ? notifConfig.reminderTime : 'Off'}</Text>
                        </View>
                        <Switch
                            value={notifConfig?.enabled ?? false}
                            onValueChange={handleToggleNotifications}
                            trackColor={{ false: '#E5E7EB', true: colors.primary }}
                            thumbColor={colors.white}
                        />
                    </View>
                    {notifConfig?.enabled && (
                        <TouchableOpacity onPress={() => setShowNotifModal(true)} style={styles.changeTimeRow}>
                            <Text style={styles.changeTimeText}>Change time</Text>
                            <Ionicons name="time-outline" size={14} color={colors.primary} />
                        </TouchableOpacity>
                    )}

                    <TouchableOpacity style={styles.prefItem}>
                        <View style={[styles.prefIconBg, { backgroundColor: '#ECFDF5' }]}>
                            <Ionicons name="shield-checkmark" size={20} color="#10B981" />
                        </View>
                        <Text style={styles.prefLabel}>Privacy & Safety</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.prefItem} onPress={() => setIsEditModalVisible(true)}>
                        <View style={[styles.prefIconBg, { backgroundColor: '#FFF7ED' }]}>
                            <Ionicons name="person" size={20} color="#F97316" />
                        </View>
                        <Text style={styles.prefLabel}>Edit Profile</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
                    </TouchableOpacity>

                    <TouchableOpacity style={styles.prefItem} onPress={() => setIsFeedbackVisible(true)}>
                        <View style={[styles.prefIconBg, { backgroundColor: '#F5F3FF' }]}>
                            <Ionicons name="chatbox-ellipses" size={20} color="#8B5CF6" />
                        </View>
                        <Text style={styles.prefLabel}>Send Feedback</Text>
                        <Ionicons name="chevron-forward" size={20} color={colors.textLight} />
                    </TouchableOpacity>

                    {/* Danger Zone: Leave Group */}
                    {groupId && (
                        <TouchableOpacity style={styles.prefItem} onPress={handleLeaveGroup}>
                            <View style={[styles.prefIconBg, { backgroundColor: '#FEF2F2' }]}>
                                <Ionicons name="log-out" size={20} color="#EF4444" />
                            </View>
                            <Text style={[styles.prefLabel, { color: '#EF4444' }]}>Leave Group</Text>
                            <Ionicons name="chevron-forward" size={20} color="#EF4444" />
                        </TouchableOpacity>
                    )}
                </View>

                {/* Logout */}
                <TouchableOpacity style={styles.logoutButton} onPress={handleSignOut}>
                    <Text style={styles.logoutText}>Sign out for now</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>Version 1.0.2</Text>
            </ScrollView>

            <NotificationPermissionModal
                visible={showNotifModal}
                onClose={() => {
                    setShowNotifModal(false);
                    loadNotifConfig();
                }}
            />

            {/* Edit Profile Modal */}
            <Modal visible={isEditModalVisible} transparent animationType="slide">
                <View style={styles.modalOverlay}>
                    <View style={styles.modalContent}>
                        <Text style={styles.modalTitle}>Edit Profile</Text>
                        <Text style={styles.modalSub}>Update your display name</Text>
                        <TextInput
                            style={styles.modalInput}
                            placeholder="Your Name"
                            value={newName}
                            onChangeText={setNewName}
                            autoFocus
                        />
                        <View style={styles.modalButtonsHorizontal}>
                            <TouchableOpacity
                                onPress={() => setIsEditModalVisible(false)}
                                style={styles.modalButtonCancel}
                                disabled={isUpdating}
                            >
                                <Text style={styles.modalButtonTextCancel}>Cancel</Text>
                            </TouchableOpacity>
                            <TouchableOpacity
                                style={styles.modalButtonSubmit}
                                onPress={handleUpdateName}
                                disabled={isUpdating}
                            >
                                {isUpdating ? (
                                    <ActivityIndicator color={colors.white} size="small" />
                                ) : (
                                    <Text style={styles.modalButtonTextSubmit}>Save</Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
            {/* Feedback Modal */}
            <FeedbackModal
                visible={isFeedbackVisible}
                onClose={() => setIsFeedbackVisible(false)}
            />
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#FAFAFA',
    },
    content: {
        padding: 24,
    },
    profileHeader: {
        alignItems: 'center',
        marginBottom: 32,
    },
    avatarContainer: {
        position: 'relative',
        marginBottom: 16,
    },
    avatar: {
        width: 100,
        height: 100,
        borderRadius: 50,
        borderWidth: 4,
        borderColor: colors.white,
    },
    levelBadge: {
        position: 'absolute',
        bottom: 0,
        right: 0,
        backgroundColor: colors.primary,
        width: 28,
        height: 28,
        borderRadius: 14,
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 2,
        borderColor: colors.white,
    },
    name: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 8,
    },
    roleBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FEF3C7',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    roleText: {
        fontSize: 14,
        fontWeight: '700',
        color: '#D97706',
    },
    section: {
        marginBottom: 24,
    },
    sectionHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 16,
    },
    sectionTitle: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.text,
    },
    seedlingBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    seedlingText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#8D6E63',
    },
    statsRow: {
        flexDirection: 'row',
        gap: 16,
    },
    statCard: {
        flex: 1,
        backgroundColor: '#FFFaf5', // Very light beige
        padding: 20,
        borderRadius: 20,
        alignItems: 'center',
        gap: 4,
    },
    statValue: {
        fontSize: 28,
        fontWeight: '800',
        color: '#D97706', // Orange-ish
    },
    statLabel: {
        fontSize: 12,
        fontWeight: '600',
        color: '#92400E',
        opacity: 0.8,
    },
    // Reflection
    reflectionCard: {
        backgroundColor: '#FFF7ED', // Light orange bg
        padding: 20,
        borderRadius: 24,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: '#FFEDD5',
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
    refInput: {
        backgroundColor: colors.white,
        padding: 16,
        borderRadius: 16,
        borderWidth: 1,
        borderColor: '#FFEDD5',
    },
    refPlaceholder: {
        color: '#9CA3AF',
        fontSize: 14,
    },
    // Preferences
    sectionTitleSmall: {
        fontSize: 12,
        fontWeight: '700',
        color: '#9CA3AF',
        letterSpacing: 1,
        marginBottom: 12,
        marginLeft: 4,
    },
    prefList: {
        backgroundColor: colors.white,
        borderRadius: 24,
        padding: 8,
        marginBottom: 32,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 10,
        elevation: 2,
    },
    prefItem: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 12,
        gap: 16,
    },
    prefIconBg: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: '#EFF6FF',
        justifyContent: 'center',
        alignItems: 'center',
    },
    prefLabel: {
        flex: 1,
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    prefSub: {
        fontSize: 12,
        color: colors.textLight,
        marginTop: 2,
    },
    changeTimeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'flex-end',
        paddingHorizontal: 16,
        paddingBottom: 12,
        gap: 4,
    },
    changeTimeText: {
        fontSize: 13,
        fontWeight: '600',
        color: colors.primary,
    },
    logoutButton: {
        alignItems: 'center',
        padding: 16,
        marginBottom: 8,
    },
    logoutText: {
        color: '#92400E',
        fontWeight: '600',
        fontSize: 15,
    },
    versionText: {
        textAlign: 'center',
        color: '#D1D5DB',
        fontSize: 12,
        marginBottom: 20,
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
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
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
