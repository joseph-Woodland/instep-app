import { GoalService } from '../../services/GoalService';
import { mockFirestore } from '../../test/utils/mockFirestore';
import { makeUser } from '../../test/fixtures/factories';

// Mock the static data source
jest.mock('../../data/goals', () => ({
    getGoalById: jest.fn((id) => {
        if (id === 'run-5k') {
            return {
                id: 'run-5k',
                title: 'Run 5K', // Note: Service might expect 'name' or 'title', let's check interface
                milestones: [
                    { id: 'm1', title: 'Walk 1km', percentage: 10 },
                    { id: 'm2', title: 'Run 1km', percentage: 25 }
                ]
            };
        }
        return null;
    }),
    RUN_5K_GOAL_ID: 'run-5k'
}));

describe('Scenario: Check-in & Progress', () => {
    beforeEach(() => {
        mockFirestore.reset();
        // Seed Goal Definition (for getOrCreate which uses Firestore)
        const goalId = 'run-5k';
        mockFirestore.set(`goals/${goalId}`, {
            id: goalId,
            name: 'Run 5K',
            milestones: [
                { id: 'm1', title: 'Walk 1km', percentage: 10 },
                { id: 'm2', title: 'Run 1km', percentage: 25 }
            ],
            status: 'live'
        });
    });

    it('completing a check-in updates progress and creates timeline entry', async () => {
        const user = makeUser({ id: 'u1' });
        const goalId = 'run-5k';

        // 1. Initialize User Goal (Uses Firestore mock)
        const userGoal = await GoalService.getOrCreateUserGoal(user.id, goalId);
        expect(userGoal).toBeDefined();

        let storedUserGoal = mockFirestore.get(`userGoals/${user.id}_${goalId}`);
        expect(storedUserGoal.progressPercent).toBe(0);
        expect(storedUserGoal.currentMilestoneId).toBe('m1');

        // 2. Submit Check-in for Milestone 1 (Uses static data mock)
        const result = await GoalService.submitCheckIn(
            user.id,
            goalId,
            'group-1',
            'I did it!',
            'm1'
        );

        if (!result.success) console.error("CheckIn Result:", result);
        expect(result.success).toBe(true);
        expect(result.milestoneCompletedName).toBe('Walk 1km');

        // 3. Verify Progress Update (Persistence in Firestore mock)
        storedUserGoal = mockFirestore.get(`userGoals/${user.id}_${goalId}`);
        expect(storedUserGoal.progressPercent).toBe(10);
        expect(storedUserGoal.currentMilestoneId).toBe('m2');

        // 4. Verify Timeline
        const timelineEntryVal = storedUserGoal.timeline.find((t: any) => t.milestoneId === 'm1');
        expect(timelineEntryVal.completedAt).toBeTruthy();
    });
});
