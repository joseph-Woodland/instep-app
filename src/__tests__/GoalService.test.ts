import { GoalService } from '../services/GoalService';
import { getDoc, setDoc, addDoc, updateDoc, collection, query, where, orderBy, getDocs } from 'firebase/firestore';

// Mock static data
jest.mock('../data/goals', () => ({
    getGoalById: jest.fn((id) => {
        if (id === 'goal1') {
            return {
                id: 'goal1',
                title: 'Goal 1',
                milestones: [
                    { id: 'ms1', title: 'Milestone 1', percentage: 10 },
                    { id: 'ms2', title: 'Milestone 2', percentage: 20 }
                ]
            };
        }
        return null;
    })
}));

// Mocks are hoisted, so we can access them here or in the tests

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

    describe('submitCheckIn', () => {
        it('should create checkin and update goal progress when milestone is completed', async () => {
            (addDoc as jest.Mock).mockResolvedValueOnce({ id: 'checkin1' });

            // userGoalRef getDoc
            (getDoc as jest.Mock).mockResolvedValueOnce({
                exists: () => true,
                data: () => ({
                    userId: 'user1',
                    goalId: 'goal1',
                    timeline: [
                        { milestoneId: 'ms1', completedAt: null },
                        { milestoneId: 'ms2', completedAt: null }
                    ],
                    currentMilestoneId: 'ms1',
                    progressPercent: 0
                })
            });

            const result = await GoalService.submitCheckIn('user1', 'goal1', 'group1', 'Great run', 'ms1');

            expect(addDoc).toHaveBeenCalled();
            expect(updateDoc).toHaveBeenCalledWith(
                expect.anything(),
                expect.objectContaining({
                    progressPercent: 10, // from mocked goal data
                    currentMilestoneId: 'ms2'
                })
            );
            expect(result.success).toBe(true);
            expect(result.milestoneCompletedName).toBe('Milestone 1');
        });

        it('should just create checkin if no milestone completed', async () => {
            (addDoc as jest.Mock).mockResolvedValueOnce({ id: 'checkin2' });

            const result = await GoalService.submitCheckIn('user1', 'goal1', 'group1', 'Just updates', null);

            expect(addDoc).toHaveBeenCalled();
            expect(getDoc).not.toHaveBeenCalled(); // Should not fetch goal if no milestone
            expect(updateDoc).not.toHaveBeenCalled();
            expect(result.success).toBe(true);
        });

        it('should handle fallback if update fails', async () => {
            (addDoc as jest.Mock).mockRejectedValueOnce(new Error('Firestore error'));
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

            // Should mock console.warn to keep output clean
            const result = await GoalService.submitCheckIn('user1', 'goal1', 'group1', 'Fail', null);

            expect(result.success).toBe(true); // Fallback is success=true (legacy mock store behavior)
            expect(consoleSpy).toHaveBeenCalled();
            consoleSpy.mockRestore();
        });
    });

    describe('getCheckIns', () => {
        it('should return list of checkins', async () => {
            (getDocs as jest.Mock).mockResolvedValueOnce({
                docs: [
                    {
                        id: 'c1',
                        data: () => ({ note: 'Note 1', createdAt: { toMillis: () => 100 } })
                    },
                    {
                        id: 'c2',
                        data: () => ({ note: 'Note 2', createdAt: { toMillis: () => 200 } })
                    }
                ]
            });

            const results = await GoalService.getCheckIns('user1', 'goal1');
            expect(results).toHaveLength(2);
            expect(results[0].id).toBe('c1');
            expect(results[1].note).toBe('Note 2');
        });

        it('should return empty array on error', async () => {
            (getDocs as jest.Mock).mockRejectedValueOnce(new Error('Fail'));
            const consoleSpy = jest.spyOn(console, 'warn').mockImplementation(() => { });

            const results = await GoalService.getCheckIns('user1', 'goal1');
            expect(results).toEqual([]);
            consoleSpy.mockRestore();
        });
    });
});
