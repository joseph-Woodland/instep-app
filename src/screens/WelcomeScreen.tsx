import { View, Text, StyleSheet, TouchableOpacity, Image, ScrollView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { colors } from '../theme/colors';
import { PrimaryButton } from '../components/PrimaryButton';
import { Ionicons } from '@expo/vector-icons';

export const WelcomeScreen = () => {
    const navigation = useNavigation<NativeStackNavigationProp<any>>();

    return (
        <View style={styles.outerContainer}>
            <SafeAreaView style={styles.container}>
                <ScrollView
                    style={{ flex: 1 }}
                    contentContainerStyle={styles.scrollContent}
                    showsVerticalScrollIndicator={false}
                >

                    {/* Logo Header */}
                    <View style={styles.header}>
                        <Ionicons name="leaf" size={24} color={colors.primary} />
                        <Text style={styles.brandTitle}>instep</Text>
                    </View>

                    {/* Hero Image Area */}
                    <View style={styles.heroContainer}>
                        <Image
                            source={require('../../assets/images/welcome_hero.png')}
                            style={styles.heroImage}
                            resizeMode="contain"
                        />
                    </View>

                    {/* Main Text */}
                    <View style={styles.textContainer}>
                        <Text style={styles.title}>You don't have{'\n'}to do it alone.</Text>
                        <Text style={styles.subtitle}>
                            Find your supportive circle and achieve your goals, one step at a time.
                        </Text>
                    </View>

                    {/* Bottom Actions */}
                    <View style={styles.footer}>
                        <PrimaryButton
                            title="Get Started"
                            onPress={() => navigation.navigate('OnboardingGoal')}
                        />
                        <View style={styles.loginRow}>
                            <Text style={styles.loginText}>Already have an account? </Text>
                            <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                                <Text style={styles.loginLink}>Log in</Text>
                            </TouchableOpacity>
                        </View>
                        <TouchableOpacity onPress={() => navigation.navigate('InviteCodeRedeem')}>
                            <Text style={styles.inviteLink}>Have an invite code?</Text>
                        </TouchableOpacity>

                        <TouchableOpacity onPress={() => navigation.navigate('BetaInvite')} style={{ marginTop: 20 }}>
                            <Text style={[styles.inviteLink, { fontSize: 13, color: colors.textLight }]}>
                                🚧 Beta Tester? Start Here
                            </Text>
                        </TouchableOpacity>
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
    scrollContent: {
        flexGrow: 1,
        padding: 24,
        paddingBottom: 40,
        flexDirection: 'column',
        justifyContent: 'space-between'
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 16,
        marginBottom: 32,
        gap: 8,
    },
    brandTitle: {
        fontSize: 20,
        fontWeight: '700',
        color: colors.text,
    },
    heroContainer: {
        height: 300,
        justifyContent: 'center',
        alignItems: 'center',
        paddingHorizontal: 16,
        marginBottom: 24,
    },
    heroImage: {
        width: '100%',
        height: '100%',
    },
    textContainer: {
        marginBottom: 32,
        alignItems: 'center',
    },
    title: {
        fontSize: 32,
        fontWeight: '800',
        color: colors.text,
        textAlign: 'center',
        lineHeight: 38,
        marginBottom: 16,
    },
    subtitle: {
        fontSize: 16,
        color: colors.textLight,
        textAlign: 'center',
        lineHeight: 24,
        paddingHorizontal: 16,
    },
    footer: {
        marginBottom: 16,
        gap: 16,
    },
    loginRow: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
    },
    loginText: {
        color: colors.textLight,
        fontSize: 14,
    },
    loginLink: {
        color: colors.text,
        fontWeight: '700',
        fontSize: 14,
    },
    inviteLink: {
        textAlign: 'center',
        color: colors.primary,
        fontWeight: '600',
        fontSize: 15,
        marginTop: 12,
    },
});
