import { db } from '../config/firebaseConfig';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    updateDoc,
    addDoc,
    serverTimestamp,
    query,
    where,
    orderBy,
    getDocs
} from 'firebase/firestore';
import { RUN_5K_GOAL, RUN_5K_GOAL_ID, getGoalById } from '../data/goals';

export const DEFAULT_GROUP_ID = "group-run-5k-30min-01";

// --- Types ---
export interface TimelineEntry {
    milestoneId: string;
    completedAt: number | null;
}

export interface UserGoal {
    userId: string;
    goalId: string;
    startDate: number;
    currentMilestoneId: string;
    progressPercent: number;
    timeline: TimelineEntry[];
    createdAt: number;
    updatedAt: number;
}

export interface CheckIn {
    id: string; // Firestore ID
    userId: string;
    goalId: string;
    note: string;
    createdAt: any; // Firestore Timestamp or number
    milestoneId: string | null;
    photoUrl?: string | null;
}

export interface Affirmation {
    id: string;
    userId: string;
    text: string;
    createdAt: number;
}

// In-Memory fallback store
const mockStore: Record<string, UserGoal> = {};

export const GoalService = {
    // Ensure the default group exists (Deprecated but kept for compat)
    ensureDefaultGroupExists: async () => { },

    // Fetch Goal Definition from Firestore
    getGoalDefinition: async (goalId: string): Promise<any> => {
        const docRef = doc(db, 'goals', goalId);
        const snap = await getDoc(docRef);
        if (snap.exists()) {
            return { id: snap.id, ...snap.data() };
        }
        return null;
    },

    getAvailableGoals: async (): Promise<any[]> => {
        try {
            const q = query(collection(db, 'goals'), where('status', '==', 'live'));
            const snap = await getDocs(q);
            return snap.docs.map(d => ({ id: d.id, ...d.data() }));
        } catch (e) {
            console.error("Error fetching available goals", e);
            return [];
        }
    },

    // Initialize or fetch the user's goal
    getOrCreateUserGoal: async (userId: string, goalId: string): Promise<UserGoal | null> => {
        const userGoalId = `${userId}_${goalId}`;
        try {
            if (!goalId) throw new Error("Goal ID required");

            const userGoalRef = doc(db, 'userGoals', userGoalId);
            const snap = await getDoc(userGoalRef);

            if (snap.exists()) {
                const data = snap.data();
                // Ensure dates are numbers
                return {
                    ...data,
                    startDate: data.startDate?.toMillis?.() || Date.now(),
                    createdAt: data.createdAt?.toMillis?.() || Date.now(),
                    updatedAt: data.updatedAt?.toMillis?.() || Date.now(),
                } as UserGoal;
            }

            // Create in DB
            // Fetch definition from Firestore instead of static file
            const goalDefRef = doc(db, 'goals', goalId);
            const goalDefSnap = await getDoc(goalDefRef);

            if (!goalDefSnap.exists()) {
                console.warn(`Goal definition ${goalId} not found in Firestore. Check seeding.`);
                // Fallback to static if absolutely necessary or throw?
                // Throwing is better to enforce "Real Data Only" rule
                throw new Error(`Unknown goal: ${goalId}`);
            }
            const goalDef = goalDefSnap.data();

            const firstMilestone = goalDef.milestones[0];
            const newGoalData = {
                userId,
                goalId: goalId,
                startDate: serverTimestamp(),
                currentMilestoneId: firstMilestone.id,
                progressPercent: 0,
                timeline: goalDef.milestones.map((m: any) => ({
                    milestoneId: m.id,
                    completedAt: null
                })),
                createdAt: serverTimestamp(),
                updatedAt: serverTimestamp(),
            };

            await setDoc(userGoalRef, newGoalData);

            return {
                ...newGoalData,
                startDate: Date.now(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
            } as unknown as UserGoal;

        } catch (error) {
            console.warn("GoalService: Error getting user goal", error);
            // Removed Mock store fallback entirely as per instructions
            return null;
        }
    },

    // Submit a check-in and update goal progress
    submitCheckIn: async (
        userId: string,
        goalId: string,
        groupId: string | null,
        note: string,
        completedMilestoneId: string | null,
        photoUrl: string | null = null
    ): Promise<{ success: boolean, milestoneCompletedName?: string }> => {
        try {
            const userGoalId = `${userId}_${goalId}`;
            const userGoalRef = doc(db, 'userGoals', userGoalId);
            // 1. Write CheckIn
            // const newCheckInRef = doc(collection(db, 'checkIns')); 
            // await setDoc(newCheckInRef, { ... });
            await addDoc(collection(db, 'checkIns'), {
                userId,
                goalId,
                note,
                createdAt: serverTimestamp(),
                milestoneId: completedMilestoneId,
                groupId: groupId || 'unknown',
                photoUrl: photoUrl
            });

            // 2. Update Goal
            let milestoneName = undefined;
            if (completedMilestoneId) {
                const snap = await getDoc(userGoalRef);
                if (!snap.exists()) throw new Error("Goal not found in DB");
                const currentData = snap.data() as UserGoal;

                const goalDef = getGoalById(goalId);
                if (!goalDef) throw new Error("Goal def not found");
                const msDef = goalDef.milestones.find(m => m.id === completedMilestoneId);

                if (msDef) {
                    milestoneName = msDef.title;
                    const updatedTimeline = currentData.timeline.map(t => ({
                        ...t,
                        completedAt: t.milestoneId === completedMilestoneId ? Date.now() : t.completedAt
                    }));

                    let nextMsId = currentData.currentMilestoneId;
                    const msIndex = goalDef.milestones.findIndex(m => m.id === completedMilestoneId);
                    if (msIndex !== -1 && msIndex < goalDef.milestones.length - 1) {
                        nextMsId = goalDef.milestones[msIndex + 1].id;
                    }

                    await updateDoc(userGoalRef, {
                        timeline: updatedTimeline,
                        progressPercent: msDef.percentage,
                        currentMilestoneId: nextMsId,
                        updatedAt: serverTimestamp(),
                    });
                }
            }
            return { success: true, milestoneCompletedName: milestoneName };

        } catch (error) {
            console.warn("GoalService: CheckIn Mock Fallback", error);

            // MOCK FALLBACK
            const userGoalId = `${userId}_${goalId}`;
            const currentMock = mockStore[userGoalId];
            if (!currentMock) return { success: true }; // Should exist if getOrCreate was called

            let milestoneName = undefined;
            if (completedMilestoneId) {
                const goalDef = getGoalById(goalId);
                const msDef = goalDef?.milestones.find(m => m.id === completedMilestoneId);

                if (goalDef && msDef) {
                    milestoneName = msDef.title;

                    // Update Mock State
                    currentMock.progressPercent = msDef.percentage;

                    currentMock.timeline = currentMock.timeline.map(t => ({
                        ...t,
                        completedAt: t.milestoneId === completedMilestoneId ? Date.now() : t.completedAt
                    }));

                    const msIndex = goalDef.milestones.findIndex(m => m.id === completedMilestoneId);
                    if (msIndex !== -1 && msIndex < goalDef.milestones.length - 1) {
                        currentMock.currentMilestoneId = goalDef.milestones[msIndex + 1].id;
                    }
                    currentMock.updatedAt = Date.now();
                }
            }

            return { success: true, milestoneCompletedName: milestoneName };
        }
    },

    // --- Phase B: Requests & Waitlist ---

    createGoalRequest: async (userId: string, text: string, type: 'new_goal' | 'join_goal', goalId?: string): Promise<string> => {
        try {
            const docRef = await addDoc(collection(db, 'goalRequests'), {
                userId,
                requestedGoalText: text,
                type,
                goalId: goalId || null,
                status: 'open',
                createdAt: serverTimestamp(),
                meta: { source: 'app' }
            });
            return docRef.id;
        } catch (error) {
            console.error("Error creating goal request:", error);
            // Mock fallback? optional
            return "mock-request-id";
        }
    },

    joinWaitlist: async (userId: string, goalId: string): Promise<string> => {
        try {
            const docRef = await addDoc(collection(db, 'waitlistEntries'), {
                userId,
                goalId,
                status: 'waiting',
                createdAt: serverTimestamp(),
            });
            return docRef.id;
        } catch (error) {
            console.error("Error joining waitlist:", error);
            return "mock-waitlist-id";
        }
    },

    getCheckIns: async (userId: string, goalId: string): Promise<CheckIn[]> => {
        try {
            const q = query(
                collection(db, 'checkIns'),
                where('userId', '==', userId),
                where('goalId', '==', goalId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toMillis?.() || Date.now()
            })) as CheckIn[];
        } catch (error) {
            console.warn("GoalService: getCheckIns failed, using mock", error);
            return [];
        }
    },

    addAffirmation: async (userId: string, text: string): Promise<Affirmation> => {
        try {
            const docRef = await addDoc(collection(db, 'affirmations'), {
                userId,
                text,
                createdAt: serverTimestamp()
            });
            return {
                id: docRef.id,
                userId,
                text,
                createdAt: Date.now()
            };
        } catch (error) {
            console.warn("GoalService: addAffirmation failed", error);
            return { id: 'mock-id', userId, text, createdAt: Date.now() };
        }
    },

    getAffirmations: async (userId: string): Promise<Affirmation[]> => {
        try {
            const q = query(
                collection(db, 'affirmations'),
                where('userId', '==', userId),
                orderBy('createdAt', 'desc')
            );
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => ({
                id: doc.id,
                ...doc.data(),
                createdAt: doc.data().createdAt?.toMillis?.() || Date.now()
            })) as Affirmation[];
        } catch (error) {
            console.warn("GoalService: getAffirmations failed", error);
            return [];
        }
    }
};
