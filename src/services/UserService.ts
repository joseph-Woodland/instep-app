import { db } from '../config/firebaseConfig';
import { doc, setDoc, arrayUnion, serverTimestamp } from 'firebase/firestore';

export const UserService = {
    updatePushToken: async (userId: string, token: string) => {
        try {
            const userRef = doc(db, 'users', userId);
            // using setDoc with merge to ensure doc exists or updates
            await setDoc(userRef, {
                pushTokens: arrayUnion(token), // Store array for multiple devices
                lastActiveAt: serverTimestamp()
            }, { merge: true });
        } catch (e) {
            // Non-blocking error
            console.warn("Err updating push token", e);
        }
    },
    updateUserProfile: async (userId: string, data: { name?: string; bio?: string; currentGoalId?: string | null; currentGroupId?: string | null }) => {
        try {
            const userRef = doc(db, 'users', userId);
            await setDoc(userRef, {
                ...data,
                updatedAt: serverTimestamp()
            }, { merge: true });
        } catch (e) {
            console.error("Err updating user profile", e);
            throw e;
        }
    },
    getUser: async (userId: string) => {
        try {
            const userRef = doc(db, 'users', userId);
            const { getDoc } = require('firebase/firestore');
            const snap = await getDoc(userRef);
            if (snap.exists()) {
                return snap.data();
            }
            return null;
        } catch (e) {
            console.warn("Err fetching user", e);
            return null;
        }
    },
    getUsers: async (userIds: string[]) => {
        try {
            // Firestore 'in' query supports up to 10
            // For MVP, if list is small, this is ok. Otherwise batch.
            if (userIds.length === 0) return {};

            const { collection, getDocs, query, where, documentId } = require('firebase/firestore');
            // 'in' query on documentId() isn't standard in client SDK usually, 
            // safer to just loop getDoc or use 'where userId in ...' if userId field exists
            // Assuming userId is in the doc data too? 

            // Simpler: Fetch one by one for MVP cache reliability or use 'in' on FieldPath.documentId()
            // Let's implement simple parallel fetch for robustness
            const { getDoc } = require('firebase/firestore');
            const promises = userIds.map(id => getDoc(doc(db, 'users', id)));
            const snaps = await Promise.all(promises);

            const usersMap: Record<string, any> = {};
            snaps.forEach(s => {
                if (s.exists()) {
                    usersMap[s.id] = s.data();
                }
            });
            return usersMap;
        } catch (e) {
            console.warn("Err fetching users", e);
            return {};
        }
    }
};
