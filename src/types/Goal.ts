export interface Milestone {
    id: string;
    title: string;
    percentage: number;
}

export type GoalCategory = 'fitness' | 'learning' | 'finance' | 'wellbeing' | 'other';
export type GoalDifficulty = 'beginner' | 'intermediate' | 'advanced';
export type GoalStatus = 'draft' | 'live' | 'paused' | 'archived';

export interface Goal {
    id: string; // Firestore Doc ID
    name: string;
    description: string;
    category: GoalCategory;
    difficulty: GoalDifficulty;
    status: GoalStatus;
    milestones: Milestone[];
    imageUrl?: string;
    createdAt: any; // Timestamp
    updatedAt: any; // Timestamp
}

export const CATEGORIES: GoalCategory[] = ['fitness', 'learning', 'finance', 'wellbeing', 'other'];
export const DIFFICULTIES: GoalDifficulty[] = ['beginner', 'intermediate', 'advanced'];
export const STATUSES: GoalStatus[] = ['draft', 'live', 'paused', 'archived'];
