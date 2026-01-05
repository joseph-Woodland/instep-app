import { GoalService } from '../services/GoalService';
import { getDoc, setDoc } from 'firebase/firestore';

// Mocks are hoisted, so we can access them here or in the tests
// The actual implementation is in jest.setup.js, but we can override mockImplementation here

describe('GoalService', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getOrCreateUserGoal', () => {
        it('should return existing goal if it exists', async () => {
            const mockUserGoal = {
                userId: 'user1',
                goalId: 'goal1',
                progressPercent: 50,
                timeline: [],
                startDate: { toMillis: () => 1000 },
                createdAt: { toMillis: () => 1000 },
                updatedAt: { toMillis: () => 1000 },
            };

            (getDoc as jest.Mock).mockResolvedValueOnce({
                exists: () => true,
                data: () => mockUserGoal
            });

            const result = await GoalService.getOrCreateUserGoal('user1', 'goal1');

            expect(getDoc).toHaveBeenCalledTimes(1);
            expect(result).toMatchObject({
                userId: 'user1',
                goalId: 'goal1',
                progressPercent: 50
            });
        });

        it('should create a new goal if it does not exist', async () => {
            // Updated to handle two getDoc calls:
            // 1. check userGoal (false)
            // 2. check goalDef (true)

            // Mock first call (User Goal) -> Not Found
            (getDoc as jest.Mock).mockResolvedValueOnce({
                exists: () => false
            });

            // Mock second call (Goal Def) -> Found
            const mockGoalDef = {
                id: 'goal1',
                milestones: [
                    { id: 'ms1', title: 'Milestone 1', percentage: 10 },
                    { id: 'ms2', title: 'Milestone 2', percentage: 20 }
                ]
            };
            (getDoc as jest.Mock).mockResolvedValueOnce({
                exists: () => true,
                data: () => mockGoalDef
            });

            const result = await GoalService.getOrCreateUserGoal('user1', 'goal1');

            // Should have tried to fetch user goal
            // Should have fetched goal def
            // Should have called setDoc
            expect(getDoc).toHaveBeenCalledTimes(2);
            expect(setDoc).toHaveBeenCalledTimes(1);

            expect(result).not.toBeNull();
            if (result) {
                expect(result.userId).toBe('user1');
                expect(result.currentMilestoneId).toBe('ms1');
                expect(result.progressPercent).toBe(0);
            }
        });
    });
});
