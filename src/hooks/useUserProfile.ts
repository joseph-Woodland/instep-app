import { useState, useEffect } from 'react';
import { UserService } from '../services/UserService';

export interface UserProfileBasic {
    displayName: string;
    photoUrl?: string;
    role?: string;
}

const userCache: Record<string, UserProfileBasic> = {};

export const useUserProfile = (userId?: string) => {
    const [profile, setProfile] = useState<UserProfileBasic | null>(null);
    const [loading, setLoading] = useState(false);

    useEffect(() => {
        if (!userId) return;

        if (userCache[userId]) {
            setProfile(userCache[userId]);
            return;
        }

        const load = async () => {
            setLoading(true);
            const data = await UserService.getUser(userId);
            if (data) {
                const p: UserProfileBasic = {
                    displayName: data.displayName || 'Member',
                    photoUrl: data.photoUrl,
                    role: data.role
                };
                userCache[userId] = p;
                setProfile(p);
            }
            setLoading(false);
        };
        load();
    }, [userId]);

    return { profile, loading };
};
