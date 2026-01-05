// DEPRECATED: New goals should be fetched from Firestore via GoalService.getAvailableGoals().
// This file is kept only for type definitions and legacy fallback support.

export interface Milestone {
    id: string;
    title: string;
    percentage: number;
}

export interface GoalDefinition {
    id: string;
    name: string;
    milestones: Milestone[];
}

// --- Goal Definitions ---
export const GOALS: GoalDefinition[] = [
    {
        id: 'run-5k-30min',
        name: 'Run 5K in under 30 minutes',
        milestones: [
            { id: 'ms1', title: 'Run 1K', percentage: 10 },
            { id: 'ms2', title: 'Run 2K', percentage: 25 },
            { id: 'ms3', title: 'Run 3K', percentage: 45 },
            { id: 'ms4', title: 'Run 4K', percentage: 65 },
            { id: 'ms5', title: 'Run 5K', percentage: 85 },
            { id: 'ms6', title: 'Run 5K in under 30 minutes', percentage: 100 },
        ]
    },
    {
        id: 'learn-coding-basic',
        name: 'Learn basic coding',
        milestones: [
            { id: 'c1', title: 'Write "Hello World"', percentage: 20 },
            { id: 'c2', title: 'Learn Variables & Loops', percentage: 50 },
            { id: 'c3', title: 'Build a Text Adventure', percentage: 100 },
        ]
    },
    {
        id: 'save-1000',
        name: 'Save £1,000',
        milestones: [
            { id: 's1', title: 'Open Savings Account', percentage: 10 },
            { id: 's2', title: 'Save first £100', percentage: 25 },
            { id: 's3', title: 'Save £500', percentage: 50 },
            { id: 's4', title: 'Save £1,000', percentage: 100 },
        ]
    }
];

export const getAvailableGoals = () => GOALS;

export const getGoalById = (goalId: string) => GOALS.find(g => g.id === goalId);

export const getMilestone = (goalId: string, milestoneId: string): Milestone | undefined => {
    const goal = getGoalById(goalId);
    return goal?.milestones.find((m) => m.id === milestoneId);
};

export const getNextMilestone = (goalId: string, currentMilestoneId: string): Milestone | undefined => {
    const goal = getGoalById(goalId);
    if (!goal) return undefined;

    const index = goal.milestones.findIndex((m) => m.id === currentMilestoneId);
    if (index !== -1 && index < goal.milestones.length - 1) {
        return goal.milestones[index + 1];
    }
    return undefined;
};

// Legacy exports for compat if needed, but prefer specific lookups
export const RUN_5K_GOAL_ID = 'run-5k-30min';
export const RUN_5K_GOAL = GOALS[0];
