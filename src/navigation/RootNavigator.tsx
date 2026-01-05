import React from 'react';
import { Platform } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import * as Notifications from 'expo-notifications'; // New
import { useNavigation } from '@react-navigation/native'; // Ensure imported

import { WelcomeScreen } from '../screens/WelcomeScreen';
import { OnboardingGoalScreen } from '../screens/OnboardingGoalScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { GroupChatScreen } from '../screens/GroupChatScreen';
import { GroupMembersScreen } from '../screens/GroupMembersScreen'; // New
import { ProfileScreen } from '../screens/ProfileScreen';
import { InviteCodeRedeemScreen } from '../screens/InviteCodeRedeemScreen';
import { BetaInviteScreen } from '../screens/BetaInviteScreen'; // New
import { LoginScreen } from '../screens/LoginScreen';
import { SignUpScreen } from '../screens/SignUpScreen';
import { useAuth } from '../context/AuthContext';
import { View, ActivityIndicator } from 'react-native';
import { colors } from '../theme/colors';
import { JournalScreen } from '../screens/JournalScreen';

import { createStackNavigator } from '@react-navigation/stack';
import 'react-native-gesture-handler'; // Required for stack

const NativeStack = createNativeStackNavigator();
const WebStack = createStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
    return (
        <Tab.Navigator
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: colors.primary,
                tabBarInactiveTintColor: colors.textLight,
                tabBarShowLabel: true,
                tabBarStyle: {
                    borderTopColor: '#EEEEEE',
                    backgroundColor: colors.white,
                    elevation: 5,
                },
                tabBarIcon: ({ focused, color, size }) => {
                    let iconName: keyof typeof Ionicons.glyphMap;

                    if (route.name === 'Home') {
                        iconName = focused ? 'home' : 'home-outline';
                    } else if (route.name === 'Journal') {
                        iconName = focused ? 'journal' : 'journal-outline';
                    } else if (route.name === 'GroupChat') {
                        iconName = focused ? 'chatbubbles' : 'chatbubbles-outline';
                    } else if (route.name === 'Profile') {
                        iconName = focused ? 'person' : 'person-outline';
                    } else {
                        iconName = 'ellipse';
                    }

                    return <Ionicons name={iconName} size={size} color={color} />;
                },
            })}
        >
            <Tab.Screen
                name="Home"
                component={HomeScreen}
            />
            <Tab.Screen
                name="Journal"
                component={JournalScreen}
                options={{ title: 'Journal' }}
            />
            <Tab.Screen
                name="GroupChat"
                component={GroupChatScreen}
                options={{ title: 'Chat' }}
            />
            <Tab.Screen
                name="Profile"
                component={ProfileScreen}
            />
        </Tab.Navigator>
    );
}

export const RootNavigator = () => {
    const navigation = useNavigation<any>();
    const { user, loading } = useAuth();

    React.useEffect(() => {
        if (Platform.OS === 'web' || !user) return;

        // 1. Cold Start
        Notifications.getLastNotificationResponseAsync().then(response => {
            if (response) {
                const data = response.notification.request.content.data;
                if (data?.screen === 'GroupChat' && data?.groupId && data?.goalId) {
                    setTimeout(() => {
                        navigation.navigate('MainTabs', {
                            screen: 'GroupChat',
                            params: { groupId: data.groupId, goalId: data.goalId }
                        });
                    }, 500);
                }
            }
        });

        // 2. Foreground / Background Tap
        const subscription = Notifications.addNotificationResponseReceivedListener(response => {
            const data = response.notification.request.content.data;
            if (data?.screen === 'GroupChat' && data?.groupId && data?.goalId) {
                navigation.navigate('MainTabs', {
                    screen: 'GroupChat',
                    params: { groupId: data.groupId, goalId: data.goalId }
                });
            }
        });

        return () => subscription.remove();
    }, [user]);

    if (loading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: colors.background }}>
                <ActivityIndicator size="large" color={colors.primary} />
            </View>
        );
    }

    const Stack = Platform.OS === 'web' ? WebStack : NativeStack;

    return (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
            {!user ? (
                // Pre-Auth / Auth Stack
                <>
                    <Stack.Screen name="Welcome" component={WelcomeScreen} />
                    <Stack.Screen name="OnboardingGoal" component={OnboardingGoalScreen} />
                    <Stack.Screen name="Login" component={LoginScreen} />
                    <Stack.Screen name="SignUp" component={SignUpScreen} />
                    <Stack.Screen name="InviteCodeRedeem" component={InviteCodeRedeemScreen} />
                    <Stack.Screen name="BetaInvite" component={BetaInviteScreen} />
                </>
            ) : (
                // App Stack
                <>
                    <Stack.Screen name="MainTabs" component={MainTabs} />
                    <Stack.Screen name="GroupMembers" component={GroupMembersScreen} />
                    <Stack.Screen name="OnboardingGoal" component={OnboardingGoalScreen} />
                    <Stack.Screen name="InviteCodeRedeem" component={InviteCodeRedeemScreen} />
                </>
            )}
        </Stack.Navigator>
    );
};
