export type GroupStatus = 'pending' | 'live' | 'paused' | 'archived';

export interface Group {
    id: string; // Firestore Doc ID
    goalId: string;
    name: string;
    description?: string; // Optional context
    status: GroupStatus;
    maxMembers: number;
    memberCount: number;
    guideUserId: string | null;
    imageUrl?: string;
    createdAt: any;
    updatedAt: any;
}

export const GROUP_STATUSES: GroupStatus[] = ['pending', 'live', 'paused', 'archived'];
