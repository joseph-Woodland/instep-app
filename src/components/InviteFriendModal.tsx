import React, { useState } from 'react';
import { Modal, View, Text, StyleSheet, TouchableOpacity, Share, ActivityIndicator, Clipboard, Alert } from 'react-native';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { GroupService, GroupInvite } from '../services/GroupService';
import { useUser } from '../context/UserContext';
import { ENV } from '../config/env';


interface InviteFriendModalProps {
    visible: boolean;
    onClose: () => void;
    groupName?: string;
    goalName?: string;
    groupId?: string;
    goalId?: string;
}

export const InviteFriendModal = ({ visible, onClose, groupName, goalName, groupId, goalId }: InviteFriendModalProps) => {
    const { userId } = useUser();
    const [loading, setLoading] = useState(false);
    const [invite, setInvite] = useState<GroupInvite | null>(null);

    const handleCreateInvite = async () => {
        if (!userId || !groupId || !goalId) return;
        setLoading(true);
        try {
            // Determine role
            const isGuide = await GroupService.isUserGuide(userId, groupId);
            const role = isGuide ? 'guide' : 'member';

            // Create Invite
            const newInvite = await GroupService.createGroupInvite(userId, groupId, goalId, role);
            setInvite(newInvite);
        } catch (error) {
            Alert.alert("Error", "Could not create invite link.");
        } finally {
            setLoading(false);
        }
    };

    const handleShare = async () => {
        if (!invite) return;
        const inviteCode = invite.inviteCode;

        const msg = `Join my InStep support group for ${goalName || 'our goal'}.

1) Install Expo Go
2) In Expo Go tap ‘Enter URL manually’ and paste: ${ENV.EXPO_PROJECT_URL}
3) Create an account, then enter this invite code during setup: ${inviteCode}

You’ll land straight in our group chat.`;

        try {
            await Share.share({
                message: msg,
            });
        } catch (error) {
            // ignore
        }
    };

    const handleCopy = () => {
        if (invite) {
            Clipboard.setString(invite.inviteCode);
            Alert.alert("Copied", "Invite code copied to clipboard.");
        }
    };

    const handleClose = () => {
        setInvite(null); // Reset on close
        onClose();
    };

    return (
        <Modal visible={visible} transparent animationType="fade" onRequestClose={handleClose}>
            <View style={styles.overlay}>
                <View style={styles.content}>
                    <TouchableOpacity style={styles.closeBtn} onPress={handleClose}>
                        <Ionicons name="close" size={24} color={colors.textLight} />
                    </TouchableOpacity>

                    <View style={styles.iconContainer}>
                        <Ionicons name={invite ? "ticket-outline" : "heart"} size={48} color={invite ? colors.success : colors.primary} />
                    </View>

                    <Text style={styles.title}>{invite ? "Share this link" : "Invite a friend"}</Text>

                    {!invite ? (
                        <>
                            <Text style={styles.body}>
                                Know someone working on <Text style={styles.highlight}>{goalName || 'this goal'}</Text> too?
                                {'\n\n'}
                                Invite them into your small support network. Better in step.
                            </Text>

                            <TouchableOpacity
                                style={styles.button}
                                activeOpacity={0.8}
                                onPress={handleCreateInvite}
                                disabled={loading}
                            >
                                {loading ? (
                                    <ActivityIndicator color={colors.white} />
                                ) : (
                                    <Text style={styles.buttonText}>Create Invite Link</Text>
                                )}
                            </TouchableOpacity>
                        </>
                    ) : (
                        <>
                            <Text style={styles.body}>
                                Share this link with your friend. When they open it, they'll join your group.
                                {'\n'}
                                <Text style={styles.limitText}>Valid for 7 days ({invite.maxUses} uses).</Text>
                            </Text>

                            <TouchableOpacity style={styles.codeBox} onPress={handleCopy} activeOpacity={0.6}>
                                <Text style={styles.codeText} numberOfLines={1} ellipsizeMode="tail">
                                    {invite.inviteCode}
                                </Text>
                                <Ionicons name="copy-outline" size={20} color={colors.textLight} />
                            </TouchableOpacity>

                            <TouchableOpacity style={styles.shareButton} onPress={handleShare}>
                                <Text style={styles.shareButtonText}>Share Invite</Text>
                                <Ionicons name="share-outline" size={20} color={colors.white} />
                            </TouchableOpacity>
                        </>
                    )}
                </View>
            </View>
        </Modal>
    );
};

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.6)',
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
        shadowRadius: 12,
        elevation: 5,
    },
    closeBtn: {
        position: 'absolute',
        top: 16,
        right: 16,
        zIndex: 10,
        padding: 8,
    },
    iconContainer: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: '#ECFDF5',
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    title: {
        fontSize: 24,
        fontWeight: '800',
        color: colors.text,
        textAlign: 'center',
        marginBottom: 16,
    },
    body: {
        fontSize: 16,
        color: colors.textLight,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 24,
    },
    highlight: {
        color: colors.primary,
        fontWeight: '600',
    },
    limitText: {
        fontSize: 14,
        color: colors.textLight,
        fontStyle: 'italic',
    },
    button: {
        backgroundColor: colors.primary,
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
    },
    buttonText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 16,
    },
    // Invites
    codeBox: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 12,
        backgroundColor: '#F3F4F6',
        paddingVertical: 16,
        paddingHorizontal: 24,
        borderRadius: 12,
        width: '100%',
        marginBottom: 16,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    codeText: {
        fontSize: 24,
        fontWeight: '700',
        color: colors.text,
        letterSpacing: 2,
    },
    shareButton: {
        backgroundColor: colors.success, // Or a distinct share color
        paddingVertical: 16,
        paddingHorizontal: 32,
        borderRadius: 16,
        width: '100%',
        alignItems: 'center',
        flexDirection: 'row',
        justifyContent: 'center',
        gap: 8,
    },
    shareButtonText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 16,
    }
});
