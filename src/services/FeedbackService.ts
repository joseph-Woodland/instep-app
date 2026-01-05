import { db } from '../config/firebaseConfig';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { Platform } from 'react-native';

export interface FeedbackData {
    userId: string;
    displayName: string;
    message: string;
    rating?: number;
    appVersion: string;
    buildNumber?: string;
    platform: string;
}

export const FeedbackService = {
    submitFeedback: async (data: FeedbackData) => {
        try {
            await addDoc(collection(db, 'feedback'), {
                ...data,
                createdAt: serverTimestamp(),
            });
            return { success: true };
        } catch (e) {
            console.error("Error submitting feedback:", e);
            throw e;
        }
    }
};
