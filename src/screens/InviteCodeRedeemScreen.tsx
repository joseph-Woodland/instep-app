import React, { useState } from 'react';
import { View, Text, StyleSheet, Alert, KeyboardAvoidingView, Platform, Image, TouchableOpacity, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { colors } from '../theme/colors';
import { Header } from '../components/Header';
import { TextInputField } from '../components/TextInputField';
import { PrimaryButton } from '../components/PrimaryButton';
import { GroupService } from '../services/GroupService';
import { useUser } from '../context/UserContext';
import { Ionicons } from '@expo/vector-icons';
import { useAuth } from '../context/AuthContext';

const heroBlobs = require('../assets/images/hero_blobs.png');

export const InviteCodeRedeemScreen = () => {
    const navigation = useNavigation<any>();
    const { userId, setGroupId, setSelectedGoalId } = useUser();
    const { user } = useAuth();

    const [code, setCode] = useState('');
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    const handleRedeem = async () => {
        if (!code.trim() || code.length < 5) {
            setError("Please enter a valid code.");
            return;
        }

        if (!user) {
            Alert.alert("Account Required", "Please sign up to join a group.");
            navigation.navigate('SignUp');
            return;
        }
        setLoading(true);
        setError('');

        try {
            const result = await GroupService.redeemGroupInvite(userId, code.trim().toUpperCase());

            if (result.success && result.status === 'joined') {
                // Update Context
                if (result.groupId) setGroupId(result.groupId);
                if (result.goalId) setSelectedGoalId(result.goalId);

                // Success
                Alert.alert("Success", "You have joined the group!", [
                    {
                        text: "Let's Go",
                        onPress: () => {
                            if (result.groupId && result.goalId) {
                                navigation.navigate('MainTabs', {
                                    screen: 'GroupChat',
                                    params: { groupId: result.groupId, goalId: result.goalId }
                                });
                            } else {
                                navigation.navigate('MainTabs', { screen: 'Home' });
                            }
                        }
                    }
                ]);
            } else if (result.status === 'full') {
                Alert.alert("Group Full", "This group is full. Join the waitlist for this goal instead?", [
                    { text: "Cancel", style: "cancel" },
                    {
                        text: "Join Waitlist",
                        onPress: () => {
                            Alert.alert("Info", "Waitlist feature coming next chunk!");
                        }
                    }
                ]);
            } else {
                setError(result.message || "Invalid code.");
            }
        } catch (e) {
            setError("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            {/* Background Decor */}
            <View style={styles.blobTop} />
            <View style={styles.blobBottom} />

            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="arrow-back" size={24} color={colors.text} />
                </TouchableOpacity>
            </View>

            <KeyboardAvoidingView
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                style={{ flex: 1 }}
            >
                <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>

                    {/* Hero Image */}
                    <View style={styles.heroContainer}>
                        <Image
                            source={heroBlobs}
                            style={styles.heroImage}
                        />
                        <View style={styles.heroOverlay} />
                        <View style={styles.privateBadge}>
                            <Ionicons name="lock-closed" size={12} color={colors.primary} />
                            <Text style={styles.privateBadgeText}>Private Circle</Text>
                        </View>
                    </View>

                    <View style={styles.textSection}>
                        <Text style={styles.title}>Join your circle</Text>
                        <Text style={styles.subtitle}>
                            Enter the code shared by your friend or group leader. You’re just a step away.
                        </Text>
                    </View>

                    {/* Input Section */}
                    <View style={styles.inputSection}>
                        <View style={styles.inputWrapper}>
                            <View style={styles.inputIconContainer}>
                                <Ionicons name="key-outline" size={22} color={colors.textLight} />
                            </View>
                            <TextInput
                                placeholder="Ex: TGH-2024"
                                placeholderTextColor="#CBD5E1"
                                value={code}
                                onChangeText={t => {
                                    setCode(t);
                                    setError('');
                                }}
                                style={styles.inputField}
                                autoCapitalize="characters"
                                selectionColor={colors.primary}
                                maxLength={10}
                            />
                        </View>

                        {error ? (
                            <Text style={styles.errorText}>{error}</Text>
                        ) : null}

                        <View style={styles.safeBadge}>
                            <Ionicons name="shield-checkmark" size={16} color={colors.primary} />
                            <Text style={styles.safeBadgeText}>Safe, supportive & private space</Text>
                        </View>
                    </View>

                </ScrollView>

                {/* Footer Action */}
                <View style={styles.footer}>
                    <TouchableOpacity
                        style={[styles.joinButton, (loading || code.length < 5) && styles.disabledButton]}
                        onPress={handleRedeem}
                        disabled={loading || code.length < 5}
                        activeOpacity={0.8}
                    >
                        {loading ? (
                            <Text style={styles.joinButtonText}>Joining...</Text>
                        ) : (
                            <>
                                <Text style={styles.joinButtonText}>Join Group</Text>
                                <Ionicons name="arrow-forward" size={20} color={colors.text} />
                            </>
                        )}
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.createLink} onPress={() => Alert.alert("Coming Soon", "Create Group feature is coming soon!")}>
                        <Text style={styles.createLinkText}>Don't have a code? <Text style={{ color: colors.primary, fontWeight: '700' }}>Start your own circle</Text></Text>
                    </TouchableOpacity>
                </View>

            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    blobTop: {
        position: 'absolute',
        top: -100,
        left: -100,
        width: 300,
        height: 300,
        borderRadius: 150,
        backgroundColor: `${colors.primary}15`, // 10% opacity
    },
    blobBottom: {
        position: 'absolute',
        bottom: -100,
        right: -100,
        width: 400,
        height: 400,
        borderRadius: 200,
        backgroundColor: '#60A5FA10', // Blue-ish faint
    },
    header: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 8,
        zIndex: 10,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: 'rgba(255,255,255,0.6)',
        justifyContent: 'center',
        alignItems: 'center',
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingTop: 16,
        paddingBottom: 100,
        alignItems: 'center',
    },
    heroContainer: {
        width: '100%',
        aspectRatio: 4 / 3,
        borderRadius: 24,
        overflow: 'hidden',
        marginBottom: 32,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.15,
        shadowRadius: 20,
        elevation: 10,
        position: 'relative',
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    heroOverlay: {
        ...StyleSheet.absoluteFillObject,
        backgroundColor: 'rgba(0,0,0,0.1)',
        zIndex: 1,
    },
    privateBadge: {
        position: 'absolute',
        bottom: 16,
        left: 16,
        zIndex: 2,
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: 'rgba(255,255,255,0.9)',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        gap: 6,
    },
    privateBadgeText: {
        fontSize: 12,
        fontWeight: '600',
        color: '#1E293B',
    },
    textSection: {
        width: '100%',
        alignItems: 'center',
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: '#0F172A',
        marginBottom: 12,
        textAlign: 'center',
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748B',
        textAlign: 'center',
        lineHeight: 24,
        maxWidth: 280,
    },
    inputSection: {
        width: '100%',
        gap: 24,
    },
    inputWrapper: {
        position: 'relative',
        width: '100%',
    },
    inputIconContainer: {
        position: 'absolute',
        left: 20,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
        zIndex: 10,
    },
    inputField: {
        backgroundColor: colors.white,
        height: 64,
        borderRadius: 16,
        paddingLeft: 56,
        paddingRight: 20,
        fontSize: 20,
        fontWeight: '700',
        color: '#0F172A',
        borderWidth: 1,
        borderColor: '#E2E8F0',
        letterSpacing: 1,
        textAlign: 'center', // Centered per design? Design has icon on left but text centered? Let's check. Design: "pl-12 ... text-center". Yes.
    },
    errorText: {
        color: '#EF4444',
        fontSize: 14,
        textAlign: 'center',
        marginTop: -16,
        fontWeight: '500',
    },
    safeBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: `${colors.primary}10`,
        paddingVertical: 8,
        paddingHorizontal: 16,
        borderRadius: 20,
        gap: 8,
        alignSelf: 'center',
    },
    safeBadgeText: {
        fontSize: 14,
        fontWeight: '600',
        color: '#166534', // Darker green
    },
    footer: {
        padding: 24,
        paddingBottom: Platform.OS === 'ios' ? 0 : 24,
        backgroundColor: 'transparent',
    },
    joinButton: {
        width: '100%',
        height: 56,
        backgroundColor: colors.primary,
        borderRadius: 28,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 8,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 10,
        elevation: 5,
    },
    disabledButton: {
        opacity: 0.6,
    },
    joinButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: '#0F172A',
    },
    createLink: {
        marginTop: 16,
        alignItems: 'center',
    },
    createLinkText: {
        fontSize: 12,
        color: '#94A3B8',
        fontWeight: '500',
    }
});
