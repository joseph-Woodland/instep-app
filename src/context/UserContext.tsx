import React, { createContext, useState, useContext } from 'react';
import { useAuth } from './AuthContext';

import { UserService } from '../services/UserService';

interface UserContextType {
    userId: string;
    userName: string;
    setUserName: (name: string) => void;
    goal: string;
    setGoal: (goal: string) => void;
    experienceLevel: string;
    setExperienceLevel: (level: string) => void;
    selectedGoalId: string | null;
    setSelectedGoalId: (goalId: string | null) => void;
    groupId: string | null;
    setGroupId: (groupId: string | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);


export const UserProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
    const { user, profile } = useAuth();
    const [userNameState, setUserNameState] = useState('');
    const [goal, setGoal] = useState('');
    const [experienceLevel, setExperienceLevel] = useState('Beginner');
    const [selectedGoalId, setLocalSelectedGoalId] = useState<string | null>(null);
    const [groupId, setLocalGroupId] = useState<string | null>(null);

    // Sync with profile name and persisted state
    const userName = userNameState || profile?.displayName || 'Friend';
    const userId = user?.uid || '';

    // Initialize from profile when available
    React.useEffect(() => {
        if (profile) {
            if (profile.currentGoalId && !selectedGoalId) {
                setLocalSelectedGoalId(profile.currentGoalId);
            }
            if (profile.currentGroupId && !groupId) {
                setLocalGroupId(profile.currentGroupId);
            }
        }
    }, [profile]);

    const setSelectedGoalId = (id: string | null) => {
        setLocalSelectedGoalId(id);
        if (userId) {
            UserService.updateUserProfile(userId, { currentGoalId: id });
        }
    };

    const setGroupId = (id: string | null) => {
        setLocalGroupId(id);
        if (userId) {
            UserService.updateUserProfile(userId, { currentGroupId: id });
        }
    };


    return (
        <UserContext.Provider value={{
            userId,
            userName,
            setUserName: setUserNameState,
            goal,
            setGoal,
            experienceLevel,
            setExperienceLevel,
            selectedGoalId,
            setSelectedGoalId,
            groupId,
            setGroupId
        }}>
            {children}
        </UserContext.Provider>
    );
};

export const useUser = () => {
    const context = useContext(UserContext);
    if (context === undefined) {
        throw new Error('useUser must be used within a UserProvider');
    }
    return context;
};
