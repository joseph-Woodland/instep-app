import { db } from '../config/firebaseConfig';
import {
    collection,
    addDoc,
    serverTimestamp,
    query,
    orderBy,
    limit,
    onSnapshot
} from 'firebase/firestore';

export interface ChatMessage {
    id: string;
    groupId: string;
    userId: string;
    userName: string;
    userPhoto?: string;
    text: string;
    type: 'user' | 'system' | 'milestone';
    createdAt: number | any; // Timestamp or number
    meta?: {
        type?: 'guide_tip';
        guideId?: string;
    };
    milestone?: {
        milestoneId: string;
        milestoneTitle: string;
        comment?: string;
        imageUrl?: string;
    };
    cheersCount?: number; // Optimistic / Cached
}

// NOTE: We are using a subcollection: groups/{groupId}/messages
// as decided in the prompt plan.

export const ChatService = {

    subscribeToGroupMessages: (groupId: string, onUpdate: (messages: ChatMessage[]) => void) => {
        try {
            const messagesRef = collection(db, 'groups', groupId, 'messages');
            const q = query(messagesRef, orderBy('createdAt', 'asc'), limit(50));

            const unsubscribe = onSnapshot(q, (snapshot) => {
                const msgs = snapshot.docs.map(doc => {
                    const data = doc.data();

                    // Robust timestamp parsing
                    let timestamp = Date.now();
                    if (data.createdAt) {
                        if (typeof data.createdAt.toMillis === 'function') {
                            timestamp = data.createdAt.toMillis();
                        } else if (data.createdAt instanceof Date) {
                            timestamp = data.createdAt.getTime();
                        } else if (typeof data.createdAt === 'number') {
                            timestamp = data.createdAt;
                        } else if (typeof data.createdAt === 'string') {
                            // Fallback for string dates if they exist
                            const parsed = Date.parse(data.createdAt);
                            if (!isNaN(parsed)) timestamp = parsed;
                        }
                    }

                    return {
                        id: doc.id,
                        ...data,
                        createdAt: timestamp
                    } as ChatMessage;
                });
                onUpdate(msgs);
            }, (error) => {
                console.error("Chat subscription error:", error);
            });

            return unsubscribe;
        } catch (e) {
            console.error("Error setting up chat subscription", e);
            return () => { };
        }
    },

    sendMessage: async (groupId: string, userId: string, userName: string, text: string, userPhoto?: string) => {
        try {
            const messagesRef = collection(db, 'groups', groupId, 'messages');
            await addDoc(messagesRef, {
                groupId,
                userId,
                userName,
                userPhoto: userPhoto || null,
                text,
                type: 'user',
                createdAt: serverTimestamp(),
            });
        } catch (e) {
            console.error("Error sending message:", e);
            throw e;
        }
    },

    sendSystemMessage: async (groupId: string, text: string) => {
        try {
            const messagesRef = collection(db, 'groups', groupId, 'messages');
            await addDoc(messagesRef, {
                groupId,
                userId: 'system',
                userName: 'System',
                text,
                type: 'system',
                createdAt: serverTimestamp(),
            });
        } catch (e) {
            console.error("Error sending system message:", e);
        }
    },

    sendMilestoneMessage: async (
        groupId: string,
        userId: string,
        userName: string,
        milestoneId: string,
        milestoneTitle: string,
        comment?: string,
        imageUrl?: string
    ) => {
        try {
            const messagesRef = collection(db, 'groups', groupId, 'messages');
            await addDoc(messagesRef, {
                groupId,
                userId,
                userName,
                text: `Completed: ${milestoneTitle}`, // Fallback text
                type: 'milestone',
                milestone: {
                    milestoneId,
                    milestoneTitle,
                    comment: comment || null,
                    imageUrl: imageUrl || null
                },
                createdAt: serverTimestamp(),
            });
        } catch (e) {
            console.error("Error sending milestone message:", e);
        }
    },

    /**
     * Send a guide tip message
     */
    sendGuideTip: async (groupId: string, guideId: string, tipText: string) => {
        try {
            const messagesRef = collection(db, 'groups', groupId, 'messages');
            await addDoc(messagesRef, {
                groupId,
                userId: 'system',
                userName: 'System',
                text: `💡 Guide tip: ${tipText}`,
                type: 'system',
                meta: {
                    type: 'guide_tip',
                    guideId: guideId,
                },
                createdAt: serverTimestamp(),
            });
        } catch (e) {
            console.error("Error sending guide tip:", e);
            throw e;
        }
    },

    addCheers: async (groupId: string, messageId: string, userId: string) => {
        // Optimistic UI updates should be handled by the component.
        // This function just writes the 'cheers' sub-document.
        try {
            const { doc, setDoc } = require('firebase/firestore');
            // Note: using setDoc to avoid duplicates (idempotency)
            const cheersRef = doc(db, 'groups', groupId, 'messages', messageId, 'cheers', userId);
            await setDoc(cheersRef, {
                userId,
                createdAt: serverTimestamp()
            });
            // In a real app, a Cloud Function would aggregate this count.
            // For MVP, we might rely on client reading it or just cache it?
            // Since we added cheersCount to the message type, we should probably update the parent message
            // incrementing a counter.
            const { increment, updateDoc } = require('firebase/firestore');
            const messageRef = doc(db, 'groups', groupId, 'messages', messageId);
            await updateDoc(messageRef, {
                cheersCount: increment(1)
            });

        } catch (e) {
            console.error("Error sending cheers:", e);
        }
    }
};
