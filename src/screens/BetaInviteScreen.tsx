import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import * as Clipboard from 'expo-clipboard';
import { colors } from '../theme/colors';
import { Ionicons } from '@expo/vector-icons';
import { ENV } from '../config/env';

export const BetaInviteScreen = () => {
    const navigation = useNavigation<any>();
    const [copied, setCopied] = useState(false);

    const handleCopy = async () => {
        await Clipboard.setStringAsync(ENV.EXPO_PROJECT_URL);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <SafeAreaView style={styles.container}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                    <Ionicons name="close" size={24} color={colors.text} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>Beta Access</Text>
                <View style={{ width: 24 }} />
            </View>

            <ScrollView contentContainerStyle={styles.content}>
                <View style={styles.heroIcon}>
                    <Ionicons name="construct" size={48} color={colors.primary} />
                </View>

                <Text style={styles.title}>Join the Closed Beta</Text>
                <Text style={styles.subtitle}>
                    Welcome! We are currently testing InStep using Expo Go. Follow these steps to get set up.
                </Text>

                {/* Step 1 */}
                <View style={styles.stepCard}>
                    <View style={styles.stepNum}><Text style={styles.stepNumText}>1</Text></View>
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Install Expo Go</Text>
                        <Text style={styles.stepDesc}>Download "Expo Go" from the App Store (iOS) or Play Store (Android).</Text>
                    </View>
                </View>

                {/* Step 2 */}
                <View style={styles.stepCard}>
                    <View style={styles.stepNum}><Text style={styles.stepNumText}>2</Text></View>
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Open Project URL</Text>
                        <Text style={styles.stepDesc}>
                            Copy the link below, open Expo Go, and paste it into the "Enter URL manually" field.
                        </Text>

                        <View style={styles.urlBox}>
                            <Text style={styles.urlText} numberOfLines={1} ellipsizeMode="middle">
                                {ENV.EXPO_PROJECT_URL}
                            </Text>
                            <TouchableOpacity style={styles.copyBtn} onPress={handleCopy}>
                                <Text style={styles.copyBtnText}>{copied ? "Copied!" : "Copy"}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>

                {/* Step 3 */}
                <View style={styles.stepCard}>
                    <View style={styles.stepNum}><Text style={styles.stepNumText}>3</Text></View>
                    <View style={styles.stepContent}>
                        <Text style={styles.stepTitle}>Create Account & Join</Text>
                        <Text style={styles.stepDesc}>
                            Once the app opens, create an account. If you have an <Text style={{ fontWeight: '700' }}>Invite Code</Text>, enter it during the goal selection step to auto-join your group.
                        </Text>
                    </View>
                </View>

                <TouchableOpacity
                    style={styles.actionButton}
                    onPress={() => navigation.navigate('OnboardingGoal')}
                >
                    <Text style={styles.actionButtonText}>I'm ready, let's go</Text>
                    <Ionicons name="arrow-forward" size={20} color={colors.white} />
                </TouchableOpacity>

            </ScrollView>
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
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: 24,
        paddingVertical: 16,
    },
    backButton: {
        padding: 4,
    },
    headerTitle: {
        fontSize: 16,
        fontWeight: '600',
        color: colors.text,
    },
    content: {
        padding: 24,
        paddingBottom: 40,
    },
    heroIcon: {
        alignSelf: 'center',
        width: 80,
        height: 80,
        borderRadius: 40,
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
        marginBottom: 12,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textLight,
        textAlign: 'center',
        lineHeight: 24,
        marginBottom: 32,
    },
    stepCard: {
        backgroundColor: colors.white,
        borderRadius: 16,
        padding: 16,
        marginBottom: 16,
        flexDirection: 'row',
        gap: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.05,
        shadowRadius: 8,
        elevation: 2,
    },
    stepNum: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: colors.primary,
        justifyContent: 'center',
        alignItems: 'center',
    },
    stepNumText: {
        color: colors.white,
        fontWeight: '700',
        fontSize: 16,
    },
    stepContent: {
        flex: 1,
    },
    stepTitle: {
        fontSize: 16,
        fontWeight: '700',
        color: colors.text,
        marginBottom: 4,
    },
    stepDesc: {
        fontSize: 14,
        color: colors.textLight,
        lineHeight: 20,
        marginBottom: 8,
    },
    urlBox: {
        flexDirection: 'row',
        backgroundColor: '#F3F4F6',
        borderRadius: 8,
        padding: 8,
        alignItems: 'center',
        marginTop: 8,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    urlText: {
        flex: 1,
        fontSize: 12,
        color: colors.text,
        fontFamily: Platform.OS === 'ios' ? 'Courier' : 'monospace',
        marginRight: 8,
    },
    copyBtn: {
        backgroundColor: colors.white,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 6,
        borderWidth: 1,
        borderColor: '#E5E7EB',
    },
    copyBtnText: {
        fontSize: 12,
        fontWeight: '600',
        color: colors.primary,
    },
    actionButton: {
        backgroundColor: colors.primary,
        borderRadius: 16,
        height: 56,
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        gap: 8,
        marginTop: 16,
        shadowColor: colors.primary,
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.3,
        shadowRadius: 12,
        elevation: 4,
    },
    actionButtonText: {
        fontSize: 18,
        fontWeight: '700',
        color: colors.white,
    },
});
