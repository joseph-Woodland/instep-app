import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Alert, ActivityIndicator, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { createUserWithEmailAndPassword, updateProfile } from 'firebase/auth';
import { auth, db } from '../config/firebaseConfig';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { colors } from '../theme/colors';
import { PrimaryButton } from '../components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useUser } from '../context/UserContext';
import { GroupService } from '../services/GroupService';

export const SignUpScreen = () => {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [loading, setLoading] = useState(false);
    const navigation = useNavigation<any>();
    const route = useRoute<any>();
    const { inviteCode, goalId: inviteGoalId, groupId: inviteGroupId } = route.params || {};

    const { selectedGoalId, setGroupId, experienceLevel } = useUser();

    const handleSignUp = async () => {
        if (!name || !email || !password) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }

        if (password.length < 6) {
            Alert.alert("Error", "Password should be at least 6 characters.");
            return;
        }

        setLoading(true);
        try {
            // 1. Create Auth User
            const userCred = await createUserWithEmailAndPassword(auth, email.trim(), password);
            const user = userCred.user;

            // 2. Update Auth Profile
            await updateProfile(user, { displayName: name });

            // 3. Create Firestore User Doc
            await setDoc(doc(db, 'users', user.uid), {
                userId: user.uid,
                displayName: name,
                email: email.trim(),
                createdAt: serverTimestamp(),
                lastActiveAt: serverTimestamp(),
                notificationsEnabled: false,
                reminderTime: '19:00',
                avatarUrl: null
            });

            // 4. Group Assignment Strategy
            let finalGroupId = null;
            let finalGoalId = inviteGoalId || selectedGoalId;

            // Strategy A: Redeem Invite (Priority)
            if (inviteCode) {
                try {
                    const res = await GroupService.redeemGroupInvite(user.uid, inviteCode);
                    if (res.success) {
                        finalGroupId = res.groupId;
                        finalGoalId = res.goalId; // Override goal if invite dictates it
                    } else {
                        console.warn("Invite redemption failed", res.message);
                        // Fallback to standard? Or alert?
                        Alert.alert("Notice", `Invite error: ${res.message}. We'll try to match you to a group instead.`);
                    }
                } catch (invErr) {
                    console.error("Invite redeem error", invErr);
                }
            }

            // Strategy B: Standard Assignment (Fallback or No Invite)
            if (!finalGroupId && finalGoalId) {
                try {
                    finalGroupId = await GroupService.assignUserToGroup(user.uid, finalGoalId);
                } catch (assignError) {
                    console.warn("Group assignment failed post-signup", assignError);
                }
            }

            // 5. Update Context & Roles
            if (finalGroupId) {
                setGroupId(finalGroupId);

                // If it was a standard assignment and they are experienced guide
                if (!inviteCode && experienceLevel === 'Experienced' && finalGoalId) {
                    await GroupService.updateUserRoleToGuide(user.uid, finalGroupId, finalGoalId);
                }
            }

        } catch (error: any) {
            let msg = "Failed to sign up.";
            if (error.code === 'auth/email-already-in-use') {
                msg = "This email is already in use.";
            } else if (error.code === 'auth/invalid-email') {
                msg = "Invalid email format.";
            }
            Alert.alert("Error", msg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <SafeAreaView style={styles.container}>
            <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
                <ScrollView contentContainerStyle={styles.scrollContent}>
                    <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
                        <Ionicons name="arrow-back" size={24} color={colors.text} />
                    </TouchableOpacity>

                    <View style={styles.header}>
                        <Text style={styles.title}>Create Account</Text>
                        <Text style={styles.subtitle}>Join a supportive community and reach your goals.</Text>
                    </View>

                    <View style={styles.form}>
                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Full Name</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Alex Johnson"
                                value={name}
                                onChangeText={setName}
                                autoCapitalize="words"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Email</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="name@email.com"
                                value={email}
                                onChangeText={setEmail}
                                autoCapitalize="none"
                                keyboardType="email-address"
                            />
                        </View>

                        <View style={styles.inputGroup}>
                            <Text style={styles.label}>Password</Text>
                            <TextInput
                                style={styles.input}
                                placeholder="Minimum 6 characters"
                                value={password}
                                onChangeText={setPassword}
                                secureTextEntry
                            />
                        </View>

                        <Text style={styles.disclaimer}>
                            By signing up, you agree to our Terms and Privacy Policy.
                        </Text>

                        <PrimaryButton
                            title="Sign Up"
                            onPress={handleSignUp}
                            loading={loading}
                            style={styles.submitBtn}
                        />
                    </View>

                    <View style={styles.footer}>
                        <Text style={styles.footerText}>Already have an account? </Text>
                        <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                            <Text style={styles.linkText}>Log In</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: colors.background,
    },
    scrollContent: {
        flexGrow: 1,
        padding: 24,
    },
    backBtn: {
        width: 40,
        height: 40,
        justifyContent: 'center',
        alignItems: 'center',
        marginBottom: 24,
    },
    header: {
        marginBottom: 32,
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: colors.text,
        marginBottom: 8,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textLight,
        lineHeight: 24,
    },
    form: {
        flex: 1,
    },
    inputGroup: {
        marginBottom: 20,
    },
    label: {
        fontSize: 14,
        fontWeight: '600',
        color: colors.text,
        marginBottom: 8,
        marginLeft: 4,
    },
    input: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 16,
        fontSize: 16,
        color: colors.text,
        borderWidth: 1,
        borderColor: '#EEEEEE',
    },
    disclaimer: {
        fontSize: 13,
        color: colors.textLight,
        textAlign: 'center',
        marginVertical: 24,
        paddingHorizontal: 20,
    },
    submitBtn: {
        marginTop: 8,
    },
    footer: {
        flexDirection: 'row',
        justifyContent: 'center',
        marginTop: 40,
        marginBottom: 20,
    },
    footerText: {
        color: colors.textLight,
        fontSize: 15,
    },
    linkText: {
        color: colors.primary,
        fontWeight: '700',
        fontSize: 15,
    },
});
