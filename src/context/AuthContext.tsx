import React, { createContext, useContext, useEffect, useState } from 'react';
import { onAuthStateChanged, User, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '../config/firebaseConfig';
import { doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';

interface UserProfile {
    userId: string;
    displayName: string;
    email: string;
    createdAt: any;
    lastActiveAt?: any;
    notificationsEnabled: boolean;
    reminderTime: string;
    avatarUrl: string | null;
    currentGoalId?: string | null;
    currentGroupId?: string | null;
}

interface AuthContextType {
    user: User | null;
    profile: UserProfile | null;
    loading: boolean;
    signOut: () => Promise<void>;
    refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const [user, setUser] = useState<User | null>(null);
    const [profile, setProfile] = useState<UserProfile | null>(null);
    const [loading, setLoading] = useState(true);

    const refreshProfile = async () => {
        if (!auth.currentUser) {
            setProfile(null);
            return;
        }

        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        if (userDoc.exists()) {
            setProfile(userDoc.data() as UserProfile);
        } else {
            // Self-heal: Create minimal profile if missing
            const newProfile: UserProfile = {
                userId: auth.currentUser.uid,
                displayName: auth.currentUser.displayName || 'Friend',
                email: auth.currentUser.email || '',
                createdAt: serverTimestamp(),
                notificationsEnabled: false,
                reminderTime: '19:00',
                avatarUrl: null,
                currentGoalId: null,
                currentGroupId: null
            };
            await setDoc(doc(db, 'users', auth.currentUser.uid), newProfile);
            setProfile(newProfile);
        }
    };

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (u) => {
            setUser(u);
            if (u) {
                await refreshProfile();
            } else {
                setProfile(null);
            }
            setLoading(false);
        });

        return unsubscribe;
    }, []);

    const signOut = async () => {
        await firebaseSignOut(auth);
    };

    return (
        <AuthContext.Provider value={{ user, profile, loading, signOut, refreshProfile }}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (context === undefined) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};
