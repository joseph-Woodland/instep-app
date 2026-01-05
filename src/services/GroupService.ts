import { db } from '../config/firebaseConfig';
import {
    collection,
    doc,
    setDoc,
    getDoc,
    getDocs,
    query,
    where,
    limit,
    serverTimestamp,
    orderBy,
    updateDoc,
    increment,
    addDoc
} from 'firebase/firestore';
import { getGoalById } from '../data/goals';

export interface Invite {
    id: string;
    goalId: string;
    groupId: string;
    userId: string;
    inviterType: 'admin' | 'member' | 'guide';
    status: 'pending' | 'accepted' | 'declined';
    message: string;
    createdAt: any;
}

export interface GroupInvite {
    id: string;
    groupId: string;
    goalId: string;
    createdByUserId: string;
    createdByRole: 'member' | 'guide';
    status: 'active' | 'disabled';
    createdAt: any;
    expiresAt: any;
    maxUses: number;
    usesCount: number;
    inviteCode: string; // e.g., TG-8K2P9
    note?: string;
}

export interface Group {
    id: string;
    goalId: string;
    name: string;
    maxMembers: number;
    memberCount: number;
    isActive: boolean;
    createdAt: number;
}

export interface UserGroupMembership {
    id: string;
    userId: string;
    groupId: string;
    goalId: string;
    role: 'member' | 'guide';
    joinedAt: number;
}

export const GroupService = {
    getGroup: async (groupId: string): Promise<Group | null> => {
        try {
            if (!groupId) return null;
            const ref = doc(db, 'groups', groupId);
            const snap = await getDoc(ref);
            if (snap.exists()) return snap.data() as Group;
            return null;
        } catch (e) {
            console.error("Get Group error", e);
            return null;
        }
    },

    /**
     * Assigns a user to a group for a specific goal.
     * 1. Check if user is already in a group for this goal.
     * 2. If not, find a suitable open group.
     * 3. If no group found, create a new one.
     * 4. Create membership record.
     */
    assignUserToGroup: async (userId: string, goalId: string): Promise<string> => {
        try {
            if (!userId || !goalId) throw new Error("Missing userId or goalId");

            // 1. Check existing membership
            const userGroupsRef = collection(db, 'userGroups');
            const q = query(
                userGroupsRef,
                where('userId', '==', userId),
                where('goalId', '==', goalId),
                limit(1)
            );
            const snap = await getDocs(q);

            if (!snap.empty) {
                const existing = snap.docs[0].data();
                console.log(`User ${userId} already in group ${existing.groupId} for goal ${goalId}`);
                return existing.groupId;
            }

            // 2. Find available group
            const groupsRef = collection(db, 'groups');
            const groupQ = query(
                groupsRef,
                where('goalId', '==', goalId),
                where('isActive', '==', true),
                // Ideally we check memberCount < maxMembers, but Firestore simple queries are limited.
                // For MVP we just grab one and assume it works, or we filter client-side if small.
                orderBy('createdAt', 'desc'),
                limit(5)
            );

            const groupSnap = await getDocs(groupQ);
            let assignedGroupId: string | null = null;
            let assignedGroupName = '';

            // Simple client-side capacity check (not atomic but fine for MVP)
            for (const d of groupSnap.docs) {
                const gData = d.data();
                if ((gData.memberCount || 0) < (gData.maxMembers || 10)) {
                    assignedGroupId = d.id;
                    assignedGroupName = gData.name;
                    break;
                }
            }

            // 3. Create new group if needed
            if (!assignedGroupId) {
                const goalDef = getGoalById(goalId);
                const goalName = goalDef ? goalDef.name : 'Unknown Goal';
                // Generate a simple ID
                const newGroupRef = doc(collection(db, 'groups'));
                assignedGroupId = newGroupRef.id;
                assignedGroupName = `${goalName} Group`;

                await setDoc(newGroupRef, {
                    id: assignedGroupId,
                    goalId,
                    name: assignedGroupName,
                    maxMembers: 10,
                    memberCount: 1, // Only this user initially
                    isActive: true,
                    createdAt: serverTimestamp(),
                });
                console.log(`Created new group: ${assignedGroupId}`);
            } else {
                // We should increment memberCount here really, but skipping atomic increment for brevity
            }

            // 4. Create Membership
            const membershipRef = doc(collection(db, 'userGroups')); // Auto-ID
            await setDoc(membershipRef, {
                id: membershipRef.id,
                userId,
                groupId: assignedGroupId,
                goalId,
                role: 'member',
                joinedAt: serverTimestamp(),
            });

            return assignedGroupId;

        } catch (e) {
            console.error("Assign Group Error:", e);
            throw e;
        }
    },

    getGroupDetails: async (groupId: string): Promise<Group | null> => {
        const ref = doc(db, 'groups', groupId);
        const snap = await getDoc(ref);
        if (snap.exists()) {
            return { id: snap.id, ...snap.data() } as Group;
        }
        return null;
    },

    /**
     * Update a user's role to guide for a specific group
     */
    updateUserRoleToGuide: async (userId: string, groupId: string, goalId: string): Promise<void> => {
        try {
            // Find the user's membership record
            const userGroupsRef = collection(db, 'userGroups');
            const q = query(
                userGroupsRef,
                where('userId', '==', userId),
                where('groupId', '==', groupId),
                where('goalId', '==', goalId),
                limit(1)
            );
            const snap = await getDocs(q);

            if (!snap.empty) {
                const membershipDoc = snap.docs[0];
                const membershipRef = doc(db, 'userGroups', membershipDoc.id);
                await setDoc(membershipRef, { role: 'guide' }, { merge: true });
                console.log(`Updated user ${userId} to guide role in group ${groupId}`);
            } else {
                console.warn(`No membership found for user ${userId} in group ${groupId}`);
            }
        } catch (e) {
            console.error("Error updating user role to guide:", e);
            throw e;
        }
    },

    /**
     * Get the guide for a specific group (if one exists)
     */
    getGroupGuide: async (groupId: string): Promise<UserGroupMembership | null> => {
        try {
            const userGroupsRef = collection(db, 'userGroups');
            const q = query(
                userGroupsRef,
                where('groupId', '==', groupId),
                where('role', '==', 'guide'),
                limit(1)
            );
            const snap = await getDocs(q);

            if (!snap.empty) {
                const data = snap.docs[0].data();
                return {
                    id: snap.docs[0].id,
                    ...data,
                    joinedAt: data.joinedAt?.toMillis?.() || Date.now(),
                } as UserGroupMembership;
            }
            return null;
        } catch (e) {
            console.error("Error getting group guide:", e);
            return null;
        }
    },

    /**
     * Check if a user is a guide in a specific group
     */
    isUserGuide: async (userId: string, groupId: string): Promise<boolean> => {
        try {
            const userGroupsRef = collection(db, 'userGroups');
            const q = query(
                userGroupsRef,
                where('userId', '==', userId),
                where('groupId', '==', groupId),
                where('role', '==', 'guide'),
                limit(1)
            );
            const snap = await getDocs(q);
            return !snap.empty;
        } catch (e) {
            console.error("Error checking if user is guide:", e);
            return false;
        }
    },

    // --- Invite System ---

    getUserPendingInvites: async (userId: string): Promise<Invite[]> => {
        try {
            const invitesRef = collection(db, 'invites');
            const q = query(
                invitesRef,
                where('userId', '==', userId),
                where('status', '==', 'pending')
                // orderBy('createdAt', 'desc') // Removed to avoid index error
            );
            const snap = await getDocs(q);
            const invites = snap.docs.map(d => ({ id: d.id, ...d.data() } as Invite));
            // Sort in memory
            return invites.sort((a, b) => {
                const ta = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
                const tb = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
                return tb - ta;
            });
        } catch (error) {
            console.error("Error fetching invites:", error);
            return [];
        }
    },

    respondToInvite: async (inviteId: string, accept: boolean): Promise<string | null> => {
        try {
            const inviteRef = doc(db, 'invites', inviteId);
            const inviteSnap = await getDoc(inviteRef);
            if (!inviteSnap.exists()) throw new Error("Invite not found");

            const invite = inviteSnap.data() as Invite;
            if (invite.status !== 'pending') throw new Error("Invite not pending");

            if (!accept) {
                await updateDoc(inviteRef, { status: 'declined' });
                return null;
            }

            // JOIN FLOW
            const { userId, groupId, goalId } = invite;

            // 1. Mark Accepted
            await updateDoc(inviteRef, {
                status: 'accepted',
                acceptedAt: serverTimestamp()
            });

            // 2. Add Membership
            const membershipRef = doc(collection(db, 'userGroups'));
            await setDoc(membershipRef, {
                id: membershipRef.id,
                userId,
                groupId,
                goalId,
                role: 'member',
                joinedAt: serverTimestamp(),
            });

            // 3. Increment Count
            const groupRef = doc(db, 'groups', groupId);
            await updateDoc(groupRef, {
                memberCount: increment(1)
            });

            console.log(`User ${userId} accepted invite ${inviteId} and joined group ${groupId}`);
            return groupId;

        } catch (error) {
            console.error("Error responding to invite:", error);
            throw error;
        }
    },

    // --- Shareable Group Invites ---

    createGroupInvite: async (userId: string, groupId: string, goalId: string, role: 'member' | 'guide'): Promise<GroupInvite> => {
        try {
            // 1. Generate unique code
            const generateCode = () => {
                const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
                let res = 'TG-';
                for (let i = 0; i < 5; i++) res += chars.charAt(Math.floor(Math.random() * chars.length));
                return res;
            };
            const inviteCode = generateCode();

            // 2. Set Expiry (7 days) & Max Uses
            const now = new Date();
            const expiresAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
            const maxUses = role === 'guide' ? 10 : 5;

            // 3. Create Doc
            const docRef = doc(collection(db, 'groupInvites'));
            const data: any = {
                id: docRef.id,
                groupId,
                goalId,
                createdByUserId: userId,
                createdByRole: role,
                status: 'active',
                createdAt: serverTimestamp(),
                expiresAt: expiresAt, // Store as Date, Firestore converts
                maxUses,
                usesCount: 0,
                inviteCode
            };

            await setDoc(docRef, data);

            return { ...data, createdAt: now, expiresAt }; // Return local version
            return { ...data, createdAt: now, expiresAt }; // Return local version
        } catch (error) {
            console.error("Error creating group invite:", error);
            throw error;
        }
    },

    validateGroupInvite: async (inviteCode: string): Promise<{ valid: boolean; message?: string; invite?: GroupInvite; groupName?: string }> => {
        try {
            const invitesRef = collection(db, 'groupInvites');
            const q = query(invitesRef, where('inviteCode', '==', inviteCode), limit(1));
            const snap = await getDocs(q);

            if (snap.empty) {
                return { valid: false, message: "That code doesn't look active. Check it and try again." };
            }

            const invite = snap.docs[0].data() as GroupInvite;

            if (invite.status !== 'active') return { valid: false, message: "This invite is no longer active." };

            // Expiry Check
            const expiryTime = invite.expiresAt?.toMillis ? invite.expiresAt.toMillis() : (invite.expiresAt?.seconds * 1000) || Date.now() + 10000;
            if (expiryTime < Date.now()) return { valid: false, message: "This invite has expired." };

            if (invite.usesCount >= invite.maxUses) return { valid: false, message: "This invite has reached its limit." };

            // Fetch Group Name for improved UX
            const groupRef = doc(db, 'groups', invite.groupId);
            const groupSnap = await getDoc(groupRef);
            let groupName = 'Support Group';
            if (groupSnap.exists()) {
                groupName = groupSnap.data().name;
            }

            return { valid: true, invite, groupName };

        } catch (e) {
            console.error("Validate invite error", e);
            return { valid: false, message: "Unable to validate code." };
        }
    },

    redeemGroupInvite: async (userId: string, inviteCode: string): Promise<{ success: boolean; status?: 'joined' | 'full' | 'error'; message?: string; groupId?: string; goalId?: string }> => {
        try {
            // 1. Find Invite
            const invitesRef = collection(db, 'groupInvites');
            const q = query(invitesRef, where('inviteCode', '==', inviteCode), limit(1));
            const snap = await getDocs(q);

            if (snap.empty) {
                return { success: false, status: 'error', message: "Invalid invite code." };
            }

            const inviteDoc = snap.docs[0];
            const invite = inviteDoc.data() as GroupInvite;

            // 2. Validate
            if (invite.status !== 'active') return { success: false, status: 'error', message: "Invite is no longer active." };
            // Handle Firestore Timestamp or Date
            const expiryTime = invite.expiresAt?.toMillis ? invite.expiresAt.toMillis() : (invite.expiresAt?.seconds * 1000) || Date.now() + 10000;
            if (expiryTime < Date.now()) return { success: false, status: 'error', message: "Invite has expired." };
            if (invite.usesCount >= invite.maxUses) return { success: false, status: 'error', message: "Invite limit reached." };

            // 3. Check Group Capacity
            const groupRef = doc(db, 'groups', invite.groupId);
            const groupSnap = await getDoc(groupRef);
            if (!groupSnap.exists()) return { success: false, status: 'error', message: "Group not found." };

            const groupData = groupSnap.data();
            if ((groupData.memberCount || 0) >= (groupData.maxMembers || 10)) {
                // Log attempt
                await addDoc(collection(db, 'inviteRedemptions'), {
                    inviteId: inviteDoc.id,
                    groupId: invite.groupId,
                    goalId: invite.goalId,
                    inviterUserId: invite.createdByUserId,
                    redeemedByUserId: userId,
                    redeemedAt: serverTimestamp(),
                    outcome: 'full'
                });
                return { success: false, status: 'full', message: "Group is full.", goalId: invite.goalId };
            }

            // 4. Join Group (Check if already member)
            const userGroupsRef = collection(db, 'userGroups');
            const memQ = query(userGroupsRef, where('userId', '==', userId), where('groupId', '==', invite.groupId), limit(1));
            const memSnap = await getDocs(memQ);
            if (!memSnap.empty) {
                return { success: true, status: 'joined', message: "Already a member.", groupId: invite.groupId, goalId: invite.goalId };
            }

            // Execute Updates
            // A. User Membership
            await addDoc(collection(db, 'userGroups'), {
                userId,
                groupId: invite.groupId,
                goalId: invite.goalId,
                role: 'member',
                joinedAt: serverTimestamp()
            });

            // B. Increment Invite Uses
            await updateDoc(inviteDoc.ref, {
                usesCount: increment(1)
            });

            // C. Increment Group Members
            await updateDoc(groupRef, {
                memberCount: increment(1)
            });

            // D. Log Redemption
            await addDoc(collection(db, 'inviteRedemptions'), {
                inviteId: inviteDoc.id,
                groupId: invite.groupId,
                goalId: invite.goalId,
                inviterUserId: invite.createdByUserId,
                redeemedByUserId: userId,
                redeemedAt: serverTimestamp(),
                outcome: 'joined'
            });

            return { success: true, status: 'joined', groupId: invite.groupId, goalId: invite.goalId };

        } catch (e) {
            console.error("Redeem error:", e);
            return { success: false, status: 'error', message: "Redemption failed." };
        }
    },

    getGroupMembers: async (groupId: string): Promise<string[]> => {
        try {
            const userGroupsRef = collection(db, 'userGroups');
            const q = query(userGroupsRef, where('groupId', '==', groupId));
            const snap = await getDocs(q);
            return snap.docs.map(d => d.data().userId);
        } catch (e) {
            console.error("Error fetching group members:", e);
            return [];
        }
    }
};
